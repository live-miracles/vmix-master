# [vMix Master](https://live-miracles.github.io/vmix-master/)

<img width="700" alt="vMix Master" src="https://github.com/user-attachments/assets/ad8fd4e9-939b-4239-84c4-10f47a881c47">

**Run several vMix systems as one: from a browser, with nothing to install.**

vMix Master is a web control panel for productions that use more than one vMix machine: a main stream plus translated streams, a hot backup, or several rooms that must switch together. Pick one vMix as the master, add the others to its group, and every switch, audio change, or custom API command is sent to all of them.

<!-- TODO: replace the screenshot above with a short GIF: switch on the master, slaves follow -->

### What it does

- **Group control:** commands from the panel go to the master and every vMix in its group.
- **Slave scripts:** drop-in vMix scripts (`vmix-scripts/`) make a slave follow the master's active input, preview, and playback position, either by input number (`Slave`) or by input name (`NameSlave`).
- **Setup check:** compare group members for mismatched bus settings, call sources, input types, layers, and durations before you go live.
- **Live translation:** a sidechain `Translator` script ducks the program audio while the translator speaks.
- **Custom commands:** send any vMix API function, such as audio changes, device toggles, and other automation.
- **Zero install:** it is a static page. Open the hosted site, or run it from a local copy.

### How it compares

vMix Master doesn't replace the tools below. It covers the multi-instance case that they leave to you.

|                           | **vMix Master**                   | vMix Web Controller (built-in) | Bitfocus Companion                                     |
| ------------------------- | --------------------------------- | ------------------------------ | ------------------------------------------------------ |
| Best for                  | Several vMix systems kept in step | Quick control of a single vMix | Custom button surfaces and hardware (e.g. Stream Deck) |
| Install                   | None, runs in the browser         | None, built into vMix          | A separate app running on a machine                    |
| Multiple vMix instances   | Yes, via master/group             | One instance per page          | Yes, but you build the pages and sync logic            |
| Follow-the-master scripts | Included                          | No                             | No                                                     |
| Setup comparison          | Yes                               | No                             | No                                                     |
| Hardware control surfaces | No                                | No                             | Yes                                                    |
| Free and open source      | Yes                               | Included with vMix             | Yes                                                    |

Use the built-in Web Controller for a single machine, and Companion if you want physical buttons. Use vMix Master when several vMix machines need to switch together.

### Quick start

1. Enable the vMix Web Controller (**Settings → Web Controller**). The default port is `8088`.
2. Open [the hosted app](https://live-miracles.github.io/vmix-master/) in Chrome, allow the local network access prompt, and add your vMix machines by IP.
3. Mark the master, tick **Part of Group** on the others, and start switching.
4. For automatic follow-the-master, load `slave.vb` or `name-slave.vb` into each slave vMix and set the master IP.

> Note: Chrome can connect from the hosted HTTPS GitHub Pages site to vMix over HTTP on your local network. The first time, Chrome asks whether to allow the site to access devices on your local network. Choose **Allow**. The page only talks to the vMix addresses you enter. For fully offline use, clone the `gh-pages` branch or download the ZIP from the `gh-pages` branch, then open `index.html` from the cloned or extracted folder in Chrome.

### Development

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

Every push to `master` runs GitHub Actions, executes the unit tests, builds the ignored assets, and publishes the current site to the `gh-pages` branch. If a `stable` branch exists, the workflow also builds that branch into the `/stable/` folder on GitHub Pages.
