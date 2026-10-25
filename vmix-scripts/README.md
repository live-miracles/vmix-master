# vMix scripts

Free, ready-to-use scripts for vMix's built-in scripting (VB.NET, 4K and Pro editions). They
cover multi-system sync, sidechain audio ducking for interpreters, automatic microphone gain,
audio fades, a clip countdown, and next-input preview. They are part of
[vMix Master](https://github.com/live-miracles/vmix-master), but each one works on its own,
without the web app.

| Script                                                                                   | What it does                                                                                     |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [`slave.vb`](slave.vb) ([docs](../docs/2-scripts/2-slave.md))                            | Makes one vMix follow another: program, preview and playback position, by input number.          |
| [`name-slave.vb`](name-slave.vb) ([docs](../docs/2-scripts/3-name-slave.md))             | Makes one vMix follow another by input name, with a fallback input.                              |
| [`preview-next.vb`](preview-next.vb) ([docs](../docs/2-scripts/4-preview-next.md))       | Puts the next input into preview after each transition.                                          |
| [`translator.vb`](translator.vb) ([docs](../docs/2-scripts/5-translator.md))             | Sidechain ducking: lowers the program audio while an interpreter speaks, then raises it again.   |
| [`auto-gain.vb`](auto-gain.vb) ([docs](../docs/2-scripts/6-auto-gain.md))                | Adjusts the gain of a microphone or call input to keep the peaks in range.                       |
| [`audio-fade.vb`](audio-fade.vb) ([docs](../docs/2-scripts/7-audio-fade.md))             | Fades the audio of media inputs in and out on transitions.                                       |
| [`duration-timer.vb`](duration-timer.vb) ([docs](../docs/2-scripts/8-duration-timer.md)) | Writes the time left of the current input into a title, and counts up when there is no duration. |

## Install a script

1. Open the `.vb` file you want and copy all of it.
2. In vMix, open **Settings → Scripting**, create a new script, make sure the language is
   VB.NET, and paste the code.
3. Edit the settings under `' ===== Configurations =====` at the top.
4. Start it with the `ScriptStart` function, using the script's name as the value.

The [scripts guide](../docs/2-scripts/1-overview.md) has the details, a "which script do I
need?" table, and how scripts combine.

Each script prints its version when it starts and tells you when a newer one is available.
