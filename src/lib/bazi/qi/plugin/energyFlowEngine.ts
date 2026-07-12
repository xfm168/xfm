/**
 * EnergyFlowEngine — P4.4 五行能量流动引擎
 *
 * 古籍依据：
 *   《易经》："五行之气，流行不息。" — 五行流动
 *   《道德经》："万物负阴而抱阳，冲气以为和。" — 阴阳调和
 *
 * 核心思路：
 *   不是静态的"金35%木20%"统计，而是生成五行能量流动数据，
 *   供前端动画展示五行生克循环。
 *
 *   1. 根据日主、月令、四柱计算初始五行能量分布
 *   2. 生成相生流动和相克流动
 *   3. 生成多个时间步快照（模拟四季变化对五行的影响）
 *   4. 计算五行平衡度
 *
 * 原则：
 *   - 纯 Plugin，不修改 Kernel
 *   - 所有注释使用中文
 *   - 使用单引号字符串，不使用反引号模板字符串
 */

import type { FiveElement, EarthlyBranch, HeavenlyStem } from '../../types'
import { STEM_ELEMENT, BRANCH_ELEMENT, GENERATE, OVERCOME } from '../../../core'

// ─── 类型导出 ───

/** 五行能量节点 */
export interface EnergyNode {
  /** 五行名称：金木水火土 */
  element: string
  /** 节点显示名称 */
  name: string
  /** 能量值 0-100 */
  energy: number
  /** 在命局中的角色 */
  role: string
}

/** 五行能量流动 */
export interface EnergyFlow {
  /** 源元素 */
  from: string
  /** 目标元素 */
  to: string
  /** 流动类型：相生或相克 */
  type: '生' | '克'
  /** 流动量 0-100 */
  amount: number
  /** 流动描述 */
  label: string
}

/** 能量快照（供前端动画逐帧播放） */
export interface EnergySnapshot {
  /** 时间步（0-360度，模拟一年四季循环） */
  timestamp: number
  /** 当前各五行能量值 */
  nodes: Array<{ element: string; energy: number }>
  /** 当前流动状态 */
  flows: EnergyFlow[]
}

/** 能量流动分析结果 */
export interface EnergyFlowResult {
  /** 生成时间 */
  generatedAt: string
  /** 初始五行分布 */
  initialNodes: EnergyNode[]
  /** 五行生克循环顺序 */
  cycle: EnergyNode[]
  /** 所有能量流动 */
  flows: EnergyFlow[]
  /** 多个时间步快照（供动画） */
  snapshots: EnergySnapshot[]
  /** 五行平衡度 0-100 */
  balance: number
  /** 最旺五行 */
  dominantElement: string
  /** 最弱五行 */
  weakestElement: string
  /** 分析摘要 */
  summary: string
  /** 古籍引用 */
  classicalRef: string
}

// ─── 常量定义 ───

/** 五行列表（相生循环顺序） */
const WU_XING_CYCLE: FiveElement[] = ['木', '火', '土', '金', '水']



/** 五行中文名称 */
const ELEMENT_NAMES: Record<FiveElement, string> = {
  '木': '甲乙木',
  '火': '丙丁火',
  '土': '戊己土',
  '金': '庚辛金',
  '水': '壬癸水',
}



/** 地支藏干及对应权重 */
const BRANCH_HIDDEN_STEMS: Record<EarthlyBranch, Array<{ stem: HeavenlyStem; weight: number }>> = {
  '子': [{ stem: '癸', weight: 1.0 }],
  '丑': [{ stem: '己', weight: 0.6 }, { stem: '癸', weight: 0.25 }, { stem: '辛', weight: 0.15 }],
  '寅': [{ stem: '甲', weight: 0.6 }, { stem: '丙', weight: 0.25 }, { stem: '戊', weight: 0.15 }],
  '卯': [{ stem: '乙', weight: 1.0 }],
  '辰': [{ stem: '戊', weight: 0.5 }, { stem: '乙', weight: 0.25 }, { stem: '癸', weight: 0.25 }],
  '巳': [{ stem: '丙', weight: 0.6 }, { stem: '戊', weight: 0.25 }, { stem: '庚', weight: 0.15 }],
  '午': [{ stem: '丁', weight: 0.7 }, { stem: '己', weight: 0.3 }],
  '未': [{ stem: '己', weight: 0.6 }, { stem: '丁', weight: 0.25 }, { stem: '乙', weight: 0.15 }],
  '申': [{ stem: '庚', weight: 0.6 }, { stem: '壬', weight: 0.25 }, { stem: '戊', weight: 0.15 }],
  '酉': [{ stem: '辛', weight: 1.0 }],
  '戌': [{ stem: '戊', weight: 0.5 }, { stem: '辛', weight: 0.25 }, { stem: '丁', weight: 0.25 }],
  '亥': [{ stem: '壬', weight: 0.7 }, { stem: '甲', weight: 0.3 }],
}

/** 月令对五行的加成权重（得令者旺） */
const MONTH_BOOST: Record<EarthlyBranch, Partial<Record<FiveElement, number>>> = {
  '寅': { '木': 2.0, '火': 1.2, '水': 0.5 },
  '卯': { '木': 2.2, '火': 1.3, '金': 0.4 },
  '辰': { '土': 1.5, '木': 1.2, '水': 1.0 },
  '巳': { '火': 2.0, '土': 1.3, '金': 0.4 },
  '午': { '火': 2.2, '土': 1.5, '水': 0.3 },
  '未': { '土': 2.0, '火': 1.2, '水': 0.5 },
  '申': { '金': 2.0, '土': 1.2, '木': 0.5 },
  '酉': { '金': 2.2, '土': 1.3, '木': 0.3 },
  '戌': { '土': 1.8, '金': 1.2, '火': 1.0 },
  '亥': { '水': 2.0, '金': 1.3, '火': 0.4 },
  '子': { '水': 2.2, '金': 1.2, '土': 0.3 },
  '丑': { '土': 1.5, '水': 1.3, '火': 0.5 },
}

/** 日主五行在命局中的角色描述 */
const DAY_MASTER_ROLES: Record<FiveElement, string> = {
  '木': '日主（自身）',
  '火': '日主（自身）',
  '土': '日主（自身）',
  '金': '日主（自身）',
  '水': '日主（自身）',
}

/** 十神对应五行角色（以日主为参照） */
const SHEN_ROLE_MAP: Record<string, Record<FiveElement, string>> = {
  '木': { '木': '比肩帮身', '火': '食伤泄秀', '土': '财星耗身', '金': '官杀克身', '水': '印星生身' },
  '火': { '木': '印星生身', '火': '比肩帮身', '土': '食伤泄秀', '金': '财星耗身', '水': '官杀克身' },
  '土': { '木': '官杀克身', '火': '印星生身', '土': '比肩帮身', '金': '食伤泄秀', '水': '财星耗身' },
  '金': { '木': '财星耗身', '火': '官杀克身', '土': '印星生身', '金': '比肩帮身', '水': '食伤泄秀' },
  '水': { '木': '食伤泄秀', '火': '财星耗身', '土': '官杀克身', '金': '印星生身', '水': '比肩帮身' },
}

/** 四季对五行的季节性影响系数 */
const SEASON_PHASE: Array<{ name: string; startDeg: number; endDeg: number; boost: Partial<Record<FiveElement, number>> }> = [
  { name: '春（木旺）', startDeg: 0, endDeg: 90, boost: { '木': 1.4, '火': 1.1, '土': 0.9, '金': 0.7, '水': 0.8 } },
  { name: '夏（火旺）', startDeg: 90, endDeg: 180, boost: { '木': 0.8, '火': 1.4, '土': 1.0, '金': 0.6, '水': 0.7 } },
  { name: '秋（金旺）', startDeg: 180, endDeg: 270, boost: { '木': 0.7, '火': 0.7, '土': 0.9, '金': 1.4, '水': 1.1 } },
  { name: '冬（水旺）', startDeg: 270, endDeg: 360, boost: { '木': 0.8, '火': 0.6, '土': 0.7, '金': 1.1, '水': 1.4 } },
]

// ─── EnergyFlowEngine ───

/**
 * 五行能量流动引擎
 *
 * 根据命局四柱数据计算五行能量分布，
 * 生成相生/相克流动数据和多步快照，
 * 供前端动画渲染五行循环。
 */
export class EnergyFlowEngine {
  // ─── 公共方法 ───

  /**
   * 分析五行能量流动（核心方法）
   *
   * @param chartData - 命局数据，包含四柱天干地支等
   * @returns 完整的能量流动分析结果
   */
  analyze(chartData: Record<string, unknown>): EnergyFlowResult {
    // 1. 计算初始五行能量分布
    var rawEnergy = this.computeRawEnergy(chartData)
    var dayElement = this.getDayElement(chartData)

    // 2. 应用月令加成
    var monthBranch = this.getMonthBranch(chartData)
    var boostedEnergy = this.applyMonthBoost(rawEnergy, monthBranch)

    // 3. 归一化到 0-100
    var normalizedEnergy = this.normalizeEnergy(boostedEnergy)

    // 4. 构建初始节点
    var initialNodes = this.buildEnergyNodes(normalizedEnergy, dayElement)

    // 5. 构建五行循环节点
    var cycleNodes = this.buildCycleNodes(normalizedEnergy)

    // 6. 生成所有能量流动
    var flows = this.buildFlows(normalizedEnergy, dayElement)

    // 7. 生成时间步快照
    var snapshots = this.generateSnapshots(normalizedEnergy, monthBranch)

    // 8. 计算平衡度
    var balance = this.computeBalance(normalizedEnergy)

    // 9. 找出最旺最弱五行
    var dominantElement = this.findDominant(normalizedEnergy)
    var weakestElement = this.findWeakest(normalizedEnergy)

    // 10. 生成摘要
    var summary = this.buildSummary(normalizedEnergy, dayElement, balance, dominantElement, weakestElement)

    return {
      generatedAt: new Date().toISOString(),
      initialNodes: initialNodes,
      cycle: cycleNodes,
      flows: flows,
      snapshots: snapshots,
      balance: balance,
      dominantElement: dominantElement,
      weakestElement: weakestElement,
      summary: summary,
      classicalRef: '《易经》曰：五行之气，流行不息。《道德经》曰：万物负阴而抱阳，冲气以为和。',
    }
  }

  /**
   * 获取动画数据（供前端直接使用）
   *
   * @param chartData - 命局数据
   * @returns 包含快照、帧率和时长的动画参数
   */
  getAnimationData(chartData: Record<string, unknown>): { snapshots: EnergySnapshot[]; fps: number; duration: number } {
    var result = this.analyze(chartData)
    return {
      snapshots: result.snapshots,
      fps: 24,
      duration: result.snapshots.length / 24,
    }
  }

  /**
   * 获取五行平衡度（0-100，越高越均衡）
   *
   * @param chartData - 命局数据
   * @returns 平衡度分数
   */
  getBalance(chartData: Record<string, unknown>): number {
    var rawEnergy = this.computeRawEnergy(chartData)
    var monthBranch = this.getMonthBranch(chartData)
    var boostedEnergy = this.applyMonthBoost(rawEnergy, monthBranch)
    var normalizedEnergy = this.normalizeEnergy(boostedEnergy)
    return this.computeBalance(normalizedEnergy)
  }

  /**
   * 获取五行生克循环顺序
   *
   * @returns 五行相生循环数组 ['木','火','土','金','水']
   */
  getCycle(): string[] {
    return ['木', '火', '土', '金', '水']
  }

  // ─── 私有方法：能量计算 ───

  /**
   * 从四柱数据中提取原始五行能量
   *
   * 每个天干贡献 12 分，每个地支本气贡献 15 分，
   * 藏干按权重分配 10 分。
   */
  private computeRawEnergy(chartData: Record<string, unknown>): Record<FiveElement, number> {
    var energy: Record<FiveElement, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }

    // 提取四柱天干
    var stems = this.extractStems(chartData)
    for (var i = 0; i < stems.length; i++) {
      var stem = stems[i]
      var elem = STEM_ELEMENT[stem]
      if (elem) {
        // 日干自身权重更高
        var weight = 15
        energy[elem] = energy[elem] + weight
      }
    }

    // 提取四柱地支（含藏干）
    var branches = this.extractBranches(chartData)
    for (var j = 0; j < branches.length; j++) {
      var branch = branches[j]
      var hiddenStems = BRANCH_HIDDEN_STEMS[branch]
      if (hiddenStems) {
        for (var k = 0; k < hiddenStems.length; k++) {
          var hs = hiddenStems[k]
          var he = STEM_ELEMENT[hs.stem]
          if (he) {
            // 本气藏干权重为 15，中气 10，余气 6
            var branchWeight = hs.weight * 18
            energy[he] = energy[he] + branchWeight
          }
        }
      }
    }

    return energy
  }

  /**
   * 提取四柱天干数组
   */
  private extractStems(chartData: Record<string, unknown>): HeavenlyStem[] {
    var stems: HeavenlyStem[] = []

    // 尝试从 pillars 结构中提取
    var pillars = chartData['pillars'] as Array<Record<string, unknown>> | undefined
    if (pillars && Array.isArray(pillars)) {
      for (var i = 0; i < pillars.length; i++) {
        var p = pillars[i]
        if (p && typeof p['gan'] === 'string') {
          stems.push(p['gan'] as HeavenlyStem)
        }
      }
    }

    // 备选：直接从 chartData 中取 yearGan, monthGan, dayGan, hourGan
    if (stems.length === 0) {
      var keys = ['yearGan', 'monthGan', 'dayGan', 'hourGan']
      for (var j = 0; j < keys.length; j++) {
        var val = chartData[keys[j]]
        if (typeof val === 'string' && val.length === 1) {
          stems.push(val as HeavenlyStem)
        }
      }
    }

    return stems
  }

  /**
   * 提取四柱地支数组
   */
  private extractBranches(chartData: Record<string, unknown>): EarthlyBranch[] {
    var branches: EarthlyBranch[] = []

    // 尝试从 pillars 结构中提取
    var pillars = chartData['pillars'] as Array<Record<string, unknown>> | undefined
    if (pillars && Array.isArray(pillars)) {
      for (var i = 0; i < pillars.length; i++) {
        var p = pillars[i]
        if (p && typeof p['zhi'] === 'string') {
          branches.push(p['zhi'] as EarthlyBranch)
        }
      }
    }

    // 备选：直接从 chartData 中取 yearZhi, monthZhi, dayZhi, hourZhi
    if (branches.length === 0) {
      var keys = ['yearZhi', 'monthZhi', 'dayZhi', 'hourZhi']
      for (var j = 0; j < keys.length; j++) {
        var val = chartData[keys[j]]
        if (typeof val === 'string' && val.length === 1) {
          branches.push(val as EarthlyBranch)
        }
      }
    }

    return branches
  }

  /**
   * 获取日主天干五行
   */
  private getDayElement(chartData: Record<string, unknown>): FiveElement {
    // 优先从 dayGan 获取
    var dayGan = chartData['dayGan'] as HeavenlyStem | undefined
    if (dayGan && STEM_ELEMENT[dayGan]) {
      return STEM_ELEMENT[dayGan]
    }

    // 从 pillars 中获取日柱天干
    var pillars = chartData['pillars'] as Array<Record<string, unknown>> | undefined
    if (pillars && pillars.length >= 3) {
      var dayPillar = pillars[2]
      if (dayPillar && typeof dayPillar['gan'] === 'string') {
        var gan = dayPillar['gan'] as HeavenlyStem
        if (STEM_ELEMENT[gan]) {
          return STEM_ELEMENT[gan]
        }
      }
    }

    // 默认返回木
    return '木'
  }

  /**
   * 获取月令地支
   */
  private getMonthBranch(chartData: Record<string, unknown>): EarthlyBranch {
    var monthZhi = chartData['monthZhi'] as EarthlyBranch | undefined
    if (monthZhi && BRANCH_ELEMENT[monthZhi]) {
      return monthZhi
    }

    var pillars = chartData['pillars'] as Array<Record<string, unknown>> | undefined
    if (pillars && pillars.length >= 2) {
      var monthPillar = pillars[1]
      if (monthPillar && typeof monthPillar['zhi'] === 'string') {
        var zhi = monthPillar['zhi'] as EarthlyBranch
        if (BRANCH_ELEMENT[zhi]) {
          return zhi
        }
      }
    }

    // 默认寅月
    return '寅'
  }

  /**
   * 应用月令加成
   *
   * 得令的五行获得倍数加成，失令的五行被削弱。
   * 如寅月木旺，木得令，金水失令。
   */
  private applyMonthBoost(
    energy: Record<FiveElement, number>,
    monthBranch: EarthlyBranch
  ): Record<FiveElement, number> {
    var result: Record<FiveElement, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
    var boostMap = MONTH_BOOST[monthBranch]

    for (var i = 0; i < WU_XING_CYCLE.length; i++) {
      var elem = WU_XING_CYCLE[i]
      var baseVal = energy[elem]
      var boost = 1.0

      if (boostMap && boostMap[elem] !== undefined) {
        boost = boostMap[elem] as number
      }

      result[elem] = baseVal * boost
    }

    return result
  }

  /**
   * 归一化能量值到 0-100 范围
   *
   * 将总量映射到总和为 100 的比例，使前端展示更加直观。
   */
  private normalizeEnergy(energy: Record<FiveElement, number>): Record<FiveElement, number> {
    var total = 0
    for (var i = 0; i < WU_XING_CYCLE.length; i++) {
      total = total + Math.max(energy[WU_XING_CYCLE[i]], 0)
    }

    // 如果总量为 0（极端情况），均分 20
    if (total <= 0) {
      return { '木': 20, '火': 20, '土': 20, '金': 20, '水': 20 }
    }

    var result: Record<FiveElement, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
    for (var j = 0; j < WU_XING_CYCLE.length; j++) {
      var elem = WU_XING_CYCLE[j]
      result[elem] = Math.round((Math.max(energy[elem], 0) / total) * 100)
    }

    // 确保总和恰好为 100（修正舍入误差）
    var sum = 0
    for (var k = 0; k < WU_XING_CYCLE.length; k++) {
      sum = sum + result[WU_XING_CYCLE[k]]
    }
    if (sum !== 100 && sum > 0) {
      // 找最大项补差
      var maxElem = '木'
      var maxVal = 0
      for (var m = 0; m < WU_XING_CYCLE.length; m++) {
        if (result[WU_XING_CYCLE[m]] > maxVal) {
          maxVal = result[WU_XING_CYCLE[m]]
          maxElem = WU_XING_CYCLE[m]
        }
      }
      result[maxElem] = result[maxElem] + (100 - sum)
    }

    return result
  }

  // ─── 私有方法：节点和流动构建 ───

  /**
   * 构建能量节点列表
   *
   * 包含五行名称、能量值和在命局中的十神角色。
   */
  private buildEnergyNodes(
    energy: Record<FiveElement, number>,
    dayElement: FiveElement
  ): EnergyNode[] {
    var nodes: EnergyNode[] = []
    var roleMap = SHEN_ROLE_MAP[dayElement] || SHEN_ROLE_MAP['木']

    for (var i = 0; i < WU_XING_CYCLE.length; i++) {
      var elem = WU_XING_CYCLE[i]
      nodes.push({
        element: elem,
        name: ELEMENT_NAMES[elem],
        energy: energy[elem],
        role: (elem === dayElement) ? DAY_MASTER_ROLES[elem] : (roleMap[elem] || '未知'),
      })
    }

    return nodes
  }

  /**
   * 构建五行生克循环节点（用于前端绘制循环图）
   *
   * 按相生顺序排列，标记日主。
   */
  private buildCycleNodes(energy: Record<FiveElement, number>): EnergyNode[] {
    var nodes: EnergyNode[] = []

    for (var i = 0; i < WU_XING_CYCLE.length; i++) {
      var elem = WU_XING_CYCLE[i]
      nodes.push({
        element: elem,
        name: elem,
        energy: energy[elem],
        role: '循环第' + (i + 1) + '位',
      })
    }

    return nodes
  }

  /**
   * 构建所有能量流动
   *
   * 包含五条相生流动和五条相克流动。
   * 流动量由源元素能量和目标元素能量共同决定。
   */
  private buildFlows(
    energy: Record<FiveElement, number>,
    dayElement: FiveElement
  ): EnergyFlow[] {
    var flows: EnergyFlow[] = []

    // 生成相生流动（5条）
    for (var i = 0; i < WU_XING_CYCLE.length; i++) {
      var fromElem = WU_XING_CYCLE[i]
      var toElem = GENERATE[fromElem]
      if (toElem) {
        var shengAmount = this.computeFlowAmount(energy[fromElem], energy[toElem], '生')
        flows.push({
          from: fromElem,
          to: toElem,
          type: '生',
          amount: shengAmount,
          label: fromElem + '生' + toElem + '（' + this.getShengDesc(fromElem, toElem) + '）',
        })
      }
    }

    // 生成相克流动（5条）
    for (var j = 0; j < WU_XING_CYCLE.length; j++) {
      var keFrom = WU_XING_CYCLE[j]
      var keTo = OVERCOME[keFrom]
      if (keTo) {
        var keAmount = this.computeFlowAmount(energy[keFrom], energy[keTo], '克')
        flows.push({
          from: keFrom,
          to: keTo,
          type: '克',
          amount: keAmount,
          label: keFrom + '克' + keTo + '（' + this.getKeDesc(keFrom, keTo) + '）',
        })
      }
    }

    return flows
  }

  /**
   * 计算单条流动的量值
   *
   * 流动量 = 源元素能量 * 目标元素吸纳系数
   * 相生：目标吸纳 40%
   * 相克：克制强度取决于源元素对目标的克制力
   */
  private computeFlowAmount(sourceEnergy: number, targetEnergy: number, type: '生' | '克'): number {
    if (type === '生') {
      // 相生：源越旺，输出越多
      var base = sourceEnergy * 0.4
      // 目标越弱，吸纳越有效（缺啥补啥）
      var absorbFactor = 1.0 - (targetEnergy / 100) * 0.3
      return Math.round(Math.min(base * absorbFactor, 100))
    } else {
      // 相克：源越旺，克制越强；目标越旺，越能抵抗
      var keBase = sourceEnergy * 0.3
      var resistFactor = 1.0 - (targetEnergy / 100) * 0.4
      return Math.round(Math.min(keBase * resistFactor, 100))
    }
  }

  /**
   * 获取相生流动的古典描述
   */
  private getShengDesc(from: FiveElement, to: FiveElement): string {
    var descs: Record<string, string> = {
      '木火': '木生火，如钻木取火',
      '火土': '火生土，如灰烬归土',
      '土金': '土生金，如矿藏蕴金',
      '金水': '金生水，如金属凝结露水',
      '水木': '水生木，如水润草木',
    }
    return descs[from + to] || from + '生' + to
  }

  /**
   * 获取相克流动的古典描述
   */
  private getKeDesc(from: FiveElement, to: FiveElement): string {
    var descs: Record<string, string> = {
      '木土': '木克土，如树根破土',
      '土水': '土克水，如堤坝挡水',
      '水火': '水克火，如水灭火焰',
      '火金': '火克金，如烈火熔金',
      '金木': '金克木，如斧伐树木',
    }
    return descs[from + to] || from + '克' + to
  }

  // ─── 私有方法：快照生成 ───

  /**
   * 生成时间步快照（模拟四季变化对五行的影响）
   *
   * 生成 8 个快照，每 45 度一个，对应一年中八个节气阶段。
   * 每个快照中五行能量随季节波动。
   */
  private generateSnapshots(
    baseEnergy: Record<FiveElement, number>,
    monthBranch: EarthlyBranch
  ): EnergySnapshot[] {
    var snapshots: EnergySnapshot[] = []
    var stepCount = 8

    // 确定命局月令对应的起始角度
    var monthIndex = this.getMonthIndex(monthBranch)
    var startDeg = monthIndex * 90 // 每季 90 度

    for (var i = 0; i < stepCount; i++) {
      var deg = (startDeg + i * 45) % 360
      var seasonData = this.getSeasonAtDegree(deg)

      // 计算该时间步的五行能量
      var stepEnergy = this.computeStepEnergy(baseEnergy, seasonData.boost)
      var stepFlows = this.buildFlows(stepEnergy, this.getDayElement({}))

      snapshots.push({
        timestamp: deg,
        nodes: this.energyToNodeArray(stepEnergy),
        flows: stepFlows,
      })
    }

    return snapshots
  }

  /**
   * 获取月令在四季中的索引（0=春，1=夏，2=秋，3=冬）
   */
  private getMonthIndex(monthBranch: EarthlyBranch): number {
    var indexMap: Record<EarthlyBranch, number> = {
      '寅': 0, '卯': 0, '辰': 0,
      '巳': 1, '午': 1, '未': 1,
      '申': 2, '酉': 2, '戌': 2,
      '亥': 3, '子': 3, '丑': 3,
    }
    return indexMap[monthBranch] !== undefined ? indexMap[monthBranch] : 0
  }

  /**
   * 根据角度获取季节数据
   *
   * 使用线性插值，使快照之间平滑过渡。
   */
  private getSeasonAtDegree(deg: number): { name: string; boost: Record<FiveElement, number> } {
    // 找到当前角度所在季节以及下一个季节
    var currentSeason = SEASON_PHASE[0]
    var nextSeason = SEASON_PHASE[1]

    for (var i = 0; i < SEASON_PHASE.length; i++) {
      if (deg >= SEASON_PHASE[i].startDeg && deg < SEASON_PHASE[i].endDeg) {
        currentSeason = SEASON_PHASE[i]
        var nextIdx = (i + 1) % SEASON_PHASE.length
        nextSeason = SEASON_PHASE[nextIdx]
        break
      }
    }

    // 计算当前季节内的进度（0-1）
    var range = currentSeason.endDeg - currentSeason.startDeg
    var progress = range > 0 ? (deg - currentSeason.startDeg) / range : 0

    // 线性插值
    var boost: Record<FiveElement, number> = { '木': 1.0, '火': 1.0, '土': 1.0, '金': 1.0, '水': 1.0 }
    for (var j = 0; j < WU_XING_CYCLE.length; j++) {
      var elem = WU_XING_CYCLE[j]
      var currVal = (currentSeason.boost[elem] !== undefined) ? (currentSeason.boost[elem] as number) : 1.0
      var nextVal = (nextSeason.boost[elem] !== undefined) ? (nextSeason.boost[elem] as number) : 1.0
      boost[elem] = currVal + (nextVal - currVal) * progress
    }

    return {
      name: currentSeason.name + ' → ' + nextSeason.name,
      boost: boost,
    }
  }

  /**
   * 计算特定时间步的五行能量
   *
   * 基础能量乘以季节系数后重新归一化。
   */
  private computeStepEnergy(
    baseEnergy: Record<FiveElement, number>,
    seasonBoost: Record<FiveElement, number>
  ): Record<FiveElement, number> {
    var adjusted: Record<FiveElement, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }

    for (var i = 0; i < WU_XING_CYCLE.length; i++) {
      var elem = WU_XING_CYCLE[i]
      var factor = seasonBoost[elem] !== undefined ? seasonBoost[elem] : 1.0
      adjusted[elem] = baseEnergy[elem] * factor
    }

    return this.normalizeEnergy(adjusted)
  }

  /**
   * 将能量 Record 转换为节点数组
   */
  private energyToNodeArray(energy: Record<FiveElement, number>): Array<{ element: string; energy: number }> {
    var arr: Array<{ element: string; energy: number }> = []
    for (var i = 0; i < WU_XING_CYCLE.length; i++) {
      arr.push({
        element: WU_XING_CYCLE[i],
        energy: energy[WU_XING_CYCLE[i]],
      })
    }
    return arr
  }

  // ─── 私有方法：平衡度与分析 ───

  /**
   * 计算五行平衡度
   *
   * 理想状态为各占 20%。偏离越远，平衡度越低。
   * 使用标准差来衡量偏离程度：
   * - 标准差 = 0 时，balance = 100（完美平衡）
   * - 标准差越大，balance 越低
   */
  private computeBalance(energy: Record<FiveElement, number>): number {
    var values: number[] = []
    for (var i = 0; i < WU_XING_CYCLE.length; i++) {
      values.push(energy[WU_XING_CYCLE[i]])
    }

    // 计算平均值
    var sum = 0
    for (var j = 0; j < values.length; j++) {
      sum = sum + values[j]
    }
    var mean = sum / values.length

    // 计算标准差
    var sqDiffSum = 0
    for (var k = 0; k < values.length; k++) {
      var diff = values[k] - mean
      sqDiffSum = sqDiffSum + diff * diff
    }
    var stdDev = Math.sqrt(sqDiffSum / values.length)

    // 标准差最大约为 40（一元素 100，其余 0），最小 0
    // 映射到 0-100
    var balance = Math.round(Math.max(0, 100 - stdDev * 2.5))

    return Math.min(100, Math.max(0, balance))
  }

  /**
   * 找出最旺（能量最高）的五行
   */
  private findDominant(energy: Record<FiveElement, number>): string {
    var maxElem = '木'
    var maxVal = -1

    for (var i = 0; i < WU_XING_CYCLE.length; i++) {
      var elem = WU_XING_CYCLE[i]
      if (energy[elem] > maxVal) {
        maxVal = energy[elem]
        maxElem = elem
      }
    }

    return maxElem
  }

  /**
   * 找出最弱（能量最低）的五行
   */
  private findWeakest(energy: Record<FiveElement, number>): string {
    var minElem = '木'
    var minVal = 101

    for (var i = 0; i < WU_XING_CYCLE.length; i++) {
      var elem = WU_XING_CYCLE[i]
      if (energy[elem] < minVal) {
        minVal = energy[elem]
        minElem = elem
      }
    }

    return minElem
  }

  /**
   * 构建分析摘要文字
   *
   * 用简洁的中文描述命局五行能量流动的核心特征。
   */
  private buildSummary(
    energy: Record<FiveElement, number>,
    dayElement: FiveElement,
    balance: number,
    dominant: string,
    weakest: string
  ): string {
    var parts: string[] = []

    // 日主描述
    parts.push('日主' + dayElement + ELEMENT_NAMES[dayElement])

    // 平衡度评价
    if (balance >= 80) {
      parts.push('五行流通，阴阳调和')
    } else if (balance >= 60) {
      parts.push('五行较为均衡，略有偏颇')
    } else if (balance >= 40) {
      parts.push('五行失衡，需调和')
    } else {
      parts.push('五行严重失衡，冲突明显')
    }

    // 旺衰描述
    parts.push(dominant + '最旺（' + energy[dominant as FiveElement] + '%）')
    parts.push(weakest + '最弱（' + energy[weakest as FiveElement] + '%）')

    // 相生流通描述
    var shengFrom = this.findPredecessor(dominant as FiveElement, '生')
    if (shengFrom) {
      parts.push(shengFrom + '生' + dominant + '，源头旺盛')
    }

    var keTo = OVERCOME[dominant as FiveElement]
    if (keTo && energy[dominant as FiveElement] > 40) {
      parts.push(dominant + '过旺克' + keTo + '，需防过激')
    }

    // 平衡建议
    if (balance < 60) {
      parts.push('宜补' + weakest + '以调和五行')
    }

    return parts.join('。') + '。'
  }

  /**
   * 查找在给定关系中的源元素
   *
   * 如 findPredecessor('火', '生') 返回 '木'（因为木生火）
   */
  private findPredecessor(target: FiveElement, relation: '生' | '克'): FiveElement | null {
    var map = relation === '生' ? GENERATE : OVERCOME
    for (var i = 0; i < WU_XING_CYCLE.length; i++) {
      var elem = WU_XING_CYCLE[i]
      if (map[elem] === target) {
        return elem
      }
    }
    return null
  }
}

// ─── 导出 ───

/** 默认导出引擎实例（方便直接使用） */
export default new EnergyFlowEngine()
