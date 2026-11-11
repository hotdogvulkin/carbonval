import { useState } from 'react'
import InputPanel from '../components/InputPanel'
import ResultsPanel from '../components/ResultsPanel'
import MapPicker from '../components/MapPicker'
import type { ValuationInputs } from '../types'
import type { ClassificationResult } from '../lib/earthEngine'
import { useParcelContext } from '../lib/useParcelContext'

const DEFAULT_INPUTS: ValuationInputs = {
  landType: 'evergreenForest',
  acres: 100,
  duration: 20,
  priceScenario: 'mid',
  protectionStatus: 'protected',
  additionalityLevel: 'moderate',
  irrigated: false,
  adverseSelection: true,
}

export default function Home() {
  const [inputs, setInputs] = useState<ValuationInputs>(DEFAULT_INPUTS)
  const [autoDetected, setAutoDetected] = useState(false)
  const [classification, setClassification] = useState<ClassificationResult | undefined>()
  const ctx = useParcelContext(inputs.location)

  function handleClassify(result: ClassificationResult, coords: { lat: number; lng: number }) {
    setInputs(prev => ({ ...prev, landType: result.landType, detectedLandType: result.landType, location: coords }))
    setClassification(result)
    setAutoDetected(true)
  }

  function handleLocationOnly(coords: { lat: number; lng: number }) {
    setInputs(prev => ({ ...prev, location: coords, detectedLandType: undefined }))
    setClassification(undefined)
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

          <nav className="flex items-center gap-5">
            <a
              href="/compliance"
              className="text-sm text-green-800 hover:text-green-600 font-medium transition-colors"
            >
              Compliance Estimator
            </a>
            <a
              href="/methodology"
              className="text-sm text-green-800 hover:text-green-600 font-medium transition-colors"
            >
              Methodology {'→'}
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        <MapPicker onClassify={handleClassify} onClassifyFailed={handleLocationOnly} />

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
          <InputPanel inputs={inputs} onChange={setInputs} ctx={ctx} />
          <ResultsPanel inputs={inputs} ctx={ctx} classification={classification} />
        </div>

      </main>
    </div>
  )
}
