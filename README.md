# Shoreline Response to Caspian Sea-Level Decline in Qizilagac Bay, Azerbaijan

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Google Earth Engine](https://img.shields.io/badge/Google%20Earth%20Engine-JavaScript%20API-blue)](https://earthengine.google.com/)
![Status: preliminary](https://img.shields.io/badge/status-preliminary-orange)

> **Status: preliminary, work in progress.** Prepared for ICAAD 2026 (23-25 October 2026).
> Results are first-order estimates and have **not** been independently validated.
> See [Limitations](#limitations) before citing any number.

## Summary

The Caspian Sea has been falling since the mid-2010s. Qizilagac (Gizil-Aghaj) Bay on the Azerbaijani coast is
shallow and very flat, so a small vertical drop exposes a large area of former seabed. This repository quantifies
that response using satellite altimetry for the level and Sentinel-2 imagery for the waterline.

**Headline result.** About **2.1 km2 of seabed is exposed per centimetre of level drop** (2.11 km2/cm for 2016-2024;
1.95 and 2.17 for the two sub-intervals; 1.88-2.25 when the water-index threshold is varied by +-0.1;
2.11-2.24 across four study-zone definitions).
This figure does not depend on any assumed coastline length. Horizontal retreat (m/cm) is reported only as a wide,
spatially variable range and should not be quoted as a single coefficient.

## Research question

How much area is exposed, and how far does the shoreline retreat, per centimetre of observed Caspian Sea-level
decline in Qizilagac Bay, and how well does a coarse global DEM represent this response?

### Differences from the planned design

| Planned | Implemented so far |
|---|---|
| GEBCO bathymetry (~450 m) | **ETOPO1 (~1.85 km)** so far, as a first comparison; one ROI-mean slope value, not a coastal-strip slope. A GEBCO analysis and an ETOPO1-vs-GEBCO comparison are planned (see [Next steps](#next-steps)) |
| Hold-out *years* | One **temporal hold-out interval**: 2016-2020 calibrates, 2020-2024 is predicted |
| Segment-specific coefficients | 0.02-degree **latitude bands** (21-22 bands), not shore-normal transects |
| Annual waterlines from about 2015 | **Three epochs**: 2016, 2020, 2024 |
| Independent validation of waterlines | **Not done** |
| Vertical land motion | **Not quantified** |

## Data

| Data | Source | Notes |
|---|---|---|
| Caspian Sea level | G-REALM (NASA/USDA), lake 000270, product TPJOJS.2.5, column 15 (EGM2008 datum) | Radar altimetry (Jason-2/3, Sentinel-6A). One track averaged over the basin, **not** a local gauge. |
| Waterline | Sentinel-2 L2A, `COPERNICUS/S2_SR_HARMONIZED` (Earth Engine) | 1 Aug-30 Sep, cloud cover < 5%: 11 scenes (2016), 32 (2020), 30 (2024) |
| Bathymetry proxy | `NOAA/NGDC/ETOPO1` (Earth Engine) | Used for one theoretical slope-based sensitivity |

Mean August-September level: 2016 = -27.224 m, 2020 = -27.467 m, 2024 = -28.397 m, giving a level drop of
**24.25 cm** (2016-2020), **93.00 cm** (2020-2024) and **117.25 cm** (2016-2024).

## Method

1. **Level drop (dH).** Mean Aug-Sep altimetric level per epoch; dH is the difference between epochs.
2. **Water mask.** Median Sentinel-2 composite per epoch; NDWI = (B3 - B8) / (B3 + B8) > 0.
3. **Exposed land.** Water in the earlier epoch and land in the later epoch, clipped to a coastal study zone;
   connected patches smaller than 256 pixels (10 m) are removed.
4. **Area sensitivity.** Exposed area (km2) divided by dH (cm).
5. **Retreat per latitude band.** Mean retreat = band area / band height (0.02 deg, 2.22 km); sensitivity = retreat / dH.
   This assumes a roughly north-south shoreline.
6. **Temporal hold-out.** Band coefficients k1 (m/cm) from 2016-2020 predict 2020-2024 retreat as k1 x dH(2020-2024),
   compared with a uniform median coefficient and with the ETOPO1-based value.
7. **Sensitivity and checks.** NDWI threshold of -0.1, 0 and +0.1; four study-zone definitions; additivity of the two
   intervals; visual inspection of the band with the largest error.

The study zone is a hand-defined polygon around the coastal strip (see `scripts/gee_waterline_extraction.js`).

## Results

### Exposed area per centimetre of level drop

| Interval | dH (cm) | Exposed area (km2) | km2 per cm |
|---|---|---|---|
| 2016-2020 | 24.25 | 47.4 | 1.95 |
| 2020-2024 | 93.00 | 201.4 | 2.17 |
| **2016-2024** | **117.25** | **247.5** | **2.11** |

The two sub-intervals agree within the uncertainty of dH (24 cm is small relative to altimetry error).

**Water-index threshold sensitivity (2016-2024):**

| NDWI threshold | Area (km2) | km2 per cm | Change |
|---|---|---|---|
| -0.1 | 220.5 | 1.88 | -11% |
| 0.0 (baseline) | 247.5 | 2.11 | 0% |
| +0.1 | 263.6 | 2.25 | +7% |

**Study-zone sensitivity (2016-2024):**

| Zone definition | Area (km2) | km2 per cm | Change |
|---|---|---|---|
| Current zone (baseline) | 247.5 | 2.11 | 0% |
| + 3 km buffer | 256.4 | 2.19 | +3.6% |
| + southern strip (38.60-38.80 N) | 248.6 | 2.12 | +0.4% |
| Full ROI rectangle | 262.2 | 2.24 | +5.9% |

The baseline zone gives the lowest value, and the southern truncation is small (+0.4%). Whether the extra area outside
the baseline zone is real exposed seabed or inland false positives has not been checked.

**Additivity.** 47.40 + 201.37 = 248.76 km2 versus 247.53 km2 for the direct 2016-2024 mask (difference 1.23 km2, 0.5%).
Each interval is classified separately, so pixels that flip back between epochs enter the sum but not the direct mask.
Without the small-patch filter the difference is 2.75 km2 and equals exactly the flip-back classes
(land -> water -> land 2.67 km2; water -> land -> water 0.09 km2; verified in Earth Engine). Land -> water under a falling
sea level is physically implausible, so these pixels most likely reflect classification inconsistency in the 2020
composite (32 scenes against 11 in 2016); this was not investigated further. The filter lowers the net difference from
2.75 to 1.23 km2. The direct value is used throughout; using the sum would change 2.11 to 2.12 km2/cm.

### Horizontal retreat per latitude band (m/cm)

| Interval | Bands with gain | Median | Interquartile range |
|---|---|---|---|
| 2016-2020 | 21 | 26.1 | 14.4 - 60.4 |
| 2020-2024 | 22 | 35.0 | 11.7 - 69.1 |

Report this as a range, not a coefficient: the spread across bands is roughly fourfold to sixfold, and the method is
weakest where the shore runs east-west (north of 39.1 N) and around the sand spit.

### Temporal hold-out (predict 2020-2024 from 2016-2020; n = 22 bands)

| Predictor | Bias (m) | MAE (m) | RMSE (m) | R2 (1:1) | r |
|---|---|---|---|---|---|
| Local (band-specific k1) | -404 | 2141 | 3475 | 0.00 | 0.58 |
| Uniform (median k1 = 26.1 m/cm) | -1687 | 2740 | 3858 | -0.24 | undefined |
| ETOPO1 ROI-mean slope (22.9 m/cm) | -1982 | 2822 | 3996 | -0.33 | undefined |

The first-interval coefficients capture the spatial pattern only partly (r = 0.58) and not the magnitude (R2 close to 0);
constant predictors under-predict systematically. About half of the squared error comes from the 39.08-39.10 N band
(observed 14.5 km, predicted 2.9 km) and about 83% from the four bands between 39.08 and 39.14 N. Bands are spatially
autocorrelated, so no statistical significance is claimed. The ETOPO1-based value (22.9 m/cm) lies in the lower part of the
observed range (about 1.1-1.5 times below the medians); no "N-times underestimation" claim is made.

## Limitations

* No independent validation of the waterlines (no high-resolution imagery, GPS or gauge comparison).
* The level comes from one basin-wide altimetry track, not a gauge near the bay. Altimetry error is not propagated, and
  the transition between missions (Jason-2/3 to Sentinel-6A) relies on the product's own bias terms.
* Only three epochs; 2016 has 11 scenes; the 2020 mask is shared by both intervals, so its errors can create artificial
  anti-correlation between them. The 24 cm drop of the first interval makes its coefficients noisy.
* The study zone was derived from an earlier mask (circular by construction). Alternative definitions change km2/cm by
  +0.4% to +5.9% (the baseline zone gives the lowest value); the origin of the extra area was not checked.
* NDWI > 0 may misclassify algae-rich or turbid shallow water and wet mud. In the 39.08-39.10 N band, true-colour composites are consistent with a real change (the northern lobe of the bay shrinks and a land strip with a salt-crust fringe appears across
  the bay mouth by 2024), but its magnitude is unverified and part of it may be water classified as land.
* Hypothesis, untested: the very large 2020-2024 response near 39.08 N may be a threshold effect (a sill or bar emerging),
  meaning m/cm would not be constant with level.
* ETOPO1 is a coarse proxy. Its 22.9 m/cm is a region-mean slope over land and sea, and its elevations are probably stored as
  integer metres (to be verified), which is coarse relative to a 1.17 m drop.
* Vertical land motion is not quantified.

## Next steps

1. **GEBCO analysis and ETOPO1-vs-GEBCO comparison.** Repeat the DEM-based estimate with the GEBCO grid (15 arc-seconds)
   and compare ETOPO1, GEBCO and the observed values (km2/cm and m/cm). Both grids store elevation in whole metres
   (documented for GEBCO; to be verified for ETOPO1), which is coarse relative to a 1.17 m level change, so the comparison
   should be based on the area-elevation (hypsometric) relationship over a coastal strip rather than on a single
   region-mean slope.
2. Independent validation of the waterlines (high-resolution imagery and/or a local gauge).
3. Shore-normal transects instead of latitude bands, and an annual series instead of three epochs.
4. Quantification of vertical land motion and propagation of altimetry uncertainty.

## Version history

* **v1 (current):** level drop from G-REALM altimetry (24.25, 93.00 and 117.25 cm); exposed-area sensitivity of about
  2.1 km2/cm; threshold sensitivity; temporal hold-out; ETOPO1 comparison.
* **v0 (draft):** used placeholder values for the level drop (65 cm) and the coastline length (50 km), which gave
    78.54 m/cm and a 3.4-fold ETOPO1 ratio. These numbers are superseded and should not be cited.

## Reproducibility

1. Open the [Earth Engine Code Editor](https://code.earthengine.google.com), paste `scripts/gee_waterline_extraction.js`
   and press Run.
2. Compare the console output with the reference values in the header of the script.
3. `scripts/etopo1_roi_mean_slope.js` is intended to reproduce the ETOPO1 constant (22.898 m/cm) but has not yet been re-run as a standalone script; `scripts/zone_sensitivity.js` (run in a new, empty script) reproduces the zone-definition table.
4. Sea-level input: `data/raw/lake000270_10d_2.txt`, downloaded from <https://earth.gsfc.nasa.gov/gwm/lake/270>;
   cleaned versions are in `data/processed/`.
5. The tables `data/processed/results_*.csv` were transcribed by hand from the Earth Engine console output (the script
   does not export them). In `results_bands_holdout.csv`, the columns `pred_uniform_m` and `pred_etopo1_m` are constants
   (26.078 and 22.898 m/cm) multiplied by dH(2020-2024) = 93.0 cm.

Earth Engine results can differ marginally across runs in the last decimal places.

## Repository structure

```
scripts/
  gee_waterline_extraction.js     Full analysis (Earth Engine, JavaScript)
  etopo1_roi_mean_slope.js        ETOPO1 ROI-mean slope and theoretical sensitivity
  zone_sensitivity.js             Sensitivity of km2/cm to the study-zone definition
data/
  raw/                            G-REALM source file
  processed/                      Sea-level products and result tables
```

## Suggested citation

Khasiyeva, S. (2026). *Shoreline response to Caspian Sea-level decline in Qizilagac Bay, Azerbaijan* (preliminary
results) [Code and data]. GitHub: <https://github.com/seljankhasiyeva/caspian-remote-sensing>.

## Author

**Seljan Khasiyeva**, Baku State University.

## License

Code is released under the MIT License (see [`LICENSE`](LICENSE)). The G-REALM data file remains subject to the terms of its provider (redistribution terms have not been checked); Sentinel-2 and ETOPO1 are accessed through Google Earth Engine under their own terms.