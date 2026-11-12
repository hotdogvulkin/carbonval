import { useMemo, useState } from 'react'
import type { ValuationInputs, ScenarioComparisonRow, ParcelContext, ValuationStatus, IntegrityRiskLevel, ClassificationResult } from '../types'
import {
  calculateValuation, generateProjection, calculateScenarioComparison,
  formatCurrency, formatNumber, formatPercent, isForest, EMPTY_CONTEXT,
} from '../lib/carbonModel'
import { VERIFICATION_COST } from '../lib/constants'
import { saveValuation } from '../lib/saveValuation'
import ProjectionChart from './ProjectionChart'
import ReportExport from './ReportExport'

interface ComparisonTableRow {
  label: string
  key: keyof ScenarioComparisonRow
  format: (v: number) => string
}

const COMPARISON_ROWS: ComparisonTableRow[] = [
  { label: 'Total Credits', key: 'totalCredits', format: (v) => `${formatNumber(v, 0)} tCO₂` },
  { label: 'Gross Value', key: 'grossValue', format: formatCurrency },
  { label: 'Net Value', key: 'netValue', format: formatCurrency },
  { label: 'Per-Acre Value', key: 'perAcreValue', format: formatCurrency },
]

const UNAVAILABLE_MESSAGES: Partial<Record<ValuationStatus, string>> = {
  'needs-location': 'Drop a pin on the map to estimate this parcel — results depend on location.',
  loading: 'Looking up regional data for this location…',
  'no-regional-data': 'No regional risk data for this location. Forest estimates require Anderegg et al. (2022) forest-risk coverage, which this ecoregion lacks.',
  'no-cropland-data': 'Data unavailable: COMET-Planner has no estimate for this county, practice, and irrigation setting.',
}

const BADGE_STYLES: Record<IntegrityRiskLevel, string> = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  high: 'bg-red-100 text-red-800 border-red-200',
}

type SaveState = 'idle' | 'loading' | 'copied' | 'error'

interface Props {
  inputs: ValuationInputs
  ctx?: ParcelContext
  classification?: ClassificationResult
  readOnly?: boolean
  savedAt?: string
}

export default function ResultsPanel({ inputs, ctx = EMPTY_CONTEXT, classification, readOnly = false, savedAt }: Props) {
  const isValid = inputs.acres > 0 && !isNaN(inputs.acres)
  const [saveState, setSaveState] = useState<SaveState>('idle')

  const results = useMemo(() => (isValid ? calculateValuation(inputs, ctx) : null), [inputs, ctx, isValid])
  const scenarioComparison = useMemo(() => (isValid ? calculateScenarioComparison(inputs, ctx) : null), [inputs, ctx, isValid])
  const projection = useMemo(() => (isValid ? generateProjection(inputs, ctx) : []), [inputs, ctx, isValid])

  async function handleSave() {
    if (!results) return
    setSaveState('loading')
    const id = await saveValuation(inputs, results, classification, ctx.region?.code)
    if (!id) {
      setSaveState('error')
      return
    }
    const url = `${window.location.origin}/v/${id}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // clipboard denied — link is still saved
    }
    setSaveState('copied')
    setTimeout(() => setSaveState('idle'), 2000)
  }

  if (!isValid || !results) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center justify-center min-h-64">
        <p className="text-sm text-gray-400">Enter a valid parcel size to see results.</p>
      </div>
    )
  }

  const unavailable = UNAVAILABLE_MESSAGES[results.status]
  const forest = isForest(inputs.landType)
  const integrity = results.integrity

  return (
    <div className="space-y-4">
      {/* Primary result */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-3 mb-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Estimated Net Value
          </p>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${BADGE_STYLES[integrity.level]}`}
            title={`CarbonVal screening heuristic, score ${integrity.score}. See Methodology.`}
          >
            Integrity risk: {integrity.level[0].toUpperCase() + integrity.level.slice(1)}
          </span>
        </div>
        <p className="text-5xl font-bold text-green-900 tracking-tight">
          {unavailable ? '—' : formatCurrency(results.netValue)}
        </p>
        <p className="text-xs text-gray-400 mt-2 leading-relaxed">
          Educational estimate based on IPCC coefficients and VCM market data.
          Actual project values require third-party verification.
        </p>

        {unavailable && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
            {unavailable}
          </p>
        )}
        {results.status === 'no-practice' && (
          <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mt-3">
            No practice change selected: no change in management means no soil-carbon stock change, so no additional carbon is credited.
          </p>
        )}

        <p className="text-xs text-gray-500 mt-3 leading-relaxed">
          For screening and decision support only — not for registering or selling credits.
          The integrity-risk badge is CarbonVal's own heuristic, not a rating from any ratings agency.
        </p>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
          Net value deducts a {formatPercent(VERIFICATION_COST, 0)} verification and registry cost and applies the
          selected additionality factor; both are illustrative assumptions, not published values.
        </p>

        {savedAt && (
          <p className="text-xs text-gray-400 mt-2">
            Saved on {new Date(savedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        )}

        {!readOnly && (
          <div className="mt-4 space-y-2">
            <button
              onClick={handleSave}
              disabled={saveState === 'loading'}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-colors
                bg-green-900 text-white hover:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saveState === 'loading' && 'Saving…'}
              {saveState === 'copied' && 'Link copied!'}
              {saveState === 'idle' && 'Save & Share'}
              {saveState === 'error' && 'Save failed — try again'}
            </button>
            <ReportExport inputs={inputs} results={results} scenarioComparison={scenarioComparison!} region={ctx.region} />
          </div>
        )}
      </div>

      {!unavailable && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Annual Sequestration" value={formatNumber(results.adjustedAnnual, 1)} unit="tCO₂/yr" />
            <MetricCard label="Total Credits" value={formatNumber(results.totalCredits, 0)} unit="tCO₂" />
          </div>
          {forest && (
            <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 leading-relaxed">
              Forest growth rates are still IPCC Tier 1 defaults and are coarse at the parcel scale.
            </p>
          )}
        </>
      )}

      {/* Reversal risk / data source */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Reversal Risk &amp; Data</p>
        <Row label="Permanence factor">
          <span className="font-mono font-semibold text-gray-900">
            {results.permanenceFactor !== null ? formatPercent(results.permanenceFactor) : 'Not available'}
          </span>
        </Row>
        {forest && (
          <Row label="EPA Level III ecoregion">
            <span className="text-xs text-gray-700 text-right">
              {ctx.region ? `${ctx.region.name} (${ctx.region.code})` : inputs.location ? (ctx.regionStatus === 'loading' ? 'Looking up…' : 'Outside coverage') : 'No pin yet'}
            </span>
          </Row>
        )}
        {forest && ctx.region?.riskPercentile !== undefined && (
          <Row label="Regional risk percentile (CONUS forest)">
            <span className="font-mono text-xs text-gray-700">{formatNumber(ctx.region.riskPercentile, 0)}th</span>
          </Row>
        )}
        {results.permanenceSource === 'verra-minimum' && (
          <p className="text-xs text-gray-500 leading-snug">
            Minimum buffer (Verra), reversal risk not modeled in detail: the 12% AFOLU minimum buffer is applied.
          </p>
        )}
        {results.cometRatePerAcre !== null && (
          <Row label="COMET-Planner rate">
            <span className="font-mono text-xs text-gray-700">{formatNumber(results.cometRatePerAcre, 3)} MT CO₂e/ac/yr</span>
          </Row>
        )}
        <p className="text-xs text-gray-400 pt-1 border-t border-gray-100">
          Integrity-risk score {integrity.score}: additionality +{integrity.components.additionality},
          protection +{integrity.components.protection}, regional risk +{integrity.components.regionalRisk},
          land-cover override +{integrity.components.landCoverOverride}.
        </p>
      </div>

      {!unavailable && (
        <>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 pt-4 pb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Scenario Comparison</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-2 text-xs font-medium text-gray-400 w-1/4"></th>
                    {(['conservative', 'mid', 'premium'] as const).map(scenario => {
                      const isSelected = inputs.priceScenario === scenario
                      const label = scenario === 'conservative' ? '$5/ton' : scenario === 'mid' ? '$15/ton' : '$30/ton'
                      const sublabel = scenario === 'conservative' ? 'Conservative' : scenario === 'mid' ? 'Mid' : 'Premium'
                      return (
                        <th key={scenario} className={`text-center px-3 py-2 text-xs font-semibold w-1/4 ${isSelected ? 'text-green-800 bg-green-50' : 'text-gray-500'}`}>
                          <span className="block">{label}</span>
                          <span className={`block font-normal text-xs ${isSelected ? 'text-green-600' : 'text-gray-400'}`}>{sublabel}</span>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map(row => (
                    <tr key={row.key} className="border-t border-gray-100">
                      <td className="px-5 py-2.5 text-xs font-medium text-gray-500">{row.label}</td>
                      {(['conservative', 'mid', 'premium'] as const).map(scenario => {
                        const isSelected = inputs.priceScenario === scenario
                        return (
                          <td key={scenario} className={`text-center px-3 py-2.5 text-xs font-mono ${isSelected ? 'bg-green-50 text-green-900 font-semibold' : 'text-gray-600'}`}>
                            {row.format(scenarioComparison![scenario][row.key])}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-green-950 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-2xl">🚗</span>
            <p className="text-sm text-green-100">
              Equivalent to taking{' '}
              <span className="font-bold text-white">{results.carEquivalent.toLocaleString()}</span>{' '}
              cars off the road for one year
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">30-Year Value Projection</p>
            <ProjectionChart data={projection} />
          </div>
        </>
      )}

      {readOnly && (
        <div className="text-center">
          <a href="/" className="text-sm text-green-800 hover:text-green-600 font-medium transition-colors">
            Run your own valuation →
          </a>
        </div>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-gray-600">{label}</span>
      {children}
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: string
  unit: string
}

function MetricCard({ label, value, unit }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">
        {value}
        {unit && <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>}
      </p>
    </div>
  )
}
