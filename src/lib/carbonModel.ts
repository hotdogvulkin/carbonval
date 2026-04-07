import type { ValuationInputs, ValuationOutputs, ProjectionDataPoint } from '../types'
import {
  SEQUESTRATION_RATES,
  PERMANENCE_FACTORS,
  CO_BENEFITS,
  PRICE_PER_TON,
  ADDITIONALITY_FACTOR,
  VERIFICATION_COST,
  TONS_PER_CAR_PER_YEAR,
  ACRES_TO_HECTARES,
} from './constants'

export function calculateValuation(inputs: ValuationInputs): ValuationOutputs {
  const { landType, acres, duration, priceScenario, protectionStatus } = inputs

  const hectares = acres * ACRES_TO_HECTARES
  const annualSequestration = hectares * SEQUESTRATION_RATES[landType]
  const adjustedAnnual = annualSequestration * PERMANENCE_FACTORS[protectionStatus] * ADDITIONALITY_FACTOR
  const totalCredits = adjustedAnnual * duration
  const effectivePrice = PRICE_PER_TON[priceScenario] * CO_BENEFITS[landType]
  const grossValue = totalCredits * effectivePrice
  const netValue = grossValue * (1 - VERIFICATION_COST)
  const carEquivalent = Math.round(totalCredits / TONS_PER_CAR_PER_YEAR)
  const perAcreValue = acres > 0 ? netValue / acres : 0

  return {
    hectares,
    annualSequestration,
    adjustedAnnual,
    totalCredits,
    effectivePrice,
    grossValue,
    netValue,
    carEquivalent,
    perAcreValue,
  }
}

export function generateProjection(
  inputs: ValuationInputs
): ProjectionDataPoint[] {
  const { landType, acres, protectionStatus } = inputs
  const hectares = acres * ACRES_TO_HECTARES
  const annualSequestration = hectares * SEQUESTRATION_RATES[landType]
  const adjustedAnnual =
    annualSequestration *
    PERMANENCE_FACTORS[protectionStatus] *
    ADDITIONALITY_FACTOR

  const points: ProjectionDataPoint[] = []

  for (let year = 1; year <= 30; year++) {
    const creditsToDate = adjustedAnnual * year

    const conservative =
      creditsToDate * PRICE_PER_TON['conservative'] * CO_BENEFITS[landType] * (1 - VERIFICATION_COST)
    const mid =
      creditsToDate * PRICE_PER_TON['mid'] * CO_BENEFITS[landType] * (1 - VERIFICATION_COST)
    const premium =
      creditsToDate * PRICE_PER_TON['premium'] * CO_BENEFITS[landType] * (1 - VERIFICATION_COST)

    points.push({ year, conservative, mid, premium })
  }

  return points
}

export function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`
  }
  return `$${value.toFixed(2)}`
}

export function formatNumber(value: number, decimals = 1): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}
