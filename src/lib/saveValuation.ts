import { supabase } from './supabase'
import type { ValuationInputs, ValuationOutputs } from '../types'

export async function saveValuation(
  inputs: ValuationInputs,
  outputs: ValuationOutputs,
  coords?: { lat: number; lng: number }
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('valuations')
      .insert({
        inputs,
        outputs,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('saveValuation error:', error)
      return null
    }

    return data.id as string
  } catch (err) {
    console.error('saveValuation unexpected error:', err)
    return null
  }
}
