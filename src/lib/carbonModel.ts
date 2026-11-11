import type {
  ValuationInputs, ValuationOutputs, ValuationStatus, ProjectionDataPoint, ScenarioComparison,
  ScenarioComparisonRow, PriceScenario, LandType, ProtectionStatus, AdditionalityLevel,
  CpsPractice, Perm30Distribution, RegionalRisk, ParcelContext, IntegrityRisk, PermanenceSource,
} from '../types'
import {
  SEQUESTRATION_RATES,
  FOREST_LAND_TYPES,
  COMET_PRACTICE_ORDER,
  COMET_VARIANT_ORDER,
  CARB_UNMODELED_RISKS,
  PERMANENCE_HORIZON_YEARS,
  INTEGRITY_POINTS,
  INTEGRITY_THRESHOLDS,
  CO_BENEFITS,
  PRICE_PER_TON,
  ADDITIONALITY_LEVELS,
  VERIFICATION_COST,
  TONS_PER_CAR_PER_YEAR,
  ACRES_TO_HECTARES,
} from './constants'

// ─── Unit conversion ────────────────────────────────────────────────────────

export function acresToHectares(acres: number): number {
  return acres * ACRES_TO_HECTARES
}

/** COMET rates are MT CO₂e per acre per year; × acres gives tCO₂e/yr (MT = metric tonne). */
export function cometAnnualTonnes(ratePerAcre: number, acres: number): number {
  return ratePerAcre * acres
}

export function isForest(landType: LandType): boolean {
  return FOREST_LAND_TYPES.includes(landType)
}

// ─── Reversal risk (Anderegg et al. 2022, Version C) ───────────────────────

export function excessMortality(projected: number, baseline1980s: number): number {
  return Math.max(0, projected - baseline1980s)
}

/** fire is never baseline-subtracted; drought/insects are excess above the 1980s. */
export function combineAnnualRisk(
  fire: number,
  droughtExcess: number,
  insectsExcess: number,
  method: 'max' | 'independent' = 'max',
): number {
  if (method === 'independent') return 1 - (1 - fire) * (1 - droughtExcess) * (1 - insectsExcess)
  return 1 - (1 - fire) * (1 - Math.max(droughtExcess, insectsExcess))
}

export function permanenceFromAnnualRisk(annualRisk: number, years = PERMANENCE_HORIZON_YEARS): number {
  return Math.pow(1 - annualRisk, years)
}

/** CARB multiplicative buffer: 1 − ∏(1 − risk_i). */
export function carbUnmodeledBuffer(protectionStatus: ProtectionStatus): number {
  const risks = Object.values(CARB_UNMODELED_RISKS[protectionStatus])
  return 1 - risks.reduce((acc, r) => acc * (1 - r), 1)
}

/** Enrollment risk ON → P25 of perm30 (= 75th percentile of risk); OFF → median. */
export function selectPerm30(dist: Perm30Distribution, adverseSelection: boolean): number {
  return adverseSelection ? dist.p25 : dist.median
}

export function computePermanenceFactor(
  dist: Perm30Distribution,
  protectionStatus: ProtectionStatus,
  adverseSelection: boolean,
): number {
  return selectPerm30(dist, adverseSelection) * (1 - carbUnmodeledBuffer(protectionStatus))
}

// ─── Ecoregion point-in-polygon ────────────────────────────────────────────

type Ring = number[][]
export type EcoGeometry =
  | { type: 'Polygon'; coordinates: Ring[] }
  | { type: 'MultiPolygon'; coordinates: Ring[][] }
export interface EcoFeature { type: 'Feature'; properties: RegionalRisk; geometry: EcoGeometry }
export interface EcoFeatureCollection { type: 'FeatureCollection'; features: EcoFeature[] }

function pointInRing(lng: number, lat: number, ring: Ring): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function pointInPolygonRings(lng: number, lat: number, rings: Ring[]): boolean {
  if (rings.length === 0 || !pointInRing(lng, lat, rings[0])) return false
  for (let h = 1; h < rings.length; h++) if (pointInRing(lng, lat, rings[h])) return false
  return true
}

export function pointInGeometry(lng: number, lat: number, geom: EcoGeometry): boolean {
  if (geom.type === 'Polygon') return pointInPolygonRings(lng, lat, geom.coordinates)
  return geom.coordinates.some(poly => pointInPolygonRings(lng, lat, poly))
}

/** Returns the EPA Level III ecoregion containing the point, or null if outside all. */
export function findEcoregion(fc: EcoFeatureCollection, lat: number, lng: number): RegionalRisk | null {
  const hit = fc.features.find(f => pointInGeometry(lng, lat, f.geometry))
  return hit ? hit.properties : null
}

export function hasRegionalRiskData(region: RegionalRisk | null): region is RegionalRisk & { perm30: Perm30Distribution } {
  return !!region && region.nCells > 0 && !!region.perm30
}

// ─── Cropland (COMET-Planner) ──────────────────────────────────────────────

/** Picks the exact practice × irrigation variant from a county's COMET row. */
export function selectCometRate(row: Array<number | null>, cps: CpsPractice, irrigated: boolean): number | null {
  const p = COMET_PRACTICE_ORDER.indexOf(cps)
  if (p < 0) return null
  const v = COMET_VARIANT_ORDER.indexOf(irrigated ? 'irrigated' : 'nonIrrigated')
  const val = row[p * COMET_VARIANT_ORDER.length + v]
  return val === undefined ? null : val
}

// ─── Integrity-risk badge (CarbonVal screening heuristic) ──────────────────

export function isLandCoverOverridden(detected: LandType | undefined, chosen: LandType): boolean {
  return detected !== undefined && detected !== chosen
}

export function scoreIntegrityRisk(args: {
  additionalityLevel: AdditionalityLevel
  protectionStatus: ProtectionStatus
  riskPercentile: number | null
  landCoverOverridden: boolean
}): IntegrityRisk {
  const rr = INTEGRITY_POINTS.regionalRisk
  const regionalRisk =
    args.riskPercentile === null ? rr.unknown
      : args.riskPercentile >= 75 ? rr.from75
        : args.riskPercentile >= 50 ? rr.from50
          : rr.below50
  const components = {
    additionality: INTEGRITY_POINTS.additionality[args.additionalityLevel],
    protection: INTEGRITY_POINTS.protection[args.protectionStatus],
    regionalRisk,
    landCoverOverride: args.landCoverOverridden ? INTEGRITY_POINTS.landCoverOverride : 0,
  }
  const score = components.additionality + components.protection + components.regionalRisk + components.landCoverOverride
  const level = INTEGRITY_THRESHOLDS.find(t => score >= t.minScore)!.level
  return { level, score, components }
}

// ─── Valuation ─────────────────────────────────────────────────────────────

export const EMPTY_CONTEXT: ParcelContext = {
  regionStatus: 'idle', region: null, countyStatus: 'idle', countyFips: null, cometRow: null,
}

interface Resolved {
  status: ValuationStatus
  annualSequestration: number
  permanenceFactor: number | null
  permanenceSource: PermanenceSource
  cometRatePerAcre: number | null
}

function resolveSequestration(inputs: ValuationInputs, ctx: ParcelContext): Resolved {
  const { landType, acres, location, cpsNumber, irrigated = false, protectionStatus, adverseSelection = true } = inputs
  const none = (status: ValuationStatus): Resolved => ({
    status, annualSequestration: 0, permanenceFactor: null, permanenceSource: 'not-modeled', cometRatePerAcre: null,
  })

  if (landType === 'cropland') {
    // No practice change → no stock change → no additional carbon.
    if (cpsNumber === undefined) return none('no-practice')
    if (!location) return none('needs-location')
    if (ctx.countyStatus === 'loading' || ctx.countyStatus === 'idle') return none('loading')
    const rate = ctx.cometRow ? selectCometRate(ctx.cometRow, cpsNumber, irrigated) : null
    if (rate === null) return none('no-cropland-data')
    // TODO: soil-carbon reversal risk for cropland is not modeled (no sourced value).
    return { status: 'ok', annualSequestration: cometAnnualTonnes(rate, acres), permanenceFactor: null, permanenceSource: 'not-modeled', cometRatePerAcre: rate }
  }

  const gross = acresToHectares(acres) * SEQUESTRATION_RATES[landType]

  if (isForest(landType)) {
    if (!location) return none('needs-location')
    if (ctx.regionStatus === 'loading' || ctx.regionStatus === 'idle') return none('loading')
    if (!hasRegionalRiskData(ctx.region)) return none('no-regional-data')
    const pf = computePermanenceFactor(ctx.region.perm30, protectionStatus, adverseSelection)
    return { status: 'ok', annualSequestration: gross, permanenceFactor: pf, permanenceSource: 'regional', cometRatePerAcre: null }
  }

  // TODO: reversal risk for shrubland/grassland/wetland/other is not modeled (no sourced value).
  return { status: 'ok', annualSequestration: gross, permanenceFactor: null, permanenceSource: 'not-modeled', cometRatePerAcre: null }
}

export function calculateValuation(inputs: ValuationInputs, ctx: ParcelContext = EMPTY_CONTEXT): ValuationOutputs {
  const { landType, acres, duration, priceScenario, additionalityLevel, protectionStatus } = inputs
  const r = resolveSequestration(inputs, ctx)

  const adjustedAnnual = r.annualSequestration * (r.permanenceFactor ?? 1) * ADDITIONALITY_LEVELS[additionalityLevel]
  const totalCredits = adjustedAnnual * duration
  const effectivePrice = PRICE_PER_TON[priceScenario] * CO_BENEFITS[landType]
  const grossValue = totalCredits * effectivePrice
  const netValue = grossValue * (1 - VERIFICATION_COST)

  const riskPercentile =
    isForest(landType) && hasRegionalRiskData(ctx.region) && ctx.region.riskPercentile !== undefined
      ? ctx.region.riskPercentile : null

  return {
    status: r.status,
    hectares: acresToHectares(acres),
    annualSequestration: r.annualSequestration,
    adjustedAnnual,
    totalCredits,
    effectivePrice,
    grossValue,
    netValue,
    carEquivalent: Math.round(totalCredits / TONS_PER_CAR_PER_YEAR),
    perAcreValue: acres > 0 ? netValue / acres : 0,
    permanenceFactor: r.permanenceFactor,
    permanenceSource: r.permanenceSource,
    cometRatePerAcre: r.cometRatePerAcre,
    integrity: scoreIntegrityRisk({
      additionalityLevel,
      protectionStatus,
      riskPercentile,
      landCoverOverridden: isLandCoverOverridden(inputs.detectedLandType, landType),
    }),
  }
}

export function generateProjection(inputs: ValuationInputs, ctx: ParcelContext = EMPTY_CONTEXT): ProjectionDataPoint[] {
  const { adjustedAnnual } = calculateValuation(inputs, ctx)
  const coBenefit = CO_BENEFITS[inputs.landType]
  const points: ProjectionDataPoint[] = []
  for (let year = 1; year <= 30; year++) {
    const credits = adjustedAnnual * year
    points.push({
      year,
      conservative: credits * PRICE_PER_TON.conservative * coBenefit * (1 - VERIFICATION_COST),
      mid: credits * PRICE_PER_TON.mid * coBenefit * (1 - VERIFICATION_COST),
      premium: credits * PRICE_PER_TON.premium * coBenefit * (1 - VERIFICATION_COST),
    })
  }
  return points
}

export function calculateScenarioComparison(inputs: ValuationInputs, ctx: ParcelContext = EMPTY_CONTEXT): ScenarioComparison {
  const scenarios: PriceScenario[] = ['conservative', 'mid', 'premium']
  const comparison = {} as ScenarioComparison
  for (const scenario of scenarios) {
    const out = calculateValuation({ ...inputs, priceScenario: scenario }, ctx)
    const row: ScenarioComparisonRow = {
      totalCredits: out.totalCredits,
      grossValue: out.grossValue,
      netValue: out.netValue,
      perAcreValue: out.perAcreValue,
    }
    comparison[scenario] = row
  }
  return comparison
}

// ─── Formatting ────────────────────────────────────────────────────────────

export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(2)}`
}

export function formatNumber(value: number, decimals = 1): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function formatPercent(fraction: number, decimals = 1): string {
  return `${(fraction * 100).toFixed(decimals)}%`
}
