// MRLC WMS GetFeatureInfo — returns the NLCD 2021 land cover class code (PALETTE_INDEX)
// at a given WGS84 coordinate. Much simpler than WCS (which uses EPSG:5070/Albers)
// and faster than Overpass (which times out on rural US coordinates).
//
// Request trick: construct a tiny 3×3 pixel bbox around the point, ask for the
// center pixel (X=1, Y=1). INFO_FORMAT=text/plain returns a flat key=value string.

const MRLC_WMS =
  'https://www.mrlc.gov/geoserver/mrlc_download/wms'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  const lat = parseFloat(req.query.lat as string)
  const lng = parseFloat(req.query.lng as string)

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: 'lat and lng are required numeric parameters' })
  }

  // Tiny bbox: ±0.01° (~1 km) around the point — large enough for WMS to render,
  // small enough that center pixel reliably represents the clicked coordinate.
  const delta = 0.01
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`

  const params = new URLSearchParams({
    SERVICE: 'WMS',
    VERSION: '1.1.1',
    REQUEST: 'GetFeatureInfo',
    LAYERS: 'NLCD_2021_Land_Cover_L48',
    QUERY_LAYERS: 'NLCD_2021_Land_Cover_L48',
    BBOX: bbox,
    WIDTH: '3',
    HEIGHT: '3',
    SRS: 'EPSG:4326',
    X: '1',
    Y: '1',
    INFO_FORMAT: 'text/plain',
  })

  const url = `${MRLC_WMS}?${params.toString()}`
  console.log('[classify-land] fetching:', url)

  try {
    const upstreamRes = await fetch(url)
    const text = await upstreamRes.text()
    console.log('[classify-land] status:', upstreamRes.status)
    console.log('[classify-land] response:', text.slice(0, 300))

    if (!upstreamRes.ok) {
      return res.status(502).json({ error: `MRLC WMS returned ${upstreamRes.status}` })
    }

    // Response format:
    //   Results for FeatureType 'mrlc_download:NLCD_2021_Land_Cover_L48':
    //   PALETTE_INDEX = 42.0
    const match = text.match(/PALETTE_INDEX\s*=\s*([\d.]+)/)
    if (!match) {
      console.warn('[classify-land] no PALETTE_INDEX in response')
      return res.status(404).json({ error: 'No land cover data at these coordinates (outside CONUS?)' })
    }

    const nlcdClass = Math.round(parseFloat(match[1]))
    console.log('[classify-land] nlcdClass:', nlcdClass)
    return res.status(200).json({ nlcdClass })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[classify-land] error:', message)
    return res.status(500).json({ error: message })
  }
}
