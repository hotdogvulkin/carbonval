import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ResultsPanel from '../components/ResultsPanel'
import type { ValuationInputs, LandType, ProjectDuration, PriceScenario, ProtectionStatus } from '../types'

interface ValuationRow {
  land_type: string
  acres: number
  duration: number
  price_scenario: string
  protection_status: string
  created_at: string
}

export default function Valuation() {
  const { id } = useParams<{ id: string }>()
  const [inputs, setInputs] = useState<ValuationInputs | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) {
      setNotFound(true)
      setLoading(false)
      return
    }

    supabase
      .from('valuations')
      .select('land_type, acres, duration, price_scenario, protection_status, created_at')
      .eq('id', id)
      .single()
      .then(({ data, error }: { data: ValuationRow | null; error: { message: string } | null }) => {
        if (error || !data) {
          setNotFound(true)
        } else {
          setInputs({
            landType: data.land_type as LandType,
            acres: data.acres,
            duration: data.duration as ProjectDuration,
            priceScenario: data.price_scenario as PriceScenario,
            protectionStatus: data.protection_status as ProtectionStatus,
          })
          setSavedAt(data.created_at)
        }
        setLoading(false)
      })
  }, [id])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <Link to="/" className="text-xl font-semibold text-green-900 tracking-tight hover:text-green-700 transition-colors">
              CarbonVal
            </Link>
            <p className="text-xs text-gray-500 mt-0.5">Carbon Credit Valuation Tool</p>
          </div>
          <a
            href="/methodology"
            className="text-sm text-green-800 hover:text-green-600 font-medium transition-colors"
          >
            Methodology →
          </a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {loading && (
          <div className="flex items-center justify-center min-h-64">
            <p className="text-sm text-gray-400">Loading valuation…</p>
          </div>
        )}

        {!loading && notFound && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-4">
            <p className="text-gray-600 font-medium">Valuation not found.</p>
            <p className="text-sm text-gray-400">This link may be invalid or expired.</p>
            <Link
              to="/"
              className="inline-block mt-2 text-sm text-green-800 hover:text-green-600 font-medium transition-colors"
            >
              Run your own valuation →
            </Link>
          </div>
        )}

        {!loading && inputs && (
          <ResultsPanel
            inputs={inputs}
            readOnly
            savedAt={savedAt ?? undefined}
          />
        )}
      </main>
    </div>
  )
}
