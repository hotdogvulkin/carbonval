/**
 * COMET-Planner v4.0 Build 2 county data (lazy-loaded) and county FIPS lookup.
 * See constants.ts (COMET_*) for the exact implementation variants and citation.
 */
interface CometFile {
  order: string[]
  variants: string[]
  counties: Record<string, Array<number | null>>
}

let cache: Promise<CometFile> | null = null

function loadComet(): Promise<CometFile> {
  if (!cache) {
    cache = fetch('/data/comet_cropland.json').then(r => {
      if (!r.ok) throw new Error(`Failed to load comet_cropland.json (${r.status})`)
      return r.json() as Promise<CometFile>
    })
    cache.catch(() => { cache = null })
  }
  return cache
}

/** County FIPS via the FCC Area API (public, CORS-enabled). Null when not in a US county. */
export async function fipsFromCoords(lat: number, lng: number): Promise<string | null> {
  const url = `https://geo.fcc.gov/api/census/block/find?latitude=${lat}&longitude=${lng}&format=json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`FCC lookup failed (${res.status})`)
  const data = (await res.json()) as { County?: { FIPS?: string | null } }
  return data.County?.FIPS ?? null
}

/** The county's COMET row (COMET_PRACTICE_ORDER × COMET_VARIANT_ORDER), or null if absent. */
export async function getCometRow(fips: string): Promise<Array<number | null> | null> {
  const data = await loadComet()
  return data.counties[fips] ?? null
}
