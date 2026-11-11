import { useEffect, useState } from 'react'
import type { ParcelContext } from '../types'
import { EMPTY_CONTEXT } from './carbonModel'
import { lookupEcoregion } from './ecoregionLookup'
import { fipsFromCoords, getCometRow } from './cometData'

/** Resolves location-dependent data (ecoregion risk, county FIPS, COMET row) for a pin. */
export function useParcelContext(location: { lat: number; lng: number } | undefined): ParcelContext {
  const [ctx, setCtx] = useState<ParcelContext>(EMPTY_CONTEXT)
  const lat = location?.lat
  const lng = location?.lng

  useEffect(() => {
    if (lat === undefined || lng === undefined) {
      setCtx(EMPTY_CONTEXT)
      return
    }
    let cancelled = false
    setCtx({ regionStatus: 'loading', region: null, countyStatus: 'loading', countyFips: null, cometRow: null })

    lookupEcoregion(lat, lng)
      .then(region => {
        if (cancelled) return
        setCtx(c => ({ ...c, region, regionStatus: region?.perm30 ? 'ok' : 'no-data' }))
      })
      .catch(() => { if (!cancelled) setCtx(c => ({ ...c, regionStatus: 'error' })) })

    fipsFromCoords(lat, lng)
      .then(async fips => {
        const row = fips ? await getCometRow(fips) : null
        if (cancelled) return
        setCtx(c => ({ ...c, countyFips: fips, cometRow: row, countyStatus: row ? 'ok' : 'no-data' }))
      })
      .catch(() => { if (!cancelled) setCtx(c => ({ ...c, countyStatus: 'error' })) })

    return () => { cancelled = true }
  }, [lat, lng])

  return ctx
}
