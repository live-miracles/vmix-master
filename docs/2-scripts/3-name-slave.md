# NameSlave

NameSlave makes a vMix follow another one, the **master**, by input **name** instead of by
input number. When the master puts an input called `X` on program, this vMix takes its own
input called `X` to program. Use it when the systems have the same inputs under different
numbers.

If the numbers match, [Slave](2-slave.md) is the better choice, because it also keeps playback
in time. NameSlave only follows program and preview.

## Requirements

- An input that should be followed has **exactly the same title** on both systems, including
  capitals and spaces.
- The slave machine can reach the master's Web Controller, for example
  `http://192.168.1.20:8088/api`.
- The transition set in `TRANSITION` is available on this vMix. The default is `Stinger1`.

## Set up

1. Add the script to the **follower** vMix, see [adding a script](1-overview.md#add-a-script-to-vmix).
2. Set `masterAPI` at the top to the master's API address:

    ```vb
    Dim masterAPI As String = "http://192.168.1.20:8088/api"
    ```

    While it still has the placeholder `http://192.168.x.x:8088/api`, the script prints
    `Please update the masterAPI ... Exiting...` and stops.

3. Change the settings below if you need to, and start the script.

## Settings

| Setting             | Default      | Meaning                                                                                           |
| ------------------- | ------------ | ------------------------------------------------------------------------------------------------- |
| `LOOP_TIME`         | `300`        | How often, in milliseconds, the script asks the master for its status                             |
| `TRANSITION`        | `"Stinger1"` | The vMix transition used when the program changes. Use `"Cut"` or `"Fade"` for a plain transition |
| `TRANSITION_BUFFER` | `3000`       | How long to wait, in milliseconds, after a transition before syncing again                        |
| `DEFAULT_INPUT`     | `"1"`        | The input number to use when this vMix has no input with the master's title                       |

## How it works

Every `LOOP_TIME` the script reads the master's status and its own, and then looks up the
titles of the master's program and preview inputs.

1. It searches this vMix for an input with the same title as the master's **program** input.
   If it finds one, that input is the target, otherwise the target is `DEFAULT_INPUT`.
   When the target is not already on program, it runs `TRANSITION` with it and waits
   `TRANSITION_BUFFER`.
2. It does the same for the master's **preview** input, and sends `PreviewInput` when the
   target is not already in preview.

## Good to know

- **Names must match exactly.** `05 Opening Video - EN.mp4` and `05 Opening Video - HI.mp4`
  are different titles, so they are not matched. When each system names its inputs
  differently, number them alike and use [Slave](2-slave.md).
- **Titles with an apostrophe do not work.** The lookup uses the master's title, so if the
  master's program or preview input is called something like `Q's slide`, the lookup fails and
  the script prints an error on every pass until that input is no longer on program or in
  preview.
- If two inputs on this vMix have the same title, the first one in the list is used.
- Unmatched inputs fall back to `DEFAULT_INPUT`, so set it to something safe, such as a black
  or a slide, and not to an input that must never go on air.
- There is no playback sync. A video starts and plays here independently of the master.

## Log messages

- `NameSlave | New active: 5 (05 Opening Video.mp4)`: this vMix took input 5, which has the
  master's title, to program.
- `NameSlave | New preview: 9 (09 Q&A Slide.png)`: this vMix put input 9 in preview.
- `NameSlave | Unexpected error: ...`: a request or a lookup failed, and the script retries.

## Troubleshooting

- **It always goes to the default input.** No title matches. Compare the titles on both
  systems character by character, including trailing spaces.
- **Nothing happens.** Check that the script is started, that `masterAPI` is correct, and that
  you can open the master's API address in a browser on this machine.
