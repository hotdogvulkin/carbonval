import type { CARBSector, CompliancePeriod } from '../types'

// CCR Title 17, Section 95812
export const COVERAGE_THRESHOLD = 25000
export const VOLUNTARY_THRESHOLD = 10000

export const COVERED_SECTORS: CARBSector[] = [
  'electricity_generation',
  'electricity_imports',
  'industrial',
  'fuel_supplier',
]

// CCR Title 17, Section 95856
export const YEAR1_SURRENDER_PCT = 0.30
export const YEAR2_SURRENDER_PCT = 0.30
export const YEAR3_SURRENDER_PCT = 0.40

// CCR Title 17, Section 95854; raised to 6% effective Jan 1, 2026 (AB 1207, Sept 2025 — program renamed Cap-and-Invest)
export const OFFSET_ELIGIBILITY_LIMIT = 0.06

// WCI auction data, 2024 reference prices
export const DEFAULT_ALLOWANCE_PRICE = 30
export const DEFAULT_OFFSET_PRICE = 20

// CARB 2022 Scoping Plan
export const ANNUAL_CAP_DECLINE = 0.04

// ─── Allowance price floor and ceiling ───────────────────────────────────────
// Year the published floor and ceiling below apply to.
export const PRICE_BOUNDS_YEAR = 2026
// Floor: CARB, "2026 Annual Auction Reserve Price Notice" (issued Dec 1, 2025), Table 2:
// California 2026 Annual Auction Reserve Price $27.94 (2025: $25.87; measure of inflation 3.01%).
// https://ww2.arb.ca.gov/sites/default/files/2025-12/nc-2026_annual_reserve_price_notice_joint_auction.pdf
export const AUCTION_RESERVE_PRICE = 27.94
// Ceiling: CARB, Price Ceiling Information page, "Price Ceiling Sale Price" table: 2026 $102.52
// (2025: $94.92). Set under CCR Title 17 §95915(f)(1)(A)–(B) ($65 in 2021, escalated annually).
// https://ww2.arb.ca.gov/our-work/programs/cap-and-trade-program/cost-containment-information/price-ceiling-information
export const PRICE_CEILING = 102.52
// Escalation rule, CCR Title 17 §95911(c)(3)(A) (reserve price) and §95915(f)(1)(B) (ceiling):
// prior year's price "increased annually by 5 percent plus the rate of inflation" (CPI-U).
export const PRICE_ESCALATION_REAL = 0.05
// Most recent CPI-U measure CARB applied (2026 notice above, Table 2: 3.01%). Future CPI is not
// published, so projections hold this value constant — an assumption, labeled in the UI.
export const LATEST_CPI_MEASURE = 0.0301

export const FREE_ALLOCATION_RANGES: Record<CARBSector, { min: number; max: number }> = {
  electricity_generation: { min: 0, max: 0 },
  electricity_imports: { min: 0, max: 0 },
  industrial: { min: 75, max: 95 },
  fuel_supplier: { min: 0, max: 10 },
}

export const CARB_SECTOR_LABELS: Record<CARBSector, string> = {
  electricity_generation: 'Electricity Generation',
  electricity_imports: 'Electricity Imports',
  industrial: 'Industrial Facility',
  fuel_supplier: 'Fuel Supplier',
}

// Compliance periods: CCR Title 17 §95840 as amended by CARB's 2026 Cap-and-Invest rulemaking
// (Final Regulation Order, corrected July 15, 2026; approved by OAL and filed Aug 31, 2026;
// effective Sept 1, 2026). §95840(d) fourth 2021–2023; (e) fifth 2024–2026; (f) sixth 2027–2028;
// (g) seventh 2029–2030; (h) eighth 2031–2033; (i) "Each subsequent compliance period after the
// eighth compliance period will alternate between a duration of two calendar years and three
// calendar years." Periods 9–13 below apply (i), starting with two years, through the program's end
// on Dec 31, 2045 (AB 1207, Stats. 2025).
// https://ww2.arb.ca.gov/sites/default/files/barcu/regact/2026/cap_invest/Attachment%20A-1%20Final%20Regulation%20Order.pdf
export const COMPLIANCE_PERIODS: Array<{ id: CompliancePeriod; start: number; end: number }> = [
  { id: '2021-2023', start: 2021, end: 2023 },
  { id: '2024-2026', start: 2024, end: 2026 },
  { id: '2027-2028', start: 2027, end: 2028 },
  { id: '2029-2030', start: 2029, end: 2030 },
  { id: '2031-2033', start: 2031, end: 2033 },
  { id: '2034-2035', start: 2034, end: 2035 },
  { id: '2036-2038', start: 2036, end: 2038 },
  { id: '2039-2040', start: 2039, end: 2040 },
  { id: '2041-2043', start: 2041, end: 2043 },
  { id: '2044-2045', start: 2044, end: 2045 },
]
// AB 1207 (2025) extends the program through Dec 31, 2045.
export const PROGRAM_END_YEAR = 2045

export const COMPLIANCE_PERIOD_LABELS: Record<CompliancePeriod, string> = Object.fromEntries(
  COMPLIANCE_PERIODS.map(p => [p.id, `${p.start}–${p.end}`]),
) as Record<CompliancePeriod, string>
