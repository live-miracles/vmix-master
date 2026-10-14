# DurationTimer

DurationTimer shows the time left of whatever is on program in a **title input**, so
presenters and the crew can see how long a clip has left. Under a minute it turns orange, and
in the last seconds it turns red. When the program input has no duration, such as a camera or a
still image, it counts up instead.

## Set up the title

The script writes into a title (GT) input called **`DurationTimer`**. Set that title up once:

1. Right-click the title in vMix and open **Title Editor**, then **Settings**.
2. Set **Duration** to `23:00:00`.
3. Set **Display Format** to `mm:ss`.
4. Turn on **Reverse**.
5. Turn on **Display 00:00:00 when Stopped**.

These settings are what make the count-up work for inputs without a duration, see below.

## Set up the script

1. Add the script to the vMix that shows the timer, see
   [adding a script](1-overview.md#add-a-script-to-vmix).
2. Change the settings below if you need to, and start the script.

If there is no input called `DurationTimer`, the script prepares one for you, and prints what
it did:

- If the vMix already has a GT title, the script **renames the first one it finds** to
  `DurationTimer`. Rename the title yourself first, if that one is used for something else.
- If there is none, it adds a new title from vMix's `Text Middle Centre Outline` GT preset, moves
  it to position 1 and sets its zoom to 5. That preset is looked for in vMix's default install
  folder, `C:\Program Files (x86)\vMix\titles\GT Text\`.

## Settings

| Setting          | Default           | Meaning                                     |
| ---------------- | ----------------- | ------------------------------------------- |
| `GT_INPUT_TITLE` | `"DurationTimer"` | The name of the title that is written to    |
| `YELLOW_TIME`    | `60`              | The seconds left when the text turns orange |
| `RED_TIME`       | `11`              | The seconds left when the text turns red    |

## How it works

Twice a second the script looks at the program input.

- **It has a duration.** The remaining time is written into the title as text, and the colour
  follows the time left: green above `YELLOW_TIME`, orange below it, and red below `RED_TIME`.
  The text is the seconds alone under a minute, then `m:ss`, and `h:mm:ss` from an hour on.
- **It has no duration** (live inputs, images, colours). The text is white, and the title's own
  timer runs and counts up. It starts again from zero whenever the program input changes. This
  is why the title needs the **Reverse** and **Display 00:00:00 when Stopped** settings.

## Good to know

- Only the **program** input is timed, not the preview.
- The timer is a normal title, so you can put it on an overlay, a multiview, or any output.
- The remaining time comes from the input's duration and position, so a paused video stays at
  the same time left, and a looping video counts down again each time.

## Log messages

- `DurationTimer | Could not find a GT input named 'DurationTimer'.`: the title was not found,
  and the script is about to rename or create one.
- `Renamed the first found GT '...' into 'DurationTimer'.`: an existing title was renamed.
- `Created a new GT input named 'DurationTimer'.`: a new title was added.
- `DurationTimer | Unexpected error: ...`: a read or a function call failed, and the script
  retries.
