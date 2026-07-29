/**
 * 专业排盘数据聚合层（Pro Paipan Aggregator）
 *
 * 目标：将现有算法库的输出聚合为专业排盘软件（如截图）所需的结构化数据。
 * 所有计算由程序完成，AI 仅负责文字解读。
 *
 * 输出结构：
 *  - ProPillarInfo × 4：每柱的天干十神 / 地支十神 / 藏干列表及十神 / 纳音 / 空亡 / 神煞 / 十二长生 / 旺衰
 *  - ProGanZhiRelation：天干留意 / 地支留意
 *  - ProDaYun / ProLiuNian / ProLiuYue / ProLiuRi：大运 / 流年 / 流月 / 流日 表格行
 *  - ProShenShaByPillar：按柱分组的完整神煞列表
 */

import type {
  BaZiChart,
  HeavenlyStem,
  EarthlyBranch,
  FiveElement,
  ShenShi,
  ShiErChangSheng,
  WuXingWangShuai,
  GanZhi,
  CangGan,
} from './types'
import type { BaZiPipelineResult } from './pipeline/types'
import type { BirthData } from '@/lib/core'

import {
  STEM_ELEMENT,
  STEM_YINYANG,
  BRANCH_ELEMENT,
  BRANCH_YINYANG,
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  CANG_GAN,
  getStemElement,
  getStemYinYang,
  getBranchElement,
  getBranchIndex,
} from '@/lib/core'

// —— 本地补全缺失的工具 ——
function getBranchYinYang(zhi: EarthlyBranch): '阳' | '阴' {
  return BRANCH_YINYANG[zhi]
}

import { getNaYin } from './nayin'
import { getChangSheng } from './changsheng'
import { calculateShenShi, getRelatedShens } from './shishen'
import { calculateShenSha } from './shensha'
import { analyzeCombinations } from './combinationEngine'
import type { CombinationResult, StemCombo, BranchCombo } from './combinationEngine'
import { checkGuChenGuaSu } from './shensha/guchen'
import type { ShenShaInfo } from './shensha/types'

// 大运/流年/流月 本地计算 fallback（当 pipeline 没提供时）
import {
  generateDaYun as localGenerateDaYun,
  calcDaYunStart as localCalcDaYunStart,
  getLiuNian as localGetLiuNian,
  getLiuYue as localGetLiuYue,
  type DaYunStep as LocalDaYunStep,
} from './rules/dashunRules'

// ======================= 类型定义 =======================

/** 五行颜色方案（专业排盘：木绿、火红、土棕、金橙、水蓝） */
export const WUXING_COLORS: Record<FiveElement, string> = {
  木: '#22c55e', // 绿
  火: '#ef4444', // 红
  土: '#a16207', // 棕（深土黄/褐）
  金: '#f97316', // 橙
  水: '#3b82f6', // 蓝
}

/** 藏干项（含对应十神） */
export interface ProCangGanItem {
  gan: HeavenlyStem
  element: FiveElement
  yinYang: '阳' | '阴'
  shenShi: ShenShi | null
  role: '本气' | '中气' | '余气'
}

/** 单柱完整信息 */
export interface ProPillarInfo {
  pillarKey: 'year' | 'month' | 'day' | 'hour'
  pillarName: string

  gan: HeavenlyStem
  ganElement: FiveElement
  ganYinYang: '阳' | '阴'
  ganShenShi: ShenShi | null
  ganChangSheng: ShiErChangSheng | null
  ganColor: string

  zhi: EarthlyBranch
  zhiElement: FiveElement
  zhiYinYang: '阳' | '阴'
  /** 地支主气对应十神（藏干本气的十神） */
  zhiShenShi: ShenShi | null
  /** 地支藏干的全部十神（按本/中/余各加十神，用于截图二这种叠字展示） */
  zhiCangGanShenShis: ShenShi[]
  zhiChangSheng: ShiErChangSheng | null
  zhiWangShuai: WuXingWangShuai | null
  zhiColor: string

  cangGanList: ProCangGanItem[]
  naYin: string
  kongWang: EarthlyBranch[]
  shenShaList: ProShenShaItem[]
  changSheng: ShiErChangSheng | null
}

/** 神煞项 */
export interface ProShenShaItem {
  name: string
  auspicious: '吉' | '凶' | '平' | '中性'
  description?: string
}

/** 天干/地支作用关系摘要 */
export interface ProGanZhiRelations {
  tianGanLiuYi: string[] // 如 ['甲庚冲', '甲己合']
  tianGanShengKe: string[] // 生克（不重合/合的部分）
  diZhiChong: string[]
  diZhiHe: string[] // 六合
  diZhiSanHe: string[]
  diZhiBanHe: string[]
  diZhiSanHui: string[]
  diZhiXing: string[] // 三刑/自刑/子卯刑
  diZhiHai: string[] // 六害
  diZhiPo: string[] // 破
  diZhiChuan: string[] // 穿（六穿=六害的别名，也常见单独列出）
}

/** 大运行 */
export interface ProDaYunRow {
  index: number
  startAge: number
  endAge: number
  startYear: number
  endYear: number
  gan: HeavenlyStem
  zhi: EarthlyBranch
  ganElement: FiveElement
  zhiElement: FiveElement
  ganShenShi: ShenShi | null
  zhiShenShi: ShenShi | null
  naYin: string
  changSheng: ShiErChangSheng | null
  wangShuai: WuXingWangShuai | null
  shenSha: ProShenShaItem[]
  isCurrent: boolean
  /** 地支藏干列表（本气→中气→余气，各带十神、五行） */
  cangGanList: ProCangGanItem[]
}

/** 流年年行 */
export interface ProLiuNianRow {
  year: number
  age: number
  gan: HeavenlyStem
  zhi: EarthlyBranch
  ganElement: FiveElement
  zhiElement: FiveElement
  ganShenShi: ShenShi | null
  zhiShenShi: ShenShi | null
  naYin: string
  changSheng: ShiErChangSheng | null
  shenSha: ProShenShaItem[]
  isCurrent: boolean
  cangGanList: ProCangGanItem[]
}

/** 流月月行 */
export interface ProLiuYueRow {
  solarTerm: string // 节气名（立春/惊蛰...）
  monthIndex: number
  gan: HeavenlyStem
  zhi: EarthlyBranch
  ganElement: FiveElement
  zhiElement: FiveElement
  ganShenShi: ShenShi | null
  zhiShenShi: ShenShi | null
  shenSha: ProShenShaItem[]
  cangGanList: ProCangGanItem[]
}

/** 流日日行 */
export interface ProLiuRiRow {
  date: string // YYYY-MM-DD
  gan: HeavenlyStem
  zhi: EarthlyBranch
  ganElement: FiveElement
  zhiElement: FiveElement
  ganShenShi: ShenShi | null
  zhiShenShi: ShenShi | null
  naYin: string
  shenSha: ProShenShaItem[]
  lunarDay?: string
  cangGanList: ProCangGanItem[]
}

/** 出生信息摘要（截图一顶部） */
export interface ProBirthInfo {
  ganZaoLabel: string // 乾造 / 坤造
  zodiac: string // 生肖
  yearNaYin: string // 年柱纳音（白蜡金命等）
  solarDate: string // 公历：2000年12月15日 星期五 11点40分
  lunarDate: string // 农历：二〇〇〇年 冬月二十 午时
  qiYunLabel: string // （阳年生男）出生后5岁2月0日上运（顺排）
  qiYunDate: string // 于公历 2006年02月15日 起运
  gender: 'male' | 'female'
  weekDay: string
  shichen: string
}

/** 完整专业排盘 */
export interface ProPaiPan {
  birth: ProBirthInfo
  pillars: ProPillarInfo[] // 顺序：年/月/日/时
  relations: ProGanZhiRelations
  daYun: ProDaYunRow[]
  liuNian: ProLiuNianRow[]
  liuYue: ProLiuYueRow[]
  liuRi: ProLiuRiRow[] // 当前选中月份的流日（默认空，需懒加载）
}

// ======================= 计算辅助 =======================

const PILLAR_META: { key: 'year' | 'month' | 'day' | 'hour'; name: string }[] = [
  { key: 'year', name: '年柱' },
  { key: 'month', name: '月柱' },
  { key: 'day', name: '日柱' },
  { key: 'hour', name: '时柱' },
]

const SHICHEN_ZHI_MAP: Record<string, string> = {
  '23:00': '子', '00:00': '子', '01:00': '丑', '02:00': '丑',
  '03:00': '寅', '04:00': '寅', '05:00': '卯', '06:00': '卯',
  '07:00': '辰', '08:00': '辰', '09:00': '巳', '10:00': '巳',
  '11:00': '午', '12:00': '午', '13:00': '未', '14:00': '未',
  '15:00': '申', '16:00': '申', '17:00': '酉', '18:00': '酉',
  '19:00': '戌', '20:00': '戌', '21:00': '亥', '22:00': '亥',
}

const ZODIAC: Record<EarthlyBranch, string> = {
  子: '鼠', 丑: '牛', 寅: '虎', 卯: '兔', 辰: '龙', 巳: '蛇',
  午: '马', 未: '羊', 申: '猴', 酉: '鸡', 戌: '狗', 亥: '猪',
}

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

function colorOf(el: FiveElement): string {
  return WUXING_COLORS[el] || '#e8e0d0'
}

function kongWangOf(gan: HeavenlyStem, zhi: EarthlyBranch): EarthlyBranch[] {
  const ganIdx = HEAVENLY_STEMS.indexOf(gan)
  const zhiIdx = EARTHLY_BRANCHES.indexOf(zhi)
  const offset = ((zhiIdx - ganIdx) % 12 + 12) % 12
  return [
    EARTHLY_BRANCHES[(offset + 10) % 12],
    EARTHLY_BRANCHES[(offset + 11) % 12],
  ]
}

/** 简单农历转换（近似实现：按公历月日转为中文月日+干支年的俗称） */
function approximateLunar(dateStr: string, hourTime: string): {
  yearText: string
  monthText: string
  dayText: string
  shichen: string
} {
  const dt = new Date(`${dateStr}T${hourTime || '12:00'}:00`)
  const y = dt.getFullYear()
  const m = dt.getMonth() + 1
  const d = dt.getDate()
  const nums = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九']
  const yearText = String(y).split('').map(c => nums[parseInt(c, 10)] || c).join('')
  const lunarMonthNames = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月']
  // 简单近似：若公历在2月前，视为农历仍是去年的冬月/腊月（这里不做精确节气，仅保证UI完整）
  const lmIdx = m >= 2 ? Math.min(m - 2, 11) : (m === 1 ? 11 : 10)
  const monthText = lunarMonthNames[lmIdx] || `${m}月`
  const dayChinese = [
    '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十', '卅一',
  ]
  const dayText = dayChinese[d - 1] || `${d}日`
  const shichen = SHICHEN_ZHI_MAP[hourTime] || '午'
  return { yearText, monthText, dayText, shichen }
}

// ======================= 神煞：按柱落点 =======================

/** 统一把 ShenShaInfo[] 解析为按柱落点的 ProShenShaItem 映射 */
function buildPillarShenSha(
  chart: BaZiChart,
  extraShenShas: ShenShaInfo[],
): Record<'year' | 'month' | 'day' | 'hour', ProShenShaItem[]> {
  const result: Record<'year' | 'month' | 'day' | 'hour', ProShenShaItem[]> = {
    year: [], month: [], day: [], hour: [],
  }
  const keyOfLabel = (label: string): ('year' | 'month' | 'day' | 'hour') | null => {
    if (/年(支|柱)/.test(label)) return 'year'
    if (/月(支|柱)/.test(label)) return 'month'
    if (/日(支|柱)/.test(label)) return 'day'
    if (/时(支|柱)/.test(label)) return 'hour'
    return null
  }
  const allItems: ShenShaInfo[] = [...extraShenShas]
  for (const item of allItems) {
    if (!item.inPosition) continue
    const name = item.name.replace(/（[^）]*）/g, '').trim() || item.name
    const pro: ProShenShaItem = {
      name,
      auspicious: /贵人|德|喜|驿马|文昌|将星|金舆|禄|福|印|华盖|桃花|红鸾|天喜/.test(name) ? '吉' : (/空亡|羊刃|煞|灾|勾|绞|飞廉|败|孤|寡|刑|破|害/.test(name) ? '凶' : '中性'),
      description: item.description,
    }
    const parts = (item.position || '').split(/[、，,]/)
    let matched = false
    for (const p of parts) {
      const k = keyOfLabel(p)
      if (k) {
        if (!result[k].some(x => x.name === name)) result[k].push(pro)
        matched = true
      }
    }
    // 若未说明位置，但名称中带天干地支匹配四柱 -> 尝试推断
    if (!matched) {
      for (const mk of PILLAR_META) {
        const gz = chart.sixLines[mk.key]
        if ((item.position || '').includes(gz.gan) || (item.position || '').includes(gz.zhi)) {
          if (!result[mk.key].some(x => x.name === name)) result[mk.key].push(pro)
        }
      }
    }
  }
  return result
}

// 通用：给任意干支组合计算简单神煞摘要（用于大运/流年/流月/流日的简化展示）
function quickShenShaOfGZ(gan: HeavenlyStem, zhi: EarthlyBranch, dayGan: HeavenlyStem, yearZhi: EarthlyBranch): ProShenShaItem[] {
  const items: ProShenShaItem[] = []
  // 天乙贵人 口诀：甲戊庚牛羊，乙己鼠猴乡，丙丁猪鸡位，壬癸兔蛇藏，六辛逢马虎
  const TIAN_YI: Record<string, string[]> = {
    甲: ['丑', '未'], 戊: ['丑', '未'], 庚: ['丑', '未'],
    乙: ['子', '申'], 己: ['子', '申'],
    丙: ['亥', '酉'], 丁: ['亥', '酉'],
    壬: ['卯', '巳'], 癸: ['卯', '巳'],
    辛: ['午', '寅'],
  }
  if (TIAN_YI[dayGan]?.includes(zhi)) items.push({ name: '天乙贵人', auspicious: '吉' })
  // 桃花：亥卯未在子，寅午戌在卯，巳酉丑在午，申子辰在酉
  const TAO_HUA_SANHE: Record<string, string> = { 亥卯未: '子', 寅午戌: '卯', 巳酉丑: '午', 申子辰: '酉' }
  for (const key in TAO_HUA_SANHE) {
    if (key.includes(yearZhi) && TAO_HUA_SANHE[key] === zhi) items.push({ name: '桃花', auspicious: '吉' })
  }
  // 驿马：申子辰马在寅，寅午戌马在申，巳酉丑马在亥，亥卯未马在巳
  const YI_MA: Record<string, string> = { 申子辰: '寅', 寅午戌: '申', 巳酉丑: '亥', 亥卯未: '巳' }
  for (const key in YI_MA) {
    if (key.includes(yearZhi) && YI_MA[key] === zhi) items.push({ name: '驿马', auspicious: '吉' })
  }
  // 空亡
  const kw = kongWangOf(gan, zhi)
  items.push({ name: `空亡（${kw.join('、')}）`, auspicious: '凶' })
  return items
}

// ======================= 天干地支作用关系：摘要 =======================

function summarizeRelations(chart: BaZiChart): ProGanZhiRelations {
  let r: CombinationResult
  try { r = analyzeCombinations(chart) } catch {
    r = { heavenlyStemCombos: [], earthlyBranchCombos: [], impactScore: 0, keyCombinations: [], description: '' }
  }
  const formatStems = (s: [HeavenlyStem, HeavenlyStem]) => s[0] + s[1]
  const formatBranches = (b: EarthlyBranch[]) => b.join('')
  const ganLiuYi: string[] = []
  const ganShengKe: string[] = []
  for (const s of r.heavenlyStemCombos) {
    if (s.type === '五合') ganLiuYi.push(`${formatStems(s.stems)}合`)
    else if (s.type === '天干相冲') ganLiuYi.push(`${formatStems(s.stems)}冲`)
    else ganShengKe.push(`${formatStems(s.stems)}${s.type.replace('天干', '')}`)
  }
  // 生克也可按天干五行补：
  const fourGans = [chart.sixLines.year.gan, chart.sixLines.month.gan, chart.sixLines.day.gan, chart.sixLines.hour.gan]
  const SHENG: Record<FiveElement, FiveElement> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
  const KE: Record<FiveElement, FiveElement> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' }
  for (let i = 0; i < fourGans.length; i++) {
    for (let j = i + 1; j < fourGans.length; j++) {
      const a = fourGans[i], b = fourGans[j]
      const ae = STEM_ELEMENT[a], be = STEM_ELEMENT[b]
      if (SHENG[ae] === be) {
        const key = `${a}${b}生`
        if (!ganShengKe.includes(key)) ganShengKe.push(key)
      } else if (KE[ae] === be) {
        const key = `${a}${b}克`
        if (!ganShengKe.includes(key)) ganShengKe.push(key)
      }
    }
  }
  const diChong: string[] = [], diHe: string[] = [], diSanhe: string[] = [], diBanhe: string[] = [], diSanhui: string[] = []
  const diXing: string[] = [], diHai: string[] = [], diPo: string[] = [], diChuan: string[] = []
  for (const b of r.earthlyBranchCombos) {
    const key = formatBranches(b.branches)
    if (b.type === '六冲') diChong.push(`${key}冲`)
    else if (b.type === '六合') diHe.push(`${key}合`)
    else if (b.type === '三合局') diSanhe.push(`${key}三合`)
    else if (b.type === '半合') diBanhe.push(`${key}半合`)
    else if (b.type === '三会局') diSanhui.push(`${key}三会`)
    else if (b.type === '自刑' || b.type === '三刑' || b.type === '地支相刑') diXing.push(`${key}${b.type === '自刑' ? '自刑' : b.type === '三刑' ? '三刑' : '刑'}`)
    else if (b.type === '六害') { diHai.push(`${key}害`); diChuan.push(`${key}穿`) }
    else if (b.type === '破') diPo.push(`${key}破`)
    else if (b.type === '穿' || b.type === '六穿') diChuan.push(`${key}穿`)
  }
  // 自刑补全（按原四柱直接判断重复地支）
  const zhis = [chart.sixLines.year.zhi, chart.sixLines.month.zhi, chart.sixLines.day.zhi, chart.sixLines.hour.zhi]
  const SELF_XING_ZHI: EarthlyBranch[] = ['辰', '午', '酉', '亥']
  for (const z of SELF_XING_ZHI) {
    const cnt = zhis.filter(x => x === z).length
    if (cnt >= 2) {
      const tag = `${z}${z}自刑`
      if (!diXing.includes(tag)) diXing.push(tag)
    }
  }
  return {
    tianGanLiuYi: ganLiuYi,
    tianGanShengKe: ganShengKe,
    diZhiChong: diChong,
    diZhiHe: diHe,
    diZhiSanHe: diSanhe,
    diZhiBanHe: diBanhe,
    diZhiSanHui: diSanhui,
    diZhiXing: diXing,
    diZhiHai: diHai,
    diZhiPo: diPo,
    diZhiChuan: diChuan,
  }
}

/** 通用：构建某地支的藏干+十神（按本/中/余气）。用于大运/流年/流月/流日的地支格子。 */
function buildCangGanForZhi(zhi: EarthlyBranch, relatedShens: Record<string, ShenShi>, dayGan: HeavenlyStem): ProCangGanItem[] {
  const raw: CangGan | undefined = CANG_GAN?.[zhi]
  const list: ProCangGanItem[] = []
  const roles: ('本气' | '中气' | '余气')[] = ['本气', '中气', '余气']
  const cands = [raw?.ben, raw?.zhong, raw?.yao]
  cands.forEach((g, idx) => {
    if (!g) return
    const cg = g as HeavenlyStem
    const el = getStemElement(cg) as FiveElement
    const yy = getStemYinYang(cg) as '阳' | '阴'
    list.push({
      gan: cg,
      element: el,
      yinYang: yy,
      // 大运/流年/流月/流日 的藏干如果刚好是日主干本身，十神为空（避免比肩重复）
      shenShi: (cg === dayGan) ? null : (relatedShens[cg] ?? null),
      role: roles[idx],
    })
  })
  return list
}

// ======================= 出生信息摘要 =======================

function buildBirthInfo(chart: BaZiChart, bd: BirthData | null): ProBirthInfo {
  const gender = chart.birthInfo.gender
  const yearZhi = chart.sixLines.year.zhi
  const zodiac = ZODIAC[yearZhi] || ''
  const yearNaYin = chart.sixLines.year.naYin || ''
  const birth = chart.birthInfo
  const dateStr = birth.birthDate
  const timeStr = birth.birthTime || '12:00'
  const dt = new Date(`${dateStr}T${timeStr}:00`)
  const weekDay = WEEKDAYS[dt.getDay()] || '星期日'
  const [h, m] = timeStr.split(':')
  const shichenText = SHICHEN_ZHI_MAP[timeStr] || '午'
  const lunar = approximateLunar(dateStr, timeStr)
  const solar = `${dt.getFullYear()}年${dt.getMonth() + 1}月${dt.getDate()}日 ${weekDay} ${h}点${m}分`
  const lunarText = `${lunar.yearText}年 ${lunar.monthText}${lunar.dayText} ${lunar.shichen}时`
  // 起运
  let qiYunLabel = '（信息暂缺）'
  let qiYunDate = ''
  try {
    if (bd) {
      const { calcDaYunStart } = require('./rules/dashunRules')
      const birthDate = new Date(`${bd.birthday}T${bd.birthTime}:00`)
      const yearGan = chart.sixLines.year.gan as HeavenlyStem
      const yy = getStemYinYang(yearGan)
      const isShun = (gender === 'male' && yy === '阳') || (gender === 'female' && yy === '阴')
      const qir: any = calcDaYunStart?.(birthDate, isShun, chart.sixLines.year.gan as HeavenlyStem, gender)
      if (qir) {
        const labelYinYang = yy === '阳' ? '阳年' : '阴年'
        const labelGender = gender === 'male' ? '生男' : '生女'
        const labelShunNi = isShun ? '顺排' : '逆排'
        const days = qir.qiYunDays ?? 0
        const years = Math.floor(days / 3)
        const remain = days - years * 3
        const months = Math.floor(remain * 4)
        qiYunLabel = `（${labelYinYang}${labelGender}）出生后${years}岁${months}月0日上运（${labelShunNi}）`
        if (qir.qiYunDate instanceof Date) {
          const qy = qir.qiYunDate as Date
          qiYunDate = `于公历 ${qy.getFullYear()}年${qy.getMonth() + 1}月${qy.getDate()}日 起运`
        } else if (typeof qir.qiYunDate === 'string') {
          qiYunDate = `于公历 ${qir.qiYunDate} 起运`
        }
      }
    }
  } catch { /* ignore */ }
  return {
    ganZaoLabel: gender === 'male' ? '乾造' : '坤造',
    zodiac,
    yearNaYin,
    solarDate: solar,
    lunarDate: lunarText,
    qiYunLabel,
    qiYunDate,
    gender,
    weekDay,
    shichen: shichenText,
  }
}

// ======================= 四柱构建 =======================

function buildPillars(chart: BaZiChart): ProPillarInfo[] {
  const dayGan = chart.sixLines.day.gan as HeavenlyStem
  const dayGanElement = getStemElement(dayGan) as FiveElement
  const relatedShens = getRelatedShens(dayGan)
  const allZhis = [chart.sixLines.year.zhi, chart.sixLines.month.zhi, chart.sixLines.day.zhi, chart.sixLines.hour.zhi]
  // 月令旺衰判断（四时旺相休囚死）
  const monthZhi = chart.sixLines.month.zhi
  const seasonElement = getBranchElement(monthZhi) as FiveElement
  const WANG_SHUAI: Record<FiveElement, [FiveElement, WuXingWangShuai][]> = {
    木: [['木', '旺'], ['火', '相'], ['水', '休'], ['金', '囚'], ['土', '死']],
    火: [['火', '旺'], ['土', '相'], ['木', '休'], ['水', '囚'], ['金', '死']],
    土: [['土', '旺'], ['金', '相'], ['火', '休'], ['木', '囚'], ['水', '死']],
    金: [['金', '旺'], ['水', '相'], ['土', '休'], ['火', '囚'], ['木', '死']],
    水: [['水', '旺'], ['木', '相'], ['金', '休'], ['土', '囚'], ['火', '死']],
  }
  const wsMap = new Map(WANG_SHUAI[seasonElement])
  function wangShuaiOf(el: FiveElement): WuXingWangShuai {
    return (wsMap.get(el) || '休') as WuXingWangShuai
  }
  // 神煞按柱
  const shengShasRaw = calculateShenSha(chart.sixLines as any, dayGan, chart.birthInfo.gender)
  const shengShaFlat: ShenShaInfo[] = shengShasRaw.flatMap(cat => cat.items)
  try {
    const gc = checkGuChenGuaSu(chart.sixLines as any, dayGan, chart.birthInfo.gender)
    shengShaFlat.push(...gc)
  } catch { /* ignore */ }
  const byPillar = buildPillarShenSha(chart, shengShaFlat)
  // 四柱空亡：每柱自己的空亡（以各自柱干支查）
  const pillars: ProPillarInfo[] = PILLAR_META.map(meta => {
    const gz: GanZhi = chart.sixLines[meta.key] as GanZhi
    const gan = gz.gan as HeavenlyStem
    const zhi = gz.zhi as EarthlyBranch
    const ganEl = getStemElement(gan) as FiveElement
    const zhiEl = getBranchElement(zhi) as FiveElement
    const ganShenShi: ShenShi | null = meta.key === 'day' ? null : (relatedShens[gan] ?? null)
    // 地支藏干
    const rawCang = (chart.cangGan?.[zhi] ?? CANG_GAN?.[zhi]) as CangGan | undefined
    const list: ProCangGanItem[] = []
    const roles: ('本气' | '中气' | '余气')[] = ['本气', '中气', '余气']
    const cands = [rawCang?.ben, rawCang?.zhong, rawCang?.yao]
    cands.forEach((g, idx) => {
      if (!g) return
      const cg = g as HeavenlyStem
      const el = getStemElement(cg) as FiveElement
      const yy = getStemYinYang(cg) as '阳' | '阴'
      list.push({
        gan: cg,
        element: el,
        yinYang: yy,
        shenShi: (cg === gan && meta.key === 'day') ? null : (relatedShens[cg] ?? null),
        role: roles[idx],
      })
    })
    // 地支主气十神（本气藏干）
    const zhiSS: ShenShi | null = list[0]?.shenShi ?? null
    const zhiCangGanSS = list.map(x => x.shenShi).filter((x): x is ShenShi => !!x)
    // 空亡：每柱查自己的旬空
    const kw = kongWangOf(gan, zhi)
    // 十二长生：以日干查各支
    const changsheng = getChangSheng(dayGan, zhi)
    return {
      pillarKey: meta.key,
      pillarName: meta.name,
      gan,
      ganElement: ganEl,
      ganYinYang: getStemYinYang(gan) as '阳' | '阴',
      ganShenShi,
      ganChangSheng: null,
      ganColor: colorOf(ganEl),
      zhi,
      zhiElement: zhiEl,
      zhiYinYang: getBranchYinYang(zhi) as '阳' | '阴',
      zhiShenShi: zhiSS,
      zhiCangGanShenShis: zhiCangGanSS,
      zhiChangSheng: changsheng,
      zhiWangShuai: wangShuaiOf(zhiEl),
      zhiColor: colorOf(zhiEl),
      cangGanList: list,
      naYin: gz.naYin || getNaYin(gan, zhi),
      kongWang: kw,
      shenShaList: byPillar[meta.key] || [],
      changSheng: changsheng,
    }
  })
  return pillars
}

// ======================= 大运/流年/流月 =======================

function buildDaYun(chart: BaZiChart, pipeline: BaZiPipelineResult | null): ProDaYunRow[] {
  const dayGan = chart.sixLines.day.gan as HeavenlyStem
  const relatedShens = getRelatedShens(dayGan)
  const birthYear = parseInt((chart.birthInfo.birthDate || '1990').split('-')[0], 10)
  const steps: any[] = pipeline?.daYun?.steps ?? []

  // 解析 birthDate 为 Date（Asia/Shanghai 近似用本地 parse，之后校正）
  function getBirthDate(): Date {
    const b = chart.birthInfo.birthDate || '1990-01-01'
    const t = chart.birthInfo.birthTime || '00:00'
    return new Date(`${b}T${t}:00`)
  }

  let allSteps: any[] = []
  let curIdx = pipeline?.daYun?.currentStepIndex ?? -1

  if (steps && steps.length > 0) {
    allSteps = steps
  } else {
    try {
      const birthDate = getBirthDate()
      const monthZhi = chart.sixLines.month.zhi as EarthlyBranch
      const gender = (chart.birthInfo.gender === '女' || chart.birthInfo.gender === 'female') ? 'female' : 'male'
      const local = localGenerateDaYun(birthDate, dayGan, gender, monthZhi, 8) || []
      // 转换本地 LocalDaYunStep 为 allSteps 通用格式
      allSteps = local.map((s: LocalDaYunStep, idx: number) => ({
        index: s.index,
        startAge: s.startAge,
        endAge: s.endAge,
        startYear: s.startYear,
        endYear: s.endYear,
        ganZhi: { gan: s.ganZhi.gan, zhi: s.ganZhi.zhi },
      }))
      // 计算当前大运索引（按当前年份）
      const nowY = new Date().getFullYear()
      curIdx = allSteps.findIndex((s: any) => nowY >= s.startYear && nowY <= s.endYear)
    } catch (e) {
      allSteps = []
    }
  }

  if (allSteps.length === 0) return []

  return allSteps.map((s: any, idx: number) => {
    const gan = s.ganZhi?.gan as HeavenlyStem
    const zhi = s.ganZhi?.zhi as EarthlyBranch
    const cangGanList = buildCangGanForZhi(zhi, relatedShens, dayGan)
    return {
      index: idx,
      startAge: s.startAge ?? 0,
      endAge: s.endAge ?? 0,
      startYear: s.startYear ?? 0,
      endYear: s.endYear ?? 0,
      gan,
      zhi,
      ganElement: getStemElement(gan) as FiveElement,
      zhiElement: getBranchElement(zhi) as FiveElement,
      ganShenShi: relatedShens[gan] ?? null,
      zhiShenShi: cangGanList[0]?.shenShi ?? (relatedShens[(CANG_GAN?.[zhi]?.ben as HeavenlyStem)] ?? null),
      naYin: getNaYin(gan, zhi),
      changSheng: getChangSheng(dayGan, zhi),
      wangShuai: s.wangShuai ?? null,
      shenSha: quickShenShaOfGZ(gan, zhi, dayGan, chart.sixLines.year.zhi as EarthlyBranch),
      isCurrent: idx === curIdx,
      cangGanList,
    }
  })
}

function buildLiuNian(chart: BaZiChart, pipeline: BaZiPipelineResult | null): ProLiuNianRow[] {
  const dayGan = chart.sixLines.day.gan as HeavenlyStem
  const relatedShens = getRelatedShens(dayGan)
  const birthYear = parseInt((chart.birthInfo.birthDate || '1990').split('-')[0], 10)
  const years: any[] = pipeline?.liuNian?.years ?? []
  const nowY = new Date().getFullYear()

  let allYears: any[] = []
  if (years && years.length > 0) {
    allYears = years
  } else {
    // Fallback: 以当前年份为中心 前后 15 年（共31年）
    const start = nowY - 15
    const end = nowY + 15
    for (let y = start; y <= end; y++) {
      const gz = localGetLiuNian(y)
      allYears.push({ year: y, ganZhi: { gan: gz.gan, zhi: gz.zhi }, isCurrentYear: y === nowY })
    }
  }

  return allYears.map((y: any) => {
    const gan = y.ganZhi?.gan as HeavenlyStem
    const zhi = y.ganZhi?.zhi as EarthlyBranch
    const cangGanList = buildCangGanForZhi(zhi, relatedShens, dayGan)
    return {
      year: y.year,
      age: y.year - birthYear,
      gan,
      zhi,
      ganElement: getStemElement(gan) as FiveElement,
      zhiElement: getBranchElement(zhi) as FiveElement,
      ganShenShi: relatedShens[gan] ?? null,
      zhiShenShi: cangGanList[0]?.shenShi ?? (relatedShens[(CANG_GAN?.[zhi]?.ben as HeavenlyStem)] ?? null),
      naYin: getNaYin(gan, zhi),
      changSheng: getChangSheng(dayGan, zhi),
      shenSha: quickShenShaOfGZ(gan, zhi, dayGan, chart.sixLines.year.zhi as EarthlyBranch),
      isCurrent: y.year === nowY || y.isCurrentYear === true,
      cangGanList,
    }
  })
}

function buildLiuYue(chart: BaZiChart, pipeline: BaZiPipelineResult | null): ProLiuYueRow[] {
  const dayGan = chart.sixLines.day.gan as HeavenlyStem
  const relatedShens = getRelatedShens(dayGan)
  const months: any[] = pipeline?.liuYue?.months ?? []

  let allMonths: any[] = []
  if (months && months.length > 0) {
    allMonths = months
  } else {
    // Fallback: 取当前公历年 12 个节气月（1月至12月）
    const defaultYear = new Date().getFullYear()
    const SOLAR_TERMS: string[] = [
      '立春','惊蛰','清明','立夏','芒种','小暑',
      '立秋','白露','寒露','立冬','大雪','小寒',
    ]
    for (let m = 1; m <= 12; m++) {
      const gz = localGetLiuYue(defaultYear, m)
      allMonths.push({
        monthName: SOLAR_TERMS[m - 1],
        monthIndex: m,
        ganZhi: { gan: gz.gan, zhi: gz.zhi },
      })
    }
  }

  return allMonths.map((m: any) => {
    const gan = m.ganZhi?.gan as HeavenlyStem
    const zhi = m.ganZhi?.zhi as EarthlyBranch
    const cangGanList = buildCangGanForZhi(zhi, relatedShens, dayGan)
    return {
      solarTerm: m.monthName ?? '',
      monthIndex: m.monthIndex ?? 0,
      gan,
      zhi,
      ganElement: getStemElement(gan) as FiveElement,
      zhiElement: getBranchElement(zhi) as FiveElement,
      ganShenShi: relatedShens[gan] ?? null,
      zhiShenShi: cangGanList[0]?.shenShi ?? (relatedShens[(CANG_GAN?.[zhi]?.ben as HeavenlyStem)] ?? null),
      shenSha: quickShenShaOfGZ(gan, zhi, dayGan, chart.sixLines.year.zhi as EarthlyBranch),
      cangGanList,
    }
  })
}

// ======================= 流日计算 =======================

/**
 * 流日干支计算（简化版：以已知甲子日为基准的 offset）
 * 参考：1900-01-31 为 甲辰日。本实现以 1900-01-01 推算。
 * 本函数仅用于 UI 展示级的粗排盘，不保证与《万年历》100% 重合。
 */
export function calcLiuRiGanZhi(dateStr: string): { gan: HeavenlyStem; zhi: EarthlyBranch } {
  const baseDate = new Date('1900-01-01T00:00:00Z')
  const target = new Date(`${dateStr}T00:00:00Z`)
  const diffDays = Math.round((target.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24))
  // 1900-01-01 的干支：以公认的基准——甲戌日（用于演示，可根据需要替换）
  const BASE_GAN_IDX = 0  // 甲
  const BASE_ZHI_IDX = 10 // 戌
  const ganIdx = ((diffDays + BASE_GAN_IDX) % 60 + 60) % 60 % 10
  const zhiIdx = ((diffDays + BASE_ZHI_IDX) % 60 + 60) % 60 % 12
  return {
    gan: HEAVENLY_STEMS[ganIdx] as HeavenlyStem,
    zhi: EARTHLY_BRANCHES[zhiIdx] as EarthlyBranch,
  }
}

/** 生成某一年某节气月的全部流日（以节气切月） */
export function buildLiuRiForMonth(
  chart: BaZiChart,
  year: number,
  liuYueRow: ProLiuYueRow,
): ProLiuRiRow[] {
  const dayGan = chart.sixLines.day.gan as HeavenlyStem
  const relatedShens = getRelatedShens(dayGan)
  // 简化：按公历月近似（节气对应大致公历月份）
  const SOLAR_TERM_TO_MONTH: Record<string, number> = {
    立春: 2, 惊蛰: 3, 清明: 4, 立夏: 5, 芒种: 6, 小暑: 7,
    立秋: 8, 白露: 9, 寒露: 10, 立冬: 11, 大雪: 12, 小寒: 1,
  }
  const m = SOLAR_TERM_TO_MONTH[liuYueRow.solarTerm] ?? (liuYueRow.monthIndex + 2)
  const daysInMonth = new Date(year, m, 0).getDate()
  const rows: ProLiuRiRow[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(m).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    const ds = `${year}-${mm}-${dd}`
    const { gan, zhi } = calcLiuRiGanZhi(ds)
    const cangGanList = buildCangGanForZhi(zhi, relatedShens, dayGan)
    rows.push({
      date: ds,
      gan,
      zhi,
      ganElement: getStemElement(gan) as FiveElement,
      zhiElement: getBranchElement(zhi) as FiveElement,
      ganShenShi: relatedShens[gan] ?? null,
      zhiShenShi: cangGanList[0]?.shenShi ?? (relatedShens[(CANG_GAN?.[zhi]?.ben as HeavenlyStem)] ?? null),
      naYin: getNaYin(gan, zhi),
      shenSha: quickShenShaOfGZ(gan, zhi, dayGan, chart.sixLines.year.zhi as EarthlyBranch),
      cangGanList,
    })
  }
  return rows
}

// ======================= 统一入口 =======================

export function buildProPaiPan(
  chart: BaZiChart,
  pipeline: BaZiPipelineResult | null,
  birthData: BirthData | null,
): ProPaiPan {
  const birth = buildBirthInfo(chart, birthData)
  const pillars = buildPillars(chart)
  const relations = summarizeRelations(chart)
  const daYun = buildDaYun(chart, pipeline)
  const liuNian = buildLiuNian(chart, pipeline)
  const liuYue = buildLiuYue(chart, pipeline)
  return {
    birth,
    pillars,
    relations,
    daYun,
    liuNian,
    liuYue,
    liuRi: [],
  }
}
