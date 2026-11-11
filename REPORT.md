# V5 methodology report

Autonomous run, 2026-11-11. Work was done directly on `main`.

**Status:** all 21 tests pass, `npm run build` (tsc + vite) passes, pushed to `main`.

How to run the tests (no new dependencies; Node ≥ 22.18 runs TypeScript natively):

```bash
node --import ./tests/register.mjs --test tests/*.test.ts
```

`package.json` was not touched, so there is no `npm test` script. Adding
`"test": "node --import ./tests/register.mjs --test tests/*.test.ts"` would be a one-line change if you want it.

---

## Part A — fixes to Steps 1–3

### A1. All ecoregions

- `scripts/build_ecoregion_risk.py` processes **all 85 CONUS EPA Level III ecoregions** (dissolved by
  `US_L3CODE`) with the approved recipe: forested cells only, SSP2-4.5, mean of 2020s–2050s, fire in full,
  drought/insects as `max(0, projected − 1980s)`, `combined = 1 − (1 − fire)(1 − max(d_ex, i_ex))`,
  `perm30 = (1 − combined)^30`, P25/median/P75 per ecoregion. It also stores the full-independence case
  for sensitivity and a regional risk percentile (used by the badge).
- "Forested cells" = cells where all three CarbonPlan web layers have data (147,454 of 946,647 grid
  cells). The published layers are only populated over the authors' forest mask.
- **82 ecoregions have data; 3 have no forested cells**: Central California Valley (7), Flint Hills (28),
  Nebraska Sand Hills (44). Pins there, and pins outside every polygon, show
  "No regional risk data for this location". There is no flat 18% fallback.
- **Known regions still match** (perm30 medians):

  | Region | Expected | Now |
  |---|---|---|
  | Cascades (4) | 92.5% | 92.52% |
  | Sierra Nevada (5) | 51.6% | 51.57% |
  | N. Appalachians (58 + 59 pooled) | 99.7% | 99.68% |

  With every ecoregion processed separately, the app assigns pins to 58 (Northeastern Highlands, 99.76%)
  or 59 (Northeastern Coastal Zone, 99.11%) individually. The pooled figure is kept for the
  sensitivity table.
- Polygons: coverage-simplified at 0.04° and rounded to 0.01° (about the 4 km risk grid), all 85 valid.
  The file is `public/data/ecoregions.json` (501 KB raw) and is **lazy-fetched** when a pin is dropped.
- **Change from the plan:** both data files are now fetched from `public/data/` rather than through a
  dynamic `import()`. The 500 KB JSON imports made `tsc` infer giant literal types, and this approach
  keeps the JS bundle small. Vercel serves static files before applying the SPA rewrite, so no config
  change was needed.

### A2. No 0.3 fallback

- `SEQUESTRATION_RATES` no longer has a cropland entry, and the type excludes it.
- No practice selected → status `no-practice`: zero credits, with the line "no change in management means
  no soil-carbon stock change, so no additional carbon is credited."
- Practice selected but no pin → status `needs-location`: "Drop a pin on the map…".
- County or scenario missing in COMET (including −999 "not estimated") → "Data unavailable".
- **Related removal:** the flat `PERMANENCE_FACTORS` (1.0 / 0.82) had no source, so it is gone entirely.
  Forest uses regional risk or shows the no-data state. Cropland, shrubland, grassland, wetland and
  other show "reversal risk not modeled" and get **no** reversal discount, and the UI says so. Before,
  unprotected non-forest parcels got the 0.82 factor. See TODOs.

### A3. Irrigation

- Variants are no longer averaged. A new irrigated / non-irrigated toggle (default non-irrigated) picks
  the matching variant. The county file stores 6 practices × 2 variants per county.
- COMET has several variants per practice beyond irrigation. I chose one exact variant per practice, and
  the UI and Methodology show its full COMET implementation text:

  | CPS | Label | Exact COMET `planner_implementation` ({I} = Irrigated / Non-Irrigated) | Why this variant |
  |---|---|---|---|
  | 329 | No-Till | Intensive Till to No Till or Strip Till on {I} Cropland | The "Reduced Till to No Till" variant exists for only 5 counties |
  | 345 | Reduced Till | Intensive Till to Reduced Till on {I} Cropland | Only variant |
  | 340 | Cover Crops | Add Non-Legume Seasonal Cover Crop to Intensive Till {I} Cropland | Cover crop alone, no bundled fertilizer cut, typical tillage baseline |
  | 590 | Nutrient Management | Improved N Fertilizer Management on Intensive Till {I} Croplands - Reduce Fertilizer Application Rate by 15% | Simplest variant; the same 15% cut that COMET's 888 combination uses |
  | 336 | Compost | Add 3 tons/ac of Compost (C:N 20) Annually to Intensive Till {I} Croplands | Lowest annual rate (COMET offers 3/6/10 t/ac × annual/every 3 yrs/once) |
  | 888 | No-Till + Nutrient Management | Intensive Till to No Till or Strip Till (CPS 329) + Synthetic N Fertilizer Reductions of 15% (CPS 590) on {I} Croplands | The exact No-Till + N-management combination |

  **Please review the 340 and 336 choices.** They are judgment calls. A sub-variant selector would be a
  small follow-up.

### A4. Practices

- Kept exactly the approved set: 329, 345, 340, 590, 336, 888. Removed 328 (Conservation Crop Rotation),
  372 and 585.
- **The earlier Step 1 labels were wrong.** In the source data, 372 is "Combustion System Improvement"
  (it had been labeled Stripcropping), 329 is No-Till (had been "Cover Crop"), 340 is Cover Crop (had
  been "Reduced Tillage"), and 345 is Reduced Till. The new labels come from the data's `cps_name` column.
- Observation to review: across counties, the 888 combination's median benefit (0.167 MT CO₂e/ac/yr
  non-irrigated) is lower than 329 alone (0.475). This is what COMET reports for that combination. I did
  not adjust it.

## Part B — integrity badge

`scoreIntegrityRisk()` in `carbonModel.ts` is a pure function. The point values and thresholds live in
`constants.ts` (`INTEGRITY_POINTS`, `INTEGRITY_THRESHOLDS`) and are documented on Methodology §5.

| Input | Points |
|---|---|
| Additionality: conservative / moderate / high | 0 / 1 / 2 |
| Protection: protected / unprotected | 0 / 1 |
| Regional risk percentile of the ecoregion median vs. all CONUS forest cells: <50 / 50–74 / ≥75 / unavailable | 0 / 1 / 2 / 1 |
| Land cover overridden (chosen ≠ NLCD-detected) | 2 |

Low = 0–2, Medium = 3–4, High = 5–7. The badge sits next to the net-value headline and is labeled as
CarbonVal's own heuristic, not any ratings agency's rating. The results panel shows the per-component
points.

## Part C — caveats and Methodology

- Under the main result, the existing disclaimer stays directly beneath the number. Below it, a visible
  note reads "For screening and decision support only — not for registering or selling credits."
- Near forest results: "Forest growth rates are still IPCC Tier 1 defaults and are coarse at the parcel
  scale." The matching TODO is in `constants.ts`.
- Methodology page, renumbered: §1 calculation chain, §2 IPCC rates (cropland removed), **§3 Cropland /
  COMET-Planner** (stock-change logic, irrigation, exact variants, county vs. MLRA caveat, citation in
  COMET's requested format), **§4 Reversal risk** (Anderegg / CarbonPlan, 1980s baseline for drought and
  insects only, max combining, CARB 2015 Table D.10 buffer 11.50% / 3.97% rendered from the constants,
  enrollment toggle, Verra 12% minimum and ACR as context), **§5 Integrity badge**, **§12 Changes based on
  expert review**, **§13 Known limitations**, **§14 Sensitivity**, **§16 Data credits** (CarbonPlan /
  Anderegg CC-BY-4.0, COMET, CARB, EPA), and new entries in the references list.
- `data/SOURCES.md` lists every source with URL, download date, version and requested citation.
  `scripts/` holds both build scripts so the data files can be reproduced.

### Sensitivity (perm30 median, before the CARB buffer)

| Region | max() (used) | Full independence |
|---|---|---|
| Cascades | 92.5% | 92.5% |
| Sierra Nevada | 51.6% | 47.0% |
| N. Appalachians (58 + 59) | 99.7% | 99.7% |

## Part D — verification

- `tests/model.test.ts` and `tests/data.test.ts`, 21 tests, all passing. They cover:
  - no practice = zero, plus the needs-location and data-unavailable states
  - unit conversion (acres → ha; MT CO₂e/ac/yr × acres)
  - Q1 ≤ median ≤ Q3 for every ecoregion
  - enrollment toggle → P25 vs. median
  - badge at Low, Medium and High, with edges
  - outside-coverage states (null region, zero-forest ecoregion, ocean point)
  - CARB buffer = 11.50% and 3.97%
  - irrigation toggle picks the right variant
  - point-in-polygon with holes and MultiPolygons
  - known regional medians and sensitivity constants against the shipped JSON
  - COMET file layout
- `npm run build` passes (`tsc -b` + `vite build`, exit 0). The only warning is the existing >500 kB
  chunk warning, which comes from jsPDF and html2canvas in the main bundle and predates this work.
- Smoke test in a browser, against the built `dist/` served locally:
  - A Nevada pin resolved to Central Basin and Range (13): permanence 78.9%, regional risk 89th
    percentile, badge Medium.
  - Cropland with no practice showed the zero / no-stock-change message.
  - CPS 329 looked up the county through the FCC API: 0.109 MT CO₂e/ac/yr. The irrigation toggle
    switched it to 0.380.
  - The Methodology page rendered all 17 sections.
  - The only console error was the expected 404 for `/api/classify-land`, a Vercel function that isn't
    served locally. That also exercised the "detection failed but pin still used" path.
- Save & Share: `saveValuation` writes the new V5 columns. If the table doesn't have them yet (PostgREST
  `PGRST204` / Postgres `42703`), it retries with the original columns only, so saving keeps working
  before the migration. Shared links read `select('*')` and default any missing fields.
- PDF export now includes the practice and irrigation setting, ecoregion, permanence factor, enrollment
  setting, integrity badge, and the screening caveat. It shows "Data unavailable" when the status
  requires it.

### Supabase SQL (not run — apply manually)

Saved as `supabase/migrations/20261111000000_v5_methodology.sql`:

```sql
alter table public.valuations
  add column if not exists cps_number integer,
  add column if not exists irrigated boolean default false,
  add column if not exists adverse_selection boolean default true,
  add column if not exists detected_land_type text,
  add column if not exists eco_region_code text,
  add column if not exists permanence_factor double precision,
  add column if not exists integrity_risk text;
```

Until this runs, shared links can't restore the practice, irrigation or enrollment settings; they fall
back to the defaults. Valuations saved before V5 have no pin. For a forest parcel, their shared link now
shows "Drop a pin…" instead of a number, because no regional risk can be looked up.

## Part E — ship

Committed in logical chunks on `main`: data, COMET data, model, UI, Save & Share, Methodology, tests,
then this report. Pushed only after the tests and the build passed. The live-site check is in the next
section.

---

## Before / after: three sample parcels

All three: 100 acres, 20 years, $15 mid price, unprotected, moderate additionality, enrollment risk ON
(OFF in brackets). "Before" = the model at commit `f841375`, run unchanged. "After" = the new model on
the shipped data files.

| Parcel (pin) | Before: permanence / credits / net | After: ecoregion | After: permanence | After: credits | After: net value | Badge |
|---|---|---|---|---|---|---|
| California mixed forest — Placer Co., CA (39.25, −120.75) | 0.82 / 1,593 t / $21.4K | Sierra Nevada (5), risk pct 98.5 | 32.7% [45.6%] | 635 t [887 t] | $8.5K [$11.9K] | Medium (4) |
| Southeast evergreen forest — Laurens Co., GA (32.5, −83.0) | 0.82 / 1,842 t / $25.4K | Southeastern Plains (65), risk pct 45.8 | 84.8% [85.9%] | 1,906 t [1,930 t] | $26.3K [$26.6K] | Low (2) |
| Midwest cropland, no-till — Marshall Co., IA (41.88, −93.1) | 0.82 / 149 t / $1.8K (IPCC 0.3 tCO₂/ha/yr) | — (COMET county 19127) | not modeled | 896 t | $10.8K | Medium (3) |

The Iowa no-till increase is large. COMET's 0.5975 MT CO₂e/ac/yr for this county (it includes N₂O and
fuel savings) replaces the generic 0.3 tCO₂/ha/yr (≈ 0.12 per acre). There is also no longer a
permanence discount for cropland (see TODOs).

---

## Every TODO

| Where | TODO |
|---|---|
| `src/lib/constants.ts` (SEQUESTRATION_RATES) | Forest growth rates are still IPCC Tier 1 defaults and are coarse at the parcel scale. Replace with regional growth data (e.g. FIA-based) once sourced. |
| `src/lib/carbonModel.ts` (cropland) | Soil-carbon reversal risk for cropland is not modeled; no sourced value. |
| `src/lib/carbonModel.ts` (other land) | Reversal risk for shrubland, grassland, wetland and other is not modeled; no sourced value. These no longer get the uncited 0.82 factor. |
| `src/lib/constants.ts` (CO_BENEFITS) | Co-benefit multipliers aren't traceable to a specific published table. |
| `src/lib/constants.ts` (ADDITIONALITY_LEVELS) | The 0.60 / 0.75 / 0.90 factors were not located in VM0007; verify. |
| `src/lib/constants.ts` (VERIFICATION_COST) | No single published source for 20%. |

## Skipped, flagged or not fixed

- **Pre-existing issues noticed but left unchanged** (outside this task's scope):
  - The "High" additionality option is described as "land already informally protected or low
    conversion risk", yet it earns the largest factor (0.90). Already-protected land is usually *less*
    additional. The badge counts "High" as the riskiest choice, but the factor itself is unchanged.
  - NLCD class 81 (Pasture/Hay) maps to Grassland in `earthEngine.ts`, but Methodology §11 says Cropland.
- **COMET download date:** the requested citation needs the download date. I used 2026-10-21, the file's
  modification date. Please correct it in `COMET_CITATION` if that's wrong.
- **No new dependencies or config changes** were needed. Tests use Node's built-in runner.
- **Slow builds:** `node_modules` on the iCloud-synced Desktop was almost entirely "dataless" (evicted).
  That was the cause of the 13-minute build. I forced the files to download with read-only `cat` and
  did not reinstall anything.
