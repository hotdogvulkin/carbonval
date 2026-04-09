import { useMemo, useState } from 'react'
import type { ValuationInputs } from '../types'
import { calculateValuation, generateProjection, formatCurrency, formatNumber } from '../lib/carbonModel'
import { saveValuation } from '../lib/saveValuation'
import ProjectionChart from './ProjectionChart'

type SaveState = 'idle' | 'loading' | 'copied' | 'error'

interface Props {
  inputs: ValuationInputs
  readOnly?: boolean
  savedAt?: string
}

export default function ResultsPanel({ inputs, readOnly = false, savedAt }: Props) {
  const isValid = inputs.acres > 0 && !isNaN(inputs.acres)
  const [saveState, setSaveState] = useState<SaveState>('idle')

  const results = useMemo(() => {
    if (!isValid) return null
    return calculateValuation(inputs)
  }, [inputs, isValid])

  const projection = useMemo(() => {
    if (!isValid) return []
    return generateProjection(inputs)
  }, [inputs, isValid])

  async function handleSave() {
    if (!results) return
    setSaveState('loading')

    const id = await saveValuation(inputs, results)

    if (!id) {
      setSaveState('error')
      return
    }

    const url = `${window.location.origin}/v/${id}`
    try {
      await navigator.clipboard.writeText(url)
      setSaveState('copied')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      // clipboard denied — still show the URL
      setSaveState('copied')
      setTimeout(() => setSaveState('idle'), 2000)
    }
  }

  if (!isValid) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center justify-center min-h-64">
        <p className="text-sm text-gray-400">Enter a valid parcel size to see results.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Primary result */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
          Estimated Net Value
        </p>
        <p className="text-5xl font-bold text-green-900 tracking-tight">
          {formatCurrency(results!.netValue)}
        </p>
        <p className="text-xs text-gray-400 mt-2 leading-relaxed">
          Educational estimate based on IPCC coefficients and VCM market data.
          Actual project values require third-party verification.
        </p>

        {savedAt && (
          <p className="text-xs text-gray-400 mt-2">
            Saved on {new Date(savedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        )}

        {/* Save & Share button */}
        {!readOnly && (
          <div className="mt-4">
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
          </div>
        )}
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Total Credits"
          value={formatNumber(results!.totalCredits, 0)}
          unit="tCO₂"
        />
        <MetricCard
          label="Annual Sequestration"
          value={formatNumber(results!.adjustedAnnual, 1)}
          unit="tCO₂/yr"
        />
        <MetricCard
          label="Per-Acre Value"
          value={formatCurrency(results!.perAcreValue)}
          unit=""
        />
        <MetricCard
          label="Gross Value"
          value={formatCurrency(results!.grossValue)}
          unit=""
        />
      </div>

      {/* Car equivalent */}
      <div className="bg-green-950 rounded-2xl p-4 flex items-center gap-3">
        <span className="text-2xl">🚗</span>
        <p className="text-sm text-green-100">
          Equivalent to taking{' '}
          <span className="font-bold text-white">
            {results!.carEquivalent.toLocaleString()}
          </span>{' '}
          cars off the road for one year
        </p>
      </div>

      {/* Projection chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
          30-Year Value Projection
        </p>
        <ProjectionChart data={projection} />
      </div>

      {/* Run your own link (read-only mode) */}
      {readOnly && (
        <div className="text-center">
          <a
            href="/"
            className="text-sm text-green-800 hover:text-green-600 font-medium transition-colors"
          >
            Run your own valuation →
          </a>
        </div>
      )}
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
