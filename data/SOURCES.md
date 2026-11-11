# Data sources

Every external dataset or document CarbonVal uses, with where it came from, when it
was downloaded, its version, and the citation the source asks for. Only official
sources, or the repository the paper itself links to, are used. No mirrors or
third-party copies.

Derived files shipped with the app:

| File | Built by | From |
|---|---|---|
| `public/data/ecoregions.json` | `scripts/build_ecoregion_risk.py <us_eco_l3.shp> public/data/ecoregions.json 0.04 0.01` | Anderegg et al. / CarbonPlan risk layers + EPA Level III ecoregions |
| `public/data/comet_cropland.json` | `scripts/build_comet_cropland.py <US_COMETPlanner_data.xlsx> public/data/comet_cropland.json` | COMET-Planner v4.0 Build 2 |

---

## 1. Forest reversal risk: Anderegg et al. (2022), via CarbonPlan

- **Paper:** Anderegg, W.R.L., Chegwidden, O.S., Badgley, G., Trugman, A.T., Cullenward, D.,
  Abatzoglou, J.T., Hicke, J.A., Freeman, J., Hamman, J.J. (2022). Future climate risks from
  stress, insects and fire across US forests. *Ecology Letters* 25(6), 1510–1520.
  https://doi.org/10.1111/ele.14018
- **Data URL (CarbonPlan, linked from the paper's code repository https://github.com/carbonplan/forest-risks):**
  - https://carbonplan.blob.core.windows.net/carbonplan-forests/risks/results/web/fire.zarr
  - https://carbonplan.blob.core.windows.net/carbonplan-forests/risks/results/web/drought.zarr
  - https://carbonplan.blob.core.windows.net/carbonplan-forests/risks/results/web/insects.zarr
- **Variable / version:** `ssp245` arrays, shape [12 decades × 783 × 1209], 4 km CONUS Albers grid,
  decades 1980s–2090s. The web layers carry no version tag; content as served on the download date.
- **Downloaded:** first 2026-10-21 (3-region analysis); full re-download 2026-11-11 (all ecoregions).
- **License:** CC-BY-4.0 (CarbonPlan forest-risks README: "When possible, the data used by this
  project is licensed using the CC-BY-4.0 license … we request that you also maintain that attribution").
- **Attribution:** "Forest risk data: Anderegg et al. (2022), Ecology Letters, doi:10.1111/ele.14018;
  data by CarbonPlan (CC-BY-4.0). Per-ecoregion statistics derived by CarbonVal."
- **Processing:** forested cells = cells where all three layers have data; SSP2-4.5 mean of the
  2020s–2050s; fire in full; drought and insects as max(0, projected − 1980s);
  combined = 1 − (1 − fire)(1 − max(drought_excess, insects_excess)); perm30 = (1 − combined)^30;
  P25 / median / P75 per ecoregion. Sensitivity: full-independence combining.

## 2. EPA Level III Ecoregions

- **Title:** Level III Ecoregions of the Conterminous United States
- **Publisher:** U.S. EPA Office of Research and Development, National Health and Environmental
  Effects Research Laboratory, Corvallis, OR. Publication date 2013-04-16 (shapefile files dated 2015-07-17).
- **URL:** https://dmap-prod-oms-edc.s3.us-east-1.amazonaws.com/ORD/Ecoregions/us/us_eco_l3.zip
  (linked from https://www.epa.gov/eco-research/level-iii-and-iv-ecoregions-continental-united-states)
- **Downloaded:** 2026-10-21; re-downloaded 2026-11-11.
- **Use constraints (from metadata):** "None … Acknowledgement of the EPA would be appreciated."
- **Citation:** U.S. Environmental Protection Agency. 2013. Level III Ecoregions of the
  Conterminous United States. U.S. EPA ORD – NHEERL, Corvallis, OR.
- **Processing:** dissolved by `US_L3CODE` (85 ecoregions), reprojected to WGS84, coverage-simplified
  at 0.04° and rounded to 0.01° (comparable to the 4 km risk grid).

## 3. COMET-Planner

- **Dataset:** COMET-Planner Dataset, Version 4.0, Build 2. Released Sept. 30, 2025; updated
  Oct. 22, 2025 (fix for missing Woody Plantings in Connecticut).
- **File:** `US_COMETPlanner_data.xlsx`, sheet "Emissions Reductions", column `total_ghg_co2`
  (MT CO2e/ac/yr). Provided by the project owner from www.comet-planner.com (file dated 2026-10-21).
- **URL:** https://comet-planner.com
- **Citation (as requested in the dataset's metadata sheet):** Amy Swan, Jorge Locatelli, Crystal
  Toureene, Mark Easter, Adam Chambers, Kevin Brown, Stephen A. Williams, Jeff Creque, John Wick,
  Keith Paustian. 2025. COMET-Planner Dataset, Version 4.0, Build 2, and COMET-Planner Report:
  Carbon and Greenhouse Gas Evaluation for NRCS Conservation Practice Planning. A companion report
  to www.comet-planner.com. Downloaded at www.comet-planner.com on October 21, 2026.
- **Processing:** class "Cropland Management"; one exact `planner_implementation` per practice and
  irrigation setting (listed in `src/lib/constants.ts` → `COMET_PRACTICES`); −999 ("not estimated")
  stored as null. No internal COMET API endpoints were used.

## 4. CARB U.S. Forest Projects Protocol

- **Document:** California Air Resources Board, Compliance Offset Protocol, U.S. Forest Projects,
  adopted June 25, 2015. Appendix D, Table D.10 (risk values from Tables D.2–D.9).
- **URL:** https://ww2.arb.ca.gov/sites/default/files/cap-and-trade/protocols/usforest/forestprotocol2015.pdf
- **Accessed:** 2026-10-21.
- **Note:** the 2014 ISOR proposed-rulemaking appendix (Table D.13) listed social risk at 2%; the
  adopted 2015 protocol lists 0%. CarbonVal uses the adopted values.

## 5. Context documents (cited on the Methodology page, no values used in calculations)

- Verra, AFOLU Non-Permanence Risk Tool v4.2 (2023), §2.5.2 minimum risk rating of 12.
  https://verra.org/wp-content/uploads/2023/10/AFOLU-Non-Permanence-Risk-Tool-v4.2-FINAL.pdf (accessed 2026-10-21)
- ACR, Reversal Risk Tool v2.0 (2024-11-19).
  https://acrcarbon.org/wp-content/uploads/2016/01/ACR-Risk-Tool-v2.0-2024-11-19.pdf (accessed 2026-10-21)

## 6. Runtime services

- FCC Area API (county FIPS from a pin): https://geo.fcc.gov/api/census/block/find — public, no key.
- USGS NLCD 2021 via MRLC WMS (land cover detection, unchanged from V2).
