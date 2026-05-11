import { useRef, useState } from 'react'
import type { ValuationInputs, ValuationOutputs, ScenarioComparison, ScenarioComparisonRow } from '../types'
import { formatCurrency, formatNumber } from '../lib/carbonModel'
import { LAND_TYPE_LABELS, ADDITIONALITY_LEVEL_LABELS, PRICE_SCENARIO_LABELS } from '../lib/constants'

interface PdfTableRow {
  label: string
  key: keyof ScenarioComparisonRow
  fmt: (v: number) => string
}

const PDF_TABLE_ROWS: PdfTableRow[] = [
  { label: 'Total Credits', key: 'totalCredits', fmt: (v) => `${formatNumber(v, 0)} tCO₂` },
  { label: 'Gross Value', key: 'grossValue', fmt: formatCurrency },
  { label: 'Net Value', key: 'netValue', fmt: formatCurrency },
  { label: 'Per-Acre Value', key: 'perAcreValue', fmt: formatCurrency },
]

interface Props {
  inputs: ValuationInputs
  results: ValuationOutputs
  scenarioComparison: ScenarioComparison
}

type ExportState = 'idle' | 'generating' | 'done' | 'error'

const SCENARIOS = ['conservative', 'mid', 'premium'] as const

export default function ReportExport({ inputs, results, scenarioComparison }: Props) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [exportState, setExportState] = useState<ExportState>('idle')

  async function handleExport() {
    if (!contentRef.current) return
    setExportState('generating')

    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const ratio = pdfWidth / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, canvas.height * ratio)
      pdf.save(`carbonval-report-${new Date().toISOString().slice(0, 10)}.pdf`)

      setExportState('done')
      setTimeout(() => setExportState('idle'), 2500)
    } catch (err) {
      console.error('PDF export failed:', err)
      setExportState('error')
      setTimeout(() => setExportState('idle'), 2500)
    }
  }

  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const durationLabel = `${inputs.duration} years`
  const protectionLabel = inputs.protectionStatus === 'protected' ? 'Protected' : 'Unprotected'

  return (
    <>
      <button
        onClick={handleExport}
        disabled={exportState === 'generating'}
        className="w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-colors
          border border-green-900 text-green-900 hover:bg-green-50
          disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {exportState === 'generating' && 'Generating PDF…'}
        {exportState === 'done' && 'PDF downloaded'}
        {exportState === 'error' && 'Export failed — try again'}
        {exportState === 'idle' && 'Export PDF'}
      </button>

      {/* Hidden content captured by html2canvas */}
      <div
        ref={contentRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '794px',
          backgroundColor: '#ffffff',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          color: '#111827',
          padding: '48px',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div style={{ borderBottom: '2px solid #1a4008', paddingBottom: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: '22px', fontWeight: 700, color: '#1a4008', margin: 0, letterSpacing: '-0.5px' }}>
                CarbonVal
              </p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>
                Carbon Credit Valuation Report
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>
                carbonval.vercel.app
              </p>
              <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0' }}>
                Generated {generatedDate}
              </p>
            </div>
          </div>
        </div>

        {/* Parcel Details */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
            Parcel Details
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px 24px' }}>
            {[
              ['Land Cover', LAND_TYPE_LABELS[inputs.landType]],
              ['Parcel Size', `${inputs.acres.toLocaleString()} acres`],
              ['Project Duration', durationLabel],
              ['Protection Status', protectionLabel],
              ['Price Scenario', PRICE_SCENARIO_LABELS[inputs.priceScenario]],
              ['Additionality', ADDITIONALITY_LEVEL_LABELS[inputs.additionalityLevel]],
            ].map(([label, value]) => (
              <div key={label}>
                <p style={{ fontSize: '10px', color: '#9ca3af', margin: '0 0 2px' }}>{label}</p>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#111827', margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Primary Result */}
        <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
          <p style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>
            Estimated Net Value
          </p>
          <p style={{ fontSize: '36px', fontWeight: 800, color: '#1a4008', margin: '0 0 8px', letterSpacing: '-1px' }}>
            {formatCurrency(results.netValue)}
          </p>
          <div style={{ display: 'flex', gap: '32px' }}>
            <div>
              <p style={{ fontSize: '10px', color: '#9ca3af', margin: '0 0 2px' }}>Annual Sequestration</p>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: 0 }}>
                {formatNumber(results.adjustedAnnual, 1)} tCO₂/yr
              </p>
            </div>
            <div>
              <p style={{ fontSize: '10px', color: '#9ca3af', margin: '0 0 2px' }}>Total Credits</p>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: 0 }}>
                {formatNumber(results.totalCredits, 0)} tCO₂
              </p>
            </div>
            <div>
              <p style={{ fontSize: '10px', color: '#9ca3af', margin: '0 0 2px' }}>Per-Acre Value</p>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: 0 }}>
                {formatCurrency(results.perAcreValue)}
              </p>
            </div>
          </div>
        </div>

        {/* Scenario Comparison Table */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
            Scenario Comparison
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '10px', color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}></th>
                {SCENARIOS.map(s => {
                  const isSelected = inputs.priceScenario === s
                  const label = s === 'conservative' ? '$5/ton' : s === 'mid' ? '$15/ton' : '$30/ton'
                  const sub = s === 'conservative' ? 'Conservative' : s === 'mid' ? 'Mid' : 'Premium'
                  return (
                    <th
                      key={s}
                      style={{
                        textAlign: 'center',
                        padding: '8px 12px',
                        fontSize: '11px',
                        color: isSelected ? '#1a4008' : '#6b7280',
                        fontWeight: isSelected ? 700 : 500,
                        backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                        borderBottom: `2px solid ${isSelected ? '#1a4008' : '#e5e7eb'}`,
                      }}
                    >
                      {label}
                      <span style={{ display: 'block', fontWeight: 400, fontSize: '10px', color: isSelected ? '#3b6d11' : '#9ca3af' }}>{sub}</span>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {PDF_TABLE_ROWS.map((row, i) => (
                <tr key={row.key} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                  <td style={{ padding: '7px 12px', fontSize: '11px', color: '#6b7280', borderBottom: '1px solid #f3f4f6' }}>{row.label}</td>
                  {SCENARIOS.map(s => {
                    const isSelected = inputs.priceScenario === s
                    return (
                      <td
                        key={s}
                        style={{
                          textAlign: 'center',
                          padding: '7px 12px',
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          color: isSelected ? '#1a4008' : '#374151',
                          fontWeight: isSelected ? 700 : 400,
                          backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                          borderBottom: '1px solid #f3f4f6',
                        }}
                      >
                        {row.fmt(scenarioComparison[s][row.key])}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Methodology Disclaimer */}
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '12px 14px', marginBottom: '20px' }}>
          <p style={{ fontSize: '10px', color: '#92400e', margin: 0, lineHeight: 1.5 }}>
            <strong>Educational estimate only.</strong> Results are based on IPCC Tier 1 default coefficients
            and VCM market reference data. Actual carbon project values require third-party verification by
            an accredited registry (Verra, Gold Standard, or ACR). Coefficients, adjustment factors, and data
            sources are documented at <strong>carbonval.vercel.app/methodology</strong>.
          </p>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
          <p style={{ fontSize: '10px', color: '#9ca3af', margin: 0 }}>
            CarbonVal — Independent research tool
          </p>
          <p style={{ fontSize: '10px', color: '#9ca3af', margin: 0 }}>
            carbonval.vercel.app
          </p>
        </div>
      </div>
    </>
  )
}
