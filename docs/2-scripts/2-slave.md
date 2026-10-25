# Slave: make one vMix follow another

Slave makes a vMix follow another one, the **master**. When the master puts an input on
program, the slave takes the same input to program. Its preview matches the master's, and
when both are playing the same video, the slave pulls its playback back into time if it
drifts.

Use it for multi-language streams, a hot backup, or several rooms that need the same
program, as long as the inputs have the **same numbers** on every system. If they are named
alike but numbered differently, use [NameSlave](3-name-slave.md).

## Requirements

- Input `N` on the slave is the matching input of input `N` on the master.
- The slave machine can reach the master's Web Controller, for example
  `http://192.168.1.20:8088/api`.
- The transition set in `TRANSITION` is available on the slave. The default is `Stinger1`.

## Set up

1. Add the script to the **slave** vMix, see [adding a script](1-overview.md#add-a-script-to-vmix).
2. Set `masterAPI` at the top to the master's API address:

    ```vb
    Dim masterAPI As String = "http://192.168.1.20:8088/api"
    ```

    While it still has the placeholder `http://192.168.x.x:8088/api`, the script prints
    `Please update the masterAPI ... Exiting...` and stops.

3. Change the settings below if you need to, and start the script.

## Settings

| Setting              | Default      | Meaning                                                                                                                     |
| -------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `LOOP_TIME`          | `300`        | How often, in milliseconds, the slave asks the master for its status                                                        |
| `TRANSITION`         | `"Stinger1"` | The vMix transition used when the program changes. Use `"Cut"` or `"Fade"` for a plain transition                           |
| `TRANSITION_BUFFER`  | `3000`       | How long to wait, in milliseconds, after a transition or a position jump before syncing again, so the transition can finish |
| `POSITION_THRESHOLD` | `30000`      | The smallest difference between the two positions, in milliseconds, that triggers a correction                              |

## How it works

Every `LOOP_TIME` the script reads its own vMix and the master's status, and then compares
three things in order.

1. **Program.** If the master's active input differs from the slave's, the slave runs
   `TRANSITION` with the master's input number and waits `TRANSITION_BUFFER`.
2. **Preview.** If the master's preview differs, the slave sends `PreviewInput` with the
   master's preview.
3. **Playback position.** The position is corrected only when all of these hold:
    - both are on the same program input,
    - the master's position is not zero,
    - the difference is bigger than `POSITION_THRESHOLD`,
    - the master is **Running**,
    - the slave's copy of the input is longer than the master's position.

    The slave then sets the input to the master's position, starts it with `Play` if it was
    not running, and waits `TRANSITION_BUFFER`.

## Good to know

- Position sync is about not letting two machines drift apart by minutes, not about frame
  accuracy. With the default threshold, a difference of up to 30 seconds is left alone,
  because every correction is a visible jump. Lower `POSITION_THRESHOLD` for a tighter match.
- A paused master is not followed. The position is only corrected while the master runs.
- If the master cannot be reached, the request times out after five seconds, the script
  prints an error, and it tries again on the next pass.
- In vMix Master you can [group](../1-getting-started/1-introduction.md#terms) the master and
  the slaves so clicks reach all of them at once. The script then acts as the safety net
  that keeps them together when the master is operated from vMix itself.

## Log messages

- `Slave | New active: 5`: the slave took input 5 to program.
- `Slave | New preview: 9`: the slave put input 9 in preview.
- `Slave | Position sync: 00:02:10 (diff: 41s, state: Paused)`: the slave jumped to 2:10. The
  difference and the state are the ones from before the correction.
- `Slave | Unexpected error: ...`: a request or an input read failed, and the script retries.

## Troubleshooting

- **Nothing happens.** Check that the script is started, that `masterAPI` is correct, and that
  you can open the master's API address in a browser on the slave machine.
- **The wrong input is taken.** The numbering differs between the systems. Fix the numbering,
  or use [NameSlave](3-name-slave.md).
- **The program does not change.** vMix may not run `TRANSITION` if it is not set up on the
  slave. Try `"Cut"` or `"Fade"` to check.
- **A video keeps jumping.** The two systems have different files behind the same input
  number, so the positions do not line up. A slave whose input is shorter than the master's
  position is skipped on purpose.
