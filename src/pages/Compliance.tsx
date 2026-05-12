import { useMemo, useState } from 'react'
import ComplianceInputPanel from '../components/ComplianceInputPanel'
import ComplianceResultsPanel from '../components/ComplianceResultsPanel'
import type { CARBInputs } from '../types'
import { calculateCARB } from '../lib/carbModel'
import { DEFAULT_ALLOWANCE_PRICE, DEFAULT_OFFSET_PRICE } from '../lib/carbConstants'

const DEFAULT_INPUTS: CARBInputs = {
  annualEmissions: 50000,
  sector: 'industrial',
  compliancePeriod: '2024-2026',
  allowanceHoldings: 0,
  emissionsGrowthRate: 0,
  receivesFreeAllocation: false,
  freeAllocationPct: 85,
  existingOffsetHoldings: 0,
  allowancePrice: DEFAULT_ALLOWANCE_PRICE,
  offsetPrice: DEFAULT_OFFSET_PRICE,
  useAdvancedMode: false,
}

export default function Compliance() {
  const [inputs, setInputs] = useState<CARBInputs>(DEFAULT_INPUTS)

  const results = useMemo(() => calculateCARB(inputs), [inputs])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-green-900 tracking-tight">
              CarbonVal
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              CARB Compliance Estimator
            </p>
          </div>

          <nav className="flex items-center gap-5">
            <a
              href="/"
              className="text-sm text-gray-600 hover:text-green-800 font-medium transition-colors"
            >
              Carbon Valuation
            </a>
            <a
              href="/methodology"
              className="text-sm text-gray-600 hover:text-green-800 font-medium transition-colors"
            >
              Methodology
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            CARB Cap-and-Trade Compliance
          </h2>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed max-w-2xl">
            Estimate your California cap-and-trade compliance exposure — coverage status,
            allowance shortfall or surplus, estimated compliance cost, and a 10-year
            projection. Based on CCR Title 17 regulatory parameters and 2024 WCI auction data.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ComplianceInputPanel inputs={inputs} onChange={setInputs} />
          <ComplianceResultsPanel results={results} />
        </div>
      </main>
    </div>
  )
}
