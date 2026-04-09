import type { LandType } from '../types'

export interface ClassificationResult {
  landType: LandType
  nlcdClass: number
  nlcdLabel: string
  confidence: 'high' | 'medium' | 'low'
}

// NLCD 2021 class code → LandType + label + confidence
const NLCD_MAP: Record<number, { landType: LandType; label: string; confidence: 'high' | 'medium' | 'low' }> = {
  11: { landType: 'other',           label: 'Open Water',                    confidence: 'high' },
  12: { landType: 'other',           label: 'Perennial Ice/Snow',            confidence: 'high' },
  21: { landType: 'other',           label: 'Developed, Open Space',         confidence: 'medium' },
  22: { landType: 'other',           label: 'Developed, Low Intensity',      confidence: 'high' },
  23: { landType: 'other',           label: 'Developed, Med Intensity',      confidence: 'high' },
  24: { landType: 'other',           label: 'Developed, High Intensity',     confidence: 'high' },
  31: { landType: 'other',           label: 'Barren Land',                   confidence: 'high' },
  41: { landType: 'deciduousForest', label: 'Deciduous Forest',              confidence: 'high' },
  42: { landType: 'evergreenForest', label: 'Evergreen Forest',              confidence: 'high' },
  43: { landType: 'mixedForest',     label: 'Mixed Forest',                  confidence: 'high' },
  52: { landType: 'shrubland',       label: 'Shrub/Scrub',                   confidence: 'high' },
  71: { landType: 'grassland',       label: 'Grassland/Herbaceous',          confidence: 'high' },
  81: { landType: 'grassland',       label: 'Pasture/Hay',                   confidence: 'medium' },
  82: { landType: 'cropland',        label: 'Cultivated Crops',              confidence: 'high' },
  90: { landType: 'wetland',         label: 'Woody Wetlands',                confidence: 'high' },
  95: { landType: 'wetland',         label: 'Emergent Herbaceous Wetlands',  confidence: 'high' },
}

export async function classifyCoordinates(lat: number, lng: number): Promise<ClassificationResult> {
  const res = await fetch(`/api/classify-land?lat=${lat}&lng=${lng}`)

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `Classification failed (${res.status})`)
  }

  const { nlcdClass } = (await res.json()) as { nlcdClass: number }

  const entry = NLCD_MAP[nlcdClass]
  if (entry) {
    return {
      landType: entry.landType,
      nlcdClass,
      nlcdLabel: entry.label,
      confidence: entry.confidence,
    }
  }

  return {
    landType: 'other',
    nlcdClass,
    nlcdLabel: `NLCD class ${nlcdClass}`,
    confidence: 'low',
  }
}
