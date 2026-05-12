import type { CARBInputs, CARBSector, CompliancePeriod } from '../types'
import {
  CARB_SECTOR_LABELS,
  COMPLIANCE_PERIOD_LABELS,
  FREE_ALLOCATION_RANGES,
  DEFAULT_ALLOWANCE_PRICE,
  DEFAULT_OFFSET_PRICE,
} from '../lib/carbConstants'

interface Props {
  inputs: CARBInputs
  onChange: (inputs: CARBInputs) => void
}

const SECTORS: CARBSector[] = [
  'electricity_generation',
  'electricity_imports',
  'industrial',
  'fuel_supplier',
]

const COMPLIANCE_PERIODS: CompliancePeriod[] = ['2021-2023', '2024-2026', '2027-2030']

export default function ComplianceInputPanel({ inputs, onChange }: Props) {
  function set<K extends keyof CARBInputs>(key: K, value: CARBInputs[K]) {
    onChange({ ...inputs, [key]: value })
  }

  const freeAllocRange = FREE_ALLOCATION_RANGES[inputs.sector]
  const hasAllocationRange = freeAllocRange.max > 0

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Facility Details
        </h2>
      </div>

      {/* Annual emissions */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">
          Annual Reported Emissions
        </label>
        <div className="relative">
          <input
            type="number"
            min="0"
            step="1000"
            value={inputs.annualEmissions}
            onChange={e => set('annualEmissions', parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm pr-20 focus:outline-none focus:ring-2 focus:ring-green-700 text-gray-900"
          />
          <span className="absolute right-3 top-2.5 text-xs text-gray-400">
            tCO₂e/yr
          </span>
        </div>
        <p className="text-xs text-gray-400">
          From your CARB MRR annual emissions report.
        </p>
      </div>

      {/* Sector */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">Covered Sector</label>
        <select
          value={inputs.sector}
          onChange={e => set('sector', e.target.value as CARBSector)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-700"
        >
          {SECTORS.map(s => (
            <option key={s} value={s}>
              {CARB_SECTOR_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Compliance period */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">Compliance Period</label>
        <div className="grid grid-cols-3 gap-2">
          {COMPLIANCE_PERIODS.map(period => (
            <button
              key={period}
              onClick={() => set('compliancePeriod', period)}
              className={`rounded-lg py-2 text-xs font-medium transition-colors ${
                inputs.compliancePeriod === period
                  ? 'bg-green-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {COMPLIANCE_PERIOD_LABELS[period]}
            </button>
          ))}
        </div>
      </div>

      {/* Current allowance holdings */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">
          Current Allowance Holdings
        </label>
        <div className="relative">
          <input
            type="number"
            min="0"
            step="1000"
            value={inputs.allowanceHoldings}
            onChange={e => set('allowanceHoldings', parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm pr-20 focus:outline-none focus:ring-2 focus:ring-green-700 text-gray-900"
          />
          <span className="absolute right-3 top-2.5 text-xs text-gray-400">
            allowances
          </span>
        </div>
      </div>

      {/* Emissions growth rate */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Emissions Growth Rate
          </label>
          <span className="text-sm font-mono text-green-900">
            {inputs.emissionsGrowthRate === 0
              ? 'Flat (no change)'
              : `${inputs.emissionsGrowthRate > 0 ? '+' : ''}${inputs.emissionsGrowthRate}%/yr`}
          </span>
        </div>
        <input
          type="range"
          min="-5"
          max="5"
          step="0.5"
          value={inputs.emissionsGrowthRate}
          onChange={e => set('emissionsGrowthRate', parseFloat(e.target.value))}
          className="w-full accent-green-800"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>−5%/yr</span>
          <span>+5%/yr</span>
        </div>
      </div>

      {/* Free allocation toggle */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">
          Free Allowance Allocation
        </label>
        <p className="text-xs text-gray-400 -mt-2">
          Does your facility receive free allowance allocation from CARB?
        </p>
        <div className="grid grid-cols-2 gap-2">
          {([true, false] as const).map(val => (
            <button
              key={String(val)}
              onClick={() => set('receivesFreeAllocation', val)}
              className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                inputs.receivesFreeAllocation === val
                  ? 'bg-green-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {val ? 'Yes' : 'No'}
            </button>
          ))}
        </div>

        {inputs.receivesFreeAllocation && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-600">
                Free Allocation (% of obligation)
              </label>
              <span className="text-sm font-mono text-green-900">
                {inputs.freeAllocationPct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={inputs.freeAllocationPct}
              onChange={e => set('freeAllocationPct', parseFloat(e.target.value))}
              className="w-full accent-green-800"
            />
            {hasAllocationRange && (
              <p className="text-xs text-gray-400">
                Typical range for {CARB_SECTOR_LABELS[inputs.sector]}:{' '}
                {freeAllocRange.min}–{freeAllocRange.max}%
              </p>
            )}
          </div>
        )}
      </div>

      {/* Advanced options expander */}
      <div className="border-t border-gray-100 pt-4">
        <button
          onClick={() => set('useAdvancedMode', !inputs.useAdvancedMode)}
          className="flex items-center gap-2 text-sm font-medium text-green-800 hover:text-green-600 transition-colors"
        >
          <span
            className={`text-xs transition-transform ${inputs.useAdvancedMode ? 'rotate-90' : ''}`}
          >
            ▶
          </span>
          {inputs.useAdvancedMode ? 'Hide advanced options' : 'Show advanced options'}
        </button>

        {inputs.useAdvancedMode && (
          <div className="mt-4 space-y-4">
            {/* Existing offset holdings */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Existing CARB-Eligible Offset Holdings
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={inputs.existingOffsetHoldings}
                  onChange={e =>
                    set('existingOffsetHoldings', parseFloat(e.target.value) || 0)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm pr-16 focus:outline-none focus:ring-2 focus:ring-green-700 text-gray-900"
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-400">
                  offsets
                </span>
              </div>
              <p className="text-xs text-gray-400">
                CARB-eligible offsets are capped at {(DEFAULT_OFFSET_PRICE > 0 ? 4 : 4)}% of your compliance obligation (CCR §95854).
              </p>
            </div>

            {/* Allowance price */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Allowance Price
                </label>
                <span className="text-sm font-mono text-green-900">
                  ${inputs.allowancePrice}/tCO₂e
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="1"
                value={inputs.allowancePrice}
                onChange={e => set('allowancePrice', parseFloat(e.target.value))}
                className="w-full accent-green-800"
              />
              <p className="text-xs text-gray-400">
                Default: ${DEFAULT_ALLOWANCE_PRICE} (2024 WCI auction reference)
              </p>
            </div>

            {/* Offset price */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  CARB-Eligible Offset Price
                </label>
                <span className="text-sm font-mono text-green-900">
                  ${inputs.offsetPrice}/tCO₂e
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="1"
                value={inputs.offsetPrice}
                onChange={e => set('offsetPrice', parseFloat(e.target.value))}
                className="w-full accent-green-800"
              />
              <p className="text-xs text-gray-400">
                Default: ${DEFAULT_OFFSET_PRICE} (CARB-eligible offset market, 2024)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
