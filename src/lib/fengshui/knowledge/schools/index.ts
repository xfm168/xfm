/**
 * 流派知识库
 */

import type { SchoolInfo, FengShuiSchool } from '../types'

export const FENGSHUI_SCHOOLS: SchoolInfo[] = [
  {
    id: 'bazhai',
    name: '八宅派',
    fullName: '八宅明镜派',
    origin: '唐代',
    period: '唐至今',
    founder: '杨筠松',
    description: '八宅派是最普及的阳宅风水流派，将住宅分为东四宅与西四宅，以九星飞布论吉凶。操作简便，适合初学者。',
    corePrinciples: [
      '东四宅（震巽坎离）配东四命',
      '西四宅（乾坤艮兑）配西四命',
      '门、主、灶三者相生相克',
      '九星飞布定吉凶',
      '大游年歌诀',
    ],
    keyTexts: [
      '《八宅明镜》',
      '《阳宅三要》',
      '《阳宅十书》',
    ],
    strengths: [
      '理论体系完整',
      '操作简便易行',
      '普及度最高',
      '适合阳宅应用',
    ],
    limitations: [
      '只分两类，略显粗糙',
      '不考虑元运变化',
      '与玄空派观点多有冲突',
    ],
    representatives: ['杨筠松', '赵九峰', '王君荣'],
    modernApplication: '现代城市住宅中应用最广，尤其适合单元楼、公寓等小型住宅的风水分析。',
  },
  {
    id: 'xuankong',
    name: '玄空派',
    fullName: '玄空飞星派',
    origin: '清代',
    period: '清至今',
    founder: '蒋大鸿（集大成者）',
    description: '玄空派以三元九运为基础，飞星布九宫，讲究"山管人丁水管财"，是现代最流行的高端风水流派。',
    corePrinciples: [
      '三元九运',
      '飞星排盘',
      '山星、向星、运星',
      '旺山旺向',
      '上山下水',
      '七星打劫',
    ],
    keyTexts: [
      '《沈氏玄空学》',
      '《青囊经》',
      '《地理辨正疏》',
    ],
    strengths: [
      '体系精密复杂',
      '考虑时间因素（元运）',
      '应验率较高',
      '适合做精细分析',
    ],
    limitations: [
      '学习难度大',
      '门派众多，方法不一',
      '需要精确的坐向度数',
      '争议较多',
    ],
    representatives: ['蒋大鸿', '沈竹礽', '章仲山'],
    modernApplication: '常用于商业地产、办公楼、豪宅等高端项目的风水规划。',
  },
  {
    id: 'sanhe',
    name: '三合派',
    fullName: '三合长生派',
    origin: '明代',
    period: '明至今',
    founder: '杨公（托名）',
    description: '三合派以十二长生为基础，讲究生、旺、墓三合局，是传统阴宅风水的主流流派，也用于阳宅。',
    corePrinciples: [
      '十二长生',
      '三合局（申子辰、亥卯未、寅午戌、巳酉丑）',
      '左水倒右、右水倒左',
      '四大局',
    ],
    keyTexts: [
      '《地理五诀》',
      '《入地眼全书》',
      '《罗经透解》',
    ],
    strengths: [
      '理论基础扎实',
      '应用范围广',
      '阴宅阳宅皆可用',
      '经验积累丰富',
    ],
    limitations: [
      '理论偏静态',
      '不考虑元运',
      '与玄空派观点不同',
    ],
    representatives: ['杨筠松', '赵九峰'],
    modernApplication: '多用于阴宅风水，也应用于大型住宅区、园区的规划布局。',
  },
  {
    id: 'sanyuan',
    name: '三元派',
    fullName: '三元九运派',
    origin: '元明时期',
    period: '元至今',
    founder: '刘秉忠',
    description: '三元派以180年为一大元，分为上中下三元，每元60年，每运20年。认为地运随时间变化，吉凶轮替。',
    corePrinciples: [
      '三元九运',
      '天运、地运、人运',
      '旺衰轮替',
      '时运结合',
    ],
    keyTexts: [
      '《青囊经》',
      '《天玉经》',
      '《都天宝照经》',
    ],
    strengths: [
      '考虑时间维度',
      '与玄空派互补',
      '宏观视野强',
    ],
    limitations: [
      '偏宏观，微观不足',
      '多与其他流派结合使用',
    ],
    representatives: ['刘秉忠', '蒋大鸿'],
    modernApplication: '常与玄空派结合，用于判断大环境的运势走向。',
  },
  {
    id: 'zangfeng',
    name: '藏风派',
    fullName: '藏风聚气派',
    origin: '晋代',
    period: '晋至今',
    founder: '郭璞',
    description: '藏风派是最古老的风水流派，核心思想是"藏风聚气"，强调环境对人的影响，是风水理论的源头。',
    corePrinciples: [
      '藏风聚气',
      '气乘风则散，界水则止',
      '山环水抱',
      '负阴抱阳',
      '天人合一',
    ],
    keyTexts: [
      '《葬经》',
      '《黄帝宅经》',
      '《青囊经》',
    ],
    strengths: [
      '风水理论源头',
      '哲学思想深厚',
      '与现代环境心理学相通',
      '适用性最广',
    ],
    limitations: [
      '理论偏抽象',
      '操作性不如八宅、玄空',
      '需要较高的领悟力',
    ],
    representatives: ['郭璞', '黄帝（托名）'],
    modernApplication: '是所有风水流派的理论基础，也应用于现代景观设计、城市规划。',
  },
  {
    id: 'modern',
    name: '现代风水',
    fullName: '现代实用风水',
    origin: '近现代',
    period: '民国至今',
    founder: '多位大师',
    description: '现代风水结合传统理论与现代科学，强调实用性和可验证性，代表人物有苏民峰、李居明等。',
    corePrinciples: [
      '传统理论现代化',
      '科学验证',
      '实用为主',
      '结合现代建筑',
      '强调体验和感受',
    ],
    keyTexts: [
      '《现代住宅风水》',
      '《城市阳宅布局宝典》',
      '《图解阳宅风水大全》',
      '《苏民峰风生水起》',
    ],
    strengths: [
      '贴近现代人生活',
      '实用性强',
      '容易理解和应用',
      '与现代建筑结合好',
    ],
    limitations: [
      '理论深度不如传统流派',
      '商业化较重',
      '水平参差不齐',
    ],
    representatives: ['苏民峰', '李居明', '麦玲玲'],
    modernApplication: '广泛应用于现代城市住宅、商业空间、办公环境的风水调整。',
  },
]

// ============ 工具函数 ============

export function getSchoolById(id: FengShuiSchool): SchoolInfo | undefined {
  return FENGSHUI_SCHOOLS.find(s => s.id === id)
}

export function getSchoolByName(name: string): SchoolInfo | undefined {
  return FENGSHUI_SCHOOLS.find(s => 
    s.name === name || 
    s.fullName === name ||
    s.id === name
  )
}

export function getAllSchools(): SchoolInfo[] {
  return FENGSHUI_SCHOOLS
}
