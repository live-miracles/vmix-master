# vMix Master

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![Live demo](https://img.shields.io/badge/live-demo-brightgreen.svg)](https://live-miracles.github.io/vmix-master/?demo)

**Run several vMix systems as one: from a browser, with nothing to install.**

### [▶ Try the live demo](https://live-miracles.github.io/vmix-master/?demo) &nbsp;·&nbsp; [Open the app](https://live-miracles.github.io/vmix-master/)

The demo runs three simulated vMix systems in your browser, so you can try everything without vMix and nothing is sent over the network.

<p align="center">
  <img src="docs/demo.gif" alt="Quick Play on the master starts the video on all three grouped vMix systems" width="860">
</p>

vMix Master is a web control panel for productions that use more than one vMix machine: a main stream plus translated streams, a hot backup, or several rooms that must switch together. Pick one vMix as the master, add the others to its group, and every switch, audio change, or custom API command is sent to all of them.

## Features

- **Group control:** commands from the panel go to the master and every vMix in its group. The master is marked on its group button.
- **Program and preview:** large timers, a position slider, **Restart** and **Play/Pause**, and six transition buttons (Quick Play, Cut, Stinger 1, Stinger 2, Fade, FTB).
- **Inputs and audio:** every input as a tile with overlays 1–6, loop, volume, and send-to-bus buttons, plus the audio buses with live level meters.
- **At-a-glance status:** each vMix has a status dot (connected, unreachable, no address), and its program and preview inputs.
- **Edit in place:** double-click a name or an address to change it, and toggle group membership with one click.
- **Function buttons:** start and stop outputs (external, SRT), audio, playback, timers, and scripts, grouped by category, plus a raw request box for any vMix API function.
- **Setup check:** compare group members for mismatched buses, call sources, input types, layers, and durations before you go live.
- **Follow-the-master scripts:** drop-in vMix scripts keep slaves in step with the master, see [vMix scripts](#vmix-scripts).
- **Works on a phone or tablet** and can be installed as an app from Chrome.
- **Zero install:** it is a static page. Open the hosted site, or run it from a local copy.

<p align="center">
  <img src="docs/screenshot.png" alt="vMix Master controlling three grouped vMix systems" width="720">
  &nbsp;
  <img src="docs/mobile.png" alt="vMix Master on a phone" width="190" align="top">
</p>

## How it compares

vMix Master doesn't replace the tools below. It covers the multi-instance case that they leave to you.

|                           | **vMix Master**                   | vMix Web Controller (built-in)    | Bitfocus Companion                                     |
| ------------------------- | --------------------------------- | --------------------------------- | ------------------------------------------------------ |
| Best for                  | Several vMix systems kept in step | Quick control of a single vMix    | Custom button surfaces and hardware (e.g. Stream Deck) |
| Install                   | None, runs in the browser         | None, built into vMix             | A separate app running on a machine                    |
| Multiple vMix instances   | ✅ Yes, via master/group          | ❌ One instance per page          | ⚠️ Yes, but you build the pages and sync logic         |
| Follow-the-master scripts | ✅ Included                       | ❌                                | ❌                                                     |
| Setup comparison          | ✅                                | ❌                                | ❌                                                     |
| Hardware control surfaces | ❌                                | ❌                                | ✅                                                     |
| Free and open source      | ✅                                | ❌ Part of vMix (not open source) | ✅                                                     |

✅ yes &nbsp; ❌ no &nbsp; ⚠️ possible with extra work

Use the built-in Web Controller for a single machine, and Companion if you want physical buttons. Use vMix Master when several vMix machines need to switch together.

## Quick start

0. Want to look around first? Open the [demo](https://live-miracles.github.io/vmix-master/?demo).
1. Enable the vMix Web Controller (**Settings → Web Controller**). The default port is `8088`.
2. Open [the hosted app](https://live-miracles.github.io/vmix-master/) in Chrome, allow the local network access prompt, and add your vMix machines by IP.
3. Mark the master, tick **Part of Group** on the others, and start switching.
4. For automatic follow-the-master, load `slave.vb` or `name-slave.vb` into each slave vMix and set the master IP.

> Note: Chrome can connect from the hosted HTTPS GitHub Pages site to vMix over HTTP on your local network. The first time, Chrome asks whether to allow the site to access devices on your local network. Choose **Allow**. The page only talks to the vMix addresses you enter. For fully offline use, clone the `gh-pages` branch or download the ZIP from the `gh-pages` branch, then open `index.html` from the cloned or extracted folder in Chrome.

## vMix scripts

Ready-to-use scripts for vMix's scripting feature are in [`vmix-scripts/`](vmix-scripts/). The app shows their current versions under **vMix Scripts**.

| Script                                          | What it does                                                                                                           |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [Slave](vmix-scripts/slave.vb)                  | Follows a master vMix: active input, preview, and playback position.                                                   |
| [NameSlave](vmix-scripts/name-slave.vb)         | Follows a master by input name instead of number, with a fallback input when there is no match.                        |
| [PreviewNext](vmix-scripts/preview-next.vb)     | Puts the next input into preview after each transition.                                                                |
| [Translator](vmix-scripts/translator.vb)        | Sidechain ducking: lowers the program audio while the translator speaks, then raises it again in two smooth steps.     |
| [AutoGain](vmix-scripts/auto-gain.vb)           | Adjusts the gain of audio and call inputs (and inputs named "AutoGain") to avoid clipping or low volume.               |
| [AudioFade](vmix-scripts/audio-fade.vb)         | Fades audio in and out during transitions for inputs with "AudioFade" in their title.                                  |
| [DurationTimer](vmix-scripts/duration-timer.vb) | Writes the remaining time of the current input into a title named "DurationTimer" (counts up if there is no duration). |

## Development

```sh
npm install
npm run dev
```

Common npm commands:

```sh
npm run build
npm test
npm run format
npm run format:check
```

The project uses npm scripts only. The website root lives in `public/`, and the TypeScript source lives in `public/ts/`. `npm run dev` serves the site at `http://localhost:3000` with live reload for TypeScript, HTML, CSS, and static asset changes. `npm run build` compiles browser scripts into ignored `public/js/` and DaisyUI/Tailwind CSS into ignored `public/output.css`.

The demo is a small simulated vMix in [`public/ts/demo.ts`](public/ts/demo.ts). Boxes whose host is `demo`, `demo2`, and so on are answered by it instead of the network, and `?demo` opens three grouped ones.

Every push to `master` runs GitHub Actions, executes the unit tests, builds the ignored assets, and publishes the current site to the `gh-pages` branch. If a `stable` branch exists, the workflow also builds that branch into the `/stable/` folder on GitHub Pages.

## Feedback

Found a bug or have an idea? Please [open an issue](https://github.com/live-miracles/vmix-master/issues). vMix Master is released under the [MIT License](LICENSE).
