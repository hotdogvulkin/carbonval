# Uncited constants: what official sources and research support

Research only. **No values were changed in this run.** Sources were checked on 2026-11-11. Paper
details (title, journal, volume, pages, DOI) were verified against Crossref. Quotes are kept short.

---

## 1. `CO_BENEFITS` (price multipliers by land type)

**Current values:** wetland 1.20 · evergreen 1.15 · deciduous 1.15 · mixed 1.12 · shrubland 1.05 ·
grassland 1.03 · cropland 1.00 · other 1.00

### Findings

1. **Ecosystem Marketplace, *State of the Voluntary Carbon Markets 2023*** (Forest Trends; covers 2022
   transactions).
   - Press release: https://www.ecosystemmarketplace.com/articles/new-state-of-the-voluntary-carbon-markets-2023-finds-vcm-demand-concentrating-around-pricier-high-integrity-credits/
   - Credits from projects with at least one co-benefit certification carried a **78% price premium**.
   - Projects linked to the SDGs were **86% higher** in price.
   - Forestry and land-use average prices rose 75% from 2021 to 2022. The page gives no absolute prices
     by ARR, IFM or REDD+, and nothing by land type.
2. **Lou, J., Hultman, N., Patwardhan, A., Qiu, Y.L. (2022).** Integrating sustainability into climate
   finance by quantifying the co-benefits and market impact of carbon projects. *Communications Earth &
   Environment* 3, 137. https://doi.org/10.1038/s43247-022-00468-9 — peer-reviewed.
   - CDM projects with the highest likely co-benefits received a **30.4% higher price** than those with
     the lowest.
   - Gold Standard certification carried a premium of **6.6%–29%**.
   - Caveat: this covers CDM credits, not today's voluntary market.

### Assessment

- The evidence supports a premium for **co-benefit certification** (CCB, Gold Standard, SDG claims). I
  found **no source for a premium by land type**. In particular, nothing supports wetland 1.20 or the
  forest-type split.
- The Methodology page says the multipliers are "calibrated to observed VCM price differentials". None
  of the sources found supports that wording.
- **Options:**
  - (a) Drop the land-type multipliers (set all to 1.0).
  - (b) Replace them with an optional "co-benefit certification" toggle using the peer-reviewed
    6.6%–29% range from Lou et al., with EM's 78% shown as an industry upper reference.

## 2. `VERIFICATION_COST` (20% of gross value)

### Findings

1. **Verra fee schedule (VCS)**, from Verra's fee-schedule FAQ: https://verra.org/new-verra-program-fee-schedule-faqs/
   - **VCU issuance levy:** $0.23 per VCU from January 1, 2025 (previously $0.20).
   - **Per-request fees:** registration request review $3,750; verification request review $2,500,
     plus a $2,500 prepayment credited toward future levies.
   - **Account fees:** $750 to open, $750 per year.
2. **ACR Fee Schedule, effective June 1, 2026:** https://acrcarbon.org/wp-content/uploads/2026/04/ACR-Fee-Schedule-April-2026.pdf
   - **Per-credit fees:** issuance $0; activation $0.30; transfer $0.02; cancellation $0.03; retirement
     $0.02.
   - **Per-project and account fees:** project listing review $2,000; validation review $5,000;
     registry account $1,500 per year.
3. **Galik, C.S., Cooley, D.M., Baker, J.S. (2012).** Analysis of the production and transaction costs
   of forest carbon offset projects in the USA. *Journal of Environmental Management* 112, 128–136.
   https://doi.org/10.1016/j.jenvman.2012.06.045 — peer-reviewed.
   - The abstract says transaction costs "may represent a relatively small percentage of total project
     implementation costs".
   - It names the baseline accounting method as a major driver of cost per ton.
   - I could not open the full text. A search snippet put transaction costs at "generally less than
     25%" of total costs, but I did not verify that against the paper, so don't cite it yet.

### Assessment

- At $15/t, registry per-credit fees are small:
  - Verra ≈ 1.5%.
  - ACR ≈ 2.3% (activation + transfer + retirement).
- Most real cost is **fixed**: third-party validation and verification audits, project design, and
  inventory. Those don't scale with value, so a flat 20% overstates costs for large projects and
  understates them for small ones.
- I found **no official percentage** for verification and registry costs, and no published figure for
  validation/verification body (VVB) audit fees.
- **Option:** model costs as (registry per-credit fee from the schedules above) + (a fixed audit cost
  per verification event). That needs a citable VVB audit-cost source, which I did not find.

## 3. `ADDITIONALITY_LEVELS` (0.60 / 0.75 / 0.90)

### Findings

**Standards.** I found no Verra, ACR or CARB document that publishes generic additionality discount
factors. These programs treat additionality as a project-level test (pass/fail), not a fractional
haircut. This is a "not found" result, not a quoted statement from each standard.

**Empirical over-crediting studies** (these could anchor an illustrative "share of credits that are
real"):

| Study | Scope | Finding |
|---|---|---|
| Badgley, G., Freeman, J., Hamman, J.J., Haya, B., Trugman, A.T., Anderegg, W.R.L., Cullenward, D. (2022). Systematic over-crediting in California's forest carbon offsets program. *Global Change Biology* 28(4), 1433–1445. https://doi.org/10.1111/gcb.15943 | California compliance improved forest management (IFM) projects | **29.4%** of credits analyzed were over-credited (90% CI 20.1%–37.8%), i.e. roughly 0.71 real |
| West, T.A.P., et al. (2023). Action needed to make carbon offsets from forest conservation work for climate change mitigation. *Science* 381(6660), 873–877. https://doi.org/10.1126/science.ade3535 | 26 REDD+ sites, 6 countries | "Most projects have not significantly reduced deforestation"; where they did, reductions were "substantially lower than claimed" |
| Probst, B.S., et al. (2024). Systematic assessment of the achieved emission reductions of carbon crediting projects. *Nature Communications* 15, 9562. https://doi.org/10.1038/s41467-024-53645-z | Synthesis of 14 studies, 2,346 projects | **<16%** of credits are real reductions overall; **25%** for avoided deforestation; **no statistically significant** reductions for improved forest management |
| Haya, B.K., et al. (2023). *Quality Assessment of REDD+ Carbon Crediting.* Berkeley Carbon Trading Project. https://gspp.berkeley.edu/assets/uploads/page/Quality-Assessment-of-REDD+-Carbon-Crediting.pdf | 4 Verra REDD+ methodologies | Widespread over-crediting; flawed baselines alone imply about 92% over-crediting (report, not peer-reviewed) |

### Assessment

- The empirical evidence points **well below** the current factors:
  - About 0.71 for California IFM (Badgley).
  - About 0.25 for REDD+ (Probst).
  - No significant effect found for IFM in Probst's synthesis.
- The 0.90 "High" level has no support in what I found.
- These studies are mostly about avoided conversion and forest management. They don't directly apply
  to reforestation or cropland practice change.
- **Options:**
  - (a) Keep the factors labeled as illustrative (current state after this run).
  - (b) Lower the range toward Badgley's ~0.7 for US forest, with the studies above cited as context.
  - (c) Replace the selector with project-type-specific defaults drawn from Probst et al. (2024).

---

**Not changed in this run:** `CO_BENEFITS`, `VERIFICATION_COST`, `ADDITIONALITY_LEVELS`. Each still has
a TODO in `src/lib/constants.ts` pointing here.

**Later (final cleanup, same day):** `CO_BENEFITS` set to 1.0 for every land type (option (a) above).
`VERIFICATION_COST` and `ADDITIONALITY_LEVELS` keep their values and are labeled as illustrative
assumptions in the UI and Methodology.
