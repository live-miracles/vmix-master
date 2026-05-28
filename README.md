## [vMix Master](https://live-miracles.github.io/vmix-master/)

<img width="700" alt="vMix Master" src="https://github.com/user-attachments/assets/ad8fd4e9-939b-4239-84c4-10f47a881c47">

vMix Master is a lightweight web interface for remotely controlling vMix from a browser. It is useful for live production workflows where you want a quick control surface for switching, audio, custom API commands, and monitoring without sitting directly at the vMix machine.

The app can connect to one or more vMix systems at the same time. Its slave feature lets you control multiple vMix instances together from one place, which is handy for multi-language streams, backup systems, multi-room productions, or any setup where several vMix machines need to stay in sync.

- Remote vMix control through a simple browser-based UI.
- Multi-vMix master/slave control for synchronized workflows.
- Custom commands for vMix API actions like audio changes, device toggles, and other automation.
- A vMix-style web panel for common live production controls.
- Ready-to-use vMix scripts in `vmix-scripts/`.

> Note: Chrome can connect from the hosted HTTPS GitHub Pages site to vMix over HTTP on your local network. For local use, clone the `gh-pages` branch or download the ZIP from the `gh-pages` branch, then open `index.html` from the cloned or extracted folder in Chrome.

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
