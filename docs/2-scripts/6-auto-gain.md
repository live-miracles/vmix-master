# AutoGain

AutoGain watches a microphone, or a call, and adjusts its **gain** by itself. It keeps the
**average level** of the voice at a target, and lowers the gain at once when the signal clips.
A speaker who moves closer, moves further away, or speaks louder or softer stays equally loud
without anyone touching the input.

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

| Setting                | Default | Meaning                                                                                              |
| ---------------------- | ------- | ---------------------------------------------------------------------------------------------------- |
| `LOOP_TIME`            | `50`    | How often the script reads the level                                                                 |
| `TARGET_LEVEL_DB`      | `-14`   | The average level of the voice to aim for, in dB                                                     |
| `TOLERANCE_DB`         | `2`     | The gain is left alone while the average is within this many dB of the target                        |
| `AVERAGE_TIME`         | `10000` | How long the average takes to follow a change in the voice. Longer is steadier, shorter is quicker   |
| `AVERAGE_THRESHOLD_DB` | `-30`   | A level below this is left out of the average, so pauses and room noise do not count                 |
| `CLIP_THRESHOLD_DB`    | `-1`    | A level above this counts as clipping                                                                |
| `CLIP_WAIT`            | `5000`  | How long after a clip the gain may not be raised                                                     |
| `GAIN_DOWN_TIME`       | `1000`  | The shortest time between two gain decreases                                                         |
| `GAIN_UP_TIME`         | `3000`  | The shortest time between two gain increases                                                         |
| `VOICE_THRESHOLD_DB`   | `-20`   | A level above this counts as a voice                                                                 |
| `VOICE_DURATION`       | `250`   | How long the voice level must last without a break to count as speaking, so short noises are ignored |
| `VOICE_WAIT`           | `5000`  | When there has been no voice for this long, the script stops changing the gain                       |

## How it works

The script changes the input's gain in steps of 1 dB, between **0 and 24 dB**.

- **Average.** While the voice is present, the script keeps a moving average of the level,
  which follows changes over about `AVERAGE_TIME`. Peaks and pauses hardly move it, so it is
  the loudness of the speaker and not the height of the loudest syllable.
- **Down.** When the average is more than `TOLERANCE_DB` above `TARGET_LEVEL_DB`, the gain is
  lowered by 1 dB. A level above `CLIP_THRESHOLD_DB` lowers it too, whatever the average is. This
  happens at most once per `GAIN_DOWN_TIME`.
- **Up.** When the average is more than `TOLERANCE_DB` below `TARGET_LEVEL_DB`, and there has
  been no clip for `CLIP_WAIT`, the gain is raised by 1 dB. This happens at most once per
  `GAIN_UP_TIME`. So a speaker who is too quiet gets about one more decibel every three
  seconds, until the average reaches the target.
- **Settling.** The meter is after the gain, so after each change the script moves the
  average by the same amount. It does not wait for the average to catch up, and does not
  change the gain twice for one problem.
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
- Because the average is steered to the target, the peaks of a speaker with a big dynamic range
  go higher, and the clip check is what keeps them from clipping.
- To choose `TARGET_LEVEL_DB`, let the speaker talk normally at a level you like and read the
  `average level` in the log. Use that number. Keep the target well above `VOICE_THRESHOLD_DB`,
  about 6 dB or more, or a speaker who moves away drops out of voice detection before the gain
  catches up.
- The script only adjusts while it hears a voice above `VOICE_THRESHOLD_DB`. This is set high on
  purpose, so noise does not count as a voice. If a speaker is too quiet to be detected, raise
  the gain by hand until the script picks the voice up.
- With [Translator](5-translator.md) on the same vMix, give the two inputs titles with
  `Translator` and `AutoGain`, so each script picks the input you mean.

## Log messages

The script prints its start-up lines, the missing-input notice, and
`AutoGain | Unexpected error: ...` when a read fails. Each time it changes the gain it prints
`AutoGain | Gain 12 -> 13 dB, average level -17.4 dB`, with the average that led to the change.
