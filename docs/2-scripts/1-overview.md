# vMix scripts overview

vMix Master controls vMix from the outside, through its Web Controller. Some jobs have to
happen inside vMix itself, such as making a second vMix follow the first, or lowering the
program audio while an interpreter speaks. For those there are ready-to-use scripts in the
[`vmix-scripts/`](https://github.com/live-miracles/vmix-master/tree/master/vmix-scripts) folder.
They are written in VB.NET for vMix's built-in scripting.

| Script                               | What it does                                                                   | Runs on                       |
| ------------------------------------ | ------------------------------------------------------------------------------ | ----------------------------- |
| [Slave](2-slave.md)                  | Follows a master vMix: program, preview and playback position, by input number | Each follower                 |
| [NameSlave](3-name-slave.md)         | Follows a master vMix by input name instead of number                          | Each follower                 |
| [PreviewNext](4-preview-next.md)     | Puts the next input into preview after each transition                         | The vMix you operate          |
| [Translator](5-translator.md)        | Lowers the program audio while a translator speaks                             | The vMix that mixes the audio |
| [AutoGain](6-auto-gain.md)           | Keeps a microphone out of clipping and not too quiet                           | The vMix with the microphone  |
| [AudioFade](7-audio-fade.md)         | Fades the audio of media inputs in and out on transitions                      | The vMix that plays the media |
| [DurationTimer](8-duration-timer.md) | Writes the time left of the current input into a title                         | The vMix that shows the title |

## Which script do I need?

| I want to...                                                       | Use                                                                                             |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Make another vMix take the same program and preview as a master    | [Slave](2-slave.md) if the input numbers match, [NameSlave](3-name-slave.md) if the names match |
| Keep a video on the follower at the same position as on the master | [Slave](2-slave.md)                                                                             |
| Always have the next input ready in preview                        | [PreviewNext](4-preview-next.md)                                                                |
| Duck the program audio while an interpreter speaks                 | [Translator](5-translator.md)                                                                   |
| Stop a speaker's level from clipping or sitting too low            | [AutoGain](6-auto-gain.md)                                                                      |
| Avoid abrupt audio on clips, music and jingles                     | [AudioFade](7-audio-fade.md)                                                                    |
| Show a countdown of the current clip                               | [DurationTimer](8-duration-timer.md)                                                            |

## Requirements

Scripting is a feature of the 4K and Pro editions of vMix. See vMix's own guide,
[Scripting and Automation](https://1.vmix.com/help27/ScriptingandAutomation.html), for the
details of the editor.

## Add a script to vMix

1. Open the script's `.vb` file from the
   [`vmix-scripts/`](https://github.com/live-miracles/vmix-master/tree/master/vmix-scripts)
   folder and copy all of it.
2. In vMix, open **Settings** and the **Scripting** tab, and create a new script. Give it a
   unique name, make sure the language is VB.NET, and paste the code.
3. Edit the settings at the top of the script, under `' ===== Configurations =====`. The
   follower scripts also need the master's address, see [Slave](2-slave.md).
4. Start the script. The way vMix describes it is to create a shortcut whose function is
   `ScriptStart` and whose value is the script's name. Stopping uses `ScriptStop`.

vMix Master has these two functions under **Scripts** in the function buttons, so you can start
and stop a script on the master and on every group member with one click. Type the script's
name in the box next to the button.

A script can be global, working with every preset, or local, loaded only with the preset it
belongs to. Tick **Local Script (This Preset Only)** in the editor to make it local. A script
that belongs to one show, such as [Slave](2-slave.md), can be local so it only loads with that
preset. If two scripts have the same name, vMix uses the first one in the list.

## How the scripts behave

All of them follow the same conventions, so once you have used one the rest look familiar.

- **Settings are constants at the top.** Times are in milliseconds unless the comment says
  otherwise. You edit them in the script, and they take effect the next time it starts.
- **They announce themselves.** At start each script prints its name and version, for example
  `12:30:01 Slave 1.4.3`, and then a short line for everything it does, such as
  `Slave | New active: 5`.
- **They check for updates.** After starting, each script asks
  [`versions.json`](https://live-miracles.github.io/vmix-master/versions.json) for the latest
  version and prints `Update available` if yours is older. This needs internet access on the
  vMix machine. When it fails, the script prints `Could not check for updates` and carries on.
  The **vMix Scripts** menu in vMix Master lists the same versions.
- **Errors do not stop them.** A failed request or an unexpected input state is printed as
  `Unexpected error: ...` and the script tries again on the next pass.
- **They find inputs by name or type.** Scripts that act on a particular input look for a
  keyword in its title:

    | Script                               | Input it uses                                                                                       |
    | ------------------------------------ | --------------------------------------------------------------------------------------------------- |
    | [Translator](5-translator.md)        | An input with `Translator` in the title, else the first Audio input, else the first VideoCall input |
    | [AutoGain](6-auto-gain.md)           | An input with `AutoGain` in the title, else the first Audio input, else the first VideoCall input   |
    | [AudioFade](7-audio-fade.md)         | Every input with `AudioFade` in the title                                                           |
    | [DurationTimer](8-duration-timer.md) | The title input named `DurationTimer`                                                               |

## Master and slave

The two follower scripts run on a vMix that should copy another one. The vMix being copied is
the **master**, and the one running the script is the **slave**. The slave asks the master for
its status every 300 ms and catches up.

```
vMix A (master) ◄─ status, every 300 ms ─ vMix B (slave)
you operate this                          runs Slave
```

This is separate from a group in vMix Master. In a group, every click in the web page goes to
all members at once. A follower script keeps working when someone operates the master in
vMix itself, from a shortcut or a control surface, without going through the page, and
[Slave](2-slave.md) also pulls a video back into time when it drifts. The two combine well:
group the systems in the page for instant control, and run the script on the followers as
the safety net.

## Combining scripts

- Run only one of [Slave](2-slave.md) and [NameSlave](3-name-slave.md) on a vMix. Both change
  the program, so they would fight.
- Run [PreviewNext](4-preview-next.md) on the master only. The followers get their preview
  from the master anyway.
- [Translator](5-translator.md) and [AutoGain](6-auto-gain.md) can share a vMix, but they pick
  their input by title first and then by type. Put `Translator` and `AutoGain` in the titles of
  their inputs so each finds the right one.

## Updating a script

Copy the new version over the old one in vMix. This replaces your settings and the master's
address with the defaults, so enter them again. The `SCRIPT_VERSION` line at the top tells you
which version you have.
