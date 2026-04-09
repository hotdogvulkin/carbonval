import { useState } from 'react'
import InputPanel from '../components/InputPanel'
import ResultsPanel from '../components/ResultsPanel'
import MapPicker from '../components/MapPicker'
import type { ValuationInputs } from '../types'
import type { ClassificationResult } from '../lib/earthEngine'

const DEFAULT_INPUTS: ValuationInputs = {
  landType: 'evergreenForest',
  acres: 100,
  duration: 20,
  priceScenario: 'mid',
  protectionStatus: 'protected',
}

export default function Home() {
  const [inputs, setInputs] = useState<ValuationInputs>(DEFAULT_INPUTS)
  const [autoDetected, setAutoDetected] = useState(false)

  function handleClassify(result: ClassificationResult) {
    setInputs(prev => ({ ...prev, landType: result.landType }))
    setAutoDetected(true)
  }

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

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        <MapPicker onClassify={handleClassify} />

        {autoDetected && (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
            <p className="text-sm text-green-800">
              Land type auto-detected from satellite data — you can override below.
            </p>
            <button
              onClick={() => setAutoDetected(false)}
              className="text-green-600 hover:text-green-800 text-lg leading-none ml-4"
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <InputPanel inputs={inputs} onChange={setInputs} />
          <ResultsPanel inputs={inputs} />
        </div>

      </main>
    </div>
  )
}
