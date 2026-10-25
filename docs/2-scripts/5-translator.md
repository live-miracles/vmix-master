# Translator: sidechain audio ducking for interpreters (vMix script)

Translator lowers the program audio while a translator, or interpreter, is speaking, and
brings it back up when they stop. It is a **sidechain**: it watches the level of the
translator's microphone and adjusts the volume of another bus, the **chain bus**, that
carries the program audio.

It is built for a stream where an interpreter speaks over the original audio. Without it, the
operator has to ride a fader all event.

## Set up the audio

The script works with this routing. The numbers are the defaults.

1. The **program audio** goes to the chain bus, `B` by default. Set `CHAIN_BUS` to the bus
   you use.
2. The **translator's input** goes to bus **C** only, with **Master** switched off for that
   input.
3. Add a **sound delay of 800 ms** to bus C. The audio is mixed 800 ms late, which gives the
   script time to lower the program before the translation is heard.
4. Send both buses to the master.

```
Translator input ─┬─► level meter ─► Translator script
                  └─► Bus C (800 ms delay) ─┐
                                            ├─► Master
Program audio ─► chain bus (B), set by script ┘
```

The translator's input is the first of these that exists:

1. An input with `Translator` in its title.
2. The first input of type **Audio**.
3. The first input of type **VideoCall**.

Add `Translator` to the title of the input to be sure the right one is used.

## Set up the script

1. Add the script to the vMix that mixes the audio, see
   [adding a script](1-overview.md#add-a-script-to-vmix).
2. Check `CHAIN_BUS`, and the times below if your setup differs.
3. Start the script.

If it cannot find an input, it prints
`Translator | No input found. Looked for an input with 'Translator' in its title, then an input of type Audio, then an input of type VideoCall. Trying again in 5 seconds.`
and looks again after five seconds.

## Settings

All times are in milliseconds. Volumes are in decibels, see
[Audio levels](../3-reference/1-audio-levels.md#volumes-in-decibels).

| Setting              | Default | Meaning                                                                                                     |
| -------------------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| `LOOP_TIME`          | `50`    | How often the script checks the translator's level                                                          |
| `VOICE_THRESHOLD_DB` | `-20`   | The level of the translator's input that counts as speech, in dB. Raise it towards `0` to be less sensitive |
| `CHAIN_BUS`          | `"B"`   | The bus whose volume is adjusted, `"A"` to `"G"`                                                            |
| `VOLUME_DOWN_TIME`   | `900`   | How long the fade down takes when the translator starts                                                     |
| `VOLUME_REDUCED_DB`  | `-24`   | The volume of the chain bus while the translator speaks, in dB. `-24` is 50 on vMix's volume scale          |
| `SILENCE_LIMIT`      | `2000`  | How long the translator must be silent before the volume starts to come up                                  |
| `VOLUME_UP_TIME`     | `2000`  | How long the raise takes                                                                                    |
| `VOLUME_FULL_DB`     | `-6`    | The volume after the raise, in dB. `-6` is 84 on vMix's volume scale, and `0` is full volume                |

`VOLUME_DOWN_TIME = 900` fits the 800 ms delay. If the translator goes straight to the
master without a delay, use `350` so the program is already low when the voice is heard.

## How it works

```
Chain bus volume
| ──────●                                   ●─────
|        \                                 /
|         \                               /
|          \                             /
|           \                           /
|            \                         /
|             ●─────────●─────────────●
+----+----+----+----+----+----+----+----+----+----→ Time
          T1             T2           T3
```

- **T1.** The translator starts speaking, meaning the level is above `VOICE_THRESHOLD_DB` and the
  input is not muted. The chain bus fades down to `VOLUME_REDUCED_DB` over `VOLUME_DOWN_TIME`.
  While the translator keeps speaking the fade is sent again at most once per
  `VOLUME_DOWN_TIME`.
- **T2.** The translator stops speaking.
- **T3.** After `SILENCE_LIMIT` of silence the volume starts to come up to `VOLUME_FULL_DB`,
  and arrives `VOLUME_UP_TIME` later. The slow raise is smoother than a jump. If the translator
  speaks again on the way up, the volume goes down again at once.

The volume is never raised before the translator has spoken for the first time since the
script started. This keeps it from changing the bus when you start it.

## Tuning

- The default `VOLUME_FULL_DB = -6` fits a translation where the interpreter is almost always
  speaking. If the program also contains music or other parts that should be at full volume,
  set `VOLUME_FULL_DB` to `0`, so the program returns to full after the silence.
- If the script reacts to breathing or room noise, raise `VOICE_THRESHOLD_DB`, for example
  to `-15`. If it misses quiet speech, lower it, for example to `-25`. The script reads the left channel of the input's meter.
- The volumes are in decibels because vMix's volume scale is not linear: 50 on the scale is much
  quieter than half the loudness. The script converts the decibels to the vMix scale and rounds
  to a whole number, see [Audio levels](../3-reference/1-audio-levels.md).

## Log messages

The script only prints its start-up lines, a missing-input notice, and
`Translator | Unexpected error: ...` when a read fails, so it stays quiet while it works.
