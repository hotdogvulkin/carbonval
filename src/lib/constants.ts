import type { LandType, PriceScenario, ProtectionStatus } from '../types'

// IPCC 2006 Guidelines for National Greenhouse Gas Inventories
// Volume 4, Chapter 4 (Forest Land)
export const SEQUESTRATION_RATES: Record<LandType, number> = {
  evergreenForest: 3.7,
  deciduousForest: 2.9,
  mixedForest: 3.2,
  shrubland: 0.9,
  grassland: 0.5,
  cropland: 0.3,
  wetland: 2.1,
  other: 0.2,
}

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

export const PERMANENCE_FACTORS: Record<ProtectionStatus, number> = {
  protected: 1.0,
  unprotected: 0.82,
}

export const CO_BENEFITS: Record<LandType, number> = {
  evergreenForest: 1.15,
  deciduousForest: 1.15,
  mixedForest: 1.12,
  wetland: 1.20,
  shrubland: 1.05,
  grassland: 1.03,
  cropland: 1.0,
  other: 1.0,
}

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

// IPCC standard assumption for additionality
export const ADDITIONALITY_FACTOR = 0.75

// Registry and verification cost (Verra, Gold Standard, ACR average)
export const VERIFICATION_COST = 0.20

// EPA: average passenger vehicle emits 4.6 tCO2 per year
export const TONS_PER_CAR_PER_YEAR = 4.6

// Acres to hectares conversion factor
export const ACRES_TO_HECTARES = 0.4047
