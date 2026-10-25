# AutoGain: automatic microphone gain

AutoGain watches a microphone, or a call, and adjusts its **gain** by itself. It keeps the
**top peaks** of the voice in a range you set: it looks at the highest peak of the last few
seconds, lowers the gain when that peak is above the range and raises it when it is below. A clip
lowers the gain at once. A speaker who moves closer or further away stays at a usable level
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

| Setting              | Default | Meaning                                                                                                                |
| -------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `LOOP_TIME`          | `50`    | How often the script reads the level                                                                                   |
| `CLIP_THRESHOLD_DB`  | `-1`    | A level above this counts as clipping                                                                                  |
| `CLIP_DOWN_TIME`     | `1000`  | The shortest time between two gain decreases caused by clipping                                                        |
| `PEAK_HIGH_DB`       | `-5`    | The top of the peak range. When the highest peak of the window is above it, the gain is lowered                        |
| `PEAK_LOW_DB`        | `-6`    | The bottom of the peak range. When the highest peak of the window is below it, the gain is raised                      |
| `PEAK_WINDOW`        | `5000`  | How long the script collects readings before it judges the highest peak. The range changes the gain at most this often |
| `VOICE_THRESHOLD_DB` | `-20`   | A level above this counts as a voice                                                                                   |
| `VOICE_DURATION`     | `250`   | How long the voice level must last without a break to count as speaking, so short noises are ignored                   |
| `VOICE_WAIT`         | `5000`  | When there has been no voice for this long, the script stops changing the gain                                         |

## How it works

The script changes the input's gain in steps of 1 dB, between **0 and 24 dB**. It aims to keep
the loudest peaks between `PEAK_LOW_DB` and `PEAK_HIGH_DB`.

- **Window.** The script keeps the highest reading of the current window of `PEAK_WINDOW`.
  When the window is full, it judges that peak:
    - above `PEAK_HIGH_DB`: the gain is lowered by 1 dB;
    - below `PEAK_LOW_DB`: the gain is raised by 1 dB;
    - in between: the gain is left alone.

    Then the next window starts from zero, so a peak is judged only once.

- **New window after a change.** The meter shows the level after the gain, so after any gain
  change, including a clip, the window is restarted and a full new window is collected at the
  new gain. Every decision is made on `PEAK_WINDOW` of speech at the current gain, and the range
  changes the gain at most once per `PEAK_WINDOW`. A speaker who is too quiet gets about one more
  decibel every five seconds, until the peaks reach the range.
- **Clip.** When the level goes above `CLIP_THRESHOLD_DB`, the gain is lowered by 1 dB at
  once, without waiting for the window. This happens at most once per `CLIP_DOWN_TIME`.
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
  goes up and down too much, widen the range, for example `-9` to `-5`, or make `PEAK_WINDOW`
  longer. A shorter window reacts faster, but judges each change on less speech. Keep
  `PEAK_LOW_DB` below `PEAK_HIGH_DB`, and both below `CLIP_THRESHOLD_DB`.
- A muted input is not measured. When it is unmuted, the script collects a full window before
  it changes the gain.
- The script only adjusts while it hears a voice above `VOICE_THRESHOLD_DB`. This is set high on
  purpose, so noise does not count as a voice. If a speaker is too quiet to be detected, raise
  the gain by hand until the script picks the voice up.
- With [Translator](5-translator.md) on the same vMix, give the two inputs titles with
  `Translator` and `AutoGain`, so each script picks the input you mean.

## Log messages

The script is quiet while it works. It prints its start-up lines, the missing-input notice, and
`AutoGain | Unexpected error: ...` when a read fails. It does not log gain changes; watch the
input's gain in vMix to follow them.
