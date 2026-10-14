# AutoGain

AutoGain watches a microphone, or a call, and adjusts its **gain** by itself. It lowers the
gain when the signal clips, and raises it when the voice has been too quiet for a while, so
a speaker who moves closer or further away stays at a usable level without anyone touching
the input.

## Set up

1. Add the script to the vMix that has the microphone, see
   [adding a script](1-overview.md#add-a-script-to-vmix).
2. Start the script. The defaults suit most voices.

The input it adjusts is the first of these that exists:

1. An input with `AutoGain` in its title.
2. The first input of type **Audio**.
3. The first input of type **VideoCall**.

Put `AutoGain` in the title of the right input to be certain. If none is found, the script
prints `No inputs have 'AutoGain' in the name or have Audio or VideoCall type.` and looks
again after five seconds. A muted input is left alone.

## Settings

Levels are the `meterF1` value of the input, which is an amplitude from 0 to 1. See
[Audio levels](../3-reference/1-audio-levels.md) for the decibel equivalents. Times are in
milliseconds.

| Setting           | Default | Meaning                                                                                              |
| ----------------- | ------- | ---------------------------------------------------------------------------------------------------- |
| `LOOP_TIME`       | `50`    | How often the script reads the level                                                                 |
| `CLIP_THRESHOLD`  | `0.9`   | A level above this, about -1 dB, counts as clipping                                                  |
| `GAIN_DOWN_TIME`  | `1000`  | The shortest time between two gain decreases                                                         |
| `PEAK_THRESHOLD`  | `0.45`  | A level above this, about -7 dB, counts as loud enough                                               |
| `PEAK_WAIT`       | `5000`  | How long there must be no loud-enough peak before the gain may be raised                             |
| `GAIN_UP_TIME`    | `3000`  | The shortest time between two gain increases                                                         |
| `VOICE_THRESHOLD` | `0.1`   | A level above this, about -20 dB, counts as a voice                                                  |
| `VOICE_DURATION`  | `250`   | How long the voice level must last without a break to count as speaking, so short noises are ignored |
| `VOICE_WAIT`      | `5000`  | When there has been no voice for this long, the script stops changing the gain                       |

## How it works

The script changes the input's gain in steps of 1 dB, between **0 and 24 dB**.

- **Down.** When the level goes above `CLIP_THRESHOLD`, the gain is lowered by 1 dB. This
  happens at most once per `GAIN_DOWN_TIME`.
- **Up.** When no peak above `PEAK_THRESHOLD` has been seen for `PEAK_WAIT`, the gain is
  raised by 1 dB. This happens at most once per `GAIN_UP_TIME`. So a speaker who is too quiet
  gets about one more decibel every three seconds, until peaks reach the target.
- **Only while someone speaks.** A voice is detected when the level stays above
  `VOICE_THRESHOLD` for `VOICE_DURATION`. When there has been no voice for `VOICE_WAIT`, the
  script makes no changes. Gain does not creep up during silence, and a clean pause does not
  turn a quiet room into loud noise.

## Good to know

- It adjusts a single input. With several microphones, put `AutoGain` in the title of the one
  that matters, usually the main speaker.
- It only changes the **gain**. The input's volume and the bus volumes are not touched.
- The gain moves slowly on purpose. After a change in the speaker or the microphone position it
  takes some seconds to settle.
- With [Translator](5-translator.md) on the same vMix, give the two inputs titles with
  `Translator` and `AutoGain`, so each script picks the input you mean.

## Log messages

The script is quiet while it works. It prints its start-up lines, the missing-input notice,
and `AutoGain | Unexpected error: ...` when a read fails.
