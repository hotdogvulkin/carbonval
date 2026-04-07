import type { ValuationInputs, LandType, ProjectDuration, PriceScenario, ProtectionStatus } from '../types'
import { LAND_TYPE_LABELS, PRICE_SCENARIO_LABELS } from '../lib/constants'

interface Props {
  inputs: ValuationInputs
  onChange: (inputs: ValuationInputs) => void
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

export default function InputPanel({ inputs, onChange }: Props) {
  function set<K extends keyof ValuationInputs>(key: K, value: ValuationInputs[K]) {
    onChange({ ...inputs, [key]: value })
  }

  const acresError = inputs.acres <= 0 || isNaN(inputs.acres)

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
        <p className="text-xs text-gray-400">
          Conservative = compliance offset floor · Mid = voluntary retail · Premium = nature-based
        </p>
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
          Unprotected parcels receive an 18% permanence discount per IPCC guidelines.
        </p>
      </div>
    </div>
  )
}
