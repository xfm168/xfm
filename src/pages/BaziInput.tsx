import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageTitle, Button, Card } from '../components/ui'
import { useBazi } from '../hooks/useBazi'
import { calculateBaZiFromBirthData } from '../lib/bazi'
import type { BirthData } from '@/lib/core'
import './BaziInput.css'

export default function BaziInput() {
  const navigate = useNavigate()
  const { saveChart } = useBazi()

  const [birthDate, setBirthDate] = useState('1990-01-15')
  const [birthTime, setBirthTime] = useState('08:00')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [calculating, setCalculating] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setCalculating(true)

    setTimeout(() => {
      const birthData: BirthData = {
        birthday: birthDate,
        birthTime,
        gender,
        timezone: 'Asia/Shanghai',
        useTrueSolarTime: false,
      }

      const chart = calculateBaZiFromBirthData(birthData)
      saveChart(chart)

      setCalculating(false)
      navigate('/bazi/chart', { state: { birthData } })
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
            <div className="form-group">
              <label className="form-label">出生日期</label>
              <input
                type="date"
                className="form-input"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">出生时间</label>
              <input
                type="time"
                className="form-input"
                value={birthTime}
                onChange={e => setBirthTime(e.target.value)}
                required
              />
            </div>

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

            <div className="form-note">
              <p>※ 请输入准确的出生年月日时，以确保排盘结果准确。</p>
              <p>※ 出生时间以当地时间为准，默认北京时间。</p>
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
