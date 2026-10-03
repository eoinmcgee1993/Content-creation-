import numpy as np
import pytest
import soundfile as sf

from voice_clone import check_takes
from voice_clone.check_takes import main, measure

RATE = 48_000


def take(rms_db=-20.5, noise_db=-70.0, seconds=5.0, rate=RATE):
    """A stand-in for speech: one second of room tone, then 0.7 s phrases
    with 0.3 s pauses. The tone is set so the whole file averages rms_db."""
    rng = np.random.default_rng(0)
    t = np.arange(int(seconds * rate)) / rate
    speaking = (t >= 1.0) & (t % 1.0 < 0.7)
    amplitude = np.sqrt(2 * 10 ** (rms_db / 10) / speaking.mean())
    voice = np.where(speaking, amplitude * np.sin(2 * np.pi * 220 * t), 0.0)
    return voice + rng.normal(0, 10 ** (noise_db / 20), t.size)


def write(tmp_path, signal, name="take.wav", rate=RATE):
    path = tmp_path / name
    sf.write(path, signal, rate, subtype="PCM_24")
    return path


def test_clean_take_passes_with_accurate_readings(tmp_path):
    result = measure(write(tmp_path, take()))
    assert result.problems == []
    assert result.rms_db == pytest.approx(-20.5, abs=0.1)
    assert result.noise_db == pytest.approx(-70.0, abs=0.5)
    assert result.seconds == pytest.approx(5.0)


def test_clipping_means_rerecord_not_limit(tmp_path):
    signal = take()
    signal[2 * RATE : 2 * RATE + 50] = 1.0
    result = measure(write(tmp_path, signal))
    assert result.problems == ["clipped at 0:02: re-record with the input gain lower"]


def test_a_single_hot_sample_is_a_peak_to_limit_not_a_clip(tmp_path):
    signal = take()
    signal[2 * RATE] = 10 ** (-1 / 20)
    result = measure(write(tmp_path, signal))
    assert result.clipped_at is None
    assert result.problems == ["peak -1.0 dB (limit -3): limit peaks at -3.5 dB"]


def test_a_low_voice_normalised_to_full_scale_is_not_called_a_clip(tmp_path):
    # Near a 120 Hz crest, several samples in a row sit above 0.999, but they
    # still curve; only a flat run of identical samples is a clip.
    signal = take()
    burst = slice(2 * RATE, 2 * RATE + RATE // 20)
    t = np.arange(RATE // 20) / RATE
    signal[burst] = 0.99995 * np.sin(2 * np.pi * 120 * t + np.pi / 2)
    result = measure(write(tmp_path, signal))
    assert result.clipped_at is None
    assert result.problems == [f"peak {result.peak_db:.1f} dB (limit -3): limit peaks at -3.5 dB"]


def test_a_take_shorter_than_one_quiet_window_still_measures(tmp_path):
    room_tone = np.random.default_rng(0).normal(0, 10 ** (-70 / 20), int(0.12 * RATE))
    result = measure(write(tmp_path, room_tone))
    assert result.seconds == pytest.approx(0.12)
    assert result.noise_db == pytest.approx(-70.0, abs=1.0)


def test_quiet_take_says_how_far_to_raise_it(tmp_path):
    result = measure(write(tmp_path, take(rms_db=-28.0, noise_db=-80.0)))
    assert result.problems == ["RMS -28.0 dB (target -23 to -18): raise it 8.0 dB"]


# The floor is the quietest of many windows, so it reads a touch under the
# noise that made it; these check the value loosely and the wording exactly.


def test_raising_a_quiet_take_would_lift_its_noise_over_the_limit(tmp_path):
    result = measure(write(tmp_path, take(rms_db=-28.0, noise_db=-64.0)))
    floor, raised = result.noise_db, result.noise_db + 8.0
    assert floor == pytest.approx(-64.0, abs=0.5)
    assert result.problems[0] == (
        f"noise floor {floor:.1f} dB, {raised:.1f} dB once you raise it (limit -60): re-record somewhere quieter"
    )


def test_noisy_room_means_rerecord(tmp_path):
    result = measure(write(tmp_path, take(noise_db=-50.0)))
    assert result.noise_db == pytest.approx(-50.0, abs=0.5)
    assert result.problems == [f"noise floor {result.noise_db:.1f} dB (limit -60): re-record somewhere quieter"]


def test_phone_band_sample_rate_means_rerecord(tmp_path):
    result = measure(write(tmp_path, take(rate=16_000), rate=16_000))
    assert result.problems == ["recorded at 16000 Hz: re-record at 48 kHz"]


def test_digital_silence_is_not_mistaken_for_a_quiet_room(tmp_path):
    signal = take(noise_db=-50.0)
    signal[: RATE // 2 + 2300] = 0.0  # an editor's cut, ending most of the way into a 50 ms frame
    assert measure(write(tmp_path, signal)).noise_db == pytest.approx(-50.0, abs=0.5)


def test_silent_file_points_at_the_mic(tmp_path):
    result = measure(write(tmp_path, np.zeros(RATE)))
    assert result.problems == ["silent: check the mic is plugged in and the app is recording from it"]


def test_clip_split_across_two_reads_is_still_caught(tmp_path, monkeypatch):
    monkeypatch.setattr(check_takes, "BLOCK_FRAMES", 2)  # 4800-sample blocks
    signal = take()
    signal[4 * 4800 - 1 : 4 * 4800 + 2] = 1.0  # one sample before the boundary, two after
    result = measure(write(tmp_path, signal))
    assert result.clipped_at == pytest.approx((4 * 4800 - 1) / RATE)
    assert result.noise_db == pytest.approx(-70.0, abs=0.5)


def test_folder_run_totals_only_clean_takes(tmp_path, capsys):
    write(tmp_path, take(), "01.wav")
    write(tmp_path, take(), "02.flac")
    write(tmp_path, take(noise_db=-50.0), "03.wav")
    (tmp_path / "notes.txt").write_text("not a take")

    assert main([str(tmp_path)]) == 1
    out = capsys.readouterr().out
    assert out.count("PASS") == 2 and out.count("FAIL") == 1
    assert "Clean audio: 0:10 of the 30:00 PVC minimum." in out


def test_all_clean_exits_zero(tmp_path, capsys):
    assert main([str(write(tmp_path, take()))]) == 0


def test_voice_memos_file_is_reported_not_crashed_on(tmp_path, capsys):
    memo = tmp_path / "Recording.m4a"
    memo.write_bytes(b"\x00\x00\x00\x20ftypM4A not decodable here")
    assert main([str(memo), str(tmp_path / "missing.wav")]) == 1
    out = capsys.readouterr().out
    assert "FAIL  Recording.m4a  can't read it" in out
    assert "export the take as WAV or FLAC" in out
    assert "no such file" in out
