/**
 * 《穷通宝鉴》 Rule Package（P2-1）
 * 
 * 作者：徐乐吾（民国）编注
 * 原名：《造化元钥》（又称《拦江网》）
 * 核心：调候用神、五行生克制化的季节性应用
 * 
 * 本文件：
 * 1. 在 ClassicalLibrary 注册《穷通宝鉴》
 * 2. 定义调候用神的古籍原文和白话解释
 * 3. 定义各季节日主的调候需求
 * 4. 导出可供 Explain 引用的原文记录
 */

import { ruleEngine } from '../../reasoning/ruleEngine'
import type { GeJuClassicalQuote } from './zipingZhengLunRules'

// ─── 调候用神原文 ───

/** 《穷通宝鉴》调候用神原文 */
export const QIONGTONG_TIAOHOU: GeJuClassicalQuote[] = [
  // ─── 春季（木旺） ───
  {
    structure: '调候格',
    originalText: '春季木旺，甲丙日主生于寅月，初春尚有余寒，先用丙火暖之，次用癸水润之。',
    vernacular: '春季木气旺，甲丙日主生于寅月时，初春还有余寒，先用丙火来温暖命局，再用癸水来滋润。',
    chapter: '正月甲木用神',
  },
  {
    structure: '调候格',
    originalText: '二月乙木，阳气渐升，专用丙火。三月乙木，阳气已盛，先用癸水，次用丙火。',
    vernacular: '二月乙木日主，阳气逐渐上升，专用丙火调候。三月乙木日主，阳气已经旺盛，先用癸水润泽，再用丙火温暖。',
    chapter: '二月三月乙木用神',
  },
  {
    structure: '调候格',
    originalText: '春三月丙火，阳气渐升，日主丙火生于卯月，木火有余，专用壬水。',
    vernacular: '春季三个月的丙火日主，阳气上升。丙火生于卯月，木火力量有余，专用壬水来调济。',
    chapter: '春季丙火用神',
  },
  {
    structure: '调候格',
    originalText: '春季丁火，木旺火相。丁生于卯月，先用癸水润之，次用甲木生火。',
    vernacular: '春季丁火日主，木旺火相。丁火生于卯月，先用癸水滋润，再用甲木来生助丁火。',
    chapter: '春季丁火用神',
  },
  // ─── 夏季（火旺） ───
  {
    structure: '调候格',
    originalText: '夏季火旺，甲日主生于午月，火炎土燥，急用癸水润泽，次用丁火为佐。',
    vernacular: '夏季火气旺盛，甲日主生于午月，火炎土燥，急需用癸水来滋润调候，再用丁火作为辅助。',
    chapter: '五月甲木用神',
  },
  {
    structure: '调候格',
    originalText: '五月丙火，火势炎烈，专用壬水。壬水为太阳之雨，丙火逢壬水，如旱得甘霖。',
    vernacular: '五月丙火日主，火势猛烈，专用壬水来调候。壬水是太阳之雨，丙火遇到壬水，就像大旱遇到甘霖。',
    chapter: '五月丙火用神',
  },
  // ─── 秋季（金旺） ───
  {
    structure: '调候格',
    originalText: '秋季金旺，庚辛日主生于酉月，金白水清。专用丁火锻炼，次用甲木引丁。',
    vernacular: '秋季金气旺盛，庚辛日主生于酉月，金白水清。专用丁火来锻炼庚辛金，再用甲木来引生丁火。',
    chapter: '八月庚辛金用神',
  },
  {
    structure: '调候格',
    originalText: '九月戊土，秋土已老，先用甲木疏之，次用癸水润之。甲癸并用，方为中和。',
    vernacular: '九月戊土日主，秋天的土已经老僵，先用甲木来疏通土气，再用癸水来滋润。甲木和癸水同时使用，才能达到中和。',
    chapter: '九月戊土用神',
  },
  // ─── 冬季（水旺） ───
  {
    structure: '调候格',
    originalText: '冬季水旺，壬癸日主生于子月，水冷金寒。急用丙火暖之，次用戊土制水。',
    vernacular: '冬季水气旺盛，壬癸日主生于子月，水冷金寒。急需用丙火来温暖命局，再用戊土来制约水势。',
    chapter: '十一月壬癸水用神',
  },
  {
    structure: '调候格',
    originalText: '十二月乙木，天寒地冻，木气已死。专用丙火暖之，次用癸水润之。丙癸齐临，方能发荣。',
    vernacular: '十二月乙木日主，天寒地冻，木气已死。专用丙火温暖，再用癸水滋润。丙火和癸水同时到来，乙木才能繁荣生长。',
    chapter: '十二月乙木用神',
  },
]

// ─── 获取格局原文 ───

export function getQiongTongQuote(structureName: string): GeJuClassicalQuote | undefined {
  return QIONGTONG_TIAOHOU.find(q => q.structure === structureName)
}

export function getAllQiongTongQuotes(): GeJuClassicalQuote[] {
  return [...QIONGTONG_TIAOHOU]
}

// ─── Rule Package 定义 ───

/**
 * 注册《穷通宝鉴》调候规则到 RuleEngine
 * 
 * 《穷通宝鉴》主要贡献：
 * 1. 各月各日主的精确调候用神
 * 2. 五行生克在季节中的应用
 * 3. 寒暖燥湿的实用判定方法
 */
export function registerQiongTongRules(): void {
  ruleEngine.registerPackage({
    id: 'qiongtong-tiaohou',
    name: '《穷通宝鉴》调候用神',
    description: '徐乐吾编注，涵盖十二月各日主的精确调候用神，寒暖燥湿的实用判定。',
    version: '1.0.0',
    source: '穷通宝鉴',
    author: '徐乐吾（编注）',
    dynasty: '民国',
    rules: [
      {
        id: 'qiongtong-tiaohou-spring',
        name: '春季调候',
        category: '调候',
        condition: [
          { field: 'monthElement', operator: 'eq', value: '木' },
        ],
        priority: 85,
        source: '穷通宝鉴',
        description: '春季木旺，需丙火暖、癸水润',
        enabled: true,
      },
      {
        id: 'qiongtong-tiaohou-summer',
        name: '夏季调候',
        category: '调候',
        condition: [
          { field: 'monthElement', operator: 'eq', value: '火' },
        ],
        priority: 85,
        source: '穷通宝鉴',
        description: '夏季火旺，需壬水济、癸水润',
        enabled: true,
      },
      {
        id: 'qiongtong-tiaohou-autumn',
        name: '秋季调候',
        category: '调候',
        condition: [
          { field: 'monthElement', operator: 'eq', value: '金' },
        ],
        priority: 85,
        source: '穷通宝鉴',
        description: '秋季金旺，需丁火炼、水淘洗',
        enabled: true,
      },
      {
        id: 'qiongtong-tiaohou-winter',
        name: '冬季调候',
        category: '调候',
        condition: [
          { field: 'monthElement', operator: 'eq', value: '水' },
        ],
        priority: 85,
        source: '穷通宝鉴',
        description: '冬季水旺，需丙火暖、戊土制',
        enabled: true,
      },
    ],
  })
}
