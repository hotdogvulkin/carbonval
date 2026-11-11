import { supabase } from './supabase'
import type { ValuationInputs, ValuationOutputs } from '../types'
import type { ClassificationResult } from './earthEngine'

// Columns added by supabase/migrations/20261111000000_v5_methodology.sql.
// If the migration has not been applied, the insert is retried without them.
function v5Columns(inputs: ValuationInputs, outputs: ValuationOutputs, ecoRegionCode?: string) {
  return {
    cps_number: inputs.cpsNumber ?? null,
    irrigated: inputs.irrigated ?? false,
    adverse_selection: inputs.adverseSelection ?? true,
    detected_land_type: inputs.detectedLandType ?? null,
    eco_region_code: ecoRegionCode ?? null,
    permanence_factor: outputs.permanenceFactor,
    integrity_risk: outputs.integrity.level,
  }
}

function isMissingColumnError(error: { code?: string; message?: string }): boolean {
  return error.code === 'PGRST204' || error.code === '42703' || /column/i.test(error.message ?? '')
}

export async function saveValuation(
  inputs: ValuationInputs,
  outputs: ValuationOutputs,
  classification?: ClassificationResult,
  ecoRegionCode?: string,
): Promise<string | null> {
  const base = {
    land_type: inputs.landType,
    acres: inputs.acres,
    duration: inputs.duration,
    price_scenario: inputs.priceScenario,
    protection_status: inputs.protectionStatus,
    additionality_level: inputs.additionalityLevel,
    lat: inputs.location?.lat ?? null,
    lng: inputs.location?.lng ?? null,
    nlcd_label: classification?.nlcdLabel ?? null,
    nlcd_class: classification?.nlcdClass ?? null,
    net_value: outputs.netValue,
    total_credits: outputs.totalCredits,
    annual_sequestration: outputs.annualSequestration,
  }
  try {
    let { data, error } = await supabase
      .from('valuations')
      .insert({ ...base, ...v5Columns(inputs, outputs, ecoRegionCode) })
      .select('id')
      .single()

    if (error && isMissingColumnError(error)) {
      ;({ data, error } = await supabase.from('valuations').insert(base).select('id').single())
    }
    if (error) {
      console.error('saveValuation error:', error)
      return null
    }
    return (data as { id: string }).id
  } catch (err) {
    console.error('saveValuation unexpected error:', err)
    return null
  }
}
