# Translator

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

If it cannot find an input, it prints `No mic / vMix Call input detected.` and looks again
after five seconds.

## Settings

All times are in milliseconds.

| Setting            | Default | Meaning                                                                                                      |
| ------------------ | ------- | ------------------------------------------------------------------------------------------------------------ |
| `LOOP_TIME`        | `50`    | How often the script checks the translator's level                                                           |
| `VOICE_THRESHOLD`  | `0.1`   | The level that counts as speech. `0.1` is about -20 dB. See [Audio levels](../3-reference/1-audio-levels.md) |
| `CHAIN_BUS`        | `"B"`   | The bus whose volume is adjusted, `"A"` to `"G"`                                                             |
| `VOLUME_DOWN_TIME` | `900`   | How long the fade down takes when the translator starts                                                      |
| `VOLUME_REDUCED`   | `50`    | The volume of the chain bus while the translator speaks, 0 to 100                                            |
| `SILENCE_LIMIT`    | `2000`  | How long the translator must be silent before the volume comes up the first time                             |
| `VOLUME_UP_TIME`   | `1000`  | How long the first raise takes                                                                               |
| `VOLUME_FULL`      | `75`    | The volume after the first raise                                                                             |
| `SILENCE_LIMIT2`   | `4000`  | How long the translator must be silent before the volume comes up the second time                            |
| `VOLUME_UP_TIME2`  | `2000`  | How long the second raise takes                                                                              |
| `VOLUME_FULL2`     | `85`    | The volume after the second raise                                                                            |

`VOLUME_DOWN_TIME = 900` fits the 800 ms delay. If the translator goes straight to the
master without a delay, use `350` so the program is already low when the voice is heard.

## How it works

```
Chain bus volume
| ──────●                                   ●─────
|        \                                 /
|         \                               /
|          \                             /
|           \                 ●──────●
|            \                /
|             ●────────●──────●
+----+----+----+----+----+----+----+----+----+----→ Time
          T1          T2     T3
```

- **T1.** The translator starts speaking, meaning the level is above `VOICE_THRESHOLD` and the
  input is not muted. The chain bus fades down to `VOLUME_REDUCED` over `VOLUME_DOWN_TIME`.
  While the translator keeps speaking the fade is sent again at most once per
  `VOLUME_DOWN_TIME`.
- **T2.** The translator stops speaking.
- **T3.** After `SILENCE_LIMIT` of silence the volume comes up to `VOLUME_FULL`, and after
  `SILENCE_LIMIT2` it comes up again to `VOLUME_FULL2`. Raising it in two steps is smoother
  than one jump, and it fits a translation where the interpreter is almost always speaking,
  so the program never returns to full volume between sentences.

The volume is never raised before the translator has spoken for the first time since the
script started. This keeps it from changing the bus when you start it.

## Tuning

- If the program also contains music or other parts that should be at full volume, set
  `VOLUME_FULL2` to `100`, so the program returns to full after a longer silence.
- If the script reacts to breathing or room noise, raise `VOICE_THRESHOLD`. If it misses quiet
  speech, lower it. The script reads the left channel of the input's meter.
- `VOLUME_REDUCED` is a percentage on vMix's volume scale, which is not linear. 50 on the
  scale is much quieter than half the loudness, see
  [Audio levels](../3-reference/1-audio-levels.md).

## Log messages

The script only prints its start-up lines, a missing-input notice, and
`Translator | Unexpected error: ...` when a read fails, so it stays quiet while it works.
