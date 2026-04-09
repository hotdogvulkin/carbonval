import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ResultsPanel from '../components/ResultsPanel'
import type { ValuationInputs } from '../types'

interface ValuationRow {
  inputs: ValuationInputs
  created_at: string
}

export default function Valuation() {
  const { id } = useParams<{ id: string }>()
  const [row, setRow] = useState<ValuationRow | null>(null)
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
      .select('inputs, created_at')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true)
        } else {
          setRow(data as ValuationRow)
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

        {!loading && row && (
          <ResultsPanel
            inputs={row.inputs}
            readOnly
            savedAt={row.created_at}
          />
        )}
      </main>
    </div>
  )
}
