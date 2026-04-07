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

export interface ValuationInputs {
  landType: LandType
  acres: number
  duration: ProjectDuration
  priceScenario: PriceScenario
  protectionStatus: ProtectionStatus
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
