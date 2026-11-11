import {
  SEQUESTRATION_RATES, ADDITIONALITY_LEVELS, VERIFICATION_COST, PRICE_PER_TON, CO_BENEFITS,
  COMET_PRACTICES, COMET_PRACTICE_ORDER, COMET_CITATION, CARB_UNMODELED_RISKS,
  INTEGRITY_POINTS, INTEGRITY_THRESHOLDS, SENSITIVITY_SAMPLE_REGIONS,
} from '../lib/constants'
import { carbUnmodeledBuffer, formatPercent } from '../lib/carbonModel'
import {
  COVERAGE_THRESHOLD,
  VOLUNTARY_THRESHOLD,
  YEAR1_SURRENDER_PCT,
  YEAR2_SURRENDER_PCT,
  YEAR3_SURRENDER_PCT,
  OFFSET_ELIGIBILITY_LIMIT,
  DEFAULT_ALLOWANCE_PRICE,
  DEFAULT_OFFSET_PRICE,
  ANNUAL_CAP_DECLINE,
  ANNUAL_PRICE_FLOOR_INCREASE,
} from '../lib/carbConstants'

const CARB_CATEGORY_LABELS: Record<string, string> = {
  financialFailure: 'Financial failure (Table D.2)',
  illegalRemoval: 'Illegal forest biomass removal (Table D.3)',
  conversion: 'Conversion to alternative land use (Table D.4)',
  overHarvesting: 'Over-harvesting (Table D.5)',
  social: 'Social risk (Table D.6)',
  otherCatastrophic: 'Other episodic catastrophic events (Table D.9)',
}

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
            used in CarbonVal's carbon credit valuation model. Values are drawn from
            IPCC guidelines, peer-reviewed research, USDA COMET-Planner, the CARB U.S. Forest
            Projects Protocol, and U.S. government sources.
            This tool produces educational estimates only — actual carbon project
            values require third-party verification by an accredited registry
            (Verra, Gold Standard, or ACR).
          </p>
        </div>

        {/* Section 1 — Calculation chain */}
        <Section number="1" title="Calculation Chain">
          <p>
            All calculation logic lives in{' '}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-gray-800">
              src/lib/carbonModel.ts
            </code>{' '}
            as pure functions with no side effects. Location-dependent inputs (ecoregion risk,
            county, COMET-Planner row) are resolved from the dropped pin before the calculation runs.
          </p>
          <div className="bg-gray-900 rounded-xl p-5 font-mono text-xs text-green-300 space-y-1 overflow-x-auto">
            <p><span className="text-gray-500">// Step 1 — Gross annual sequestration</span></p>
            <p>forest / other: gross = acres {'×'} 0.4047 {'×'} SEQUESTRATION_RATE[landType]</p>
            <p>cropland:       gross = acres {'×'} COMET[county, practice, irrigation]  (0 if no practice)</p>
            <p className="pt-1"><span className="text-gray-500">// Step 2 — Reversal risk (forest only)</span></p>
            <p>permanence = perm30[ecoregion, P25 or median] {'×'} (1 {'−'} CARB unmodeled buffer)</p>
            <p className="pt-1"><span className="text-gray-500">// Step 3 — Additionality</span></p>
            <p>adjustedAnnual = gross {'×'} permanence {'×'} additionality</p>
            <p className="pt-1"><span className="text-gray-500">// Step 4 — Total credits, price, verification cost</span></p>
            <p>totalCredits = adjustedAnnual {'×'} projectYears</p>
            <p>netValue = totalCredits {'×'} pricePerTon {'×'} coBenefit[landType] {'×'} (1 {'−'} verificationCost)</p>
          </div>
          <p>
            Estimates are for screening and decision support only — not for registering or
            selling credits.
          </p>
        </Section>

        {/* Section 2 — Sequestration rates */}
        <Section number="2" title="Sequestration Rates (Forest and Other Land)">
          <p>
            Forest, shrubland, grassland, wetland and other rates are Tier 1 default values from the{' '}
            <Citation href="https://www.ipcc-nggip.iges.or.jp/public/2006gl/vol4.html">
              IPCC 2006 Guidelines for National Greenhouse Gas Inventories, Volume 4
            </Citation>
            , selected for temperate North American conditions. These are point estimates from
            ranges that vary by climate zone, species composition, soil type, and stand age.{' '}
            <span className="font-semibold text-gray-900">
              Forest growth rates are still IPCC Tier 1 defaults and are coarse at the parcel scale.
            </span>{' '}
            Cropland no longer uses an IPCC rate; see Section 3.
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
                <TableRow landType="Wetland" rate={SEQUESTRATION_RATES.wetland} zone="Temperate inland" source="Vol. 4, Ch. 7, Sec. 7.2" />
                <TableRow landType="Other" rate={SEQUESTRATION_RATES.other} zone="Conservative default" source="Vol. 4, Ch. 9" />
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            1 acre = 0.4047 hectares.
          </p>
        </Section>

        {/* Section 3 — Cropland */}
        <Section number="3" title="Cropland: COMET-Planner">
          <p>
            Cropland estimates come from the USDA-NRCS / Colorado State University{' '}
            <Citation href="https://comet-planner.com">COMET-Planner</Citation> dataset
            (Version 4.0, Build 2), column <code className="text-xs font-mono">total_ghg_co2</code>:
            the mean total greenhouse-gas emission reduction of adopting a conservation practice, in
            metric tonnes CO₂e per acre per year. It includes soil carbon, biomass carbon, N₂O and
            on-farm fossil-fuel changes, so not every practice is purely a soil-carbon stock change.
          </p>
          <p>
            <span className="font-semibold text-gray-900">Stock-change logic.</span>{' '}
            Credits come only from a change in management. If no practice is selected, there is no
            management change, no stock change, and therefore zero additional carbon — there is no
            generic cropland sequestration rate. Without a map pin the county is unknown, so the
            tool asks for a pin instead of guessing.
          </p>
          <p>
            <span className="font-semibold text-gray-900">Practices and variants.</span>{' '}
            COMET-Planner models several implementation variants per practice. CarbonVal does not
            average them; it uses one exact variant per practice, chosen by the irrigation toggle
            (default non-irrigated):
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="pb-2 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">CPS</th>
                  <th className="pb-2 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Practice</th>
                  <th className="pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">COMET-Planner implementation ({'{'}irrigation{'}'} = Irrigated / Non-Irrigated)</th>
                </tr>
              </thead>
              <tbody>
                {COMET_PRACTICE_ORDER.map(num => (
                  <tr key={num} className="border-t border-gray-100">
                    <td className="py-2 pr-4 font-mono text-xs text-green-900">{num}</td>
                    <td className="py-2 pr-4 font-medium text-gray-900">{COMET_PRACTICES[num].label}</td>
                    <td className="py-2 text-gray-500 text-xs">{COMET_PRACTICES[num].implementation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            <span className="font-semibold text-gray-900">Geography.</span>{' '}
            The pin is matched to a county with the FCC Area API. COMET-Planner reports values for
            USDA Major Land Resource Areas rectified to county boundaries, and each county carries one
            value. Counties and MLRAs do not coincide exactly, so a county value may not represent every
            part of a county that spans several MLRAs. Where an MLRA had too few samples, COMET-Planner
            substitutes the Land Resource Region value. Values marked −999 (“not estimated”) are shown
            as data unavailable.
          </p>
          <p className="text-xs text-gray-500">Citation (as requested by COMET-Planner): {COMET_CITATION}</p>
        </Section>

        {/* Section 4 — Reversal risk */}
        <Section number="4" title="Reversal Risk (Forest)">
          <p>
            Forest permanence uses fire, drought and insect risk maps from{' '}
            <Citation href="https://doi.org/10.1111/ele.14018">Anderegg et al. (2022)</Citation>,
            published by <Citation href="https://carbonplan.org/research/forest-risks">CarbonPlan</Citation>{' '}
            at 4 km resolution. For every EPA Level III ecoregion, CarbonVal uses the forested grid
            cells (cells where the published layers have data) and the SSP2-4.5 scenario averaged over
            the 2020s through 2050s:
          </p>
          <div className="bg-gray-900 rounded-xl p-5 font-mono text-xs text-green-300 space-y-1 overflow-x-auto">
            <p>fire            = projected annual fire probability  <span className="text-gray-500">// never baseline-subtracted</span></p>
            <p>drought_excess  = max(0, projected {'−'} 1980s)</p>
            <p>insects_excess  = max(0, projected {'−'} 1980s)</p>
            <p>combined_annual = 1 {'−'} (1 {'−'} fire)(1 {'−'} max(drought_excess, insects_excess))</p>
            <p>perm30          = (1 {'−'} combined_annual)^30</p>
          </div>
          <p>
            Drought and insect layers model total mortality, while IPCC Tier 1 net growth rates are
            already net of normal background mortality. Subtracting the 1980s level for drought and
            insects (only) avoids counting background mortality twice. Fire at historical rates is real
            reversal risk, so fire is used in full. Drought and insect mortality overlap (insects often
            attack drought-stressed trees), so the two are combined with max() rather than as independent
            risks; Section 14 shows the independence case.
          </p>
          <p>
            <span className="font-semibold text-gray-900">Unmodeled risks (CARB buffer).</span>{' '}
            The dataset omits wind, ice, harvest, financial and other reversals. For these, CarbonVal uses
            the{' '}
            <Citation href="https://ww2.arb.ca.gov/sites/default/files/cap-and-trade/protocols/usforest/forestprotocol2015.pdf">
              CARB Compliance Offset Protocol, U.S. Forest Projects (adopted June 25, 2015), Appendix D, Table D.10
            </Citation>
            . CARB's Wildfire and Disease/Insect categories are replaced by the regional data; the remaining
            categories are combined multiplicatively, as in CARB's own formula:
            buffer = 1 {'−'} {'∏'}(1 {'−'} risk).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="pb-2 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">CARB category</th>
                  <th className="pb-2 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Unprotected (no QCE)</th>
                  <th className="pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Protected (QCE / public / tribal)</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(CARB_UNMODELED_RISKS.unprotected).map(k => (
                  <tr key={k} className="border-t border-gray-100">
                    <td className="py-2 pr-4 text-gray-700">{CARB_CATEGORY_LABELS[k] ?? k}</td>
                    <td className="py-2 pr-4 font-mono text-green-900">{formatPercent(CARB_UNMODELED_RISKS.unprotected[k], 0)}</td>
                    <td className="py-2 font-mono text-green-900">{formatPercent(CARB_UNMODELED_RISKS.protected[k], 0)}</td>
                  </tr>
                ))}
                <tr className="border-t border-gray-100 text-gray-400">
                  <td className="py-2 pr-4">Wildfire, Disease/Insects</td>
                  <td className="py-2 pr-4" colSpan={2}>Replaced by Anderegg et al. regional data</td>
                </tr>
                <tr className="border-t border-gray-200 font-semibold">
                  <td className="py-2 pr-4 text-gray-900">Unmodeled buffer</td>
                  <td className="py-2 pr-4 font-mono text-green-900">{formatPercent(carbUnmodeledBuffer('unprotected'), 2)}</td>
                  <td className="py-2 font-mono text-green-900">{formatPercent(carbUnmodeledBuffer('protected'), 2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 font-mono text-sm">
            permanence = perm30_regional {'×'} (1 {'−'} unmodeled buffer)
          </div>
          <p>
            <span className="font-semibold text-gray-900">Enrollment risk toggle.</span>{' '}
            Parcels at higher risk may be more likely to enroll (adverse selection). With the toggle ON
            (default) CarbonVal uses the 25th percentile of perm30 across the ecoregion's forested cells,
            i.e. the 75th percentile of risk; with it OFF it uses the median. Locations outside forest-risk
            coverage show “No regional risk data for this location” instead of a flat discount.
          </p>
          <p>
            <span className="font-semibold text-gray-900">Context from other registries.</span>{' '}
            Verra's{' '}
            <Citation href="https://verra.org/wp-content/uploads/2023/10/AFOLU-Non-Permanence-Risk-Tool-v4.2-FINAL.pdf">
              AFOLU Non-Permanence Risk Tool v4.2
            </Citation>{' '}
            sets a minimum risk rating of 12 regardless of the calculated score. The{' '}
            <Citation href="https://acrcarbon.org/wp-content/uploads/2016/01/ACR-Risk-Tool-v2.0-2024-11-19.pdf">
              ACR Reversal Risk Tool v2.0
            </Citation>{' '}
            also combines risk categories multiplicatively. CarbonVal follows CARB's structure and does not
            apply a separate floor.
          </p>
          <p>
            Reversal risk is modeled for forest land types only. For cropland and other land types
            no reversal discount is applied, and the results panel says so.
          </p>
        </Section>

        {/* Section 5 — Integrity badge */}
        <Section number="5" title="Integrity-Risk Badge">
          <p>
            The Low / Medium / High badge next to the result is a CarbonVal screening heuristic. It is not
            a rating from any ratings agency and does not follow any agency's method. It adds points for
            factors that make an estimate less likely to hold up:
          </p>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-1 text-sm">
            <p>Additionality level: conservative +{INTEGRITY_POINTS.additionality.conservative}, moderate +{INTEGRITY_POINTS.additionality.moderate}, high +{INTEGRITY_POINTS.additionality.high} (claiming more credit with less evidence)</p>
            <p>Protection status: protected +{INTEGRITY_POINTS.protection.protected}, unprotected +{INTEGRITY_POINTS.protection.unprotected}</p>
            <p>Regional risk percentile (ecoregion median vs. all CONUS forest cells): below 50th +{INTEGRITY_POINTS.regionalRisk.below50}, 50th–74th +{INTEGRITY_POINTS.regionalRisk.from50}, 75th and above +{INTEGRITY_POINTS.regionalRisk.from75}, not available (non-forest or no data) +{INTEGRITY_POINTS.regionalRisk.unknown}</p>
            <p>Land cover overridden (chosen type differs from the satellite-detected type): +{INTEGRITY_POINTS.landCoverOverride}</p>
            <p className="pt-2 border-t border-gray-200 font-medium">
              {INTEGRITY_THRESHOLDS.map(t => `${t.level[0].toUpperCase()}${t.level.slice(1)}: score ≥ ${t.minScore}`).join(' · ')}
            </p>
          </div>
        </Section>

        {/* Section 6 — Additionality */}
        <Section number="6" title="Additionality Factor">
          <p>
            Additionality is the principle that carbon credits should only represent
            sequestration that would not have occurred without the carbon project —
            i.e., the project must go beyond "business as usual." CarbonVal allows
            users to select one of three additionality levels, calibrated to{' '}
            <Citation href="https://verra.org/methodologies/vm0007-redd-methodology-framework-redd-mf-v1-6/">
              Verra VM0007 (REDD Methodology Framework)
            </Citation>{' '}
            additionality scoring guidance:
          </p>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3 text-sm">
            <div>
              <p className="font-medium text-gray-900">
                Conservative — {ADDITIONALITY_LEVELS.conservative}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">
                Land likely to be developed or converted without this project. High
                counterfactual threat; credits reflect only the most defensible
                additionality claim.
              </p>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <p className="font-medium text-gray-900">
                Moderate — {ADDITIONALITY_LEVELS.moderate} (default)
              </p>
              <p className="text-gray-500 text-xs mt-0.5">
                Some development pressure — the IPCC Tier 1 conservative default.
                Approximately 25% of gross sequestration is assumed to occur
                regardless of the project.
              </p>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <p className="font-medium text-gray-900">
                High — {ADDITIONALITY_LEVELS.high}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">
                Land already informally protected or facing low conversion risk.
                Only 10% of gross sequestration is assumed to be non-additional.
                Appropriate for parcels with existing conservation agreements or
                documented low development pressure.
              </p>
            </div>
          </div>
          <p>
            These levels are not a substitute for formal additionality demonstration.
            Real carbon projects require project-specific counterfactual land use
            analysis, threat mapping, and legal review. Selecting a higher
            additionality level without site-specific evidence will overstate credit
            value. This is the single largest source of uncertainty in the model.
          </p>
        </Section>

        {/* Section 7 — Price scenarios */}
        <Section number="7" title="Market Price Scenarios">
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

        {/* Section 8 — Co-benefits */}
        <Section number="8" title="Co-Benefit Price Multipliers">
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

        {/* Section 9 — Verification cost */}
        <Section number="9" title="Verification and Registry Cost">
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

        {/* Section 10 — Car equivalent */}
        <Section number="10" title="Car Equivalent Statistic">
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

        {/* Section 11 — Satellite Land Cover Detection */}
        <Section number="11" title="Satellite Land Cover Detection">
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

        {/* Section 12 — Changes based on expert review */}
        <Section number="12" title="Changes Based on Expert Review">
          <p>Version 5 of the methodology was revised after outside expert review. The main changes:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><span className="font-semibold text-gray-900">Flat 18% permanence discount removed.</span> It had no regional basis. Forest permanence now comes from ecoregion-level fire, drought and insect risk plus CARB's buffer for risks the data does not cover.</li>
            <li><span className="font-semibold text-gray-900">Background mortality no longer double-counted.</span> IPCC growth rates are already net of normal mortality, so drought and insect risk use only the excess above the 1980s; fire is kept in full because historical fire is real reversal risk.</li>
            <li><span className="font-semibold text-gray-900">Drought and insects combined with max().</span> The two overlap, so treating them as independent would overstate risk.</li>
            <li><span className="font-semibold text-gray-900">CARB structure instead of an ad-hoc floor.</span> The unmodeled buffer uses CARB's adopted 2015 protocol values (not the 2014 proposed-rulemaking values, which differed for social risk).</li>
            <li><span className="font-semibold text-gray-900">Enrollment-risk (adverse selection) toggle added,</span> defaulting to the more conservative 75th percentile of risk.</li>
            <li><span className="font-semibold text-gray-900">Generic cropland rate removed.</span> The IPCC 0.3 fallback credited carbon without any management change. Cropland now requires a specific practice and uses COMET-Planner county values for the exact practice and irrigation variant, without averaging variants.</li>
            <li><span className="font-semibold text-gray-900">Integrity-risk badge and screening caveats added</span> so results are not read as registry-ready credit estimates.</li>
          </ul>
        </Section>

        {/* Section 13 — Known Limitations */}
        <Section number="13" title="Known Limitations">
          <p>
            <span className="font-semibold text-gray-900">Forest growth rates are still Tier 1.</span>{' '}
            Forest sequestration uses IPCC Tier 1 defaults, which are coarse at the parcel scale and do
            not reflect species, stand age, site index or management.
          </p>
          <p>
            <span className="font-semibold text-gray-900">1980s baseline.</span>{' '}
            Treating the 1980s drought and insect level as background mortality may also remove some real
            episodic risk that occurred in that decade.
          </p>
          <p>
            <span className="font-semibold text-gray-900">Full exposure assumption.</span>{' '}
            (1 {'−'} p)^30 assumes all stored carbon is exposed to risk for the full 30 years. Credits
            issued late in a project are exposed for less time, so this is conservative for them; it also
            ignores partial (non-stand-replacing) losses and recovery.
          </p>
          <p>
            <span className="font-semibold text-gray-900">Omitted hazards.</span>{' '}
            The Anderegg et al. dataset omits wind, ice and harvest. The CARB unmodeled buffer
            approximates these, but it is a protocol default, not a regional estimate.
          </p>
          <p>
            <span className="font-semibold text-gray-900">Ecoregion-level risk.</span>{' '}
            Each parcel receives its ecoregion's distribution, not the risk of its own 4 km cell.
            Ecoregion polygons are simplified (~4 km), so pins near a boundary may be assigned to the
            neighboring ecoregion.
          </p>
          <p>
            <span className="font-semibold text-gray-900">Cropland.</span>{' '}
            County values stand in for MLRA values; soil-carbon reversal (e.g. returning to tillage) is not modeled.
          </p>
          <p>
            <span className="font-semibold text-gray-900">Simplified additionality.</span>{' '}
            The three additionality levels (0.60 / 0.75 / 0.90) are coarse proxies and remain the single
            largest source of uncertainty in the model.
          </p>
          <p>
            <span className="font-semibold text-gray-900">Static pricing and single-pixel land cover.</span>{' '}
            Prices are fixed 2023–2024 reference points, and NLCD land cover is read from one 30 m pixel.
            Coverage is the contiguous United States only.
          </p>
        </Section>

        {/* Section 14 — Sensitivity */}
        <Section number="14" title="Sensitivity: Combining Method">
          <p>
            Median 30-year regional permanence (perm30, before the CARB buffer) using max() combining
            versus treating fire, drought and insects as fully independent risks:
            1 {'−'} (1 {'−'} fire)(1 {'−'} drought_excess)(1 {'−'} insects_excess).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="pb-2 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Region (EPA L3)</th>
                  <th className="pb-2 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">max() (used)</th>
                  <th className="pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Full independence</th>
                </tr>
              </thead>
              <tbody>
                {SENSITIVITY_SAMPLE_REGIONS.map(r => (
                  <tr key={r.name} className="border-t border-gray-100">
                    <td className="py-2 pr-4 text-gray-900">{r.name} ({r.codes.join(' + ')})</td>
                    <td className="py-2 pr-4 font-mono text-green-900">{formatPercent(r.maxCombining)}</td>
                    <td className="py-2 font-mono text-green-900">{formatPercent(r.independent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            The difference matters only where both drought and insect mortality rise above their 1980s
            levels (here, the Sierra Nevada).
          </p>
        </Section>

        {/* Section 15 — CARB Compliance Module */}
        <Section number="15" title="CARB Compliance Module">
          <p>
            The CARB compliance module estimates compliance exposure for California-covered
            entities under the{' '}
            <Citation href="https://ww2.arb.ca.gov/our-work/programs/cap-and-trade-program">
              California Cap-and-Invest Program
            </Citation>{' '}
            (formerly Cap-and-Trade, renamed and extended through 2045 by{' '}
            <Citation href="https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202520260AB1207">
              AB 1207
            </Citation>
            , signed September 2025). All constants are derived from{' '}
            <Citation href="https://govt.westlaw.com/calregs/Browse/Home/California/CaliforniaCodeofRegulations?guid=I5D9EA7206A0611E0A17A8FDBA8EB1FA0&originationContext=documenttoc&transitionType=Default&contextData=(sc.Default)">
              CCR Title 17, California Code of Regulations
            </Citation>
            .
          </p>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-2 text-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Coverage Thresholds — CCR §95812</p>
            <div className="flex justify-between">
              <span className="text-gray-600">Mandatory coverage threshold</span>
              <span className="font-mono font-medium text-gray-900">{COVERAGE_THRESHOLD.toLocaleString()} tCO₂e/yr</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2">
              <span className="text-gray-600">Voluntary participation threshold</span>
              <span className="font-mono font-medium text-gray-900">{VOLUNTARY_THRESHOLD.toLocaleString()} tCO₂e/yr</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-2 text-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Surrender Schedule — CCR §95856</p>
            <div className="flex justify-between">
              <span className="text-gray-600">Year 1 surrender</span>
              <span className="font-mono font-medium text-gray-900">{(YEAR1_SURRENDER_PCT * 100).toFixed(0)}% of compliance obligation</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2">
              <span className="text-gray-600">Year 2 surrender</span>
              <span className="font-mono font-medium text-gray-900">{(YEAR2_SURRENDER_PCT * 100).toFixed(0)}% of compliance obligation</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2">
              <span className="text-gray-600">Year 3 surrender (remainder)</span>
              <span className="font-mono font-medium text-gray-900">{(YEAR3_SURRENDER_PCT * 100).toFixed(0)}% of compliance obligation</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-2 text-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Offset Eligibility — CCR §95854 (as amended by AB 1207)</p>
            <div className="flex justify-between">
              <span className="text-gray-600">Max offset use (% of compliance obligation, effective Jan 1, 2026)</span>
              <span className="font-mono font-medium text-gray-900">{(OFFSET_ELIGIBILITY_LIMIT * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2">
              <span className="text-gray-600">Of which must have direct environmental benefit in California</span>
              <span className="font-mono font-medium text-gray-900">50%</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-2 text-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Market Reference Prices — WCI Auction Data, 2024</p>
            <div className="flex justify-between">
              <span className="text-gray-600">Default allowance price</span>
              <span className="font-mono font-medium text-gray-900">${DEFAULT_ALLOWANCE_PRICE}/tCO₂e</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2">
              <span className="text-gray-600">Default CARB-eligible offset price</span>
              <span className="font-mono font-medium text-gray-900">${DEFAULT_OFFSET_PRICE}/tCO₂e</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-2 text-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Price Trajectory — CARB 2022 Scoping Plan; CCR §95841</p>
            <div className="flex justify-between">
              <span className="text-gray-600">Annual cap decline rate</span>
              <span className="font-mono font-medium text-gray-900">{(ANNUAL_CAP_DECLINE * 100).toFixed(0)}%/yr</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2">
              <span className="text-gray-600">Annual price floor increase</span>
              <span className="font-mono font-medium text-gray-900">{(ANNUAL_PRICE_FLOOR_INCREASE * 100).toFixed(0)}%/yr</span>
            </div>
          </div>
          <p>
            The compliance cost projection uses compound growth on the price floor rate
            to model likely minimum price escalation over 10 years. The "optimistic"
            scenario assumes 50% of the net obligation is covered by banked allowances or
            early auction purchases. The "base" scenario compounds the price floor twice
            (once for current price, once for future price) and represents the upper range
            of likely cost under continued price floor escalation. These are not forecasts —
            actual WCI auction prices depend on cap stringency, economic conditions, and
            political factors.
          </p>
          <p>
            <span className="font-semibold text-gray-900">Known limitations.</span>{' '}
            Free allocation percentages are entered by the user and not validated against
            CARB's sector-specific allocation formulas, which depend on production output,
            efficiency benchmarks, and assistance factors. The model does not account for
            early action allowances, auction purchase limits, price containment reserve
            triggers, banking/borrowing rules, or the AB 1207 requirement that 50% of
            offsets used carry direct environmental benefits in California. All results are
            educational estimates only.
          </p>
        </Section>

        {/* Section 16 — Data credits */}
        <Section number="16" title="Data Credits">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Forest reversal-risk data: Anderegg, W.R.L., Chegwidden, O.S., Badgley, G., Trugman, A.T.,
              Cullenward, D., Abatzoglou, J.T., Hicke, J.A., Freeman, J., Hamman, J.J. (2022). Future
              climate risks from stress, insects and fire across US forests. <em>Ecology Letters</em> 25(6), 1510–1520.{' '}
              <Citation href="https://doi.org/10.1111/ele.14018">doi:10.1111/ele.14018</Citation>. Data
              published by <Citation href="https://github.com/carbonplan/forest-risks">CarbonPlan</Citation>{' '}
              under CC-BY-4.0; CarbonVal derived per-ecoregion statistics from it.
            </li>
            <li>Cropland: {COMET_CITATION}</li>
            <li>
              CARB. Compliance Offset Protocol, U.S. Forest Projects. Adopted June 25, 2015.{' '}
              <Citation href="https://ww2.arb.ca.gov/sites/default/files/cap-and-trade/protocols/usforest/forestprotocol2015.pdf">PDF</Citation>.
            </li>
            <li>
              U.S. EPA. Level III Ecoregions of the Continental United States.{' '}
              <Citation href="https://www.epa.gov/eco-research/level-iii-and-iv-ecoregions-continental-united-states">epa.gov</Citation>.
            </li>
            <li>County lookup: FCC Area API (Census block / county FIPS).</li>
          </ul>
          <p className="text-xs text-gray-500">Full provenance, versions and download dates are recorded in data/SOURCES.md in the repository.</p>
        </Section>

        {/* Section 17 — Full references */}
        <Section number="17" title="Full References">
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
              {
                id: 9,
                text: 'Anderegg, W.R.L., Chegwidden, O.S., Badgley, G., Trugman, A.T., Cullenward, D., Abatzoglou, J.T., Hicke, J.A., Freeman, J., Hamman, J.J. Future climate risks from stress, insects and fire across US forests. Ecology Letters, 25(6), 1510–1520, 2022.',
                href: 'https://doi.org/10.1111/ele.14018',
              },
              {
                id: 10,
                text: COMET_CITATION,
                href: 'https://comet-planner.com',
              },
              {
                id: 11,
                text: 'California Air Resources Board. Compliance Offset Protocol, U.S. Forest Projects. Adopted June 25, 2015.',
                href: 'https://ww2.arb.ca.gov/sites/default/files/cap-and-trade/protocols/usforest/forestprotocol2015.pdf',
              },
              {
                id: 12,
                text: 'Verra. AFOLU Non-Permanence Risk Tool, v4.2. 2023.',
                href: 'https://verra.org/wp-content/uploads/2023/10/AFOLU-Non-Permanence-Risk-Tool-v4.2-FINAL.pdf',
              },
              {
                id: 13,
                text: 'ACR. Reversal Risk Tool, v2.0. November 2024.',
                href: 'https://acrcarbon.org/wp-content/uploads/2016/01/ACR-Risk-Tool-v2.0-2024-11-19.pdf',
              },
              {
                id: 14,
                text: 'U.S. EPA. Level III Ecoregions of the Continental United States.',
                href: 'https://www.epa.gov/eco-research/level-iii-and-iv-ecoregions-continental-united-states',
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
