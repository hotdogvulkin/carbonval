import type { ValuationInputs, LandType, ProjectDuration, PriceScenario, ProtectionStatus, AdditionalityLevel, CpsPractice, ParcelContext } from '../types'
import {
  LAND_TYPE_LABELS,
  ADDITIONALITY_LEVEL_LABELS,
  ADDITIONALITY_LEVEL_DESCRIPTIONS,
  COMET_PRACTICES,
  COMET_SELECTABLE_PRACTICES,
} from '../lib/constants'
import { VCM_MARKET_DATA } from '../lib/marketData'
import { isForest, selectCometRate, formatNumber } from '../lib/carbonModel'

interface Props {
  inputs: ValuationInputs
  onChange: (inputs: ValuationInputs) => void
  ctx: ParcelContext
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${on ? 'bg-green-700' : 'bg-gray-300'}`}
      role="switch"
      aria-checked={on}
      aria-label={label}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4' : 'translate-x-1'}`} />
    </button>
  )
}

const LAND_TYPES: LandType[] = [
  'evergreenForest',
  'deciduousForest',
  'mixedForest',
  'shrubland',
  'grassland',
  'cropland',
  'wetland',
  'other',
]

const DURATIONS: ProjectDuration[] = [10, 20, 30]
const PRICE_SCENARIOS: PriceScenario[] = ['conservative', 'mid', 'premium']
const ADDITIONALITY_LEVELS: AdditionalityLevel[] = ['conservative', 'moderate', 'high']

export default function InputPanel({ inputs, onChange, ctx }: Props) {
  function set<K extends keyof ValuationInputs>(key: K, value: ValuationInputs[K]) {
    onChange({ ...inputs, [key]: value })
  }

  const acresError = inputs.acres <= 0 || isNaN(inputs.acres)
  const irrigated = inputs.irrigated ?? false
  const adverseSelection = inputs.adverseSelection ?? true
  const practice = inputs.cpsNumber !== undefined ? COMET_PRACTICES[inputs.cpsNumber] : null
  const rate = inputs.cpsNumber !== undefined && ctx.cometRow ? selectCometRate(ctx.cometRow, inputs.cpsNumber, irrigated) : null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Parcel Details
        </h2>
      </div>

      {/* Acreage */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">
          Parcel Size
        </label>
        <div className="relative">
          <input
            type="number"
            min="0.1"
            step="any"
            value={inputs.acres}
            onChange={e => set('acres', parseFloat(e.target.value))}
            className={`w-full rounded-lg border px-3 py-2 text-sm pr-12 focus:outline-none focus:ring-2 focus:ring-green-700 ${
              acresError
                ? 'border-red-400 bg-red-50 text-red-900'
                : 'border-gray-300 text-gray-900'
            }`}
          />
          <span className="absolute right-3 top-2.5 text-sm text-gray-400">
            acres
          </span>
        </div>
        {acresError && (
          <p className="text-xs text-red-600">Please enter a valid acreage greater than 0.</p>
        )}
      </div>

      {/* Land Type */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">
          Land Cover Type
        </label>
        <select
          value={inputs.landType}
          onChange={e => set('landType', e.target.value as LandType)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-700"
        >
          {LAND_TYPES.map(type => (
            <option key={type} value={type}>
              {LAND_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      {/* Cropland practice + irrigation */}
      {inputs.landType === 'cropland' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Conservation Practice (change from current management)</label>
            <select
              value={inputs.cpsNumber ?? ''}
              onChange={e => set('cpsNumber', e.target.value ? (Number(e.target.value) as CpsPractice) : undefined)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-700"
            >
              <option value="">No practice change</option>
              {COMET_SELECTABLE_PRACTICES.map(num => (
                <option key={num} value={num}>CPS {num} — {COMET_PRACTICES[num].label}</option>
              ))}
            </select>
            {practice ? (
              <p className="text-xs text-gray-400 leading-snug">
                COMET-Planner scenario: {practice.implementation.replace('{irrigation}', irrigated ? 'Irrigated' : 'Non-Irrigated')}.
                {' '}
                {!inputs.location
                  ? 'Drop a pin on the map to look up the county rate.'
                  : ctx.countyStatus === 'loading'
                    ? 'Looking up county…'
                    : rate !== null
                      ? `County rate: ${formatNumber(rate, 3)} MT CO₂e/acre/yr.`
                      : 'COMET-Planner has no estimate for this county and scenario.'}
              </p>
            ) : (
              <p className="text-xs text-gray-400">No practice change means no soil-carbon stock change, so no additional carbon is credited.</p>
            )}
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Irrigated cropland</label>
            <Toggle on={irrigated} onClick={() => set('irrigated', !irrigated)} label="Irrigated cropland" />
          </div>
        </div>
      )}

      {/* Project Duration */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">
          Project Duration
        </label>
        <div className="grid grid-cols-3 gap-2">
          {DURATIONS.map(d => (
            <button
              key={d}
              onClick={() => set('duration', d)}
              className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                inputs.duration === d
                  ? 'bg-green-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {d} years
            </button>
          ))}
        </div>
      </div>

      {/* Price Scenario */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">
          Market Price Scenario
        </label>
        <div className="grid grid-cols-3 gap-2">
          {PRICE_SCENARIOS.map(scenario => (
            <button
              key={scenario}
              onClick={() => set('priceScenario', scenario)}
              className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                inputs.priceScenario === scenario
                  ? 'bg-green-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {scenario === 'conservative' ? '$5' : scenario === 'mid' ? '$15' : '$30'}
              <span className="block text-xs font-normal opacity-75">/ton</span>
            </button>
          ))}
        </div>
        {/* Market Data callout */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-700">Market Data</p>
            <span className="text-xs text-gray-400">{VCM_MARKET_DATA.referenceYear}</span>
          </div>
          {VCM_MARKET_DATA.segments.map(seg => (
            <div key={seg.segment} className="flex items-start justify-between gap-2">
              <p className="text-xs text-gray-500 leading-tight">{seg.segment}</p>
              <p className="text-xs font-mono text-gray-700 shrink-0">{seg.priceRange}</p>
            </div>
          ))}
          <p className="text-xs text-gray-400 pt-0.5 border-t border-gray-200 leading-relaxed">
            {VCM_MARKET_DATA.source} · {VCM_MARKET_DATA.reportTitle}.{' '}
            {VCM_MARKET_DATA.updateNote}
          </p>
        </div>
      </div>

      {/* Protection Status */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">
          Protection Status
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['protected', 'unprotected'] as ProtectionStatus[]).map(status => (
            <button
              key={status}
              onClick={() => set('protectionStatus', status)}
              className={`rounded-lg py-2 text-sm font-medium capitalize transition-colors ${
                inputs.protectionStatus === status
                  ? 'bg-green-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400">
          Protected (conservation easement / public / tribal) uses CARB's QCE risk values; unprotected uses CARB's no-QCE values. Forest only.
        </p>
      </div>

      {/* Enrollment risk (adverse selection) — forest only */}
      {isForest(inputs.landType) && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Enrollment risk (adverse selection)</label>
            <Toggle on={adverseSelection} onClick={() => set('adverseSelection', !adverseSelection)} label="Enrollment risk" />
          </div>
          <p className="text-xs text-gray-400">
            {adverseSelection
              ? 'ON — uses the 75th percentile of regional risk (P25 permanence), assuming higher-risk parcels are likelier to enroll.'
              : 'OFF — uses the regional median permanence.'}
          </p>
        </div>
      )}

      {/* Additionality */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">
          Additionality
        </label>
        <div className="space-y-2">
          {ADDITIONALITY_LEVELS.map(level => (
            <button
              key={level}
              onClick={() => set('additionalityLevel', level)}
              className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                inputs.additionalityLevel === level
                  ? 'bg-green-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="block text-sm font-medium">
                {ADDITIONALITY_LEVEL_LABELS[level]}
              </span>
              <span className={`block text-xs mt-0.5 ${
                inputs.additionalityLevel === level ? 'text-green-200' : 'text-gray-400'
              }`}>
                {ADDITIONALITY_LEVEL_DESCRIPTIONS[level]}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400">
          Additionality factors (0.60 / 0.75 / 0.90) are an illustrative assumption, not values from any carbon standard.
        </p>
      </div>
    </div>
  )
}
