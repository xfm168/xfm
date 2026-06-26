import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

let supabaseInstance: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      '[Supabase] 缺少环境变量配置：VITE_SUPABASE_URL 和/或 VITE_SUPABASE_ANON_KEY。' +
      '需要 Supabase 功能的页面将无法正常工作。'
    )
    return null
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  return supabaseInstance
}

export const supabase = getSupabase()
