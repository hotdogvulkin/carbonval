import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  acresToHectares, cometAnnualTonnes, carbUnmodeledBuffer, selectPerm30, computePermanenceFactor,
  combineAnnualRisk, excessMortality, permanenceFromAnnualRisk, selectCometRate, scoreIntegrityRisk,
  isLandCoverOverridden, calculateValuation, generateProjection, calculateScenarioComparison,
  findEcoregion, hasRegionalRiskData, EMPTY_CONTEXT, verraMinimumPermanence, type EcoFeatureCollection,
} from '../src/lib/carbonModel.ts'
import { VERRA_MIN_BUFFER, ADDITIONALITY_LEVELS, ADDITIONALITY_LEVEL_DESCRIPTIONS } from '../src/lib/constants.ts'
import type { ParcelContext, ValuationInputs, RegionalRisk } from '../src/types/index.ts'

const near = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`)

const REGION: RegionalRisk = {
  code: '5', name: 'Sierra Nevada', nCells: 1783,
  perm30: { p25: 0.3693, median: 0.5157, p75: 0.6562 },
  perm30Independent: { p25: 0.3129, median: 0.4701, p75: 0.6409 },
  riskPercentile: 98,
}
// row order: 329 ni/ir, 345 ni/ir, 340 ni/ir, 590 ni/ir, 336 ni/ir, 888 ni/ir
const ROW = [0.5975, 0.9735, 0.5505, 0.7686, 0.5188, 0.3125, 0.0375, 0.0408, 0.7025, 0.565, 0.1904, 0.6556]
const LOC = { lat: 41.88, lng: -93.1 }
const okCtx = (over: Partial<ParcelContext> = {}): ParcelContext => ({
  regionStatus: 'ok', region: REGION, countyStatus: 'ok', countyFips: '19127', cometRow: ROW, ...over,
})
const base: ValuationInputs = {
  landType: 'evergreenForest', acres: 100, duration: 20, priceScenario: 'mid',
  protectionStatus: 'unprotected', additionalityLevel: 'moderate', location: LOC,
}

test('unit conversion: acres → hectares and COMET MT CO2e/ac/yr × acres', () => {
  near(acresToHectares(100), 40.47)
  near(cometAnnualTonnes(0.5, 100), 50)
  const out = calculateValuation({ ...base, landType: 'cropland', cpsNumber: 329 }, okCtx())
  near(out.annualSequestration, 0.5975 * 100)
  near(out.cometRatePerAcre!, 0.5975)
})

test('no practice selected = zero additional carbon', () => {
  for (const ctx of [okCtx(), EMPTY_CONTEXT]) {
    const out = calculateValuation({ ...base, landType: 'cropland', cpsNumber: undefined }, ctx)
    assert.equal(out.status, 'no-practice')
    assert.equal(out.annualSequestration, 0)
    assert.equal(out.totalCredits, 0)
    assert.equal(out.netValue, 0)
  }
})

test('cropland with practice but no pin asks for a location', () => {
  const out = calculateValuation({ ...base, landType: 'cropland', cpsNumber: 329, location: undefined }, EMPTY_CONTEXT)
  assert.equal(out.status, 'needs-location')
  assert.equal(out.netValue, 0)
})

test('cropland: missing COMET estimate shows data unavailable', () => {
  const row = [...ROW]; row[10] = null
  const out = calculateValuation({ ...base, landType: 'cropland', cpsNumber: 888 }, okCtx({ cometRow: row }))
  assert.equal(out.status, 'no-cropland-data')
  assert.equal(out.netValue, 0)
  assert.equal(calculateValuation({ ...base, landType: 'cropland', cpsNumber: 329 }, okCtx({ cometRow: null, countyStatus: 'no-data' })).status, 'no-cropland-data')
})

test('irrigation toggle picks the matching COMET variant', () => {
  assert.equal(selectCometRate(ROW, 329, false), 0.5975)
  assert.equal(selectCometRate(ROW, 329, true), 0.9735)
  assert.equal(selectCometRate(ROW, 340, true), 0.3125)
  assert.equal(selectCometRate(ROW, 590, false), 0.0375)
  assert.equal(selectCometRate(ROW, 888, false), 0.1904)
  assert.equal(selectCometRate(ROW, 888, true), 0.6556)
  const irr = calculateValuation({ ...base, landType: 'cropland', cpsNumber: 345, irrigated: true }, okCtx())
  near(irr.cometRatePerAcre!, 0.7686)
  const dry = calculateValuation({ ...base, landType: 'cropland', cpsNumber: 345 }, okCtx())
  near(dry.cometRatePerAcre!, 0.5505)
})

test('CARB unmodeled buffer = 11.50% unprotected, 3.97% protected', () => {
  near(carbUnmodeledBuffer('unprotected'), 0.114991, 1e-6)
  near(carbUnmodeledBuffer('protected'), 0.0397, 1e-6)
  assert.equal(carbUnmodeledBuffer('unprotected').toFixed(4), '0.1150')
  assert.equal(carbUnmodeledBuffer('protected').toFixed(4), '0.0397')
})

test('enrollment toggle picks the right percentile', () => {
  assert.equal(selectPerm30(REGION.perm30!, true), 0.3693)
  assert.equal(selectPerm30(REGION.perm30!, false), 0.5157)
  near(computePermanenceFactor(REGION.perm30!, 'unprotected', true), 0.3693 * (1 - 0.114991), 1e-6)
  near(computePermanenceFactor(REGION.perm30!, 'protected', false), 0.5157 * (1 - 0.0397), 1e-6)
  const on = calculateValuation({ ...base, adverseSelection: true }, okCtx())
  const off = calculateValuation({ ...base, adverseSelection: false }, okCtx())
  const dflt = calculateValuation({ ...base }, okCtx())
  assert.ok(on.permanenceFactor! < off.permanenceFactor!)
  assert.equal(dflt.permanenceFactor, on.permanenceFactor)
})

test('reversal-risk formula pieces (Version C)', () => {
  assert.equal(excessMortality(0.010, 0.012), 0)
  near(excessMortality(0.0126, 0.0093), 0.0033)
  near(combineAnnualRisk(0.01, 0.003, 0.009, 'max'), 1 - 0.99 * 0.991)
  near(combineAnnualRisk(0.01, 0.003, 0.009, 'independent'), 1 - 0.99 * 0.997 * 0.991)
  assert.ok(combineAnnualRisk(0.01, 0.003, 0.009, 'independent') >= combineAnnualRisk(0.01, 0.003, 0.009, 'max'))
  near(permanenceFromAnnualRisk(0.02), Math.pow(0.98, 30))
  assert.equal(permanenceFromAnnualRisk(0), 1)
})

test('forest: outside-coverage and missing-pin states', () => {
  assert.equal(calculateValuation({ ...base, location: undefined }, EMPTY_CONTEXT).status, 'needs-location')
  const outside = calculateValuation(base, okCtx({ region: null, regionStatus: 'no-data' }))
  assert.equal(outside.status, 'no-regional-data')
  assert.equal(outside.permanenceFactor, null)
  assert.equal(outside.netValue, 0)
  const noForest = calculateValuation(base, okCtx({ region: { code: '7', name: 'Central California Valley', nCells: 0 }, regionStatus: 'no-data' }))
  assert.equal(noForest.status, 'no-regional-data')
  assert.equal(calculateValuation(base, okCtx({ regionStatus: 'loading', region: null })).status, 'loading')
  assert.equal(hasRegionalRiskData(null), false)
})

test('forest valuation applies regional permanence and additionality', () => {
  const out = calculateValuation(base, okCtx())
  assert.equal(out.status, 'ok')
  assert.equal(out.permanenceSource, 'regional')
  const gross = 100 * 0.4047 * 3.7
  near(out.annualSequestration, gross)
  near(out.adjustedAnnual, gross * 0.3693 * (1 - carbUnmodeledBuffer('unprotected')) * 0.75)
  near(out.totalCredits, out.adjustedAnnual * 20)
  near(out.netValue, out.totalCredits * 15 * 1.15 * 0.8, 1e-6)
})

test('Verra AFOLU minimum buffer: 12% → permanence 0.88', () => {
  assert.equal(VERRA_MIN_BUFFER, 0.12)
  near(verraMinimumPermanence(), 0.88)
})

test('non-forest, non-cropland land gets the Verra minimum buffer', () => {
  for (const landType of ['shrubland', 'grassland', 'wetland', 'other'] as const) {
    const out = calculateValuation({ ...base, landType, location: undefined }, EMPTY_CONTEXT)
    assert.equal(out.status, 'ok')
    assert.equal(out.permanenceSource, 'verra-minimum')
    near(out.permanenceFactor!, 0.88)
    near(out.adjustedAnnual, out.annualSequestration * 0.88 * 0.75)
  }
})

test('cropland gets the Verra minimum buffer on the COMET rate', () => {
  const out = calculateValuation({ ...base, landType: 'cropland', cpsNumber: 329 }, okCtx())
  assert.equal(out.permanenceSource, 'verra-minimum')
  near(out.permanenceFactor!, 0.88)
  near(out.adjustedAnnual, 0.5975 * 100 * 0.88 * 0.75)
  const none = calculateValuation({ ...base, landType: 'cropland' }, okCtx())
  assert.equal(none.permanenceFactor, null)
  assert.equal(none.totalCredits, 0)
})

test('additionality descriptions match factor order (higher risk of conversion → higher factor)', () => {
  assert.ok(ADDITIONALITY_LEVELS.conservative < ADDITIONALITY_LEVELS.moderate && ADDITIONALITY_LEVELS.moderate < ADDITIONALITY_LEVELS.high)
  assert.match(ADDITIONALITY_LEVEL_DESCRIPTIONS.high, /high risk of conversion/i)
  assert.match(ADDITIONALITY_LEVEL_DESCRIPTIONS.conservative, /already protected/i)
})

test('integrity badge: low, medium, high', () => {
  const low = scoreIntegrityRisk({ additionalityLevel: 'conservative', protectionStatus: 'protected', riskPercentile: 20, landCoverOverridden: false })
  assert.equal(low.level, 'low'); assert.equal(low.score, 0)
  const lowEdge = scoreIntegrityRisk({ additionalityLevel: 'moderate', protectionStatus: 'unprotected', riskPercentile: 10, landCoverOverridden: false })
  assert.equal(lowEdge.level, 'low'); assert.equal(lowEdge.score, 2)
  const med = scoreIntegrityRisk({ additionalityLevel: 'moderate', protectionStatus: 'unprotected', riskPercentile: 60, landCoverOverridden: false })
  assert.equal(med.level, 'medium'); assert.equal(med.score, 3)
  const unknown = scoreIntegrityRisk({ additionalityLevel: 'high', protectionStatus: 'protected', riskPercentile: null, landCoverOverridden: false })
  assert.equal(unknown.level, 'medium'); assert.equal(unknown.components.regionalRisk, 1)
  const high = scoreIntegrityRisk({ additionalityLevel: 'high', protectionStatus: 'unprotected', riskPercentile: 80, landCoverOverridden: true })
  assert.equal(high.level, 'high'); assert.equal(high.score, 7)
  const edge = scoreIntegrityRisk({ additionalityLevel: 'conservative', protectionStatus: 'unprotected', riskPercentile: 75, landCoverOverridden: true })
  assert.equal(edge.level, 'high'); assert.equal(edge.score, 5)
})

test('integrity badge is wired into valuation (override + regional percentile)', () => {
  const out = calculateValuation({ ...base, additionalityLevel: 'high', detectedLandType: 'grassland' }, okCtx())
  assert.deepEqual(out.integrity.components, { additionality: 2, protection: 1, regionalRisk: 2, landCoverOverride: 2 })
  assert.equal(out.integrity.level, 'high')
  assert.equal(isLandCoverOverridden(undefined, 'cropland'), false)
  assert.equal(isLandCoverOverridden('cropland', 'cropland'), false)
  assert.equal(isLandCoverOverridden('grassland', 'cropland'), true)
})

test('projection and scenario comparison follow the valuation', () => {
  const ctx = okCtx()
  const out = calculateValuation(base, ctx)
  const proj = generateProjection(base, ctx)
  assert.equal(proj.length, 30)
  near(proj[19].mid, out.netValue, 1e-6)
  const cmp = calculateScenarioComparison(base, ctx)
  near(cmp.mid.netValue, out.netValue, 1e-6)
  assert.ok(cmp.conservative.netValue < cmp.premium.netValue)
  assert.equal(generateProjection({ ...base, landType: 'cropland' }, ctx).every(p => p.mid === 0), true)
})

test('point-in-polygon ecoregion lookup, including holes and outside points', () => {
  const fc: EcoFeatureCollection = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { code: 'A', name: 'A', nCells: 1 }, geometry: { type: 'Polygon', coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]], [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]]] } },
      { type: 'Feature', properties: { code: 'B', name: 'B', nCells: 1 }, geometry: { type: 'MultiPolygon', coordinates: [[[[20, 0], [30, 0], [30, 10], [20, 10], [20, 0]]], [[[40, 0], [50, 0], [50, 10], [40, 10], [40, 0]]]] } },
    ],
  }
  assert.equal(findEcoregion(fc, 2, 2)?.code, 'A')     // lat, lng
  assert.equal(findEcoregion(fc, 5, 5), null)          // inside hole
  assert.equal(findEcoregion(fc, 5, 45)?.code, 'B')    // second part of MultiPolygon
  assert.equal(findEcoregion(fc, 50, 50), null)        // outside all
})
