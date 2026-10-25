# AudioFade: automatic audio fade in and out (vMix script)

AudioFade fades the sound of media inputs in and out when they go on and off air, instead of
cutting it abruptly. A music clip or a jingle fades out as you leave it, and is stopped and
rewound, so the next time it starts from the beginning and fades in.

It only works on inputs that have **`AudioFade`** in their title, such as
`07 Meditation Music AudioFade.mp3`.

## Set up

1. Add `AudioFade` to the title of every input that should fade.
2. Add the script to the vMix that plays them, see
   [adding a script](1-overview.md#add-a-script-to-vmix).
3. Change the settings below if you need to, and start the script.

The script sets some options on these inputs when it starts, see below. If you add or rename
an `AudioFade` input later, stop and start the script again so it gets them too.

## Settings

See [Audio levels](../3-reference/1-audio-levels.md) for how decibels relate to the vMix volume
scale.

| Setting          | Default | Meaning                                                                                                                |
| ---------------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `MAX_VOLUME_DB`  | `-3`    | The volume the input fades up to when it goes on air, in dB. `-3` is 92 on vMix's volume scale, and `0` is full volume |
| `FADE_DOWN_TIME` | `3000`  | How long the fade out takes, in milliseconds                                                                           |
| `FADE_UP_TIME`   | `1000`  | How long the fade in takes, in milliseconds                                                                            |

## How it works

When the script starts, it runs four functions on every matching input:

| Function         | Effect                                                                             |
| ---------------- | ---------------------------------------------------------------------------------- |
| `AudioAutoOff`   | vMix does not mute the input by itself on a transition                             |
| `AutoPlayOn`     | The input starts playing when it goes live                                         |
| `AutoRestartOff` | It does not restart from the beginning when it goes live                           |
| `AutoPauseOff`   | It does not pause when it goes off air, so the video keeps running during the fade |

After that, twice a second, the script looks at each of these inputs.

- **It is unmuted but no longer on program.** The volume fades to 0 over `FADE_DOWN_TIME`,
  and then the input is muted, paused and set back to position 0.
- **It is muted and now on program.** The input is unmuted and the volume fades up to
  `MAX_VOLUME_DB` over `FADE_UP_TIME`.

## Good to know

- On the first pass, an `AudioFade` input that is unmuted but not on program is faded out,
  paused and rewound like any other. Start the script before the show, while those inputs are
  idle, so this happens out of sight.
- "On air" means the input is the **program** input. An input used only as an overlay is
  not treated as on air.
- The script waits while a fade runs, so with several `AudioFade` inputs, a second one starts
  its fade after the first has finished.
- The sound is faded with the input's own volume. If you set an input's volume yourself, the
  next fade replaces it with `MAX_VOLUME_DB`.

## Log messages

- `AudioFade | Set up 2 input(s) with 'AudioFade' in their title.`: printed at start-up, with
  the number of inputs the script found and set up.
- `AudioFade | No input found. Looked for inputs with 'AudioFade' in their title. Add 'AudioFade' to the titles and start the script again.`:
  printed at start-up when no title contains `AudioFade`. The script keeps running, but an
  input renamed later misses the set-up above, so start the script again.
- `AudioFade | Fading out input 7`: input 7 left the program and is fading out.
- `AudioFade | Fading in input 7`: input 7 came on air and is fading in.
- `AudioFade | Unexpected error: ...`: a function call failed, and the script retries.
