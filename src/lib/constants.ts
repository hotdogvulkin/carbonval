import type { LandType, PriceScenario, ProtectionStatus, AdditionalityLevel, CpsPractice, IntegrityRiskLevel } from '../types'

// ─── Sequestration rates (non-cropland) ─────────────────────────────────────
// IPCC 2006 Guidelines for National Greenhouse Gas Inventories, Volume 4
// (forest: Ch. 4 Table 4.9; shrubland/grassland: Ch. 6; wetland: Ch. 7; other: Ch. 9).
// Units: tCO₂/ha/yr (see Methodology §Sequestration Rates).
// Cropland has no IPCC fallback: cropland credits come only from COMET-Planner
// practice-change estimates (see COMET_* below).
// TODO: forest growth rates are still IPCC Tier 1 defaults and are coarse at the
// parcel scale; replace with regional growth data (e.g. FIA-based) when sourced.
export const SEQUESTRATION_RATES: Record<Exclude<LandType, 'cropland'>, number> = {
  evergreenForest: 3.7,  // IPCC 2006 Vol. 4 Ch. 4 Table 4.9
  deciduousForest: 2.9,  // IPCC 2006 Vol. 4 Ch. 4 Table 4.9
  mixedForest: 3.2,      // IPCC 2006 Vol. 4 Ch. 4 Table 4.9
  shrubland: 0.9,        // IPCC 2006 Vol. 4 Ch. 6 Sec. 6.2
  grassland: 0.5,        // IPCC 2006 Vol. 4 Ch. 6 Table 6.2
  wetland: 2.1,          // IPCC 2006 Vol. 4 Ch. 7 Sec. 7.2
  other: 0.2,            // IPCC 2006 Vol. 4 Ch. 9
}

export const FOREST_LAND_TYPES: LandType[] = ['evergreenForest', 'deciduousForest', 'mixedForest']

export const LAND_TYPE_LABELS: Record<LandType, string> = {
  evergreenForest: 'Evergreen Forest',
  deciduousForest: 'Deciduous Forest',
  mixedForest: 'Mixed Forest',
  shrubland: 'Shrubland',
  grassland: 'Grassland',
  cropland: 'Cropland',
  wetland: 'Wetland',
  other: 'Other',
}

// ─── Cropland: COMET-Planner v4.0 Build 2 ───────────────────────────────────
// Source: COMET-Planner Dataset, Version 4.0, Build 2 (released Sept. 30, 2025;
// updated Oct. 22, 2025), sheet "Emissions Reductions", column total_ghg_co2
// ("Mean of total greenhouse gas emission reductions", MT CO2e/ac/yr).
// One exact `planner_implementation` variant per practice, split by irrigation.
// Values are stored per county in public/data/comet_cropland.json, in this order.
export const COMET_PRACTICE_ORDER: CpsPractice[] = [329, 345, 340, 590, 336, 888]
export const COMET_VARIANT_ORDER = ['nonIrrigated', 'irrigated'] as const

// Practices offered in the selector. CPS 888 stays in the data file (and still reads for saved
// valuations) but is not offered: in 98.8% of counties COMET-Planner's 888 baseline is the
// reduced-till baseline, not intensive till (Baseline Emissions sheet; see REPORT.md, "CPS 888").
export const COMET_SELECTABLE_PRACTICES: CpsPractice[] = COMET_PRACTICE_ORDER.filter(c => c !== 888)

export const COMET_PRACTICES: Record<CpsPractice, { label: string; implementation: string }> = {
  329: { label: 'No-Till',                       implementation: 'Intensive Till to No Till or Strip Till on {irrigation} Cropland' },
  345: { label: 'Reduced Till',                  implementation: 'Intensive Till to Reduced Till on {irrigation} Cropland' },
  340: { label: 'Cover Crops',                   implementation: 'Add Non-Legume Seasonal Cover Crop to Intensive Till {irrigation} Cropland' },
  590: { label: 'Nutrient Management',           implementation: 'Improved N Fertilizer Management on Intensive Till {irrigation} Croplands - Reduce Fertilizer Application Rate by 15%' },
  336: { label: 'Compost',                       implementation: 'Add 3 tons/ac of Compost (C:N 20) Annually to Intensive Till {irrigation} Croplands' },
  888: { label: 'No-Till + Nutrient Management', implementation: 'Intensive Till to No Till or Strip Till (CPS 329) + Synthetic N Fertilizer Reductions of 15% (CPS 590) on {irrigation} Croplands' },
}

// COMET-Planner metadata sheet: "Data will be cited as follows: …"
export const COMET_CITATION =
  'Amy Swan, Jorge Locatelli, Crystal Toureene, Mark Easter, Adam Chambers, Kevin Brown, Stephen A. Williams, Jeff Creque, John Wick, Keith Paustian. 2025. COMET-Planner Dataset, Version 4.0, Build 2, and COMET-Planner Report: Carbon and Greenhouse Gas Evaluation for NRCS Conservation Practice Planning. A companion report to www.comet-planner.com. Downloaded at www.comet-planner.com on October 21, 2026.'

// ─── Reversal risk: CARB U.S. Forest Projects Protocol ──────────────────────
// CARB Compliance Offset Protocol, U.S. Forest Projects, adopted June 25, 2015,
// Appendix D, Table D.10 (risk values from Tables D.2–D.9).
// https://ww2.arb.ca.gov/sites/default/files/cap-and-trade/protocols/usforest/forestprotocol2015.pdf
// Wildfire (Table D.7) and Disease/Insect (Table D.8) are NOT listed here: they are
// replaced by the Anderegg et al. (2022) regional data. The remaining categories form
// the unmodeled buffer. "protected" = QCE / public / tribal column; "unprotected" = no QCE.
export const CARB_UNMODELED_RISKS: Record<ProtectionStatus, Record<string, number>> = {
  unprotected: {
    financialFailure: 0.05,   // Table D.2, no QCE
    illegalRemoval: 0.00,     // Table D.3
    conversion: 0.02,         // Table D.4, no QCE
    overHarvesting: 0.02,     // Table D.5, no QCE
    social: 0.00,             // Table D.6
    otherCatastrophic: 0.03,  // Table D.9
  },
  protected: {
    financialFailure: 0.01,   // Table D.2, QCE / public / tribal
    illegalRemoval: 0.00,     // Table D.3
    conversion: 0.00,         // Table D.4, QCE / public / tribal
    overHarvesting: 0.00,     // Table D.5, QCE / public / tribal
    social: 0.00,             // Table D.6
    otherCatastrophic: 0.03,  // Table D.9
  },
}

// ─── Non-forest reversal buffer: Verra AFOLU minimum ───────────────────────
// Verra, AFOLU Non-Permanence Risk Tool v4.2 (2023), Section 2.5.2: "The minimum risk rating
// shall be 12, regardless of the risk rating calculated using Table 15." The risk rating is the
// percentage of credits deposited in the buffer pool, so the minimum buffer is 12%.
// https://verra.org/wp-content/uploads/2023/10/AFOLU-Non-Permanence-Risk-Tool-v4.2-FINAL.pdf
// Applied to cropland, shrubland, grassland, wetland and other, whose reversal risk is not
// modeled in detail: permanence factor = 1 − 0.12 = 0.88.
export const VERRA_MIN_BUFFER = 0.12

// ─── Regional reversal risk: Anderegg et al. (2022) via CarbonPlan ─────────
// Anderegg, W.R.L., et al. (2022). Future climate risks from stress, insects and fire across US forests.
// Ecology Letters 25(6):1510–1520. doi:10.1111/ele.14018. Data: CarbonPlan forest-risks web layers
// (CC-BY-4.0), https://carbonplan.blob.core.windows.net/carbonplan-forests/risks/results/web/
// Per-ecoregion P25/median/P75 of perm30 are stored in public/data/ecoregions.json.
export const PERMANENCE_HORIZON_YEARS = 30  // crediting horizon used for (1 − p)^30

// Three reference regions (perm30 median, Version C; derived by the pipeline in
// data/SOURCES.md and asserted against ecoregions.json in tests/data.test.ts).
// "independent" = sensitivity case 1 − (1−fire)(1−drought_excess)(1−insects_excess).
// N. Appalachians = EPA L3 58 + 59 pooled (values from scripts/build_ecoregion_risk.py log).
export const SENSITIVITY_SAMPLE_REGIONS: Array<{ name: string; codes: string[]; maxCombining: number; independent: number }> = [
  { name: 'Cascades', codes: ['4'], maxCombining: 0.9252, independent: 0.9251 },
  { name: 'Sierra Nevada', codes: ['5'], maxCombining: 0.5157, independent: 0.4701 },
  { name: 'N. Appalachians', codes: ['58', '59'], maxCombining: 0.9968, independent: 0.9968 },
]

// ─── Integrity-risk badge (CarbonVal screening heuristic) ───────────────────
// Not a published rating and not any ratings agency's method. Point values and
// thresholds are CarbonVal's own scoring rule, documented on the Methodology page.
export const INTEGRITY_POINTS = {
  additionality: { conservative: 0, moderate: 1, high: 2 } as Record<AdditionalityLevel, number>,
  protection: { protected: 0, unprotected: 1 } as Record<ProtectionStatus, number>,
  regionalRisk: { below50: 0, from50: 1, from75: 2, unknown: 1 },
  landCoverOverride: 2,
}
export const INTEGRITY_THRESHOLDS: Array<{ minScore: number; level: IntegrityRiskLevel }> = [
  { minScore: 5, level: 'high' },
  { minScore: 3, level: 'medium' },
  { minScore: 0, level: 'low' },
]

// Co-benefit price multipliers: all 1.0 (no premium applied). Market studies find a premium for
// co-benefit certification (Ecosystem Marketplace SOVCM 2023; Lou et al. 2022, Commun. Earth
// Environ. 3:137), but no source ties a premium to land type. Kept so a sourced value can be added.
// TODO: only replace with a land-type or certification premium that has a citable source; see
// REPORT-constants.md.
export const CO_BENEFITS: Record<LandType, number> = {
  evergreenForest: 1.0,
  deciduousForest: 1.0,
  mixedForest: 1.0,
  wetland: 1.0,
  shrubland: 1.0,
  grassland: 1.0,
  cropland: 1.0,
  other: 1.0,
}

// Price scenarios ($/tCO2e): Ecosystem Marketplace, State of the Voluntary Carbon Markets 2024
// (2023–2024 VCM segments). See also src/lib/marketData.ts.
export const PRICE_PER_TON: Record<PriceScenario, number> = {
  conservative: 5,
  mid: 15,
  premium: 30,
}

export const PRICE_SCENARIO_LABELS: Record<PriceScenario, string> = {
  conservative: 'Conservative ($5/ton)',
  mid: 'Mid ($15/ton)',
  premium: 'Premium ($30/ton)',
}

// Additionality factors: CarbonVal's illustrative assumptions, not taken from any standard or
// methodology (listed under Known limitations on the Methodology page).
// TODO: replace with a defensible source; see REPORT-constants.md for candidates.
export const ADDITIONALITY_LEVELS: Record<AdditionalityLevel, number> = {
  conservative: 0.60,
  moderate: 0.75,
  high: 0.90,
}

export const ADDITIONALITY_LEVEL_LABELS: Record<AdditionalityLevel, string> = {
  conservative: 'Conservative',
  moderate: 'Moderate',
  high: 'High',
}

export const ADDITIONALITY_LEVEL_DESCRIPTIONS: Record<AdditionalityLevel, string> = {
  conservative: 'Land already protected or unlikely to change without this project',
  moderate: 'Some conversion or development pressure without this project',
  high: 'Land at high risk of conversion or development without this project',
}

// Registry and verification cost share: CarbonVal's illustrative assumption, not a published figure
// (listed under Known limitations on the Methodology page). Registry per-credit fees alone are
// about 1.5–2.3% of value at $15/t (Verra fee FAQ; ACR Fee Schedule, June 2026).
// TODO: no published source for 20%; see REPORT-constants.md.
export const VERIFICATION_COST = 0.20

// U.S. EPA, Greenhouse Gas Emissions from a Typical Passenger Vehicle, EPA-420-F-23-014 (June 2023)
export const TONS_PER_CAR_PER_YEAR = 4.6

// Acres to hectares: 1 acre = 0.40468564224 ha (NIST); rounded to 4 d.p.
export const ACRES_TO_HECTARES = 0.4047
