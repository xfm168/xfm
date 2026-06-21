import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  getVisitorId,
  generateDailyValues,
  todayString,
  type DailyHexagramWithDetail,
  type Hexagram,
} from '../lib/hexagram'

type Status = 'loading' | 'ready' | 'error'

interface UseDailyHexagramResult {
  status: Status
  data: DailyHexagramWithDetail | null
  error: string | null
}

export function useDailyHexagram(): UseDailyHexagramResult {
  const [status, setStatus] = useState<Status>('loading')
  const [data, setData]     = useState<DailyHexagramWithDetail | null>(null)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const visitorId = getVisitorId()
        const today     = todayString()

        // 1. Check for existing record
        const { data: existing, error: fetchErr } = await supabase
          .from('daily_hexagrams')
          .select(`*, hexagram:hexagrams(*)`)
          .eq('visitor_id', visitorId)
          .eq('date', today)
          .maybeSingle()

        if (fetchErr) throw fetchErr

        if (existing && !cancelled) {
          setData(existing as DailyHexagramWithDetail)
          setStatus('ready')
          return
        }

        // 2. Generate values deterministically
        const generated = generateDailyValues(visitorId, today)

        // 3. Fetch the hexagram row for this number
        const { data: hexRow, error: hexErr } = await supabase
          .from('hexagrams')
          .select('*')
          .eq('number', generated.hexagram_number)
          .single()

        if (hexErr) throw hexErr

        const hexagram = hexRow as Hexagram

        // 4. Insert new record (ignore conflict — could race on double render)
        const { data: inserted, error: insertErr } = await supabase
          .from('daily_hexagrams')
          .insert({
            visitor_id:      visitorId,
            date:            today,
            hexagram_id:     hexagram.id,
            hexagram_number: generated.hexagram_number,
            score:           generated.score,
            career_score:    generated.career_score,
            wealth_score:    generated.wealth_score,
            love_score:      generated.love_score,
            health_score:    generated.health_score,
            lucky_color:     generated.lucky_color,
            lucky_number:    generated.lucky_number,
            analysis:        generated.analysis,
          })
          .select()
          .single()

        if (insertErr) {
          // On unique conflict (double render), fetch again
          if (insertErr.code === '23505') {
            const { data: retry } = await supabase
              .from('daily_hexagrams')
              .select(`*, hexagram:hexagrams(*)`)
              .eq('visitor_id', visitorId)
              .eq('date', today)
              .maybeSingle()

            if (retry && !cancelled) {
              setData(retry as DailyHexagramWithDetail)
              setStatus('ready')
            }
            return
          }
          throw insertErr
        }

        if (!cancelled) {
          setData({ ...(inserted as DailyHexagramWithDetail), hexagram })
          setStatus('ready')
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加载失败，请刷新重试')
          setStatus('error')
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { status, data, error }
}
