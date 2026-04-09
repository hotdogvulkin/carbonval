import { SEQUESTRATION_RATES, PERMANENCE_FACTORS, ADDITIONALITY_FACTOR, VERIFICATION_COST, PRICE_PER_TON, CO_BENEFITS } from '../lib/constants'

interface CitationProps {
  children: React.ReactNode
  href: string
}

function Citation({ children, href }: CitationProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-green-800 underline underline-offset-2 hover:text-green-600 transition-colors"
    >
      {children}
    </a>
  )
}

interface SectionProps {
  number: string
  title: string
  children: React.ReactNode
}

function Section({ number, title, children }: SectionProps) {
  return (
    <section className="border-t border-gray-200 pt-8 mt-8">
      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-xs font-mono text-gray-400">{number}</span>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
        {children}
      </div>
    </section>
  )
}

interface TableRowProps {
  landType: string
  rate: number
  zone: string
  source: string
}

function TableRow({ landType, rate, zone, source }: TableRowProps) {
  return (
    <tr className="border-t border-gray-100">
      <td className="py-2 pr-4 font-medium text-gray-900">{landType}</td>
      <td className="py-2 pr-4 font-mono text-green-900">{rate.toFixed(1)}</td>
      <td className="py-2 pr-4 text-gray-500">{zone}</td>
      <td className="py-2 text-gray-400 text-xs">{source}</td>
    </tr>
  )
}

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

        {/* Title block */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-3">
            Methodology
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            This page documents every coefficient, adjustment factor, and data source
            used in CarbonVal's carbon credit valuation model. All values are drawn
            from peer-reviewed IPCC guidelines or U.S. government sources.
            This tool produces educational estimates only — actual carbon project
            values require third-party verification by an accredited registry
            (Verra, Gold Standard, or ACR).
          </p>
        </div>

        {/* Section 1 — Calculation chain */}
        <Section number="1" title="Calculation Chain">
          <p>
            CarbonVal follows a six-step calculation chain. All logic lives in{' '}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-gray-800">
              src/lib/carbonModel.ts
            </code>{' '}
            as pure functions with no side effects.
          </p>
          <div className="bg-gray-900 rounded-xl p-5 font-mono text-xs text-green-300 space-y-1 overflow-x-auto">
            <p><span className="text-gray-500">// Step 1 — Unit conversion</span></p>
            <p>hectares = acres {'\u00D7'} 0.4047</p>
            <p className="pt-1"><span className="text-gray-500">// Step 2 — Gross sequestration</span></p>
            <p>annualSequestration = hectares {'\u00D7'} SEQUESTRATION_RATE[landType]</p>
            <p className="pt-1"><span className="text-gray-500">// Step 3 — Apply permanence and additionality</span></p>
            <p>adjustedAnnual = annualSequestration {'\u00D7'} permanence {'\u00D7'} additionality</p>
            <p className="pt-1"><span className="text-gray-500">// Step 4 — Total credits over project lifetime</span></p>
            <p>totalCredits = adjustedAnnual {'\u00D7'} projectYears</p>
            <p className="pt-1"><span className="text-gray-500">// Step 5 — Apply price and co-benefit premium</span></p>
            <p>grossValue = totalCredits {'\u00D7'} pricePerTon {'\u00D7'} coBenefit[landType]</p>
            <p className="pt-1"><span className="text-gray-500">// Step 6 — Deduct verification cost</span></p>
            <p>netValue = grossValue {'\u00D7'} (1 {'\u2212'} verificationCost)</p>
          </div>
        </Section>

        {/* Section 2 — Sequestration rates */}
        <Section number="2" title="Sequestration Rates">
          <p>
            Sequestration rates represent Tier 1 default values from the{' '}
            <Citation href="https://www.ipcc-nggip.iges.or.jp/public/2006gl/vol4.html">
              IPCC 2006 Guidelines for National Greenhouse Gas Inventories, Volume 4
            </Citation>
            , selected for temperate North American conditions. Forest rates are
            derived from Chapter 4 (Table 4.9, mean annual increment for temperate
            continental zones). Grassland and cropland rates are derived from
            Chapters 6 and 5 respectively, using Tier 1 soil carbon stock change
            factors. Wetland rates reflect Chapter 7 guidance for managed inland
            wetlands. These are point estimates from ranges that vary by climate
            zone, species composition, soil type, and stand age. Users requiring
            project-level precision should use country- or region-specific Tier 2
            data.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="pb-2 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Land Type</th>
                  <th className="pb-2 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">tCO₂/ha/yr</th>
                  <th className="pb-2 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Climate Zone</th>
                  <th className="pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">IPCC Source</th>
                </tr>
              </thead>
              <tbody>
                <TableRow landType="Evergreen Forest" rate={SEQUESTRATION_RATES.evergreenForest} zone="Temperate continental" source="Vol. 4, Ch. 4, Table 4.9" />
                <TableRow landType="Deciduous Forest" rate={SEQUESTRATION_RATES.deciduousForest} zone="Temperate continental" source="Vol. 4, Ch. 4, Table 4.9" />
                <TableRow landType="Mixed Forest" rate={SEQUESTRATION_RATES.mixedForest} zone="Temperate continental" source="Vol. 4, Ch. 4, Table 4.9" />
                <TableRow landType="Shrubland" rate={SEQUESTRATION_RATES.shrubland} zone="Temperate" source="Vol. 4, Ch. 6, Sec. 6.2" />
                <TableRow landType="Grassland" rate={SEQUESTRATION_RATES.grassland} zone="Temperate, nominally managed" source="Vol. 4, Ch. 6, Table 6.2" />
                <TableRow landType="Cropland" rate={SEQUESTRATION_RATES.cropland} zone="Temperate, full-till baseline" source="Vol. 4, Ch. 5, Table 5.5" />
                <TableRow landType="Wetland" rate={SEQUESTRATION_RATES.wetland} zone="Temperate inland" source="Vol. 4, Ch. 7, Sec. 7.2" />
                <TableRow landType="Other" rate={SEQUESTRATION_RATES.other} zone="Conservative default" source="Vol. 4, Ch. 9" />
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            All rates expressed in metric tonnes of CO₂ equivalent per hectare per year (tCO₂/ha/yr).
            1 acre = 0.4047 hectares (exact conversion factor).
          </p>
        </Section>

        {/* Section 3 — Permanence */}
        <Section number="3" title="Permanence Discount">
          <p>
            Carbon credits require that sequestered carbon remain stored for the
            duration of the project period and beyond. Parcels without legal
            protection (conservation easement, fee-simple acquisition, or equivalent
            instrument) face a higher risk of reversal through development,
            harvest, or fire. CarbonVal applies a permanence factor to reflect this
            risk:
          </p>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 font-mono text-sm space-y-1">
            <p><span className="text-gray-400">Protected parcel:</span> <span className="text-green-900 font-medium">{PERMANENCE_FACTORS.protected.toFixed(2)} (no discount)</span></p>
            <p><span className="text-gray-400">Unprotected parcel:</span> <span className="text-green-900 font-medium">{PERMANENCE_FACTORS.unprotected.toFixed(2)} (18% discount)</span></p>
          </div>
          <p>
            The 18% discount for unprotected land is consistent with buffer pool
            requirements used by the{' '}
            <Citation href="https://verra.org/programs/verified-carbon-standard/">
              Verified Carbon Standard (Verra)
            </Citation>{' '}
            and the{' '}
            <Citation href="https://americancarbonregistry.org">
              American Carbon Registry (ACR)
            </Citation>{' '}
            for unprotected forestry projects in North America, which typically
            require 10–20% of credits be held in a buffer pool against reversal risk.
          </p>
        </Section>

        {/* Section 4 — Additionality */}
        <Section number="4" title="Additionality Factor">
          <p>
            Additionality is the principle that carbon credits should only represent
            sequestration that would not have occurred without the carbon project —
            i.e., the project must go beyond "business as usual." CarbonVal applies
            a conservative fixed additionality factor:
          </p>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 font-mono text-sm">
            <p><span className="text-gray-400">Additionality factor:</span> <span className="text-green-900 font-medium">{ADDITIONALITY_FACTOR} (Tier 1 conservative default)</span></p>
          </div>
          <p>
            This value reflects the IPCC Tier 1 conservative assumption that
            approximately 25% of gross sequestration on any managed parcel would
            have occurred regardless of the carbon project, due to natural forest
            growth and existing land management practices. In V3, this will become
            a user-adjustable input based on additionality scoring per{' '}
            <Citation href="https://verra.org/methodologies/vm0007-redd-methodology-framework-redd-mf-v1-6/">
              Verra VM0007
            </Citation>
            .
          </p>
        </Section>

        {/* Section 5 — Price scenarios */}
        <Section number="5" title="Market Price Scenarios">
          <p>
            CarbonVal offers three price scenarios corresponding to distinct segments
            of the voluntary carbon market (VCM). Prices are fixed point-in-time
            estimates and do not reflect live market data. V3 will integrate a
            monthly-updated price feed from{' '}
            <Citation href="https://www.ecosystemmarketplace.com">
              Ecosystem Marketplace
            </Citation>
            .
          </p>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Conservative — compliance offset floor</span>
              <span className="font-mono font-medium text-gray-900">${PRICE_PER_TON.conservative}/tCO₂</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2">
              <span className="text-gray-600">Mid — voluntary retail average</span>
              <span className="font-mono font-medium text-gray-900">${PRICE_PER_TON.mid}/tCO₂</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2">
              <span className="text-gray-600">Premium — nature-based solutions premium</span>
              <span className="font-mono font-medium text-gray-900">${PRICE_PER_TON.premium}/tCO₂</span>
            </div>
          </div>
          <p>
            Price ranges reflect 2023–2024 VCM transaction data reported by{' '}
            <Citation href="https://www.ecosystemmarketplace.com/articles/state-of-the-voluntary-carbon-markets-2024/">
              Ecosystem Marketplace's State of the Voluntary Carbon Markets 2024
            </Citation>
            . Nature-based solutions (forests, wetlands) consistently command
            premiums over industrial or cookstove offset projects due to biodiversity
            and community co-benefits.
          </p>
        </Section>

        {/* Section 6 — Co-benefits */}
        <Section number="6" title="Co-Benefit Price Multipliers">
          <p>
            Different land types generate different levels of biodiversity,
            water quality, and community co-benefits alongside carbon sequestration.
            Markets consistently price these co-benefits into credit values. CarbonVal
            applies a multiplicative premium to the base price per ton for each land type:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="pb-2 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Land Type</th>
                  <th className="pb-2 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Multiplier</th>
                  <th className="pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Rationale</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { type: 'Wetland', mult: CO_BENEFITS.wetland, note: 'Highest — biodiversity, water filtration, flood control' },
                  { type: 'Evergreen Forest', mult: CO_BENEFITS.evergreenForest, note: 'High — habitat, watershed protection' },
                  { type: 'Deciduous Forest', mult: CO_BENEFITS.deciduousForest, note: 'High — habitat, watershed protection' },
                  { type: 'Mixed Forest', mult: CO_BENEFITS.mixedForest, note: 'Moderate-high — diverse habitat' },
                  { type: 'Shrubland', mult: CO_BENEFITS.shrubland, note: 'Moderate — pollinator habitat' },
                  { type: 'Grassland', mult: CO_BENEFITS.grassland, note: 'Low-moderate — grazing, pollinator habitat' },
                  { type: 'Cropland', mult: CO_BENEFITS.cropland, note: 'None — limited co-benefits' },
                  { type: 'Other', mult: CO_BENEFITS.other, note: 'None — unclassified' },
                ].map(row => (
                  <tr key={row.type} className="border-t border-gray-100">
                    <td className="py-2 pr-4 font-medium text-gray-900">{row.type}</td>
                    <td className="py-2 pr-4 font-mono text-green-900">{row.mult.toFixed(2)}x</td>
                    <td className="py-2 text-gray-500 text-xs">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Multipliers are calibrated to observed VCM price differentials reported
            in{' '}
            <Citation href="https://www.ecosystemmarketplace.com">
              Ecosystem Marketplace
            </Citation>{' '}
            transaction data. Wetlands receive the highest multiplier (1.20x)
            consistent with their disproportionate ecosystem service value documented
            in{' '}
            <Citation href="https://www.ipcc.ch/report/ar6/wg2/">
              IPCC AR6 Working Group II, Chapter 2
            </Citation>
            .
          </p>
        </Section>

        {/* Section 7 — Verification cost */}
        <Section number="7" title="Verification and Registry Cost">
          <p>
            Carbon credits must be verified by an accredited third-party auditor
            and registered on a recognized registry before they can be sold.
            CarbonVal deducts a flat{' '}
            <span className="font-semibold text-gray-900">
              {(VERIFICATION_COST * 100).toFixed(0)}% verification cost
            </span>{' '}
            from gross value to estimate net revenue to the landowner.
          </p>
          <p>
            This reflects the combined cost of third-party verification audits,
            registry issuance fees, and project developer margins typical of
            North American forestry projects on the{' '}
            <Citation href="https://verra.org">Verra</Citation>,{' '}
            <Citation href="https://americancarbonregistry.org">ACR</Citation>, and{' '}
            <Citation href="https://www.climateactionreserve.org">
              Climate Action Reserve (CAR)
            </Citation>{' '}
            registries. Actual costs vary significantly by project size, methodology,
            and developer; small projects ({'\u003c'}500 acres) typically face
            higher per-unit costs due to fixed audit expenses.
          </p>
        </Section>

        {/* Section 8 — Car equivalent */}
        <Section number="8" title="Car Equivalent Statistic">
          <p>
            The car equivalent statistic converts total carbon credits into an
            intuitive real-world comparison:
          </p>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 font-mono text-sm">
            <p>carEquivalent = round(totalCredits {'\u00F7'} 4.6)</p>
          </div>
          <p>
            The 4.6 metric tonnes CO₂ per vehicle per year figure is sourced
            directly from the{' '}
            <Citation href="https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle">
              U.S. EPA — Greenhouse Gas Emissions from a Typical Passenger Vehicle
            </Citation>{' '}
            (EPA-420-F-23-014, June 2023). It assumes a vehicle averaging 22.2 miles
            per gallon, driving 11,500 miles per year, burning gasoline producing
            8,887 grams CO₂ per gallon.
          </p>
        </Section>

        {/* Section 9 — Satellite Land Cover Detection */}
        <Section number="9" title="Satellite Land Cover Detection">
          <p>
            CarbonVal V2 uses the USGS National Land Cover Database (NLCD) 2021 to
            automatically classify land cover type at any US coordinate. NLCD 2021
            is produced by the Multi-Resolution Land Characteristics Consortium
            (MRLC), a partnership of federal agencies including USGS, EPA, and NASA.
            It provides land cover classification for the contiguous United States at
            30-meter spatial resolution, updated on a roughly five-year cycle.
          </p>
          <p>
            Classification is performed at runtime by querying the MRLC's public WMS
            endpoint using a GetFeatureInfo request centered on the dropped pin
            coordinate. The response returns a <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-gray-800">PALETTE_INDEX</code> value
            corresponding to one of 20 NLCD land cover classes. CarbonVal maps these
            to its eight land type categories as follows:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="pb-2 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">NLCD Class Code</th>
                  <th className="pb-2 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">NLCD Label</th>
                  <th className="pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">CarbonVal Land Type</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { code: '41', label: 'Deciduous Forest', type: 'Deciduous Forest' },
                  { code: '42', label: 'Evergreen Forest', type: 'Evergreen Forest' },
                  { code: '43', label: 'Mixed Forest', type: 'Mixed Forest' },
                  { code: '52', label: 'Shrub/Scrub', type: 'Shrubland' },
                  { code: '71', label: 'Grassland/Herbaceous', type: 'Grassland' },
                  { code: '81, 82', label: 'Pasture/Hay, Cultivated Crops', type: 'Cropland' },
                  { code: '90, 95', label: 'Woody Wetlands, Emergent Herbaceous Wetlands', type: 'Wetland' },
                  { code: '11, 12, 21–24, 31', label: 'Open Water, Ice/Snow, Developed, Barren Land', type: 'Other' },
                ].map(row => (
                  <tr key={row.code} className="border-t border-gray-100">
                    <td className="py-2 pr-4 font-mono text-xs text-green-900">{row.code}</td>
                    <td className="py-2 pr-4 text-gray-600">{row.label}</td>
                    <td className="py-2 font-medium text-gray-900">{row.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            NLCD classifies land cover at a single 30m pixel centered on the pin
            location. For heterogeneous parcels, the detected type may not represent
            the full parcel. Users should verify the detected type against local
            knowledge and override if necessary.
          </p>
          <p>
            Source:{' '}
            <Citation href="https://www.mrlc.gov">
              Multi-Resolution Land Characteristics Consortium (MRLC)
            </Citation>
            .{' '}
            Homer, C., et al. "Conterminous United States land cover change patterns
            2001–2016 from the 2016 National Land Cover Database."
            <em> ISPRS Journal of Photogrammetry and Remote Sensing</em>, 162, 2020.
          </p>
        </Section>

        {/* Section 10 — Known Limitations */}
        <Section number="10" title="Known Limitations">
          <p>
            <span className="font-semibold text-gray-900">Rate generalization.</span>{' '}
            Sequestration rates are IPCC Tier 1 global defaults. Actual rates for a
            specific parcel in New England, the Southeast, or the Pacific Northwest
            may differ materially based on species composition, stand age, soil type,
            and local climate. Users with site-specific data should treat CarbonVal
            outputs as order-of-magnitude estimates only.
          </p>
          <p>
            <span className="font-semibold text-gray-900">Fixed additionality.</span>{' '}
            The 0.75 additionality factor is a conservative fixed assumption. Real
            carbon projects require project-specific additionality demonstration,
            often involving counterfactual land use analysis, threat mapping, and
            legal review. This is the single largest source of uncertainty in the
            model.
          </p>
          <p>
            <span className="font-semibold text-gray-900">Static pricing.</span>{' '}
            Price scenarios are fixed point-in-time estimates based on 2023–2024 VCM
            data. Carbon markets are volatile — prices have ranged from under $1 to
            over $50 per tonne in the voluntary market over the past decade. V3 will
            address this with a monthly-updated price feed.
          </p>
          <p>
            <span className="font-semibold text-gray-900">Single-pixel land classification.</span>{' '}
            NLCD classification is based on a single 30m pixel at the pin location.
            Large or heterogeneous parcels may contain multiple land cover types that
            this tool does not capture. A full project would require parcel boundary
            integration and area-weighted classification.
          </p>
          <p>
            <span className="font-semibold text-gray-900">US coverage only.</span>{' '}
            NLCD is a US-specific dataset. The tool does not support international
            parcels.
          </p>
          <p>
            <span className="font-semibold text-gray-900">No permanence modeling.</span>{' '}
            CarbonVal does not model specific reversal risks such as wildfire
            probability, pest outbreak, or development pressure. The permanence
            factor is a blunt instrument. Actual registry buffer pool requirements
            vary by methodology, geography, and project risk profile.
          </p>
        </Section>

        {/* Section 11 — Full references */}
        <Section number="11" title="Full References">
          <ol className="space-y-3 list-none">
            {[
              {
                id: 1,
                text: 'Eggleston, H.S., Buendia, L., Miwa, K., Ngara, T., and Tanabe, K. (Eds.). 2006 IPCC Guidelines for National Greenhouse Gas Inventories, Volume 4: Agriculture, Forestry and Other Land Use. Institute for Global Environmental Strategies, Hayama, Japan.',
                href: 'https://www.ipcc-nggip.iges.or.jp/public/2006gl/vol4.html',
              },
              {
                id: 2,
                text: 'U.S. EPA. Greenhouse Gas Emissions from a Typical Passenger Vehicle. EPA-420-F-23-014, June 2023.',
                href: 'https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle',
              },
              {
                id: 3,
                text: 'Ecosystem Marketplace. State of the Voluntary Carbon Markets 2024. Forest Trends Association, Washington, DC.',
                href: 'https://www.ecosystemmarketplace.com/articles/state-of-the-voluntary-carbon-markets-2024/',
              },
              {
                id: 4,
                text: 'Verra. Verified Carbon Standard Program Guide, v4.1. Washington, DC: Verra, 2023.',
                href: 'https://verra.org/programs/verified-carbon-standard/',
              },
              {
                id: 5,
                text: 'American Carbon Registry. Forest Carbon Project Standard, v8.1. Winrock International, Little Rock, AR, 2023.',
                href: 'https://americancarbonregistry.org',
              },
              {
                id: 6,
                text: 'IPCC. Climate Change 2022: Impacts, Adaptation and Vulnerability. Contribution of Working Group II to the Sixth Assessment Report. Cambridge University Press, 2022.',
                href: 'https://www.ipcc.ch/report/ar6/wg2/',
              },
              {
                id: 7,
                text: 'Homer, C., Dewitz, J., Jin, S., Xian, G., Costello, C., Danielson, P., Gass, L., Funk, M., Wickham, J., Stehman, S., Auch, R., and Riitters, K. Conterminous United States land cover change patterns 2001–2016 from the 2016 National Land Cover Database. ISPRS Journal of Photogrammetry and Remote Sensing, 162, 184–199, 2020.',
                href: 'https://www.mrlc.gov',
              },
              {
                id: 8,
                text: 'Multi-Resolution Land Characteristics Consortium (MRLC). National Land Cover Database 2021. U.S. Geological Survey, 2023.',
                href: 'https://www.mrlc.gov',
              },
            ].map(ref => (
              <li key={ref.id} className="flex gap-3">
                <span className="text-xs font-mono text-gray-400 mt-0.5 shrink-0">[{ref.id}]</span>
                <span className="text-xs text-gray-600 leading-relaxed">
                  {ref.text}{' '}
                  <Citation href={ref.href}>Link</Citation>
                </span>
              </li>
            ))}
          </ol>
        </Section>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-8 mt-8">
          <p className="text-xs text-gray-400 leading-relaxed">
            CarbonVal is an independent research tool developed at Deerfield Academy.
            It is not affiliated with any carbon registry, land trust, or financial institution.
            Results are educational estimates only and do not constitute financial,
            legal, or environmental advice. All coefficient sources are cited above
            and publicly available.
          </p>
        </div>

      </main>
    </div>
  )
}
