import { useState } from 'react'
import InputPanel from '../components/InputPanel'
import ResultsPanel from '../components/ResultsPanel'
import type { ValuationInputs } from '../types'

const DEFAULT_INPUTS: ValuationInputs = {
  landType: 'evergreenForest',
  acres: 100,
  duration: 20,
  priceScenario: 'mid',
  protectionStatus: 'protected',
}

export default function Home() {
  const [inputs, setInputs] = useState<ValuationInputs>(DEFAULT_INPUTS)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-green-900 tracking-tight">
              CarbonVal
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Carbon Credit Valuation Tool
            </p>
          </div>

          <a
            href="/methodology"
            className="text-sm text-green-800 hover:text-green-600 font-medium transition-colors"
          >
            Methodology {'\u2192'}
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <InputPanel inputs={inputs} onChange={setInputs} />
          <ResultsPanel inputs={inputs} />
        </div>
      </main>
    </div>
  )
}
