#!/usr/bin/env python3
"""Check voice-clone takes against ElevenLabs' Professional Voice Cloning audio targets.

    python voice_clone/check_takes.py voice_clone/takes/      # every take in a folder
    python voice_clone/check_takes.py take01.wav take02.flac

Run it on the files you are about to upload, after trimming and normalising:
turning a take up raises its noise floor along with the voice. Each take
passes, or fails with what to do about it, and the total clean runtime is set
against the 30-minute PVC minimum.
"""

from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import soundfile as sf

# ElevenLabs' PVC guide: "between -23dB and -18dB RMS with a true peak of -3dB".
RMS_RANGE_DB = (-23.0, -18.0)
TARGET_RMS_DB = -20.0
PEAK_MAX_DB = -3.0
# ElevenLabs publishes no noise-floor figure. This is ACX's audiobook limit,
# the spec whose RMS and peak numbers ElevenLabs' match.
NOISE_MAX_DB = -60.0
MIN_SAMPLE_RATE = 44_100
PVC_MINIMUM_S = 30 * 60

# Three identical samples this close to full scale is a flattened waveform: the
# recorder clipped, and no edit puts the missing peak back. A peak that high but
# still curved (a take normalised to 0 dB, say) is only hot, and a limiter fixes it.
CLIP_LEVEL = 0.999
FRAME_S = 0.05
# The noise floor is the quietest 250 ms, so the pause between two sentences
# is enough room tone to measure; a longer window lands on speech.
QUIET_FRAMES = 5
BLOCK_FRAMES = 1200  # read 60 s at a time: a long take does not fit in memory
AUDIO_SUFFIXES = {".wav", ".flac", ".mp3", ".m4a"}


@dataclass
class Take:
    path: Path
    seconds: float
    sample_rate: int
    rms_db: float
    peak_db: float
    noise_db: float
    clipped_at: float | None
    problems: list[str] = field(default_factory=list)


def _db(power: float) -> float:
    return 10 * np.log10(power) if power > 0 else -np.inf


def _clock(seconds: float) -> str:
    minutes, secs = divmod(int(seconds), 60)
    hours, minutes = divmod(minutes, 60)
    return f"{hours}:{minutes:02d}:{secs:02d}" if hours else f"{minutes}:{secs:02d}"


def measure(path: Path) -> Take:
    rate = sf.info(str(path)).samplerate
    frame = max(1, round(rate * FRAME_S))
    read = 0
    sum_sq = 0.0
    peak = 0.0
    clipped_at = None
    tail = np.zeros(2, dtype=np.float32)  # the previous block's last two levels
    frame_power: list[float] = []

    for block in sf.blocks(str(path), blocksize=frame * BLOCK_FRAMES, dtype="float32", always_2d=True):
        level = np.abs(block).max(axis=1)  # a clip on either channel counts
        mono = block.mean(axis=1, dtype=np.float64)
        peak = max(peak, float(level.max()))
        sum_sq += float(np.dot(mono, mono))

        levels = np.concatenate((tail, level))
        flat = (levels[:-2] >= CLIP_LEVEL) & (levels[:-2] == levels[1:-1]) & (levels[1:-1] == levels[2:])
        if clipped_at is None and flat.any():
            clipped_at = max(0, read + int(np.argmax(flat)) - 2) / rate
        tail = levels[-2:]

        whole = len(mono) // frame  # blocks are whole frames; only the file's last one is cut short
        frame_power.extend(np.mean(mono[: whole * frame].reshape(whole, frame) ** 2, axis=1))
        read += len(block)

    power = np.asarray(frame_power)
    quiet = power[:0]
    if len(power):
        # Digital silence pasted in by an editor is not room tone: skip it, and
        # the frames either side that it only partly covers.
        silent = power == 0
        cut = silent.copy()
        cut[1:] |= silent[:-1]
        cut[:-1] |= silent[1:]
        width = min(QUIET_FRAMES, len(power))
        windows = np.convolve(power, np.ones(width) / width, mode="valid")
        quiet = windows[np.convolve(cut, np.ones(width), mode="valid") == 0]

    take = Take(
        path=path,
        seconds=read / rate,
        sample_rate=rate,
        rms_db=_db(sum_sq / read) if read else -np.inf,
        peak_db=_db(peak * peak),
        noise_db=_db(quiet.min()) if len(quiet) else -np.inf,
        clipped_at=clipped_at,
    )
    take.problems = _problems(take)
    return take


def _problems(take: Take) -> list[str]:
    if take.rms_db == -np.inf:
        return ["silent: check the mic is plugged in and the app is recording from it"]

    low, high = RMS_RANGE_DB
    # Normalising moves the noise floor and the peaks by the same gain as the
    # voice, so judge them where they will be once the RMS is fixed.
    gain = 0.0 if low <= take.rms_db <= high else TARGET_RMS_DB - take.rms_db
    direction = "raise" if gain > 0 else "lower"
    problems = []

    if take.clipped_at is not None:
        problems.append(f"clipped at {_clock(take.clipped_at)}: re-record with the input gain lower")
    if take.sample_rate < MIN_SAMPLE_RATE:
        problems.append(f"recorded at {take.sample_rate} Hz: re-record at 48 kHz")
    if take.noise_db + gain > NOISE_MAX_DB:
        floor = f"noise floor {take.noise_db:.1f} dB"
        if gain:
            floor += f", {take.noise_db + gain:.1f} dB once you {direction} it"
        problems.append(f"{floor} (limit {NOISE_MAX_DB:.0f}): re-record somewhere quieter")
    if gain:
        problems.append(f"RMS {take.rms_db:.1f} dB (target {low:.0f} to {high:.0f}): {direction} it {abs(gain):.1f} dB")
    if take.clipped_at is None and take.peak_db + gain > PEAK_MAX_DB:
        after = " after that" if gain else ""
        problems.append(f"peak {take.peak_db + gain:.1f} dB{after} (limit {PEAK_MAX_DB:.0f}): limit peaks at -3.5 dB")
    return problems


def _files(paths: list[Path]) -> list[Path]:
    files = []
    for path in paths:
        if path.is_dir():
            files.extend(sorted(p for p in path.iterdir() if p.suffix.lower() in AUDIO_SUFFIXES))
        else:
            files.append(path)
    return files


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Check voice-clone takes against ElevenLabs' PVC audio targets.")
    parser.add_argument("paths", nargs="+", type=Path, metavar="PATH", help="audio files, or folders of them")
    files = _files(parser.parse_args(argv).paths)
    if not files:
        print("No audio files found.", file=sys.stderr)
        return 1

    clean = 0.0
    failed = 0
    for path in files:
        if not path.is_file():
            print(f"FAIL  {path}  no such file")
            failed += 1
            continue
        try:
            take = measure(path)
        except RuntimeError as err:  # libsndfile's error type: not audio it can decode
            print(f"FAIL  {path.name}  can't read it ({err}): export the take as WAV or FLAC")
            failed += 1
            continue

        verdict = "FAIL" if take.problems else "PASS"
        print(
            f"{verdict}  {path.name}  {_clock(take.seconds)}  RMS {take.rms_db:.1f}  "
            f"peak {take.peak_db:.1f}  noise {take.noise_db:.1f}  {take.sample_rate} Hz"
        )
        for problem in take.problems:
            print(f"      - {problem}")
        if take.problems:
            failed += 1
        else:
            clean += take.seconds

    if clean >= PVC_MINIMUM_S:
        print(f"\nClean audio: {_clock(clean)}, past the {_clock(PVC_MINIMUM_S)} PVC minimum.")
    else:
        print(f"\nClean audio: {_clock(clean)} of the {_clock(PVC_MINIMUM_S)} PVC minimum.")
    print("ElevenLabs recommends 2-3 hours for the closest clone.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
