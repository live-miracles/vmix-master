# Audio levels

vMix describes audio on several different scales, and the numbers in its API are not the ones
on the faders. This page explains them, because the thresholds of the
[Translator](../2-scripts/5-translator.md) and [AutoGain](../2-scripts/6-auto-gain.md)
scripts are written in them.

## The scales

| Scale      | Range               | Where it is used                                                                  |
| ---------- | ------------------- | --------------------------------------------------------------------------------- |
| Volume     | 0 to 100            | The volume bars in the interface, and `SetVolumeFade`                             |
| Amplitude  | 0 to 1              | The level of an audio bus or an input's meter in the API, `meterF1` and `meterF2` |
| Amplitude2 | 0 to 100            | The volume of an input in the API, `volume`                                       |
| Decibels   | minus infinity to 0 | Audio engineering. `0 dB FS` is the loudest signal that can be represented        |

## Converting between them

```
Amplitude  = Amplitude2 / 100
Amplitude2 = Amplitude * 100
Volume     = (Amplitude ^ 0.25) * 100
Amplitude  = (Volume / 100) ^ 4
Decibels   = 20 * Math.Log10(Amplitude)
Amplitude  = 10 ^ (Decibels / 20)
```

The volume scale is not linear. It is the amplitude raised to the power of a quarter, which is
why the middle of a fader is much quieter than half the loudness.

## Examples

What a **meter** reads at each volume, and what the **control**, the volume bar, does to a
voice that arrives at -18 dB FS.

| Volume (%) | Amplitude | Meter (dB FS) | Control (dB FS) \* |
| ---------- | --------- | ------------- | ------------------ |
| 100        | 1.0000    | 0.00          | −18.00             |
| 95         | 0.8145    | −1.78         | −19.78             |
| 90         | 0.6561    | −3.66         | −21.66             |
| 85         | 0.5220    | −5.65         | −23.65             |
| 80         | 0.4096    | −7.75         | −25.75             |
| 75         | 0.3164    | −10.00        | −28.00             |
| 70         | 0.2401    | −12.39        | −30.39             |
| 65         | 0.1785    | −14.97        | −32.97             |
| 60         | 0.1296    | −17.75        | −35.75             |
| 55         | 0.0915    | −20.77        | −38.77             |
| 50         | 0.0625    | −24.08        | −42.08             |
| 45         | 0.0410    | −27.74        | −45.74             |
| 40         | 0.0256    | −31.84        | −49.84             |
| 35         | 0.0150    | −36.47        | −54.47             |
| 30         | 0.0081    | −41.83        | −59.83             |
| 25         | 0.0039    | −48.16        | −66.16             |
| 20         | 0.0016    | −55.92        | −73.92             |
| 15         | 0.0005    | −65.91        | −83.91             |
| 10         | 0.0001    | −80.00        | −98.00             |
| 5          | 0.0000    | −104.08       | −122.08            |
| 1          | 0.0000    | −160.00       | −178.00            |
| 0          | 0.0000    | -∞            | -∞                 |

\* For a usual incoming voice signal of -18 dB FS.

## Volumes in decibels

The volume bar can also be described in decibels, as the change it makes to the signal:
`Decibels = 20 * Math.Log10(Amplitude)`, which together with the conversions above gives

```
Volume   = 100 * 10 ^ (Decibels / 80)
Decibels = 80 * Math.Log10(Volume / 100)
```

The [Translator](../2-scripts/5-translator.md) settings use this, because a decibel is the same
change of loudness anywhere on the scale, and a step of 1 on the volume scale is not.

| Decibels | Volume (%) |
| -------- | ---------- |
| 0        | 100        |
| -3       | 91.7       |
| -6       | 84.1       |
| -9       | 77.2       |
| -12      | 70.8       |
| -15      | 64.9       |
| -18      | 59.6       |
| -24      | 50.1       |
| -30      | 42.2       |
| -36      | 35.5       |
| -48      | 25.1       |

## What to keep in mind

- A **meter** at 100 % is 0 dB FS, the loudest possible signal. A **volume bar** at 100 % is
  the full incoming signal, which for a normal voice is about the target loudness of -18 dB FS.
- Lowering a volume bar to 50 % therefore reduces the incoming signal **by** 24 dB, relative
  to the signal, and not **to** -24 dB.

## Thresholds in the scripts

| Setting                                                         | Value    | Equivalent           |
| --------------------------------------------------------------- | -------- | -------------------- |
| [Translator](../2-scripts/5-translator.md) `VOICE_THRESHOLD_DB` | `-20` dB | 0.1 amplitude        |
| [AutoGain](../2-scripts/6-auto-gain.md) `VOICE_THRESHOLD_DB`    | `-20` dB | 0.1 amplitude        |
| [AutoGain](../2-scripts/6-auto-gain.md) `TARGET_LEVEL_DB`       | `-14` dB | 0.2 amplitude        |
| [AutoGain](../2-scripts/6-auto-gain.md) `AVERAGE_THRESHOLD_DB`  | `-30` dB | about 0.03 amplitude |
| [AutoGain](../2-scripts/6-auto-gain.md) `CLIP_THRESHOLD_DB`     | `-1` dB  | about 0.9 amplitude  |

To pick your own threshold, take the level you want in decibels and use
`Amplitude = 10 ^ (Decibels / 20)`.
