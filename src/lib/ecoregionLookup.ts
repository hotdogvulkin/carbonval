/**
 * Lazy-loads EPA Level III ecoregion polygons (WGS84, simplified) with per-ecoregion
 * Anderegg et al. (2022) perm30 statistics. See data/SOURCES.md for provenance.
 */
import type { RegionalRisk } from '../types'
import { findEcoregion, type EcoFeatureCollection } from './carbonModel'

let cache: Promise<EcoFeatureCollection> | null = null

export function loadEcoregions(): Promise<EcoFeatureCollection> {
  if (!cache) {
    cache = fetch('/data/ecoregions.json').then(r => {
      if (!r.ok) throw new Error(`Failed to load ecoregions.json (${r.status})`)
      return r.json() as Promise<EcoFeatureCollection>
    })
    cache.catch(() => { cache = null })
  }
  return cache
}

export async function lookupEcoregion(lat: number, lng: number): Promise<RegionalRisk | null> {
  return findEcoregion(await loadEcoregions(), lat, lng)
}
