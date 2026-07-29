import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBazi } from '../hooks/useBazi'
import { calculateBaZiFromBirthData } from '../lib/bazi'
import type { BirthData } from '@/lib/core'
import type { ZiShiStrategy } from '@/lib/core/types/base'
import { usePageSEO } from '../hooks/usePageSEO'
import { CalendarDays, Clock, User, Sparkles, ChevronDown, MapPin, Globe2, Sun, GpsFixed } from 'lucide-react'
import { LOCATIONS_DB, findLocationByPath, DEFAULT_LOCATION } from '../lib/locations'
import type { Country, City, County } from '../lib/locations'
import { DEFAULT_USE_TRUE_SOLAR_TIME, DEFAULT_ZISHI_STRATEGY } from '../lib/core/config'
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

  const [countryCode, setCountryCode] = useState<string>('CN')
  const [provinceName, setProvinceName] = useState<string>('北京市')
  const [cityName, setCityName] = useState<string>('北京市')
  const [countyName, setCountyName] = useState<string>('东城区')
  const [longitude, setLongitude] = useState<number>(DEFAULT_LOCATION.longitude)
  const [latitude, setLatitude] = useState<number>(DEFAULT_LOCATION.latitude)
  const [timezone, setTimezone] = useState<string>(DEFAULT_LOCATION.timezone)
  const [useTrueSolarTime, setUseTrueSolarTime] = useState<boolean>(DEFAULT_USE_TRUE_SOLAR_TIME)
  const [zishiStrategy, setZishiStrategy] = useState<ZiShiStrategy>(DEFAULT_ZISHI_STRATEGY)
  const [autoLocating, setAutoLocating] = useState<boolean>(false)

  const countries = LOCATIONS_DB.countries
  const currentCountry = countries.find(c => c.code === countryCode)
  const currentProvinces = countryCode === 'CN' ? (currentCountry?.provinces ?? []) : []
  const currentProvince = currentProvinces.find(p => p.name === provinceName)
  const currentCities = countryCode === 'CN' ? (currentProvince?.cities ?? []) : (currentCountry?.majorCities ?? [])
  const currentCity = currentCities.find(c => c.name === cityName)
  const currentCounties = currentCity?.counties ?? []

  function syncLocationState(code: string, province?: string, city?: string, county?: string) {
    const loc = findLocationByPath(LOCATIONS_DB, code, province, city, county)
    setLongitude(loc.longitude)
    setLatitude(loc.latitude)
    setTimezone(loc.timezone)
  }

  function onCountryChange(code: string) {
    setCountryCode(code)
    if (code === 'CN') {
      setProvinceName('北京市')
      setCityName('北京市')
      setCountyName('东城区')
      syncLocationState(code, '北京市', '北京市', '东城区')
    } else {
      setProvinceName('')
      const country = countries.find(c => c.code === code)
      if (country && country.majorCities.length > 0) {
        const firstCity = country.majorCities[0]
        setCityName(firstCity.name)
        if (firstCity.counties.length > 0) {
          setCountyName(firstCity.counties[0].name)
          syncLocationState(code, '', firstCity.name, firstCity.counties[0].name)
        } else {
          setCountyName('')
          syncLocationState(code, '', firstCity.name, '')
        }
      } else {
        setCityName('')
        setCountyName('')
        syncLocationState(code, '', '', '')
      }
    }
  }

  function onProvinceChange(name: string) {
    setProvinceName(name)
    const province = currentProvinces.find(p => p.name === name)
    if (province && province.cities.length > 0) {
      const firstCity = province.cities[0]
      setCityName(firstCity.name)
      if (firstCity.counties.length > 0) {
        setCountyName(firstCity.counties[0].name)
        syncLocationState(countryCode, name, firstCity.name, firstCity.counties[0].name)
      } else {
        setCountyName('')
        syncLocationState(countryCode, name, firstCity.name, '')
      }
    } else {
      setCityName('')
      setCountyName('')
      syncLocationState(countryCode, name, '', '')
    }
  }

  function onCityChange(name: string) {
    setCityName(name)
    const cities = countryCode === 'CN' ? (currentProvince?.cities ?? []) : (currentCountry?.majorCities ?? [])
    const city = cities.find(c => c.name === name)
    if (city && city.counties.length > 0) {
      setCountyName(city.counties[0].name)
      syncLocationState(countryCode, provinceName, name, city.counties[0].name)
    } else {
      setCountyName('')
      syncLocationState(countryCode, provinceName, name, '')
    }
  }

  function onCountyChange(name: string) {
    setCountyName(name)
    syncLocationState(countryCode, provinceName, cityName, name)
  }

  function autoLocate() {
    if (!navigator.geolocation) {
      return
    }
    setAutoLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lng = pos.coords.longitude
        const lat = pos.coords.latitude
        setLongitude(lng)
        setLatitude(lat)

        let bestDist = Infinity
        let bestCountry: Country | undefined
        let bestCity: City | undefined
        let bestCounty: County | undefined

        for (const country of countries) {
          for (const city of country.majorCities) {
            const dist = Math.abs(city.latitude - lat) + Math.abs(city.longitude - lng)
            if (dist < bestDist) {
              bestDist = dist
              bestCountry = country
              bestCity = city
              bestCounty = undefined
            }
            for (const county of city.counties) {
              const d2 = Math.abs(county.latitude - lat) + Math.abs(county.longitude - lng)
              if (d2 < bestDist) {
                bestDist = d2
                bestCountry = country
                bestCity = city
                bestCounty = county
              }
            }
          }
          if (country.provinces) {
            for (const province of country.provinces) {
              for (const city of province.cities) {
                const dist = Math.abs(city.latitude - lat) + Math.abs(city.longitude - lng)
                if (dist < bestDist) {
                  bestDist = dist
                  bestCountry = country
                  bestCity = city
                  bestCounty = undefined
                }
                for (const county of city.counties) {
                  const d2 = Math.abs(county.latitude - lat) + Math.abs(county.longitude - lng)
                  if (d2 < bestDist) {
                    bestDist = d2
                    bestCountry = country
                    bestCity = city
                    bestCounty = county
                  }
                }
              }
            }
          }
        }

        if (bestCountry && bestCity) {
          setCountryCode(bestCountry.code)
          setTimezone(bestCounty?.timezone ?? bestCity.timezone)
          if (bestCountry.code === 'CN' && bestCountry.provinces) {
            const province = bestCountry.provinces.find(p =>
              p.cities.some(c => c.name === bestCity!.name)
            )
            if (province) {
              setProvinceName(province.name)
            }
          } else {
            setProvinceName('')
          }
          setCityName(bestCity.name)
          setCountyName(bestCounty?.name ?? '')
        }

        setAutoLocating(false)
      },
      () => {
        setAutoLocating(false)
      }
    )
  }

  function onToggleSolarTime(v: boolean) {
    setUseTrueSolarTime(v)
  }

  function onToggleZishi(v: ZiShiStrategy) {
    setZishiStrategy(v)
  }

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
        longitude,
        latitude,
        timezone,
        useTrueSolarTime,
        childHourStrategy: zishiStrategy,
        location: `${countryCode}${provinceName ? '/' + provinceName : ''}${cityName ? '/' + cityName : ''}${countyName ? '/' + countyName : ''}`,
        birthTimeUnknown: shichen === 'unknown',
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

          {/* 出生地 */}
          <div className="bazi-field">
            <label className="bazi-field-label">
              <MapPin size={16} />
              <span>出生地</span>
            </label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div className="bazi-select-wrap" style={{ flex: '1 1 120px', minWidth: 0 }}>
                <select
                  className="bazi-field-select"
                  value={countryCode}
                  onChange={e => onCountryChange(e.target.value)}
                >
                  {countries.map(c => (
                    <option value={c.code} key={c.code}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown size={18} className="bazi-select-arrow" />
              </div>
              {countryCode === 'CN' && (
                <div className="bazi-select-wrap" style={{ flex: '1 1 120px', minWidth: 0 }}>
                  <select
                    className="bazi-field-select"
                    value={provinceName}
                    onChange={e => onProvinceChange(e.target.value)}
                  >
                    {currentProvinces.map(p => (
                      <option value={p.name} key={p.name}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="bazi-select-arrow" />
                </div>
              )}
              <div className="bazi-select-wrap" style={{ flex: '1 1 120px', minWidth: 0 }}>
                <select
                  className="bazi-field-select"
                  value={cityName}
                  onChange={e => onCityChange(e.target.value)}
                >
                  {currentCities.map(c => (
                    <option value={c.name} key={c.name}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown size={18} className="bazi-select-arrow" />
              </div>
              {currentCounties.length > 0 && (
                <div className="bazi-select-wrap" style={{ flex: '1 1 120px', minWidth: 0 }}>
                  <select
                    className="bazi-field-select"
                    value={countyName}
                    onChange={e => onCountyChange(e.target.value)}
                  >
                    {currentCounties.map(c => (
                      <option value={c.name} key={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="bazi-select-arrow" />
                </div>
              )}
            </div>
          </div>

          {/* 当前位置 */}
          <div className="bazi-field">
            <label className="bazi-field-label">
              <GpsFixed size={16} />
              <span>当前位置</span>
            </label>
            <button
              type="button"
              onClick={autoLocate}
              disabled={autoLocating}
              className="bazi-gender-btn"
              style={{ width: '100%' }}
            >
              {autoLocating ? '定位中…' : '使用当前定位'}
            </button>
          </div>

          {/* 经纬度 / 时区 */}
          <div className="bazi-field">
            <label className="bazi-field-label">
              <Globe2 size={16} />
              <span>经纬度 / 时区</span>
            </label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <input
                type="number"
                step="0.0001"
                className="bazi-field-input"
                style={{ flex: '1 1 120px', minWidth: 0 }}
                value={longitude}
                onChange={e => setLongitude(parseFloat(e.target.value) || 0)}
              />
              <input
                type="number"
                step="0.0001"
                className="bazi-field-input"
                style={{ flex: '1 1 120px', minWidth: 0 }}
                value={latitude}
                onChange={e => setLatitude(parseFloat(e.target.value) || 0)}
              />
              <input
                type="text"
                readOnly
                className="bazi-field-input"
                style={{ flex: '1 1 160px', minWidth: 0 }}
                value={timezone}
              />
            </div>
          </div>

          {/* 真太阳时校正 */}
          <div className="bazi-field">
            <label className="bazi-field-label">
              <Sun size={16} />
              <span>真太阳时校正</span>
            </label>
            <div>
              <div className="bazi-gender-group">
                <button
                  type="button"
                  className={`bazi-gender-btn ${useTrueSolarTime ? 'active' : ''}`}
                  onClick={() => onToggleSolarTime(true)}
                >
                  已开启
                </button>
                <button
                  type="button"
                  className={`bazi-gender-btn ${!useTrueSolarTime ? 'active' : ''}`}
                  onClick={() => onToggleSolarTime(false)}
                >
                  已关闭
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#8a7f6d', marginTop: '8px', lineHeight: 1.5 }}>
                基于出生地经纬度对北京时间进行校正（均时差+经度校正）
              </p>
            </div>
          </div>

          {/* 子时换日规则 */}
          <div className="bazi-field">
            <label className="bazi-field-label">
              <Clock size={16} />
              <span>子时换日规则</span>
            </label>
            <div className="bazi-gender-group" style={{ flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`bazi-gender-btn ${zishiStrategy === 'late' ? 'active' : ''}`}
                onClick={() => onToggleZishi('late')}
                title="23:00-24:00 归今日"
              >
                晚子时算当天
              </button>
              <button
                type="button"
                className={`bazi-gender-btn ${zishiStrategy === 'early' ? 'active' : ''}`}
                onClick={() => onToggleZishi('early')}
                title="23:00-24:00 归明日"
              >
                晚子时算次日
              </button>
              <button
                type="button"
                className={`bazi-gender-btn ${zishiStrategy === 'gregorian' ? 'active' : ''}`}
                onClick={() => onToggleZishi('gregorian')}
                title="用校正后的真太阳时换日"
              >
                真太阳时决定
              </button>
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
