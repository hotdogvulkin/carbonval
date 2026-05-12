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

// CCR Title 17, Section 95854
export const OFFSET_ELIGIBILITY_LIMIT = 0.04

// WCI auction data, 2024 reference prices
export const DEFAULT_ALLOWANCE_PRICE = 30
export const DEFAULT_OFFSET_PRICE = 20

// CARB 2022 Scoping Plan
export const ANNUAL_CAP_DECLINE = 0.04
// CCR Title 17, Section 95841
export const ANNUAL_PRICE_FLOOR_INCREASE = 0.05

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

export const COMPLIANCE_PERIOD_LABELS: Record<CompliancePeriod, string> = {
  '2021-2023': '2021–2023',
  '2024-2026': '2024–2026',
  '2027-2030': '2027–2030',
}
