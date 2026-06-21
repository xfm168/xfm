import { useState, useEffect } from 'react'
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './PremiumReport.css'

type RoomType = 'living' | 'bedroom' | 'kitchen' | 'balcony'
type PayStatus = 'gate' | 'processing' | 'unlocked'

const ROOM_NAMES: Record<RoomType, string> = {
  living: '客厅', bedroom: '卧室', kitchen: '厨房', balcony: '阳台',
}

const GATE_FEATURES = [
  { icon: '☯', text: '明财位精准定位与激活方案' },
  { icon: '☯', text: '暗财位发现与布局建议' },
  { icon: '☯', text: '桃花位详细分析' },
  { icon: '☯', text: '文昌位开运指引' },
  { icon: '☯', text: '健康位与病符位解析' },
  { icon: '☯', text: '家具布局专业建议（4条）' },
  { icon: '☯', text: '颜色五行搭配方案' },
  { icon: '☯', text: 'AI风水师深度解读' },
]

interface PositionDetail {
  name: string; direction: string; description: string; activation: string
}
interface PremiumData {
  wealthPrimary: PositionDetail; wealthHidden: PositionDetail
  romance: PositionDetail; study: PositionDetail
  health: PositionDetail; disease: PositionDetail
  furniture: string[]
  colors: { recommend: string[]; avoid: string[] }
  masterReading: string
}

const POSITIONS: Record<RoomType, Omit<PremiumData, 'masterReading'>> = {
  living: {
    wealthPrimary: { name: '明财位', direction: '东南方', description: '东南属木，主财官，是财运流动的主要通道，此位气场活跃，财星易聚。', activation: '宜摆放常绿植物或流水装置，忌放枯萎植物与尖锐物品。' },
    wealthHidden:  { name: '暗财位', direction: '入门对角线', description: '入门斜对角处为藏风聚气之所，气息流转最终汇聚于此，为藏财要地。', activation: '保持整洁，可摆放貔貅或山水画，忌堆积杂物或置放镜子。' },
    romance: { name: '桃花位', direction: '西南方', description: '西南属坤土，主感情与婚姻，为人际关系之枢纽，桃花缘分由此发端。', activation: '摆放成对水晶球或粉色系装饰，忌放枯花与旧物。' },
    study:   { name: '文昌位', direction: '东北方', description: '东北属艮山，文昌星所居之位，主学业、智慧与考运，有助思维清明。', activation: '宜置文具书籍或文昌塔，台灯置于此位，忌堆杂物或置电器。' },
    health:  { name: '健康位', direction: '东方', description: '东方属震木，主健康与生机，春气从此入室，为身体康泰之源。', activation: '保持通风透气，适当置翠绿植物提升生气，忌阴暗潮湿。' },
    disease: { name: '病符位', direction: '西方', description: '西方本年二黑病符星临，金气偏旺，易引动呼吸与肺部不适。', activation: '避免红色物品，宜置铜铃或金属器皿化解，保持干燥整洁。' },
    furniture: ['沙发背靠实墙，切不可背对门窗，主气场不稳', '电视背景墙宜设于东方或北方，避免正对主卧门', '茶几宜方形或圆形，四角须圆润，忌尖角朝向坐位', '入门处设玄关屏风或隔断，可藏风聚气，避免一览无余'],
    colors: { recommend: ['米白', '浅金', '暖棕', '浅绿'], avoid: ['纯黑', '深冷蓝', '重灰'] },
  },
  bedroom: {
    wealthPrimary: { name: '明财位', direction: '东南角', description: '卧室东南角为个人财库之位，气场稳定，财气由此积聚成库。', activation: '床头柜宜置于此位，可摆放绿晶或黄水晶，忌放杂物与药品。' },
    wealthHidden:  { name: '暗财位', direction: '床底气场', description: '床底长期积聚地气，为个人阴财之所，气场纯净则财运稳固。', activation: '保持床底清洁通风，不可堆放杂物与旧物，尤忌存放尖锐物品。' },
    romance: { name: '桃花位', direction: '西南方', description: '西南坤土主感情，卧室桃花位于此，感情运与婚姻缘分从此滋生。', activation: '成对的装饰品或床头灯，粉色或玫瑰金色调，忌单数摆放。' },
    study:   { name: '文昌位', direction: '东北方', description: '东北山位主思维清明，若卧室兼作书房，此位有助学业与职场表现。', activation: '书桌宜面向此方，台灯置于左前方，忌背对门而坐。' },
    health:  { name: '健康位', direction: '东方', description: '晨光从东而来，卧室东方气场影响睡眠质量与体能恢复。', activation: '保持东方窗帘轻薄透光，适量引入自然光，忌完全遮蔽东方。' },
    disease: { name: '病符位', direction: '西北方', description: '西北方向本年病星临位，影响家中长辈或主人的健康状态。', activation: '可放置铜葫芦或六帝古钱，保持干燥整洁，避免床头朝向此方。' },
    furniture: ['床头靠实墙，床尾不可正对门，主气息流失', '镜子不可正对床，尤忌在床头正上方设镜', '衣柜门宜完全关闭，开放式衣架应以布帘遮挡', '床位避开横梁正下方，横梁压床主身体不适'],
    colors: { recommend: ['米白', '浅木色', '莫兰迪粉', '浅灰'], avoid: ['大红', '亮橙', '荧光色'] },
  },
  kitchen: {
    wealthPrimary: { name: '明财位', direction: '灶台方位', description: '灶为财禄之源，灶台的朝向与位置直接关系家中财运与饮食健康。', activation: '保持灶台整洁，火口朝东南或正南吉方，忌水火相冲布局。' },
    wealthHidden:  { name: '暗财位', direction: '冰箱位置', description: '冰箱象征食禄储存，为家中暗财所在，冰箱丰满则家运充盈。', activation: '冰箱内保持整洁有序，忌空置，冰箱门不可正对灶台。' },
    romance: { name: '桃花位', direction: '西南角', description: '厨房主人缘与聚合，西南角为感情能量汇聚之地，家和方能财聚。', activation: '保持此角落整洁明亮，可摆放小型绿植或花瓶，象征家庭和睦。' },
    study:   { name: '文昌位', direction: '东北方', description: '对厨房而言，文昌位影响家中子女学业与事业发展机遇。', activation: '此处保持清洁，避免油污堆积，可贴金色装饰提升文气。' },
    health:  { name: '健康位', direction: '通风方向', description: '厨房油烟与湿气影响家中成员健康，通风路径是关键健康位。', activation: '保持抽油烟机正常运作，窗户经常开启，忌长期紧闭。' },
    disease: { name: '病符位', direction: '排水聚湿处', description: '厨房潮湿聚集之处易成病符，影响肠胃与消化系统健康。', activation: '保持排水畅通，定期清理下水道，灶台附近保持干燥。' },
    furniture: ['灶台不可正对冰箱，水火相冲影响健康', '灶台背后须有实墙，忌背对窗户或门口', '厨房与卫生间不宜共享一扇门，主健康漏财', '冰箱门朝向宜向室内，不可正对厨房门'],
    colors: { recommend: ['米白', '浅木色', '暖黄'], avoid: ['纯黑', '深蓝', '墨绿'] },
  },
  balcony: {
    wealthPrimary: { name: '明财位', direction: '东南朝向', description: '阳台直接连接外部气场，面向东南的阳台财气最为旺盛。', activation: '朝东南方摆放大型绿植，引入外部旺气，忌堆放杂物遮挡气口。' },
    wealthHidden:  { name: '暗财位', direction: '植物角落', description: '阳台绿植密集之处藏有隐性财气，植物旺盛象征财气充盈。', activation: '保持植物健康生长，枯枝须及时修剪，忌放枯死植物。' },
    romance: { name: '桃花位', direction: '西南朝向', description: '阳台西南方向接收坤土之气，有助感情稳定与贵人缘分。', activation: '放置粉色花卉或风铃，象征桃花绽放，忌放枯花或仙人掌。' },
    study:   { name: '文昌位', direction: '东北角', description: '东北角位于艮位，接收文昌之气，有益思维与学习。', activation: '可置书架或阅读角，配合充足自然光，形成开运书房格局。' },
    health:  { name: '健康位', direction: '通风路径', description: '阳台是室内外气场交换的主要界面，通风路径影响全家健康能量。', activation: '保持阳台通风畅通，定期清理，避免堆积杂物阻断气流通道。' },
    disease: { name: '病符位', direction: '阴暗角落', description: '阳台阴暗潮湿的角落容易积聚阴气与病符能量，需重点关注。', activation: '定期清扫角落，可放置盐灯或虎尾兰，保持干燥明亮。' },
    furniture: ['阳台不宜完全封闭，保留通风口与自然光入口', '晾晒区与休闲区宜分开，避免潮湿侵入室内气场', '绿植宜选阳性植物，忌大量阴性植物聚集', '若改作书房，宜铺木质地板，接地气，助文昌'],
    colors: { recommend: ['原木色', '竹绿', '米白'], avoid: ['深灰', '重黑', '冷色调'] },
  },
}

function getMasterReading(roomType: RoomType, score: number): string {
  const room = ROOM_NAMES[roomType]
  if (score >= 85) return `此${room}整体气场流通顺畅，格局端正，阴阳调和。财星得位，近期财运渐有起色；健康位气息稳定，家中成员康泰。建议在东南财位增设一盆常绿植物，进一步激活财气流动。整体而言，此空间风水基础扎实，顺势而为，静待时机，可期事半功倍之效。`
  if (score >= 70) return `此${room}整体格局尚可，但局部气流路径受阻，影响运势流动。主要问题在于财位与健康位的气场互动，需适当调整。建议优先处理病符位的化解，再激活财位能量。整体运势中平偏上，经针对性调整后，可望在三个月内看到明显改善。`
  if (score >= 60) return `此${room}存在若干风水格局问题，需认真对待。气场流通受阻，财运与健康均有一定隐患。当务之急是清理杂物、疏通气流通道，同时化解病符位的不良影响。建议按本报告建议逐步调整，先易后难，切勿操之过急。`
  return `此${room}整体气场偏弱，多处风水格局失当，阴阳失衡较为明显。财位受压，健康位气息不稳，需系统性的布局调整。建议先清理所有杂物，保持整洁通风，再按照本报告建议逐项落实。坚持改善，通常四至六周可感受到明显变化。`
}

// ── Sub-views ─────────────────────────────────────

function GateView({ score, roomName, onUnlock }: { score: number; roomName: string; onUnlock: () => void }) {
  return (
    <div className="prem-gate animate-fade-in">
      <div className="container">
        <div className="gate-score-row">
          <div className="gate-score-badge">
            <span className="gate-score-num">{score}</span>
            <span className="gate-score-unit">分</span>
          </div>
          <div className="gate-score-info">
            <p className="gate-room">{roomName} · 基础分析已完成</p>
            <p className="gate-hint">解锁深度报告，获取完整风水格局解读</p>
          </div>
        </div>

        <div className="gate-features-card">
          <div className="gate-features-header">
            <span className="gate-divider-line" />
            <span className="gate-section-title">深度报告包含</span>
            <span className="gate-divider-line" />
          </div>
          <ul className="gate-features-list">
            {GATE_FEATURES.map((f, i) => (
              <li key={i} className="gate-feature-item">
                <span className="gate-feature-dot" />
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="gate-cta-wrap">
          <div className="gate-price-row">
            <span className="gate-price">¥ 39</span>
            <span className="gate-price-note">专属深度报告 · 一次性解锁</span>
          </div>
          <button className="gate-unlock-btn" onClick={onUnlock}>
            <span>立即解锁深度报告</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
          <p className="gate-disclaimer">（演示版 · 暂未接入真实支付）</p>
        </div>
      </div>
    </div>
  )
}

function ProcessingView() {
  return (
    <div className="prem-processing animate-fade-in">
      <div className="container">
        <div className="processing-wrap">
          <div className="processing-bagua">☯</div>
          <h2 className="processing-title">正在为您测算专属风水报告</h2>
          <p className="processing-sub">天地有象，阴阳有序，万事有机</p>
          <div className="processing-steps">
            <span className="ps-dot" />
            <span className="ps-dot" />
            <span className="ps-dot" />
          </div>
        </div>
      </div>
    </div>
  )
}

function PositionCard({ pos, className }: { pos: PositionDetail; className?: string }) {
  return (
    <div className={`position-card ${className ?? ''}`}>
      <div className="pc-header">
        <span className="pc-name">{pos.name}</span>
        <span className="pc-direction">{pos.direction}</span>
      </div>
      <p className="pc-desc">{pos.description}</p>
      <div className="pc-activation">
        <span className="pc-act-label">化局之法</span>
        <p>{pos.activation}</p>
      </div>
    </div>
  )
}

function UnlockedView({ data, roomName, score, onBack }: {
  data: PremiumData; roomName: string; score: number; onBack: () => void
}) {
  return (
    <div className="prem-unlocked animate-fade-in">
      <div className="prem-unlocked-badge">
        <span className="unlocked-icon">✦</span>
        <span>深度报告已解锁 · {roomName}</span>
      </div>

      <div className="container">
        {/* Wealth Positions */}
        <section className="prem-section">
          <h2 className="prem-section-title">财位格局</h2>
          <div className="position-pair">
            <PositionCard pos={data.wealthPrimary} className="card-wealth" />
            <PositionCard pos={data.wealthHidden} className="card-wealth-hidden" />
          </div>
        </section>

        {/* Life Positions */}
        <section className="prem-section">
          <h2 className="prem-section-title">命位格局</h2>
          <div className="position-grid">
            <PositionCard pos={data.romance} className="card-romance" />
            <PositionCard pos={data.study} className="card-study" />
          </div>
        </section>

        {/* Health Positions */}
        <section className="prem-section">
          <h2 className="prem-section-title">健康格局</h2>
          <div className="position-grid">
            <PositionCard pos={data.health} className="card-health" />
            <PositionCard pos={data.disease} className="card-disease" />
          </div>
        </section>

        {/* Furniture Layout */}
        <section className="prem-section">
          <h2 className="prem-section-title">家具布局建议</h2>
          <div className="furniture-card">
            {data.furniture.map((rule, i) => (
              <div key={i} className="furniture-rule">
                <span className="furniture-num">{i + 1}</span>
                <p>{rule}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Color System */}
        <section className="prem-section">
          <h2 className="prem-section-title">颜色五行方案</h2>
          <div className="color-card">
            <div className="color-group">
              <span className="color-group-label">宜用颜色</span>
              <div className="color-tags">
                {data.colors.recommend.map(c => (
                  <span key={c} className="color-tag recommend">{c}</span>
                ))}
              </div>
            </div>
            <div className="color-divider" />
            <div className="color-group">
              <span className="color-group-label">忌用颜色</span>
              <div className="color-tags">
                {data.colors.avoid.map(c => (
                  <span key={c} className="color-tag avoid">{c}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Master Reading */}
        <section className="prem-section">
          <h2 className="prem-section-title">AI风水师深度解读</h2>
          <div className="master-card">
            <div className="master-header">
              <span className="master-icon">☯</span>
              <div>
                <p className="master-label">玄风勘测师</p>
                <p className="master-score-line">综合风水评分：{score}分</p>
              </div>
            </div>
            <blockquote className="master-text">「{data.masterReading}」</blockquote>
          </div>
        </section>

        {/* Actions */}
        <div className="unlocked-actions">
          <button className="ul-btn-secondary" onClick={onBack}>分析其他空间</button>
          <button className="ul-btn-primary" onClick={() => window.location.href = '/'}>返回首页</button>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────
export default function PremiumReport() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const stateData = location.state as {
    reportId: string | null
    roomType: RoomType
    score: number
    summary: string
  } | null

  const reportId = stateData?.reportId ?? searchParams.get('id')
  const roomType: RoomType = stateData?.roomType ?? 'living'
  const score = stateData?.score ?? 0

  const [payStatus, setPayStatus] = useState<PayStatus>('gate')
  const [premiumData, setPremiumData] = useState<PremiumData | null>(null)

  useEffect(() => {
    if (reportId) checkIfAlreadyPaid(reportId)
  }, [reportId])

  async function checkIfAlreadyPaid(id: string) {
    const { data } = await supabase
      .from('fengshui_reports')
      .select('payment_status, premium_report')
      .eq('id', id)
      .maybeSingle()
    if (data?.payment_status === 'premium' && data.premium_report) {
      setPremiumData(data.premium_report as PremiumData)
      setPayStatus('unlocked')
    }
  }

  async function handleUnlock() {
    setPayStatus('processing')
    await new Promise(r => setTimeout(r, 2200))

    const generated: PremiumData = {
      ...POSITIONS[roomType],
      masterReading: getMasterReading(roomType, score),
    }

    if (reportId) {
      await supabase
        .from('fengshui_reports')
        .update({ payment_status: 'premium', premium_report: generated, updated_at: new Date().toISOString() })
        .eq('id', reportId)
    }

    setPremiumData(generated)
    setPayStatus('unlocked')
  }

  const roomName = ROOM_NAMES[roomType]

  return (
    <div className="premium-page">
      <section className="prem-header">
        <div className="container">
          <button className="prem-back" onClick={() => navigate(-1)}>← 返回分析结果</button>
          <span className="prem-label">深度报告</span>
          <h1 className="prem-title">玄风勘测 · 深度报告</h1>
          <p className="prem-sub">{roomName} · 风水评分 {score} 分</p>
        </div>
      </section>

      {payStatus === 'gate'       && <GateView score={score} roomName={roomName} onUnlock={handleUnlock} />}
      {payStatus === 'processing' && <ProcessingView />}
      {payStatus === 'unlocked' && premiumData && (
        <UnlockedView data={premiumData} roomName={roomName} score={score} onBack={() => navigate('/fengshui')} />
      )}
    </div>
  )
}
