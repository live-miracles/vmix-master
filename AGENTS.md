# Agent notes

## vMix audio scales

vMix uses several audio scales and the numbers in its API are not the ones on the faders. The
full explanation, with conversion formulas and tables, is in
[docs/3-reference/1-audio-levels.md](docs/3-reference/1-audio-levels.md). In short:

- **Volume** (0 to 100) is the scale of the volume bars and of the `Set...Volume`, `Set...VolumeFade`
  and `SetBus...VolumeFade` functions. It is the amplitude to the power of a quarter, so it is
  not linear: `Volume = 100 * Amplitude ^ 0.25`. 50 is about -24 dB and 85 is about -6 dB.
- **Amplitude** (0 to 1) is a meter's level in the API (`meterF1`, `meterF2`, bus meters).
- **Amplitude2** (0 to 100) is an input's `volume` attribute in the XML, which is `Amplitude * 100`.
  Volume 50 is 6.25 here.
- **Decibels**: `dB = 20 * Math.Log10(Amplitude)`, so `Volume = 100 * 10 ^ (dB / 80)`.

Prefer decibels for settings a user edits, and convert to the Volume scale inside the script
before calling a vMix function. Do not make users enter raw Volume numbers like 50.

## vMix scripts

- Scripts live in `vmix-scripts/` and have a page in `docs/2-scripts/`.
- Each script has a `SCRIPT_VERSION` that must match its entry in `public/versions.json`. Bump
  both when the behaviour or the settings of a script change.
- Keep the script's header comment, its docs page and the README table in step with the code.
- Run `npm run format:check` before committing, CI checks it.
