# Cork accent voice clone

A kit for recording a Professional Voice Clone (PVC) of your own Cork voice on
ElevenLabs, for the Clearmark caller in `clearmark_voice.py`. It follows the
cloning plan you were given, with every number checked against ElevenLabs' own
guide and fixed where it was wrong (see [what changed](#what-changed-from-the-original-plan)).

- `script.md` is what to say: about an hour of solo material.
- `check_takes.py` passes or fails each recording against ElevenLabs' audio
  targets, and says whether to fix it in editing or re-record.

## 0. First, check the dialer can use a cloned voice

`clearmark_voice.py` places calls through AgentPhone. AgentPhone only accepts
voice IDs from its own catalogue and rejects any it doesn't know, and its docs
say nothing about adding a clone. Find out before you record an hour of audio:

```bash
pip install agentphone
AGENTPHONE_API_KEY=ap_... python -c "import os; from agentphone import AgentPhone; print(*AgentPhone(api_key=os.environ['AGENTPHONE_API_KEY']).agents.list_voices(), sep='\n')"
```

If there's no way to add your own voice (ask AgentPhone's support), the clone
needs a different dialer. ElevenLabs' own Agents platform uses a PVC directly and
places outbound calls through Twilio or a SIP trunk.

## 1. Set up once, then never change it

A PVC learns everything it hears, including the room and the mic, and it learns
best when every take sounds the same.

- **Room:** a walk-in wardrobe full of clothes, or a duvet over your head. Not a
  kitchen or bathroom. Fans, fridges and heating off.
- **Mic:** an external one, not the phone's own. Either a lav (e.g. Rode
  SmartLav+) clipped 15–20 cm below your mouth, or a small shotgun mic (e.g. Rode
  VideoMic Me-L/C) pointed at your mouth. Same mic and same position every session.
- **App:** ShurePlus MOTIV (iOS) or RecForge II (Android), not Voice Memos.
  WAV, 48 kHz, 24-bit. Automatic gain control and limiter **off**.
- **Level:** set the input gain so your loudest words peak around -12 to -6 dB.
  Never let it reach 0 dB: clipping can't be edited out.

## 2. Record about an hour

ElevenLabs' bare minimum is 30 minutes of clean audio. It recommends at least an
hour, and 2–3 hours for the closest clone. `script.md` has three parts:

- **Part A:** an accent passage, about 3 minutes.
- **Part B:** the caller's own lines, about 5 minutes.
- **Part C:** unscripted talking, 2–3 minutes per prompt. This is most of the hour.

Part C is also where the Cork rhythm and melody come from.

Save takes in `voice_clone/takes/`. Git ignores that folder, and that matters:
a recording of your voice is enough for someone else to clone it.

## 3. Edit and check every take

1. Cut false starts, coughs, and any pause over about two seconds. Leave the short
   natural pauses: the checker measures the room's noise in them.
2. Check the takes:

   ```bash
   pip install -r voice_clone/requirements.txt
   python voice_clone/check_takes.py voice_clone/takes/
   ```

   Each take gets PASS, or FAIL with what to do about it:

   | It says | Do this |
   |---|---|
   | raise / lower it N dB | apply N dB of gain (Audacity: Amplify) |
   | limit peaks at -3.5 dB | run a limiter at -3.5 dB (Audacity: Limiter) |
   | re-record ... | the take is clipped, the room is too noisy, or the sample rate is phone-quality. Editing can't fix any of those |

   With ffmpeg you can do both edits in one pass. This example is for a take the
   checker said to raise by 8.0 dB:

   ```bash
   ffmpeg -i take.wav -af "volume=8.0dB,alimiter=limit=0.668:level=disabled" -c:a pcm_s24le take-fixed.wav
   ```

   `0.668` is -3.5 dB. That's half a dB under ElevenLabs' -3 dB limit, because
   encoding to MP3 can push peaks up a little and the checker measures sample
   peaks, which can read slightly under the true peak.
3. Check the fixed file again, because raising a take raises its noise floor too.
4. Then listen once on headphones. The checker can't hear echo.

The targets are -23 to -18 dB RMS and a peak no higher than -3 dB, both
ElevenLabs'. ElevenLabs gives no figure for the noise floor, so the checker uses
ACX's audiobook limit of -60 dB. ACX's RMS and peak figures are the same as
ElevenLabs'.

## 4. Create the clone

You need the ElevenLabs Creator plan or above.

1. **Upload.** In ElevenLabs go to Voices → Create Voice → Professional Voice
   Clone, and upload the takes that passed. Use MP3 at 192 kbps or higher, which
   ElevenLabs recommends, or WAV, which it says usually doesn't improve the
   clone. If you have hours of audio, split it into files of about 30 minutes.
2. **Verify.** This is a live voice captcha. Use the same mic, room and delivery
   as your takes, read each line once, then press Stop.
   - Once you start verification, you can't delete the voice until it's verified.
   - If every attempt fails, you have to wait 24 hours to try again.
3. **Wait for training.** It usually takes 3–6 hours, sometimes up to a day. It
   trains Flash v2.5, Turbo v2.5 and Multilingual v2, plus Flash v2 and Turbo v2
   for English.

## 5. Before it makes a call

- **Test it the way it will be used.** Phone agents run low-latency models such
  as Flash v2.5, so test on that, not only in ElevenLabs' preview. Test it over a
  real phone line too: phone audio is narrowband, which flattens a voice but
  keeps the accent.
- **Say it's an AI.** Since 2 August 2026, Article 50 of the EU AI Act has
  required an AI system that talks to people to tell them so, unless that's
  obvious. A clone of a real Cork voice is built not to be obvious, so the caller
  has to say it. The greeting in `clearmark_voice.py` does; keep it if you
  change the wording.

## What changed from the original plan

- **"Vocal density instead of quantity."** This doesn't work for a PVC. The
  60-word paragraph takes about 25 seconds to read, and ElevenLabs' floor is 30
  minutes. The idea survives as Part A, which is longer and covers more sounds,
  inside an hour of audio.
- **The recorded conversation.** A 15–20 minute chat leaves under 10 minutes of
  you, and crosstalk can't be edited out cleanly. ElevenLabs' speaker separation
  is unreliable when voices overlap or turns are short, and the clone learns its
  artefacts. Part C keeps the natural speech without a second voice.
- **WAV only, never MP3.** WAV is right for recording, because you'll edit the
  takes. For the upload, ElevenLabs recommends MP3 at 192 kbps or higher and says
  WAV usually doesn't help.
- **Peaks at -12 to -6 dB.** Right for recording. The files you upload should sit
  at -23 to -18 dB RMS with peaks no higher than -3 dB, and the checker tells you
  how much gain gets them there.
- **Review by listening on headphones.** Still needed for echo, but clipping,
  levels and noise are now measured.
- **"Upload and name it."** That step was missing several things:
  - the plan tier you need
  - voice verification
  - how long training takes
  - whether the dialer can use the voice at all (step 0)

## Sources

- ElevenLabs: [Professional Voice Cloning](https://elevenlabs.io/docs/eleven-creative/voices/voice-cloning/professional-voice-cloning)
  (duration, levels, format, verification, models) and
  [voice cloning concepts](https://elevenlabs.io/docs/eleven-api/concepts/voice-cloning) (speaker separation)
- ElevenLabs Agents: [Twilio outbound calls](https://elevenlabs.io/docs/eleven-agents/phone-numbers/twilio-integration/native-integration),
  [SIP trunk outbound calls](https://elevenlabs.io/docs/eleven-agents/api-reference/sip-trunk/outbound-call)
- AgentPhone: [agents and the voice catalogue](https://docs.agentphone.ai/documentation/guides/agents)
- ACX: [audio submission requirements](https://help.acx.com/s/article/what-are-the-acx-audio-submission-requirements)
- EU AI Act Article 50: [McCann FitzGerald](https://www.mccannfitzgerald.com/knowledge/technology-and-innovation/one-month-to-go-eu-ai-act-transparency-compliance),
  [Cooley](https://www.cooley.com/news/insight/2026/2026-08-03-eu-ai-act-transparency-obligations-take-effect-2-august-2026)

## Tests

```bash
pytest voice_clone/tests -q
```

The tests generate synthetic takes with known levels, noise, clipping and edits.
