// Static 2024 VCM price reference data
// Source: Ecosystem Marketplace, State of the Voluntary Carbon Markets 2024
// https://www.ecosystemmarketplace.com/articles/state-of-the-voluntary-carbon-markets-2024/

export interface VcmSegmentPrice {
  segment: string
  priceRange: string
  median: number
  note: string
}

export interface MarketDataSnapshot {
  source: string
  sourceUrl: string
  referenceYear: number
  reportTitle: string
  segments: VcmSegmentPrice[]
  updateNote: string
}

export const VCM_MARKET_DATA: MarketDataSnapshot = {
  source: 'Ecosystem Marketplace',
  sourceUrl: 'https://www.ecosystemmarketplace.com/articles/state-of-the-voluntary-carbon-markets-2024/',
  referenceYear: 2024,
  reportTitle: 'State of the Voluntary Carbon Markets 2024',
  segments: [
    {
      segment: 'Compliance offset floor',
      priceRange: '$2–$8',
      median: 5,
      note: 'Industrial & waste projects, older vintages',
    },
    {
      segment: 'Voluntary retail average',
      priceRange: '$10–$20',
      median: 15,
      note: 'Mixed portfolio, active registries',
    },
    {
      segment: 'Nature-based solutions premium',
      priceRange: '$20–$50+',
      median: 30,
      note: 'REDD+, IFM, wetland restoration with co-benefit certification',
    },
  ],
  updateNote:
    'These are static reference prices based on 2024 transaction data. A live monthly price feed is planned for a future release.',
}
