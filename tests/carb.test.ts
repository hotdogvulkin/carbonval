import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateCARB, calculateProjection, clampAllowancePrice, compliancePeriodForYear,
  compliancePeriodYears, priceBoundsForYear, priceEscalationFactor,
} from '../src/lib/carbModel.ts'
import {
  AUCTION_RESERVE_PRICE, COMPLIANCE_PERIODS, PRICE_CEILING, PROGRAM_END_YEAR,
} from '../src/lib/carbConstants.ts'
import type { CARBInputs } from '../src/types/index.ts'

const near = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`)

const base: CARBInputs = {
  annualEmissions: 100_000,
  sector: 'industrial',
  compliancePeriod: '2024-2026',
  allowanceHoldings: 0,
  emissionsGrowthRate: 0,
  receivesFreeAllocation: false,
  freeAllocationPct: 0,
  existingOffsetHoldings: 0,
  allowancePrice: 30,
  offsetPrice: 20,
  useAdvancedMode: false,
}

test('compliance periods follow §95840 (2026 amendments) and run contiguously to 2045', () => {
  assert.equal(compliancePeriodYears('2024-2026'), 3)
  assert.equal(compliancePeriodYears('2027-2028'), 2)
  assert.equal(compliancePeriodYears('2029-2030'), 2)
  assert.equal(compliancePeriodYears('2031-2033'), 3)
  for (let i = 1; i < COMPLIANCE_PERIODS.length; i++) {
    assert.equal(COMPLIANCE_PERIODS[i].start, COMPLIANCE_PERIODS[i - 1].end + 1)
  }
  assert.equal(COMPLIANCE_PERIODS.at(-1)!.end, PROGRAM_END_YEAR)
  // §95840(i): after the eighth period (2031–2033), alternate two and three years.
  const after = COMPLIANCE_PERIODS.slice(COMPLIANCE_PERIODS.findIndex(p => p.id === '2031-2033') + 1)
  after.forEach((p, i) => assert.equal(p.end - p.start + 1, i % 2 === 0 ? 2 : 3, p.id))
  assert.equal(compliancePeriodForYear(2030), '2029-2030')
  assert.equal(compliancePeriodForYear(2034), '2034-2035')
  assert.equal(compliancePeriodForYear(2046), null)
})

test('2026 floor and ceiling match CARB published values', () => {
  const b = priceBoundsForYear(2026)
  assert.equal(b.floor, 27.94)
  assert.equal(b.ceiling, 102.52)
  assert.equal(AUCTION_RESERVE_PRICE, 27.94)
  assert.equal(PRICE_CEILING, 102.52)
})

test('escalation rule (5% + CPI-U) reproduces CARB 2026 values from 2025 values', () => {
  // 2025 values and the 3.01% CPI measure: CARB 2026 Annual Auction Reserve Price Notice, Table 2,
  // and CARB Price Ceiling Information page ($94.92 in 2025).
  const f = priceEscalationFactor(0.0301)
  near(f, 1.0801)
  assert.equal(Math.round(25.87 * f * 100) / 100, 27.94)
  assert.equal(Math.round(94.92 * f * 100) / 100, 102.52)
})

test('later years escalate the bounds and round to cents each year', () => {
  const b27 = priceBoundsForYear(2027)
  assert.equal(b27.floor, 30.18) // 27.94 × 1.0801 = 30.178
  assert.equal(b27.ceiling, 110.73) // 102.52 × 1.0801 = 110.732
  const b28 = priceBoundsForYear(2028)
  assert.equal(b28.floor, Math.round(30.18 * 1.0801 * 100) / 100)
})

test('allowance price is clamped to the year bounds', () => {
  assert.equal(clampAllowancePrice(5, 2026), 27.94)
  assert.equal(clampAllowancePrice(150, 2026), 102.52)
  assert.equal(clampAllowancePrice(50, 2026), 50)
  assert.equal(clampAllowancePrice(Number.NaN, 2026), 27.94)
  const r = calculateCARB({ ...base, allowancePrice: 5 }, 2026)
  assert.equal(r.allowancePriceUsed, 27.94)
  near(r.pureAllowanceCost, r.tonsShort * 27.94, 1e-6)
})

test('surrender schedule follows the selected period length', () => {
  const three = calculateCARB(base, 2026)
  assert.equal(three.periodYears, 3)
  assert.equal(three.periodObligation, 300_000)
  assert.deepEqual(three.surrenderSchedule.map(r => Math.round(r.tons)), [30_000, 30_000, 240_000])

  const two = calculateCARB({ ...base, compliancePeriod: '2027-2028' }, 2026)
  assert.equal(two.periodYears, 2)
  assert.equal(two.periodObligation, 200_000)
  assert.deepEqual(two.surrenderSchedule.map(r => Math.round(r.tons)), [30_000, 170_000])
  near(two.surrenderSchedule.reduce((a, r) => a + r.tons, 0), two.periodObligation)
})

test('projection shows the floor–ceiling range and keeps the price inside it', () => {
  const proj = calculateProjection({ ...base, allowancePrice: 100 }, 2026)
  assert.equal(proj.length, 10)
  assert.equal(proj[0].year, 2026)
  assert.equal(proj[0].compliancePeriod, '2024-2026')
  assert.equal(proj[1].compliancePeriod, '2027-2028')
  assert.equal(proj[5].compliancePeriod, '2031-2033')
  for (const y of proj) {
    assert.ok(y.floorPrice <= y.allowancePrice && y.allowancePrice <= y.ceilingPrice, String(y.year))
    assert.ok(y.floorCost <= y.baseCost && y.baseCost <= y.ceilingCost, String(y.year))
    const b = priceBoundsForYear(y.year)
    assert.equal(y.floorPrice, b.floor)
    assert.equal(y.ceilingPrice, b.ceiling)
  }
  assert.equal(proj[0].floorCost, Math.round(100_000 * 27.94))
  assert.equal(proj[0].ceilingCost, Math.round(100_000 * 102.52))
})
