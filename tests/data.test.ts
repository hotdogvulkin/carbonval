import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { findEcoregion, hasRegionalRiskData, type EcoFeatureCollection } from '../src/lib/carbonModel.ts'
import { COMET_PRACTICE_ORDER, SENSITIVITY_SAMPLE_REGIONS } from '../src/lib/constants.ts'

const eco = JSON.parse(readFileSync(new URL('../public/data/ecoregions.json', import.meta.url), 'utf8')) as EcoFeatureCollection
const comet = JSON.parse(readFileSync(new URL('../public/data/comet_cropland.json', import.meta.url), 'utf8')) as {
  order: string[]; variants: string[]; counties: Record<string, Array<number | null>>
}
const byCode = (c: string) => eco.features.find(f => f.properties.code === c)!.properties

test('all CONUS EPA Level III ecoregions are present', () => {
  assert.equal(eco.features.length, 85)
})

test('Q1 <= median <= Q3 and values in [0, 1] for every ecoregion with data', () => {
  let n = 0
  for (const f of eco.features) {
    const p = f.properties
    if (!hasRegionalRiskData(p)) continue
    n++
    for (const d of [p.perm30!, p.perm30Independent!]) {
      assert.ok(d.p25 <= d.median && d.median <= d.p75, `${p.code}: ${JSON.stringify(d)}`)
      assert.ok(d.p25 >= 0 && d.p75 <= 1)
    }
    assert.ok(p.perm30Independent!.median <= p.perm30!.median + 1e-4, `${p.code}: independence should not raise permanence`)
    assert.ok(p.riskPercentile! >= 0 && p.riskPercentile! <= 100)
  }
  assert.ok(n >= 80)
})

test('known regional medians still match (Cascades 92.5%, Sierra Nevada 51.6%)', () => {
  assert.equal((byCode('4').perm30!.median * 100).toFixed(1), '92.5')
  assert.equal((byCode('5').perm30!.median * 100).toFixed(1), '51.6')
  for (const s of SENSITIVITY_SAMPLE_REGIONS.filter(r => r.codes.length === 1)) {
    assert.equal(byCode(s.codes[0]).perm30!.median, s.maxCombining)
    assert.equal(byCode(s.codes[0]).perm30Independent!.median, s.independent)
  }
  const nApp = SENSITIVITY_SAMPLE_REGIONS.find(r => r.name === 'N. Appalachians')!
  assert.equal((nApp.maxCombining * 100).toFixed(1), '99.7')
  assert.ok(byCode('58').perm30!.median >= 0.99 && byCode('59').perm30!.median >= 0.99)
})

test('ecoregions with no forest cells have no risk data', () => {
  assert.equal(hasRegionalRiskData(byCode('7')), false)  // Central California Valley
})

test('point lookups against the shipped polygons', () => {
  assert.equal(findEcoregion(eco, 45.37, -121.70)?.code, '4')  // Mt. Hood area, Cascades
  assert.equal(findEcoregion(eco, 37.75, -119.55)?.code, '5')  // Yosemite area, Sierra Nevada
  assert.equal(findEcoregion(eco, 30.0, -140.0), null)         // Pacific Ocean
})

test('COMET file layout matches COMET_PRACTICE_ORDER and source values', () => {
  assert.deepEqual(comet.order, COMET_PRACTICE_ORDER.map(String))
  assert.deepEqual(comet.variants, ['ni', 'ir'])
  assert.equal(Object.keys(comet.counties).length, 3114)
  assert.equal(comet.counties['19127'][0], 0.5975)  // Marshall Co., IA — CPS 329 non-irrigated
  for (const row of Object.values(comet.counties)) assert.equal(row.length, 12)
})
