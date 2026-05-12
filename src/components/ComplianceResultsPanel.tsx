import type { CARBResults, CoverageStatus } from '../types'
import { formatCarbCurrency, formatCarbNumber } from '../lib/carbModel'
import ComplianceProjectionChart from './ComplianceProjectionChart'

interface Props {
  results: CARBResults
}

interface CoverageBadgeProps {
  status: CoverageStatus
}

function CoverageBadge({ status }: CoverageBadgeProps) {
  if (status === 'mandatory') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
        Mandatory Coverage
      </span>
    )
  }
  if (status === 'voluntary_eligible') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
        Voluntary Eligible
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
      Not Covered
    </span>
  )
}

interface SurrenderRowProps {
  label: string
  tons: number
  cost: number
}

function SurrenderRow({ label, tons, cost }: SurrenderRowProps) {
  return (
    <tr className="border-t border-gray-100">
      <td className="px-5 py-2.5 text-xs font-medium text-gray-500">{label}</td>
      <td className="px-3 py-2.5 text-xs font-mono text-right text-gray-700">
        {formatCarbNumber(Math.round(tons))} tCO₂e
      </td>
      <td className="px-3 py-2.5 text-xs font-mono text-right text-gray-700">
        {formatCarbCurrency(cost)}
      </td>
    </tr>
  )
}

export default function ComplianceResultsPanel({ results }: Props) {
  const isShort = results.allowanceStatus === 'short'
  const isLong = results.allowanceStatus === 'long'

  return (
    <div className="space-y-4">
      {/* Coverage status */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start gap-3 mb-3">
          <CoverageBadge status={results.coverageStatus} />
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{results.coverageMessage}</p>
      </div>

      {/* Net compliance exposure */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
          Net Compliance Exposure
        </p>
        {isShort && (
          <>
            <p className="text-5xl font-bold text-red-700 tracking-tight">
              {formatCarbNumber(Math.round(results.tonsShort))}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              tCO₂e short over the compliance period
            </p>
          </>
        )}
        {isLong && (
          <>
            <p className="text-5xl font-bold text-green-900 tracking-tight">
              +{formatCarbNumber(Math.round(results.tonsLong))}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              tCO₂e long — surplus allowances
            </p>
          </>
        )}
        {results.allowanceStatus === 'balanced' && (
          <>
            <p className="text-5xl font-bold text-gray-700 tracking-tight">Balanced</p>
            <p className="text-sm text-gray-500 mt-1">
              Allowances match compliance obligation
            </p>
          </>
        )}
        <p className="text-xs text-gray-400 mt-3 leading-relaxed">
          Educational estimate based on CARB regulatory parameters and WCI auction data.
          Actual compliance obligations require verification by a qualified compliance consultant.
        </p>
      </div>

      {/* Obligation breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 font-medium mb-1">Annual Net Obligation</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCarbNumber(Math.round(results.netObligation))}
            <span className="text-sm font-normal text-gray-400 ml-1">tCO₂e</span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 font-medium mb-1">Period Obligation</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCarbNumber(Math.round(results.periodObligation))}
            <span className="text-sm font-normal text-gray-400 ml-1">tCO₂e</span>
          </p>
        </div>
      </div>

      {/* Compliance cost */}
      {isShort && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
            Estimated Compliance Cost
          </p>
          <p className="text-4xl font-bold text-gray-900 tracking-tight">
            {formatCarbCurrency(results.pureAllowanceCost)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Pure allowance cost at market price</p>

          {results.blendedCost < results.pureAllowanceCost && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Blended Cost (allowances + eligible offsets)
              </p>
              <p className="text-2xl font-bold text-green-900 tracking-tight">
                {formatCarbCurrency(results.blendedCost)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Offset savings callout */}
      {isShort && results.offsetSavings > 0 && (
        <div className="bg-green-950 rounded-2xl p-4">
          <p className="text-sm text-green-100">
            Using eligible offsets could save{' '}
            <span className="font-bold text-white">
              {formatCarbCurrency(results.offsetSavings)}
            </span>{' '}
            versus purchasing allowances at market price.
          </p>
          <p className="text-xs text-green-400 mt-1">
            CARB-eligible offsets are capped at 4% of your compliance obligation (CCR §95854).
          </p>
        </div>
      )}

      {/* Surrender schedule */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 pt-4 pb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Surrender Schedule
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-2 text-xs font-medium text-gray-400 w-1/3"></th>
                <th className="text-right px-3 py-2 text-xs font-medium text-gray-400">
                  Tons Due
                </th>
                <th className="text-right px-3 py-2 text-xs font-medium text-gray-400">
                  Est. Cost
                </th>
              </tr>
            </thead>
            <tbody>
              <SurrenderRow
                label="Year 1 (30%)"
                tons={results.surrenderSchedule.year1.tons}
                cost={results.surrenderSchedule.year1.cost}
              />
              <SurrenderRow
                label="Year 2 (30%)"
                tons={results.surrenderSchedule.year2.tons}
                cost={results.surrenderSchedule.year2.cost}
              />
              <SurrenderRow
                label="Year 3 (40%)"
                tons={results.surrenderSchedule.year3.tons}
                cost={results.surrenderSchedule.year3.cost}
              />
            </tbody>
          </table>
        </div>
        <p className="px-5 py-3 text-xs text-gray-400 border-t border-gray-100">
          Surrender schedule per CCR Title 17, Section 95856. Year 3 clears the remainder.
        </p>
      </div>

      {/* Excess offsets notice */}
      {results.excessOffsets > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <p className="text-sm text-yellow-900">
            You hold{' '}
            <span className="font-semibold">
              {formatCarbNumber(Math.round(results.excessOffsets))} offsets
            </span>{' '}
            beyond your CARB eligibility limit. These may have voluntary market value.
          </p>
          <a
            href="/"
            className="inline-block mt-2 text-xs font-medium text-green-800 hover:text-green-600 transition-colors"
          >
            Estimate voluntary market value →
          </a>
        </div>
      )}

      {/* 10-year projection chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
          10-Year Compliance Cost Projection
        </p>
        <ComplianceProjectionChart data={results.projection} />
      </div>
    </div>
  )
}
