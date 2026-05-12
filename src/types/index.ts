export type { ClassificationResult } from '../lib/earthEngine'

export type LandType =
  | 'evergreenForest'
  | 'deciduousForest'
  | 'mixedForest'
  | 'shrubland'
  | 'grassland'
  | 'cropland'
  | 'wetland'
  | 'other'

export type ProjectDuration = 10 | 20 | 30

export type PriceScenario = 'conservative' | 'mid' | 'premium'

export type ProtectionStatus = 'protected' | 'unprotected'

export type AdditionalityLevel = 'conservative' | 'moderate' | 'high'

export interface ValuationInputs {
  landType: LandType
  acres: number
  duration: ProjectDuration
  priceScenario: PriceScenario
  protectionStatus: ProtectionStatus
  additionalityLevel: AdditionalityLevel
}

export interface ValuationOutputs {
  hectares: number
  annualSequestration: number
  adjustedAnnual: number
  totalCredits: number
  effectivePrice: number
  grossValue: number
  netValue: number
  carEquivalent: number
  perAcreValue: number
}

export interface ProjectionDataPoint {
  year: number
  conservative: number
  mid: number
  premium: number
}

export interface ScenarioComparisonRow {
  totalCredits: number
  grossValue: number
  netValue: number
  perAcreValue: number
}

export type ScenarioComparison = Record<PriceScenario, ScenarioComparisonRow>

export type CARBSector =
  | 'electricity_generation'
  | 'electricity_imports'
  | 'industrial'
  | 'fuel_supplier'

export type CoverageStatus = 'mandatory' | 'voluntary_eligible' | 'not_covered'
export type AllowanceStatus = 'short' | 'long' | 'balanced'
export type CompliancePeriod = '2021-2023' | '2024-2026' | '2027-2030'

export interface CARBInputs {
  annualEmissions: number
  sector: CARBSector
  compliancePeriod: CompliancePeriod
  allowanceHoldings: number
  emissionsGrowthRate: number
  receivesFreeAllocation: boolean
  freeAllocationPct: number
  existingOffsetHoldings: number
  allowancePrice: number
  offsetPrice: number
  useAdvancedMode: boolean
}

export interface CARBResults {
  coverageStatus: CoverageStatus
  coverageMessage: string
  netObligation: number
  periodObligation: number
  allowableOffsets: number
  excessOffsets: number
  effectiveCoverage: number
  tonsShort: number
  tonsLong: number
  allowanceStatus: AllowanceStatus
  pureAllowanceCost: number
  blendedCost: number
  offsetSavings: number
  surrenderSchedule: {
    year1: { tons: number; cost: number }
    year2: { tons: number; cost: number }
    year3: { tons: number; cost: number }
  }
  projection: Array<{
    year: number
    emissions: number
    obligation: number
    allowancePrice: number
    conservativeCost: number
    baseCost: number
    optimisticCost: number
  }>
}
