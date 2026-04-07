export default function Methodology() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-green-900 tracking-tight">
              CarbonVal
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Carbon Credit Valuation Tool
            </p>
          </div>

          <a
            href="/"
            className="text-sm text-green-800 hover:text-green-600 font-medium transition-colors"
          >
            {'\u2190'} Calculator
          </a>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <p className="text-gray-400 text-sm">Methodology page — coming soon.</p>
      </main>
    </div>
  )
}
