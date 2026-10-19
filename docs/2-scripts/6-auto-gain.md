# AutoGain

AutoGain watches a microphone, or a call, and adjusts its **gain** by itself. It keeps the
**top peaks** of the voice in a range you set: it lowers the gain when a peak goes above the
range or the signal clips, and raises it when no peak has reached the range for a while. A
speaker who moves closer or further away stays at a usable level without anyone touching the
input.

## Set up

1. Add the script to the vMix that has the microphone, see
   [adding a script](1-overview.md#add-a-script-to-vmix).
2. Start the script. The defaults suit most voices.

The input it adjusts is the first of these that exists:

1. An input with `AutoGain` in its title.
2. The first input of type **Audio**.
3. The first input of type **VideoCall**.

Put `AutoGain` in the title of the right input to be certain. If none is found, the script
prints `AutoGain | No input found. Looked for an input with 'AutoGain' in its title, then an input of type Audio, then an input of type VideoCall. Trying again in 5 seconds.`
and looks again after five seconds. A muted input is left alone.

## Settings

Levels are in decibels of the input's `meterF1` meter, where 0 dB is the loudest possible
signal. See [Audio levels](../3-reference/1-audio-levels.md) for how they relate to the other
vMix scales. Times are in milliseconds.

| Setting              | Default | Meaning                                                                                              |
| -------------------- | ------- | ---------------------------------------------------------------------------------------------------- |
| `LOOP_TIME`          | `50`    | How often the script reads the level                                                                 |
| `CLIP_THRESHOLD_DB`  | `-1`    | A level above this counts as clipping                                                                |
| `CLIP_DOWN_TIME`     | `1000`  | The shortest time between two gain decreases caused by clipping                                      |
| `PEAK_HIGH_DB`       | `-5`    | The top of the peak range. A peak above it lowers the gain                                           |
| `PEAK_LOW_DB`        | `-6`    | The bottom of the peak range. Peaks must reach it, or the gain is raised                             |
| `PEAK_WAIT`          | `5000`  | How long there must be no peak above `PEAK_LOW_DB` before the gain may be raised                     |
| `GAIN_CHANGE_TIME`   | `3000`  | After any gain change, how long the peak range waits before it raises or lowers the gain again       |
| `VOICE_THRESHOLD_DB` | `-20`   | A level above this counts as a voice                                                                 |
| `VOICE_DURATION`     | `250`   | How long the voice level must last without a break to count as speaking, so short noises are ignored |
| `VOICE_WAIT`         | `5000`  | When there has been no voice for this long, the script stops changing the gain                       |

## How it works

The script changes the input's gain in steps of 1 dB, between **0 and 24 dB**. It aims to keep
the loudest peaks between `PEAK_LOW_DB` and `PEAK_HIGH_DB`.

- **Clip.** When the level goes above `CLIP_THRESHOLD_DB`, the gain is lowered by 1 dB at
  once, whatever happened before. This happens at most once per `CLIP_DOWN_TIME`.
- **Down.** When a peak goes above `PEAK_HIGH_DB`, the gain is lowered by 1 dB. Only a peak
  since the last gain change counts, so one loud syllable lowers the gain once.
- **Up.** When no peak above `PEAK_LOW_DB` has been seen for `PEAK_WAIT`, the gain is
  raised by 1 dB. So a speaker who is too quiet gets about one more decibel every three seconds,
  until peaks reach the range.
- **Pace.** After any gain change, including a clip, the range waits `GAIN_CHANGE_TIME` before
  it raises or lowers the gain again, so the meter shows the new gain first.
- **In range.** While the peaks stay between the two thresholds, the gain is left alone.
- **Only while someone speaks.** A voice is detected when the level stays above
  `VOICE_THRESHOLD_DB` for `VOICE_DURATION`. When there has been no voice for `VOICE_WAIT`, the
  script makes no changes. Gain does not creep up during silence, and a clean pause does not
  turn a quiet room into loud noise.

## Good to know

- It adjusts a single input. With several microphones, put `AutoGain` in the title of the one
  that matters, usually the main speaker.
- It only changes the **gain**. The input's volume and the bus volumes are not touched.
- The gain moves slowly on purpose. After a change in the speaker or the microphone position it
  takes some seconds to settle.
- A narrow range keeps the peaks close to one level, but the gain changes often. If the gain
  goes up and down too much, widen the range, for example `-9` to `-5`. Keep `PEAK_LOW_DB` below
  `PEAK_HIGH_DB`, and both below `CLIP_THRESHOLD_DB`.
- The script only adjusts while it hears a voice above `VOICE_THRESHOLD_DB`. This is set high on
  purpose, so noise does not count as a voice. If a speaker is too quiet to be detected, raise
  the gain by hand until the script picks the voice up.
- With [Translator](5-translator.md) on the same vMix, give the two inputs titles with
  `Translator` and `AutoGain`, so each script picks the input you mean.

## Log messages

The script prints its start-up lines, the missing-input notice, and
`AutoGain | Unexpected error: ...` when a read fails. Each time it changes the gain it prints
`AutoGain | Gain 12 -> 13 dB`.
