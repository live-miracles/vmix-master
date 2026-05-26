## [vMix Master](https://live-miracles.github.io/vmix-master/)

<img width="700" alt="vMix Master" src="https://github.com/user-attachments/assets/ad8fd4e9-939b-4239-84c4-10f47a881c47">

During live translations, we sometimes use multiple vMix systems. This web interface allows us to control multiple vMix systems in a master-slave relationship and much more.

- Custom Commands: remotely adjust input volume, turn on/off external devices, etc.
- vMix Web: Provides a web vMix-like interface.
- vMix scripts for use inside vMix live in `vmix-scripts/`.

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

Every push to `master` runs GitHub Actions, executes the unit tests, builds the ignored assets, and publishes `public/` to the `gh-pages` branch.
