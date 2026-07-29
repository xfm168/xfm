import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBazi } from '../hooks/useBazi'
import { calculateBaZiFromBirthData } from '../lib/bazi'
import type { BirthData } from '@/lib/core'
import { usePageSEO } from '../hooks/usePageSEO'
import { CalendarDays, Clock, User, Sparkles, ChevronDown } from 'lucide-react'
import './BaziInput.css'

/** 时辰选项 */
const SHICHEN_OPTIONS = [
  { value: 'shichen-zi', label: '子时（23:00-1:00）', time: '00:00' },
  { value: 'shichen-chou', label: '丑时（1:00-3:00）', time: '02:00' },
  { value: 'shichen-yin', label: '寅时（3:00-5:00）', time: '04:00' },
  { value: 'shichen-mao', label: '卯时（5:00-7:00）', time: '06:00' },
  { value: 'shichen-chen', label: '辰时（7:00-9:00）', time: '08:00' },
  { value: 'shichen-si', label: '巳时（9:00-11:00）', time: '10:00' },
  { value: 'shichen-wu', label: '午时（11:00-13:00）', time: '12:00' },
  { value: 'shichen-wei', label: '未时（13:00-15:00）', time: '14:00' },
  { value: 'shichen-shen', label: '申时（15:00-17:00）', time: '16:00' },
  { value: 'shichen-you', label: '酉时（17:00-19:00）', time: '18:00' },
  { value: 'shichen-xu', label: '戌时（19:00-21:00）', time: '20:00' },
  { value: 'shichen-hai', label: '亥时（21:00-23:00）', time: '22:00' },
  { value: 'unknown', label: '不确定时辰', time: '12:00' },
]

export default function BaziInput() {
  usePageSEO({
    title: '八字测算 | 玄风门',
    description: '输入出生信息，玄风门为您排出四柱命盘，专业八字命理推演。',
    canonical: 'https://xuanfengmen.com/bazi',
  })

  const navigate = useNavigate()
  const { saveChart } = useBazi()

  const [birthDate, setBirthDate] = useState('1990-01-15')
  const [shichen, setShichen] = useState('shichen-chen')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [calculating, setCalculating] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setCalculating(true)

    const selected = SHICHEN_OPTIONS.find(o => o.value === shichen)
    const resolvedTime = selected?.time || '12:00'

    setTimeout(() => {
      const birthData: BirthData = {
        birthday: birthDate,
        birthTime: resolvedTime,
        gender,
        timezone: 'Asia/Shanghai',
      }

      const chart = calculateBaZiFromBirthData(birthData)
      saveChart(chart)

      setCalculating(false)
      navigate('/bazi/chart', { state: { birthData } })
    }, 600)
  }

  return (
    <div className="bazi-input-v2">
      {/* 太极背景 */}
      <div className="bazi-input-bg" aria-hidden>
        <div className="bazi-taiji" />
      </div>

      <div className="bazi-input-container">
        {/* 标题 */}
        <div className="bazi-input-header">
          <h1 className="bazi-input-title">八字测算</h1>
          <p className="bazi-input-subtitle">输入出生信息，推演命盘</p>
        </div>

        {/* 表单卡片 */}
        <form onSubmit={handleSubmit} className="bazi-input-form">
          {/* 出生日期 */}
          <div className="bazi-field">
            <label className="bazi-field-label">
              <CalendarDays size={16} />
              <span>出生日期（公历）</span>
            </label>
            <input
              type="date"
              className="bazi-field-input"
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              required
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* 出生时辰 */}
          <div className="bazi-field">
            <label className="bazi-field-label">
              <Clock size={16} />
              <span>出生时辰</span>
            </label>
            <div className="bazi-select-wrap">
              <select
                className="bazi-field-select"
                value={shichen}
                onChange={e => setShichen(e.target.value)}
              >
                {SHICHEN_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} className="bazi-select-arrow" />
            </div>
          </div>

          {/* 性别 */}
          <div className="bazi-field">
            <label className="bazi-field-label">
              <User size={16} />
              <span>性别</span>
            </label>
            <div className="bazi-gender-group">
              <button
                type="button"
                className={`bazi-gender-btn ${gender === 'male' ? 'active' : ''}`}
                onClick={() => setGender('male')}
              >
                乾造（男）
              </button>
              <button
                type="button"
                className={`bazi-gender-btn ${gender === 'female' ? 'active' : ''}`}
                onClick={() => setGender('female')}
              >
                坤造（女）
              </button>
            </div>
          </div>

          {/* 提示 */}
          <div className="bazi-field-hint">
            <p>请输入准确的出生日期和时辰，以确保排盘准确。</p>
            {shichen === 'unknown' && (
              <p className="bazi-hint-warn">未提供时辰，时柱仅供参考。</p>
            )}
          </div>

          {/* 按钮 */}
          <button
            type="submit"
            className={`bazi-submit-btn ${calculating ? 'loading' : ''}`}
            disabled={calculating}
          >
            {calculating ? (
              <>
                <span className="bazi-btn-spinner" />
                <span>正在排盘...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>开始分析</span>
              </>
            )}
          </button>
        </form>

        {/* 简介 */}
        <div className="bazi-input-intro">
          <h3>关于八字</h3>
          <p>
            八字命理学，又称四柱八字，以人出生的年、月、日、时为基础，
            配以天干地支，通过五行生克制化的原理，推演人的命运轨迹。
          </p>
          <p>
            命由天定，运由己造，了解命盘方能把握机遇。
          </p>
        </div>
      </div>
    </div>
  )
}
