/**
 * 玄风八字配置中心 (Config Center)
 * V4.8.1 Baseline
 *
 * 所有流派差异必须进入配置中心，禁止在代码中写死流派逻辑。
 */

// ========== 排盘配置 ==========

export interface PaiPanConfig {
  /** 子初换日 / 子正换日 */
  dayChangeMode: 'zichu' | 'zizheng'
  /** 晚子时归属：当日日干起 / 次日日干起 */
  lateZiMode: 'sameDay' | 'nextDay'
  /** 真太阳时开关 */
  useSolarTime: boolean
  /** 默认时区 */
  defaultTimezone: string
  /** 自动识别夏令时 */
  autoDST: boolean
  /** 节气精度 */
  solarTermPrecision: 'minute' | 'second'
}

// ========== 力量配置 ==========

export interface LiLiangConfig {
  touGanWeight: number
  tongGenWeight: number
  deLingWeight: number
  deDiWeight: number
  deShiWeight: number
  heHuaAffectStrength: boolean
  chongKeAffectStrength: boolean
}

// ========== 格局配置 ==========

export interface GeJuConfig {
  priority: string[]
  enableCongGe: boolean
  enableHuaGe: boolean
  enableZhuanWang: boolean
  zhuanWangThreshold: number
  congGeThreshold: number
  zhengGeMethod: 'touGan' | 'benQi' | 'all'
}

// ========== 喜用神配置 ==========

export interface XiYongConfig {
  method: 'fuyi' | 'tiaohou_first' | 'geju_first' | 'comprehensive'
  tiaohouWeight: number
  fuyiWeight: number
  gejuWeight: number
  bingYaoWeight: number
  tongGuanWeight: number
  enableBingYao: boolean
  enableTongGuan: boolean
}

// ========== 大运流年配置 ==========

export interface DaYunConfig {
  qiYunMethod: 'sanzheYisui' | 'shunNi'
  yunStep: number
  yunYears: number
  dayunLiuNianInteraction: boolean
}

// ========== 输出配置 ==========

export interface OutputConfig {
  enableExplain: boolean
  enableEvidenceChain: boolean
  enableRuleReference: boolean
  enableClassicReference: boolean
  aiMode: 'explain_only' | 'expand' | 'full'
}

// ========== 完整 Profile ==========

export interface BaziProfile {
  id: string
  name: string
  description: string
  preset: 'gufa' | 'xiandai' | 'taiwan' | 'hongkong' | 'custom'

  paiPan: PaiPanConfig
  liLiang: LiLiangConfig
  geJu: GeJuConfig
  xiYong: XiYongConfig
  daYun: DaYunConfig
  output: OutputConfig
}

// ========== 内置预设 ==========

/** 古法（默认） */
export const GUFa_PROFILE: BaziProfile = {
  id: 'gufa',
  name: '古法（传统子平）',
  description: '传统子平法，调候优先，子初换日',
  preset: 'gufa',
  paiPan: {
    dayChangeMode: 'zichu',
    lateZiMode: 'sameDay',
    useSolarTime: false,
    defaultTimezone: 'UTC+8',
    autoDST: false,
    solarTermPrecision: 'second',
  },
  liLiang: {
    touGanWeight: 1.0,
    tongGenWeight: 1.0,
    deLingWeight: 1.0,
    deDiWeight: 1.0,
    deShiWeight: 1.0,
    heHuaAffectStrength: true,
    chongKeAffectStrength: true,
  },
  geJu: {
    priority: ['zhengGe', 'congGe', 'huaGe', 'zhuanWang'],
    enableCongGe: true,
    enableHuaGe: true,
    enableZhuanWang: true,
    zhuanWangThreshold: 85,
    congGeThreshold: 20,
    zhengGeMethod: 'touGan',
  },
  xiYong: {
    method: 'comprehensive',
    tiaohouWeight: 0.35,
    fuyiWeight: 0.25,
    gejuWeight: 0.20,
    bingYaoWeight: 0.10,
    tongGuanWeight: 0.10,
    enableBingYao: false,
    enableTongGuan: false,
  },
  daYun: {
    qiYunMethod: 'sanzheYisui',
    yunStep: 8,
    yunYears: 10,
    dayunLiuNianInteraction: true,
  },
  output: {
    enableExplain: true,
    enableEvidenceChain: true,
    enableRuleReference: true,
    enableClassicReference: true,
    aiMode: 'expand',
  },
}

/** 现代派 */
export const XIANDAI_PROFILE: BaziProfile = {
  ...GUFa_PROFILE,
  id: 'xiandai',
  name: '现代派（扶抑为主）',
  description: '扶抑优先，子正换日',
  preset: 'xiandai',
  paiPan: {
    ...GUFa_PROFILE.paiPan,
    dayChangeMode: 'zizheng',
    lateZiMode: 'nextDay',
  },
  xiYong: {
    ...GUFa_PROFILE.xiYong,
    method: 'fuyi',
    fuyiWeight: 0.50,
    tiaohouWeight: 0.20,
  },
}

/** 台湾派 */
export const TAIWAN_PROFILE: BaziProfile = {
  ...GUFa_PROFILE,
  id: 'taiwan',
  name: '台湾派（格局优先）',
  description: '格局优先，子初换日',
  preset: 'taiwan',
  xiYong: {
    ...GUFa_PROFILE.xiYong,
    method: 'geju_first',
    gejuWeight: 0.45,
    fuyiWeight: 0.20,
  },
}

/** 香港派 */
export const HONGKONG_PROFILE: BaziProfile = {
  ...GUFa_PROFILE,
  id: 'hongkong',
  name: '香港派（调候+纳音）',
  description: '调候优先，子正换日',
  preset: 'hongkong',
  paiPan: {
    ...GUFa_PROFILE.paiPan,
    dayChangeMode: 'zizheng',
  },
}

/** 默认配置 */
export const DEFAULT_PROFILE: BaziProfile = GUFa_PROFILE

/** 获取预设配置 */
export function getProfile(preset: string): BaziProfile {
  switch (preset) {
    case 'gufa':
      return GUFa_PROFILE
    case 'xiandai':
      return XIANDAI_PROFILE
    case 'taiwan':
      return TAIWAN_PROFILE
    case 'hongkong':
      return HONGKONG_PROFILE
    default:
      return DEFAULT_PROFILE
  }
}
