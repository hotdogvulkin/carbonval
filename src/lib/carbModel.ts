import type { CARBInputs, CARBResults, CoverageStatus, AllowanceStatus, CompliancePeriod } from '../types'
import {
  COVERAGE_THRESHOLD,
  VOLUNTARY_THRESHOLD,
  COVERED_SECTORS,
  YEAR1_SURRENDER_PCT,
  YEAR2_SURRENDER_PCT,
  OFFSET_ELIGIBILITY_LIMIT,
  PRICE_BOUNDS_YEAR,
  AUCTION_RESERVE_PRICE,
  PRICE_CEILING,
  PRICE_ESCALATION_REAL,
  LATEST_CPI_MEASURE,
  COMPLIANCE_PERIODS,
} from './carbConstants'

// ─── Compliance periods (CCR Title 17 §95840, 2026 amendments) ───────────────

/** Number of calendar years in a compliance period. */
export function compliancePeriodYears(period: CompliancePeriod): number {
  const p = COMPLIANCE_PERIODS.find(c => c.id === period)
  return p ? p.end - p.start + 1 : 3
}

/** The compliance period containing a calendar year, or null outside the defined periods. */
export function compliancePeriodForYear(year: number): CompliancePeriod | null {
  return COMPLIANCE_PERIODS.find(c => year >= c.start && year <= c.end)?.id ?? null
}

// ─── Price floor and ceiling (§95911(c)(3)(A), §95915(f)(1)(B)) ──────────────

/** Annual escalation factor: 1 + 5% + CPI-U. Future CPI is unknown; the latest published
 *  measure is held constant by default. */
export function priceEscalationFactor(cpi = LATEST_CPI_MEASURE): number {
  return 1 + PRICE_ESCALATION_REAL + cpi
}

const roundCents = (v: number) => Math.round(v * 100) / 100

/** Auction Reserve Price (floor) and Price Ceiling for a year. Published values for
 *  PRICE_BOUNDS_YEAR; later years apply the escalation rule, rounded to cents each year as CARB
 *  publishes them. Earlier years are not modeled and return the published year's values. */
export function priceBoundsForYear(year: number, cpi = LATEST_CPI_MEASURE): { year: number; floor: number; ceiling: number } {
  let floor = AUCTION_RESERVE_PRICE
  let ceiling = PRICE_CEILING
  const f = priceEscalationFactor(cpi)
  for (let y = PRICE_BOUNDS_YEAR + 1; y <= year; y++) {
    floor = roundCents(floor * f)
    ceiling = roundCents(ceiling * f)
  }
  return { year: Math.max(year, PRICE_BOUNDS_YEAR), floor, ceiling }
}

/** Keep a user price within the year's floor and ceiling. */
export function clampAllowancePrice(price: number, year: number): number {
  const { floor, ceiling } = priceBoundsForYear(year)
  if (!Number.isFinite(price)) return floor
  return Math.min(ceiling, Math.max(floor, price))
}

/** Calendar year used for "current" prices and projections. */
export function currentYear(): number {
  return new Date().getFullYear()
}

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
      return `Your facility emits ${emis} tCO₂e/year, below the 10,000 tCO₂e voluntary participation threshold. You are not subject to the CARB Cap-and-Invest program.`
  }
}

function calculateObligation(inputs: CARBInputs) {
  const freeAllocation = inputs.receivesFreeAllocation
    ? inputs.annualEmissions * (inputs.freeAllocationPct / 100)
    : 0
  const netObligation = inputs.annualEmissions - freeAllocation
  const periodYears = compliancePeriodYears(inputs.compliancePeriod)
  const periodObligation = netObligation * periodYears
  // §95855/§95856: 30% of each non-final year's obligation is surrendered annually; the final year
  // clears the remainder of the full compliance period obligation.
  const annualShares = [YEAR1_SURRENDER_PCT, YEAR2_SURRENDER_PCT].slice(0, periodYears - 1)
  const annualTons = annualShares.map(share => netObligation * share)
  const finalTons = periodObligation - annualTons.reduce((a, b) => a + b, 0)
  return {
    freeAllocation,
    netObligation,
    periodYears,
    periodObligation,
    annualShares,
    annualTons,
    finalTons,
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
  price: number,
  exposure: ReturnType<typeof calculateExposure>,
  obligation: ReturnType<typeof calculateObligation>,
  position: ReturnType<typeof calculatePosition>
) {
  const { tonsShort } = exposure
  const pureAllowanceCost = tonsShort * price

  const offsetEligibilityRemaining = Math.max(
    0,
    obligation.periodObligation * OFFSET_ELIGIBILITY_LIMIT - position.allowableOffsets
  )
  const offsetTons = Math.min(tonsShort, offsetEligibilityRemaining)
  const allowanceTons = tonsShort - offsetTons
  const blendedCost =
    offsetTons * inputs.offsetPrice + allowanceTons * price
  const offsetSavings = pureAllowanceCost - blendedCost

  const surrenderSchedule = [
    ...obligation.annualTons.map((tons, i) => ({
      label: `Year ${i + 1}`,
      share: obligation.annualShares[i],
      tons,
      cost: tons * price,
    })),
    {
      label: `Year ${obligation.periodYears} (remainder)`,
      share: null,
      tons: obligation.finalTons,
      cost: obligation.finalTons * price,
    },
  ]

  return { pureAllowanceCost, blendedCost, offsetSavings, surrenderSchedule }
}

/** 10-year projection. The user's price escalates by the same rule as the floor and ceiling and is
 *  clamped to each year's bounds; floor and ceiling costs show the regulatory range. */
export function calculateProjection(inputs: CARBInputs, startYear: number, projectionYears = 10) {
  const f = priceEscalationFactor()
  const startPrice = clampAllowancePrice(inputs.allowancePrice, startYear)
  return Array.from({ length: projectionYears }, (_, i) => {
    const year = startYear + i
    const emissions =
      inputs.annualEmissions * Math.pow(1 + inputs.emissionsGrowthRate / 100, i)
    const obligation =
      emissions *
      (1 - (inputs.receivesFreeAllocation ? inputs.freeAllocationPct / 100 : 0))
    const { floor, ceiling } = priceBoundsForYear(year)
    const allowancePrice = Math.min(ceiling, Math.max(floor, startPrice * Math.pow(f, i)))

    return {
      year,
      compliancePeriod: compliancePeriodForYear(year),
      emissions: Math.round(emissions),
      obligation: Math.round(obligation),
      allowancePrice: roundCents(allowancePrice),
      floorPrice: floor,
      ceilingPrice: ceiling,
      floorCost: Math.round(obligation * floor),
      baseCost: Math.round(obligation * allowancePrice),
      ceilingCost: Math.round(obligation * ceiling),
    }
  })
}

export function calculateCARB(inputs: CARBInputs, asOfYear = currentYear()): CARBResults {
  const coverageStatus = determineCoverage(inputs)
  const priceBounds = priceBoundsForYear(asOfYear)
  const price = clampAllowancePrice(inputs.allowancePrice, asOfYear)
  const obligation = calculateObligation(inputs)
  const position = calculatePosition(inputs, obligation)
  const exposure = calculateExposure(position.netExposure)
  const cost = calculateCost(inputs, price, exposure, obligation, position)
  const projection = calculateProjection(inputs, asOfYear)

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
    allowancePriceUsed: price,
    priceBounds,
    periodYears: obligation.periodYears,
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

export function formatCarbPercent(fraction: number): string {
  return Math.round(fraction * 100) + '%'
}
