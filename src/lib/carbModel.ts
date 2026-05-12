import type { CARBInputs, CARBResults, CoverageStatus, AllowanceStatus } from '../types'
import {
  COVERAGE_THRESHOLD,
  VOLUNTARY_THRESHOLD,
  COVERED_SECTORS,
  YEAR1_SURRENDER_PCT,
  YEAR2_SURRENDER_PCT,
  OFFSET_ELIGIBILITY_LIMIT,
  ANNUAL_PRICE_FLOOR_INCREASE,
} from './carbConstants'

function determineCoverage(inputs: CARBInputs): CoverageStatus {
  if (
    inputs.annualEmissions >= COVERAGE_THRESHOLD &&
    COVERED_SECTORS.includes(inputs.sector)
  ) {
    return 'mandatory'
  } else if (inputs.annualEmissions >= VOLUNTARY_THRESHOLD) {
    return 'voluntary_eligible'
  }
  return 'not_covered'
}

function buildCoverageMessage(status: CoverageStatus, inputs: CARBInputs): string {
  const emis = inputs.annualEmissions.toLocaleString()
  switch (status) {
    case 'mandatory':
      return `Your facility emits ${emis} tCO₂e/year and operates in a covered sector. You are subject to mandatory compliance under CCR Title 17, Section 95812.`
    case 'voluntary_eligible':
      return `Your facility emits ${emis} tCO₂e/year, below the 25,000 tCO₂e mandatory threshold. You may opt into the program voluntarily.`
    case 'not_covered':
      return `Your facility emits ${emis} tCO₂e/year, below the 10,000 tCO₂e voluntary participation threshold. You are not subject to CARB cap-and-trade.`
  }
}

function calculateObligation(inputs: CARBInputs) {
  const freeAllocation = inputs.receivesFreeAllocation
    ? inputs.annualEmissions * (inputs.freeAllocationPct / 100)
    : 0
  const netObligation = inputs.annualEmissions - freeAllocation
  const compliancePeriodYears = 3
  const periodObligation = netObligation * compliancePeriodYears
  const year1Surrender = netObligation * YEAR1_SURRENDER_PCT
  const year2Surrender = netObligation * YEAR2_SURRENDER_PCT
  const year3Surrender = periodObligation - year1Surrender - year2Surrender
  return {
    freeAllocation,
    netObligation,
    periodObligation,
    year1Surrender,
    year2Surrender,
    year3Surrender,
  }
}

function calculatePosition(
  inputs: CARBInputs,
  obligation: ReturnType<typeof calculateObligation>
) {
  const maxOffsetUse = obligation.periodObligation * OFFSET_ELIGIBILITY_LIMIT
  const allowableOffsets = Math.min(inputs.existingOffsetHoldings, maxOffsetUse)
  const excessOffsets = Math.max(0, inputs.existingOffsetHoldings - maxOffsetUse)
  const effectiveCoverage =
    inputs.allowanceHoldings + allowableOffsets + obligation.freeAllocation
  const netExposure = obligation.periodObligation - effectiveCoverage
  return { allowableOffsets, excessOffsets, effectiveCoverage, netExposure }
}

function calculateExposure(netExposure: number) {
  if (netExposure > 0) {
    return { status: 'short' as AllowanceStatus, tonsShort: netExposure, tonsLong: 0 }
  }
  if (netExposure < 0) {
    return {
      status: 'long' as AllowanceStatus,
      tonsShort: 0,
      tonsLong: Math.abs(netExposure),
    }
  }
  return { status: 'balanced' as AllowanceStatus, tonsShort: 0, tonsLong: 0 }
}

function calculateCost(
  inputs: CARBInputs,
  exposure: ReturnType<typeof calculateExposure>,
  obligation: ReturnType<typeof calculateObligation>,
  position: ReturnType<typeof calculatePosition>
) {
  const { tonsShort } = exposure
  const pureAllowanceCost = tonsShort * inputs.allowancePrice

  const offsetEligibilityRemaining = Math.max(
    0,
    obligation.periodObligation * OFFSET_ELIGIBILITY_LIMIT - position.allowableOffsets
  )
  const offsetTons = Math.min(tonsShort, offsetEligibilityRemaining)
  const allowanceTons = tonsShort - offsetTons
  const blendedCost =
    offsetTons * inputs.offsetPrice + allowanceTons * inputs.allowancePrice
  const offsetSavings = pureAllowanceCost - blendedCost

  const surrenderSchedule = {
    year1: {
      tons: obligation.year1Surrender,
      cost: obligation.year1Surrender * inputs.allowancePrice,
    },
    year2: {
      tons: obligation.year2Surrender,
      cost: obligation.year2Surrender * inputs.allowancePrice,
    },
    year3: {
      tons: obligation.year3Surrender,
      cost: obligation.year3Surrender * inputs.allowancePrice,
    },
  }

  return { pureAllowanceCost, blendedCost, offsetSavings, surrenderSchedule }
}

function calculateProjection(inputs: CARBInputs, projectionYears = 10) {
  return Array.from({ length: projectionYears }, (_, i) => {
    const year = new Date().getFullYear() + i
    const emissions =
      inputs.annualEmissions * Math.pow(1 + inputs.emissionsGrowthRate / 100, i)
    const obligation =
      emissions *
      (1 - (inputs.receivesFreeAllocation ? inputs.freeAllocationPct / 100 : 0))
    const allowancePrice =
      inputs.allowancePrice * Math.pow(1 + ANNUAL_PRICE_FLOOR_INCREASE, i)

    return {
      year,
      emissions: Math.round(emissions),
      obligation: Math.round(obligation),
      allowancePrice: Math.round(allowancePrice * 100) / 100,
      conservativeCost: Math.round(obligation * allowancePrice),
      baseCost: Math.round(
        obligation * allowancePrice * Math.pow(1 + ANNUAL_PRICE_FLOOR_INCREASE, i)
      ),
      optimisticCost: Math.round(obligation * 0.5 * allowancePrice),
    }
  })
}

export function calculateCARB(inputs: CARBInputs): CARBResults {
  const coverageStatus = determineCoverage(inputs)
  const obligation = calculateObligation(inputs)
  const position = calculatePosition(inputs, obligation)
  const exposure = calculateExposure(position.netExposure)
  const cost = calculateCost(inputs, exposure, obligation, position)
  const projection = calculateProjection(inputs)

  return {
    coverageStatus,
    coverageMessage: buildCoverageMessage(coverageStatus, inputs),
    netObligation: obligation.netObligation,
    periodObligation: obligation.periodObligation,
    allowableOffsets: position.allowableOffsets,
    excessOffsets: position.excessOffsets,
    effectiveCoverage: position.effectiveCoverage,
    tonsShort: exposure.tonsShort,
    tonsLong: exposure.tonsLong,
    allowanceStatus: exposure.status,
    pureAllowanceCost: cost.pureAllowanceCost,
    blendedCost: cost.blendedCost,
    offsetSavings: cost.offsetSavings,
    surrenderSchedule: cost.surrenderSchedule,
    projection,
  }
}

export function formatCarbCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

export function formatCarbNumber(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}
