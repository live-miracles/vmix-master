# PreviewNext

PreviewNext puts the next input into preview after every transition. For a rundown of
numbered inputs it saves the operator from selecting the next item by hand: take the current
input to program, and the one after it is already waiting in preview.

## Set up

1. Add the script to the vMix you operate, see
   [adding a script](1-overview.md#add-a-script-to-vmix). It needs no address and no other
   configuration.
2. Change the settings below if you need to, and start the script.

Run it on the **master** only. A vMix that runs [Slave](2-slave.md) gets its preview from
the master already, and a second script would set the preview as well.

## Settings

| Setting      | Default | Meaning                                                                                                                     |
| ------------ | ------- | --------------------------------------------------------------------------------------------------------------------------- |
| `LOOP_TIME`  | `300`   | How often, in milliseconds, the script checks which input is on program                                                     |
| `DELAY_TIME` | `1000`  | How long to wait, in milliseconds, after the program changes before the preview is updated. This lets the transition finish |

## How it works

When the program input changes, the script waits `DELAY_TIME`, and then sends `PreviewInput`
with the **next input number**: the number of the program input plus one. After you start the
script it does this once for the input that is on program at that moment.

If the program input is the last one, the request points past the end of the input list.
vMix ignores it, so the preview stays as it was.

## Good to know

- "Next" means the next input **number**. It is not the next item in a list, and it does not
  skip inputs that are not part of your rundown. Number the inputs in the order you play
  them, as in `01 Opening`, `02 Waiting`, `03 Welcome`.
- It reacts to the program changing, however that happened: a click, a shortcut, or another
  script.
- Anything you put in preview yourself stays until the next program change, and is then
  replaced.

## Log messages

- `PreviewNext | Updating preview: 6`: the preview was set to input 6.
- `PreviewNext | Unexpected error: ...`: reading the vMix status failed, and the script retries.
