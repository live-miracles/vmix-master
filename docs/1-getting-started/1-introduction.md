# Introduction

vMix Master is a web control panel for [vMix](https://www.vmix.com/). It runs entirely in
your browser: there is no server and nothing to install. You open the page, enter the
address of one or more vMix systems, and control them from there.

It works for a single vMix, where it shows every input by name with program and preview,
audio buses with level meters, overlays, playback controls, and any vMix function. When a
production uses several vMix machines, such as a main stream plus translated streams, a hot
backup, or several rooms that must switch together, you group them and every action goes to
all of them.

You can try everything without vMix in the
[demo](https://live-miracles.github.io/vmix-master/?demo), which runs three simulated
systems inside the page.

## How it works

```
 Your browser                      vMix machines
┌─────────────────┐ status (XML) ┌──────────────────┐
│ vMix Master     │◄──────────── │ vMix (master)    │
│ (a static page) │─ commands ──►│ <ip>:8088/api/   │
│                 │              ├──────────────────┤
│                 │─ commands ──►│ vMix (group)     │
└─────────────────┘              └──────────────────┘
```

The page talks to each vMix directly over its Web Controller API:

- **Status:** every refresh interval it fetches `http://<ip>:8088/api/`, which returns the
  state of the whole vMix as XML (inputs, program and preview, audio, overlays), and redraws
  the dashboard. The interval is the **Refresh rate** in Settings, one second by default.
- **Commands:** a click sends a vMix API function, for example
  `http://<ip>:8088/api/?Function=Cut&Input=5`. A command goes to the master and to every
  group member, and the affected systems are refreshed shortly afterwards so you see the
  result straight away.

Nothing goes through a third party. The hosted page only delivers the code, and your
browser sends the requests to your vMix machines.

## Terms

| Term             | Meaning                                                                                                                                       |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Box              | One vMix system in the row at the top. It shows a status dot, the name, the address, and what is on program and preview.                      |
| Master           | The box whose status the panel below shows, and that actions are sent from. Click a box to make it the master.                                |
| Group            | The boxes with the group button switched on. When the master is in the group, every action goes to the master and to all other group members. |
| Panel            | Everything below the boxes: program and preview, audio buses, and the inputs.                                                                 |
| Function buttons | The cards under the panel for outputs, transitions, audio, playback, timers, scripts, and a raw request box for any vMix function.            |

A group master is shown with a **MASTER** label on its group button and a green outline. A
master that is not in a group only controls itself.

## Where your setup is stored

Your boxes are stored in the page address, so you can bookmark it or send it to a colleague:

| Parameter      | Holds                                          | Example                                |
| -------------- | ---------------------------------------------- | -------------------------------------- |
| `boxes`        | Name and address of each box, separated by `¦` | `Main.192.168.1.20¦Hindi.192.168.1.21` |
| `group`        | The numbers of the boxes that are in the group | `1 2`                                  |
| `master`       | The number of the master box                   | `1`                                    |
| `refresh-rate` | Seconds between status refreshes               | `1`                                    |

The installed app always opens at the plain page address, so it also saves this setup in your
browser and puts it back each time you open the app. The saved address suggestions from
Settings are stored in your browser too. Because the boxes
are kept in the address, avoid `.` and `¦` in box names.

## Scripts

vMix Master controls vMix from the outside. For things that must happen inside vMix, such as
making a second vMix follow the master or lowering the program audio while a translator
speaks, there are ready-to-use [vMix scripts](../2-scripts/1-overview.md).

Next: [connect to vMix](2-connect-vmix.md).
