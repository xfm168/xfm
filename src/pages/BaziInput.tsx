import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageTitle, Button, Card } from '../components/ui'
import { useBazi } from '../hooks/useBazi'
import { calculateBaZiFromBirthData } from '../lib/bazi'
import type { BirthData } from '@/lib/core'
import { usePageSEO } from '../hooks/usePageSEO'
import './BaziInput.css'

/** 时辰选项定义 */
const SHICHEN_OPTIONS = [
  { value: 'unknown', label: '不知道时辰' },
  { value: 'morning', label: '上午（6:00-12:00）' },
  { value: 'afternoon', label: '下午（12:00-18:00）' },
  { value: 'evening', label: '晚上（18:00-24:00）' },
  { value: 'dawn', label: '凌晨（0:00-6:00）' },
  { value: 'shichen-zi', label: '子时（23:00-1:00）' },
  { value: 'shichen-chou', label: '丑时（1:00-3:00）' },
  { value: 'shichen-yin', label: '寅时（3:00-5:00）' },
  { value: 'shichen-mao', label: '卯时（5:00-7:00）' },
  { value: 'shichen-chen', label: '辰时（7:00-9:00）' },
  { value: 'shichen-si', label: '巳时（9:00-11:00）' },
  { value: 'shichen-wu', label: '午时（11:00-13:00）' },
  { value: 'shichen-wei', label: '未时（13:00-15:00）' },
  { value: 'shichen-shen', label: '申时（15:00-17:00）' },
  { value: 'shichen-you', label: '酉时（17:00-19:00）' },
  { value: 'shichen-xu', label: '戌时（19:00-21:00）' },
  { value: 'shichen-hai', label: '亥时（21:00-23:00）' },
  { value: 'exact', label: '精确时间' },
]

/** 时辰对应的大致时间（用于传给 calculator） */
const SHICHEN_TIME_MAP: Record<string, string> = {
  'shichen-zi': '00:00',
  'shichen-chou': '02:00',
  'shichen-yin': '04:00',
  'shichen-mao': '06:00',
  'shichen-chen': '08:00',
  'shichen-si': '10:00',
  'shichen-wu': '12:00',
  'shichen-wei': '14:00',
  'shichen-shen': '16:00',
  'shichen-you': '18:00',
  'shichen-xu': '20:00',
  'shichen-hai': '22:00',
  'morning': '09:00',
  'afternoon': '15:00',
  'evening': '21:00',
  'dawn': '03:00',
}

export default function BaziInput() {
  usePageSEO({
    title: '八字排盘 | 玄风门',
    description: '输入生辰八字，玄风门为您排出四柱命盘，分析五行喜忌、用神强弱，专业八字命理推演。',
    canonical: 'https://xuanfengmen.com/bazi'
  })
  const navigate = useNavigate()
  const { saveChart } = useBazi()

  // ---- 基础字段 ----
  const [birthDate, setBirthDate] = useState('1990-01-15')
  const [birthTime, setBirthTime] = useState('08:00')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [calculating, setCalculating] = useState(false)

  // ---- 新增字段 ----
  const [calendarType, setCalendarType] = useState<'solar' | 'lunar'>('solar')
  const [timeCategory, setTimeCategory] = useState('exact')
  const [useTrueSolarTime, setUseTrueSolarTime] = useState(false)
  const [birthCity, setBirthCity] = useState('北京')
  const [useDaylightSaving, setUseDaylightSaving] = useState(false)
  const [name, setName] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setCalculating(true)

    // 根据时辰选择确定实际时间
    let resolvedTime = birthTime
    if (timeCategory !== 'exact' && timeCategory !== 'unknown') {
      resolvedTime = SHICHEN_TIME_MAP[timeCategory] || birthTime
    }
    if (timeCategory === 'unknown') {
      resolvedTime = '12:00' // 不知道时辰默认正午
    }

    setTimeout(() => {
      const birthData: BirthData = {
        birthday: birthDate,
        birthTime: resolvedTime,
        gender,
        timezone: 'Asia/Shanghai',
        useTrueSolarTime,
      }

      const chart = calculateBaZiFromBirthData(birthData)
      saveChart(chart)

      // 将额外字段通过 navigate state 传递
      const extraInfo = {
        calendarType,
        timeCategory,
        birthCity,
        useDaylightSaving,
        name: name || undefined,
      }

      setCalculating(false)
      navigate('/bazi/chart', {
        state: {
          birthData,
          extraInfo,
        },
      })
    }, 800)
  }

  return (
    <div className="bazi-input-page">
      <PageTitle
        icon="☰"
        label="玄风命理"
        title="八字排盘"
        subtitle="输入出生信息，推演命盘"
      />

      <div className="container bazi-input-content">
        <Card className="bazi-form-card">
          <form onSubmit={handleSubmit} className="bazi-form">

            {/* ---- 姓名输入 ---- */}
            <div className="form-group">
              <label className="form-label">姓名</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="选填"
                maxLength={20}
              />
            </div>

            {/* ---- 农历/公历切换 ---- */}
            <div className="form-group">
              <label className="form-label">历法</label>
              <div className="toggle-selector">
                <button
                  type="button"
                  className={`toggle-btn ${calendarType === 'solar' ? 'active' : ''}`}
                  onClick={() => setCalendarType('solar')}
                >
                  公历
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${calendarType === 'lunar' ? 'active' : ''}`}
                  onClick={() => setCalendarType('lunar')}
                >
                  农历
                </button>
              </div>
            </div>

            {/* ---- 出生日期 ---- */}
            <div className="form-group">
              <label className="form-label">
                出生日期
                {calendarType === 'lunar' && (
                  <span className="calendar-hint">（农历）</span>
                )}
              </label>
              <input
                type="date"
                className="form-input"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                required
              />
            </div>

            {/* ---- 出生时间（时辰选择） ---- */}
            <div className="form-group">
              <label className="form-label">出生时间</label>
              <select
                className="form-input form-select"
                value={timeCategory}
                onChange={e => setTimeCategory(e.target.value)}
                required
              >
                {SHICHEN_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* 精确时间输入 */}
              {timeCategory === 'exact' && (
                <input
                  type="time"
                  className="form-input exact-time-input"
                  value={birthTime}
                  onChange={e => setBirthTime(e.target.value)}
                  required
                />
              )}
            </div>

            {/* ---- 性别 ---- */}
            <div className="form-group">
              <label className="form-label">性别</label>
              <div className="gender-selector">
                <button
                  type="button"
                  className={`gender-btn ${gender === 'male' ? 'active' : ''}`}
                  onClick={() => setGender('male')}
                >
                  男命
                </button>
                <button
                  type="button"
                  className={`gender-btn ${gender === 'female' ? 'active' : ''}`}
                  onClick={() => setGender('female')}
                >
                  女命
                </button>
              </div>
            </div>

            {/* ---- 真太阳时开关 ---- */}
            <div className="form-group">
              <label className="form-label">时间校正</label>
              <div className="toggle-row">
                <div className="toggle-switch-wrap">
                  <button
                    type="button"
                    className={`toggle-switch ${useTrueSolarTime ? 'active' : ''}`}
                    onClick={() => setUseTrueSolarTime(!useTrueSolarTime)}
                    role="switch"
                    aria-checked={useTrueSolarTime}
                  >
                    <span className="toggle-thumb" />
                  </button>
                  <span className="toggle-label">使用真太阳时</span>
                </div>
              </div>
              {useTrueSolarTime && (
                <div className="form-sub-group">
                  <label className="form-label">出生城市</label>
                  <input
                    type="text"
                    className="form-input"
                    value={birthCity}
                    onChange={e => setBirthCity(e.target.value)}
                    placeholder="例如：北京"
                  />
                </div>
              )}
            </div>

            {/* ---- 夏令时开关 ---- */}
            <div className="form-group">
              <label className="form-label">夏令时</label>
              <div className="toggle-row">
                <div className="toggle-switch-wrap">
                  <button
                    type="button"
                    className={`toggle-switch ${useDaylightSaving ? 'active' : ''}`}
                    onClick={() => setUseDaylightSaving(!useDaylightSaving)}
                    role="switch"
                    aria-checked={useDaylightSaving}
                  >
                    <span className="toggle-thumb" />
                  </button>
                  <span className="toggle-label">出生时处于夏令时</span>
                </div>
              </div>
            </div>

            {/* ---- 提示信息 ---- */}
            <div className="form-note">
              <p>※ 请输入准确的出生年月日时，以确保排盘结果准确。</p>
              <p>※ 出生时间以当地时间为准，默认北京时间。</p>
              {timeCategory === 'unknown' && (
                <p className="form-note-highlight">※ 未提供时辰，日柱以正午（12:00）推算，时柱仅供参考。</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={calculating}
            >
              开始推演
            </Button>
          </form>
        </Card>

        <div className="bazi-intro">
          <h3 className="intro-title">关于八字</h3>
          <p className="intro-text">
            八字命理学，又称四柱八字，是中国传统命理学的重要组成部分。
            它以人出生的年、月、日、时为基础，配以天干地支，
            通过五行生克制化的原理，推演人的命运轨迹。
          </p>
          <p className="intro-text">
            八字不仅是一种命理工具，更是一种认识自我、理解人生的智慧。
            命由天定，运由己造，了解命盘方能把握机遇。
          </p>
        </div>
      </div>
    </div>
  )
}
