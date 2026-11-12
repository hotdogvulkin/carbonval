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

export type CpsPractice = 329 | 345 | 340 | 590 | 336 | 888

export type IntegrityRiskLevel = 'low' | 'medium' | 'high'

export interface Perm30Distribution {
  p25: number
  median: number
  p75: number
}

export interface RegionalRisk {
  code: string
  name: string
  nCells: number
  perm30?: Perm30Distribution
  perm30Independent?: Perm30Distribution
  riskPercentile?: number
}

export type LookupStatus = 'idle' | 'loading' | 'ok' | 'no-data' | 'error'

/** Location-dependent data resolved asynchronously in src/lib/useParcelContext.ts */
export interface ParcelContext {
  regionStatus: LookupStatus
  region: RegionalRisk | null
  countyStatus: LookupStatus
  countyFips: string | null
  /** COMET row for the county, in COMET_PRACTICE_ORDER × COMET_VARIANT_ORDER */
  cometRow: Array<number | null> | null
}

export interface ValuationInputs {
  landType: LandType
  acres: number
  duration: ProjectDuration
  priceScenario: PriceScenario
  protectionStatus: ProtectionStatus
  additionalityLevel: AdditionalityLevel
  location?: { lat: number; lng: number }
  detectedLandType?: LandType
  cpsNumber?: CpsPractice
  irrigated?: boolean
  adverseSelection?: boolean
}

export type ValuationStatus =
  | 'ok'
  | 'needs-location'
  | 'loading'
  | 'no-practice'
  | 'no-regional-data'
  | 'no-cropland-data'

export type PermanenceSource = 'regional' | 'verra-minimum' | 'not-modeled'

export interface IntegrityRisk {
  level: IntegrityRiskLevel
  score: number
  components: { additionality: number; protection: number; regionalRisk: number; landCoverOverride: number }
}

export interface ValuationOutputs {
  status: ValuationStatus
  hectares: number
  /** Gross annual tCO₂e before permanence/additionality */
  annualSequestration: number
  adjustedAnnual: number
  totalCredits: number
  effectivePrice: number
  grossValue: number
  netValue: number
  carEquivalent: number
  perAcreValue: number
  permanenceFactor: number | null
  permanenceSource: PermanenceSource
  cometRatePerAcre: number | null
  integrity: IntegrityRisk
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
