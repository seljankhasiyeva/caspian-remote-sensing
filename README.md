# Quantifying Shoreline Retreat per Centimetre of Caspian Sea-Level Decline in Qizilagac Bay, Azerbaijan

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Google Earth Engine](https://img.shields.io/badge/Google%20Earth%20Engine-API-blue)](https://earthengine.google.com/)

## Abstract
The ongoing decline of the Caspian Sea level presents severe consequences for shallow coastal environments, coastal infrastructure, and ecologically sensitive wetland habitats. While regional sea-level projections and historical shoreline shifts have been documented, a validated, observation-based empirical relationship between vertical sea-level decline and horizontal shoreline displacement—expressed in metres per centimetre (m/cm)—remains insufficiently established for the Azerbaijani coast.

This study quantifies the empirical sensitivity coefficient ($m/cm$) in Gizil-Aghaj (Qizilagac) Bay, Azerbaijan. Using observed sea-level records from 2016 onward as the forcing variable, multi-temporal Sentinel-2 satellite imagery was processed in Google Earth Engine (GEE) to extract annual waterlines across selected coastal segments. These empirical observations were systematically compared against theoretical shoreline responses derived from coarse-resolution (~450 m) GEBCO bathymetry. Hold-out observation years were utilized for out-of-sample validation to evaluate model performance and model discrepancies, while accounting for potential impacts of Vertical Land Movement (VLM).

## Key Research Findings
* **Total Exposed Area (2016–2024):** ~255.25 km² of previously submerged marine habitat converted to dry land.
* **Mean Horizontal Shoreline Displacement:** ~5,105.10 metres (~5.1 km) of cumulative landward retreat.
* **Observed Empirical Sensitivity Ratio ($m/cm$):** **~78.54 m/cm** (For every 1 cm vertical sea-level decline, the shoreline retreats approximately 78.54 metres horizontally).
* **GEBCO Theoretical Projection:** **~22.90 m/cm** (Derived from a mean bathymetric slope of $0.0250^\circ$).
* **Model Discrepancy & Resolution Bias:** Coarse-resolution (~450 m) GEBCO bathymetric models **underestimate** observed shoreline retreat by a factor of approximately **3.4x**, underscoring the critical necessity of empirical, high-resolution satellite-derived calibration factors for coastal hazard assessment in flat bathymetric settings.

## Methodology & Workflow
1. **Forcing Variable & Satellite Data:** Integrated observed Caspian Sea-level fluctuations with Sentinel-2 Surface Reflectance (SR) composites (August–September window) to minimize seasonal noise.
2. **Waterline Extraction & Edge Detection:** Automated Normalized Difference Water Index (NDWI) calculation combined with Canny Edge Detection in GEE to map annual waterlines (2016, 2020, 2024).
3. **Bathymetric Sensitivity Modeling:** Calculated theoretical horizontal displacement ($\Delta L = \Delta H / \tan(\theta)$) using slope angles extracted from GEBCO 2023 grid datasets.
4. **Out-of-Sample Validation:** Evaluated empirical response consistency using hold-out observation periods (Calibration: 2016–2020; Validation: 2020–2024).

## Repository Architecture
* `scripts/gee_waterline_extraction.js` — Google Earth Engine script for automated NDWI extraction, Canny edge detection, and area/retreat metrics calculation.
* `scripts/gebco_slope_analysis.py` — Python script for bathymetric slope extraction and theoretical displacement calculations.
* `scripts/validation_holdout.py` — Out-of-sample validation script evaluating calibration vs. validation performance.
* `data/processed/summary_results.csv` — Processed quantitative metrics including dry land area, mean retreat distance, and segment-specific sensitivity coefficients.
* `figures/` — Cartographic outputs, overlay waterline maps, and comparative sensitivity plots.

## Author
**Seljan Khasiyeva** (Baku State University) · *ICAAD 2026 Presentation*