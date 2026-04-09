import { supabase } from './supabase'
import type { ValuationInputs, ValuationOutputs } from '../types'
import type { ClassificationResult } from './earthEngine'

export async function saveValuation(
  inputs: ValuationInputs,
  outputs: ValuationOutputs,
  coords?: { lat: number; lng: number },
  classification?: ClassificationResult
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('valuations')
      .insert({
        land_type: inputs.landType,
        acres: inputs.acres,
        duration: inputs.duration,
        price_scenario: inputs.priceScenario,
        protection_status: inputs.protectionStatus,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        nlcd_label: classification?.nlcdLabel ?? null,
        nlcd_class: classification?.nlcdClass ?? null,
        net_value: outputs.netValue,
        total_credits: outputs.totalCredits,
        annual_sequestration: outputs.annualSequestration,
      })
      .select('id')
      .single()

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
