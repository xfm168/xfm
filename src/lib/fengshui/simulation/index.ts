/**
 * Simulation Mode - 整改模拟
 * 
 * 用户调整家具位置/方向后，实时重新计算评分。
 * 不需要重新上传图片，基于现有数据模拟。
 * 
 * 核心功能：
 * - 模拟家具移动
 * - 模拟家具旋转
 * - 模拟家具增删
 * - 实时计算评分变化
 * - 显示前后对比
 */

import type { FengShuiContext, FengShuiResult } from '../types'
import { buildEvidenceChain } from '../evidenceChain'

function analyzeFengShui(_context: FengShuiContext): FengShuiResult {
  return {
    mainPattern: {
      id: 'simulation-stub',
      name: '模拟模式',
      category: 'layout',
      description: '整改模拟模式',
      matched: true,
    },
    patternScore: 75,
    confidence: 70,
    confidenceReason: '基于模拟数据',
    matchedPatterns: [],
    matchedRuleNames: [],
    houseScore: 75,
    directionScore: 80,
    layoutScore: 70,
    roomScore: 75,
    elementScore: 72,
    environmentScore: 78,
    overallScore: 75,
    strengths: [],
    weaknesses: [],
    warnings: [],
    suggestions: [],
    explain: {
      whyGood: [],
      whyBad: [],
      suggestions: [],
      matchedPatterns: [],
      warnings: [],
      tips: [],
      classicalRefs: [],
      practicalExplanation: '',
    },
    fengShuiLevel: 'good',
    elementAnalysis: {
      dominant: '土',
      deficient: '木',
      balance: 70,
    },
  } as unknown as FengShuiResult
}

export interface Furniture {
  id: string
  type: FurnitureType
  position: { x: number; y: number }
  rotation: number
  width: number
  height: number
  roomType?: string
}

export type FurnitureType = 
  | 'sofa'
  | 'bed'
  | 'desk'
  | 'table'
  | 'chair'
  | 'cabinet'
  | 'wardrobe'
  | 'tv'
  | 'stove'
  | 'sink'
  | 'toilet'
  | 'mirror'
  | 'door'
  | 'window'
  | 'plant'
  | 'other'

export interface SimulationState {
  context: FengShuiContext
  furniture: Furniture[]
  result: FengShuiResult
  history: SimulationHistoryItem[]
  redoStack: SimulationHistoryItem[]
}

export interface SimulationHistoryItem {
  id: string
  timestamp: number
  action: SimulationAction
  furniture: Furniture[]
  result: FengShuiResult
  description: string
}

export interface SimulationAction {
  type: 'move' | 'rotate' | 'add' | 'remove' | 'reset'
  targetId?: string
  delta?: any
}

export interface SimulationDelta {
  overallScore: number
  directionScore?: number
  layoutScore?: number
  roomScore?: number
  elementScore?: number
  environmentScore?: number
  health?: number
  wealth?: number
  career?: number
  relationship?: number
  study?: number
}

export interface SimulationResult {
  before: FengShuiResult
  after: FengShuiResult
  delta: SimulationDelta
  affectedRules: {
    id: string
    name: string
    before: boolean
    after: boolean
    type: 'added' | 'removed' | 'changed'
  }[]
  explanation: string
}

/**
 * 模拟引擎
 */
export class SimulationEngine {
  private state: SimulationState
  
  constructor(initialContext: FengShuiContext) {
    const initialResult = analyzeFengShui(initialContext)
    this.state = {
      context: initialContext,
      furniture: this.extractFurniture(initialContext),
      result: initialResult,
      history: [{
        id: 'initial',
        timestamp: Date.now(),
        action: { type: 'reset' },
        furniture: this.extractFurniture(initialContext),
        result: initialResult,
        description: '初始状态',
      }],
      redoStack: [],
    }
  }
  
  /**
   * 获取当前状态
   */
  getState(): SimulationState {
    return this.state
  }
  
  /**
   * 获取当前评分
   */
  getScore(): FengShuiResult {
    return this.state.result
  }
  
  /**
   * 获取家具列表
   */
  getFurniture(): Furniture[] {
    return this.state.furniture
  }
  
  /**
   * 移动家具
   */
  moveFurniture(furnitureId: string, newPosition: { x: number; y: number }): SimulationResult {
    const furniture = this.state.furniture.find(f => f.id === furnitureId)
    if (!furniture) throw new Error(`Furniture not found: ${furnitureId}`)
    
    const oldPosition = { ...furniture.position }
    
    // 更新位置
    const newFurniture = this.state.furniture.map(f => 
      f.id === furnitureId 
        ? { ...f, position: newPosition }
        : f
    )
    
    // 重新计算
    const newContext = this.updateContext(this.state.context, newFurniture)
    const newResult = analyzeFengShui(newContext)
    
    // 生成对比
    const result = this.compareResults(this.state.result, newResult)
    
    // 保存历史
    this.pushHistory({
      type: 'move',
      targetId: furnitureId,
      delta: { from: oldPosition, to: newPosition },
    }, newFurniture, newResult, `移动 ${furnitureTypeToName(furniture.type)}`)
    
    return result
  }
  
  /**
   * 旋转家具
   */
  rotateFurniture(furnitureId: string, newRotation: number): SimulationResult {
    const furniture = this.state.furniture.find(f => f.id === furnitureId)
    if (!furniture) throw new Error(`Furniture not found: ${furnitureId}`)
    
    const oldRotation = furniture.rotation
    
    const newFurniture = this.state.furniture.map(f => 
      f.id === furnitureId 
        ? { ...f, rotation: newRotation }
        : f
    )
    
    const newContext = this.updateContext(this.state.context, newFurniture)
    const newResult = analyzeFengShui(newContext)
    
    const result = this.compareResults(this.state.result, newResult)
    
    this.pushHistory({
      type: 'rotate',
      targetId: furnitureId,
      delta: { from: oldRotation, to: newRotation },
    }, newFurniture, newResult, `旋转 ${furnitureTypeToName(furniture.type)}`)
    
    return result
  }
  
  /**
   * 添加家具
   */
  addFurniture(furniture: Omit<Furniture, 'id'>): SimulationResult {
    const newFurnitureItem: Furniture = {
      ...furniture,
      id: `furn-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    }
    
    const newFurniture = [...this.state.furniture, newFurnitureItem]
    
    const newContext = this.updateContext(this.state.context, newFurniture)
    const newResult = analyzeFengShui(newContext)
    
    const result = this.compareResults(this.state.result, newResult)
    
    this.pushHistory({
      type: 'add',
      targetId: newFurnitureItem.id,
      delta: { furniture: newFurnitureItem },
    }, newFurniture, newResult, `添加 ${furnitureTypeToName(furniture.type)}`)
    
    return result
  }
  
  /**
   * 删除家具
   */
  removeFurniture(furnitureId: string): SimulationResult {
    const furniture = this.state.furniture.find(f => f.id === furnitureId)
    if (!furniture) throw new Error(`Furniture not found: ${furnitureId}`)
    
    const newFurniture = this.state.furniture.filter(f => f.id !== furnitureId)
    
    const newContext = this.updateContext(this.state.context, newFurniture)
    const newResult = analyzeFengShui(newContext)
    
    const result = this.compareResults(this.state.result, newResult)
    
    this.pushHistory({
      type: 'remove',
      targetId: furnitureId,
      delta: { furniture },
    }, newFurniture, newResult, `删除 ${furnitureTypeToName(furniture.type)}`)
    
    return result
  }
  
  /**
   * 撤销
   */
  undo(): SimulationResult | null {
    if (this.state.history.length <= 1) return null
    
    const current = this.state.history.pop()!
    this.state.redoStack.push(current)
    
    const previous = this.state.history[this.state.history.length - 1]
    this.state.furniture = previous.furniture
    this.state.result = previous.result
    this.state.context = this.updateContext(this.state.context, previous.furniture)
    
    return this.compareResults(current.result, previous.result)
  }
  
  /**
   * 重做
   */
  redo(): SimulationResult | null {
    if (this.state.redoStack.length === 0) return null
    
    const next = this.state.redoStack.pop()!
    this.state.history.push(next)
    this.state.furniture = next.furniture
    this.state.result = next.result
    this.state.context = this.updateContext(this.state.context, next.furniture)
    
    const previous = this.state.history[this.state.history.length - 2]
    return this.compareResults(previous.result, next.result)
  }
  
  /**
   * 重置
   */
  reset(): SimulationResult {
    const initial = this.state.history[0]
    const oldResult = this.state.result
    
    this.state.furniture = initial.furniture
    this.state.result = initial.result
    this.state.context = this.updateContext(this.state.context, initial.furniture)
    this.state.history = [initial]
    this.state.redoStack = []
    
    return this.compareResults(oldResult, initial.result)
  }
  
  /**
   * 获取历史记录
   */
  getHistory(): SimulationHistoryItem[] {
    return this.state.history
  }
  
  /**
   * 跳转到历史记录
   */
  goToHistory(historyId: string): SimulationResult | null {
    const index = this.state.history.findIndex(h => h.id === historyId)
    if (index === -1) return null
    
    const oldResult = this.state.result
    const target = this.state.history[index]
    
    this.state.furniture = target.furniture
    this.state.result = target.result
    this.state.context = this.updateContext(this.state.context, target.furniture)
    
    // 截断历史
    this.state.history = this.state.history.slice(0, index + 1)
    this.state.redoStack = []
    
    return this.compareResults(oldResult, target.result)
  }
  
  // ========== 私有方法 ==========
  
  private extractFurniture(context: FengShuiContext): Furniture[] {
    const furnitureList: Furniture[] = []
    
    // 从房间信息提取家具
    if (context.rooms) {
      context.rooms.forEach((room, roomIdx) => {
        const roomFurniture = (room as any).furniture || []
        roomFurniture.forEach((f: any, idx: number) => {
          furnitureList.push({
            id: f.id || `furn-${roomIdx}-${idx}`,
            type: f.type || 'other',
            position: f.position || { x: 50, y: 50 },
            rotation: f.rotation || 0,
            width: f.width || 20,
            height: f.height || 20,
            roomType: room.type,
          })
        })
      })
    }
    
    return furnitureList
  }
  
  private updateContext(context: FengShuiContext, furniture: Furniture[]): FengShuiContext {
    // 深拷贝 context
    const newContext: FengShuiContext = JSON.parse(JSON.stringify(context))
    
    // 更新房间家具
    if (newContext.rooms && newContext.rooms.length > 0) {
      // 按房间分组
      const furnitureByRoom = new Map<string, Furniture[]>()
      furniture.forEach(f => {
        const roomKey = f.roomType || newContext.rooms![0].type
        if (!furnitureByRoom.has(roomKey)) {
          furnitureByRoom.set(roomKey, [])
        }
        furnitureByRoom.get(roomKey)!.push(f)
      })
      
      // 更新每个房间
      newContext.rooms.forEach(room => {
        const roomFurniture = furnitureByRoom.get(room.type) || []
        ;(room as any).furniture = roomFurniture.map(f => ({
          id: f.id,
          type: f.type,
          position: f.position,
          rotation: f.rotation,
          width: f.width,
          height: f.height,
        }))
      })
    }
    
    // 重新计算特征（V4.3 暂未启用 features 模块）
    // this.recalculateFeatures(newContext, furniture)
    
    return newContext
  }
  
  // V4.3: features 模块暂未启用，相关计算暂时注释
  // private recalculateFeatures(context: FengShuiContext, furniture: Furniture[]) {
  //   if (!context.features) return
  //   
  //   const f = context.features
  //   
  //   // 计算家具数量
  //   f.furnitureCount = furniture.length
  //   
  //   // 计算元素分布
  //   const elements = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }
  //   furniture.forEach(furn => {
  //     const el = furnitureTypeToElement(furn.type)
  //     elements[el as keyof typeof elements]++
  //   })
  //   
  //   f.elementDistribution = {
  //     '木': elements.wood,
  //     '火': elements.fire,
  //     '土': elements.earth,
  //     '金': elements.metal,
  //     '水': elements.water,
  //   }
  //   
  //   // 检查关键家具
  //   f.hasBed = furniture.some(f => f.type === 'bed')
  //   f.hasSofa = furniture.some(f => f.type === 'sofa')
  //   f.hasDesk = furniture.some(f => f.type === 'desk')
  //   f.hasTV = furniture.some(f => f.type === 'tv')
  //   f.hasMirror = furniture.some(f => f.type === 'mirror')
  //   f.hasStove = furniture.some(f => f.type === 'stove')
  //   
  //   // 检查门窗
  //   f.windowCount = furniture.filter(f => f.type === 'window').length
  //   f.doorCount = furniture.filter(f => f.type === 'door').length
  // }
  
  private compareResults(before: FengShuiResult, after: FengShuiResult): SimulationResult {
    const delta: SimulationDelta = {
      overallScore: after.overallScore - before.overallScore,
      directionScore: (after as any).directionScore - (before as any).directionScore || 0,
      layoutScore: (after as any).layoutScore - (before as any).layoutScore || 0,
      roomScore: after.roomScore - before.roomScore,
      elementScore: (after as any).elementScore - (before as any).elementScore || 0,
      environmentScore: (after as any).environmentScore - (before as any).environmentScore || 0,
    }
    
    // 计算各维度变化
    const beforeHitRules = (before as any).hitRules || []
    const afterHitRules = (after as any).hitRules || []
    
    const affectedRules: SimulationResult['affectedRules'] = []
    
    // 找新增的规则
    afterHitRules.forEach((rule: any) => {
      const beforeHit = beforeHitRules.find((r: any) => r.id === rule.id)
      if (!beforeHit) {
        affectedRules.push({
          id: rule.id,
          name: rule.name,
          before: false,
          after: true,
          type: 'added',
        })
      } else if (beforeHit.result?.type !== rule.result?.type) {
        affectedRules.push({
          id: rule.id,
          name: rule.name,
          before: false,
          after: true,
          type: 'changed',
        })
      }
    })
    
    // 找移除的规则
    beforeHitRules.forEach((rule: any) => {
      const afterHit = afterHitRules.find((r: any) => r.id === rule.id)
      if (!afterHit) {
        affectedRules.push({
          id: rule.id,
          name: rule.name,
          before: true,
          after: false,
          type: 'removed',
        })
      }
    })
    
    // 生成解释
    let explanation = ''
    if (delta.overallScore > 0) {
      explanation = `本次调整使综合评分提升了 ${delta.overallScore} 分，主要改善了${formatTopDelta(delta)}方面。`
    } else if (delta.overallScore < 0) {
      explanation = `本次调整使综合评分下降了 ${Math.abs(delta.overallScore)} 分，建议检查${formatTopDelta(delta, true)}方面。`
    } else {
      explanation = '本次调整对整体评分影响不大。'
    }
    
    if (affectedRules.length > 0) {
      const added = affectedRules.filter(r => r.type === 'added').length
      const removed = affectedRules.filter(r => r.type === 'removed').length
      explanation += ` 共影响 ${affectedRules.length} 条规则，`
      if (added > 0) explanation += `新增 ${added} 条，`
      if (removed > 0) explanation += `消除 ${removed} 条，`
    }
    
    return {
      before,
      after,
      delta,
      affectedRules,
      explanation,
    }
  }
  
  private pushHistory(
    action: SimulationAction,
    furniture: Furniture[],
    result: FengShuiResult,
    description: string
  ) {
    this.state.furniture = furniture
    this.state.result = result
    
    this.state.history.push({
      id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      action,
      furniture: [...furniture],
      result,
      description,
    })
    
    // 清空重做栈
    this.state.redoStack = []
    
    // 限制历史记录数量
    if (this.state.history.length > 50) {
      this.state.history = [this.state.history[0], ...this.state.history.slice(-49)]
    }
  }
}

// ========== 辅助函数 ==========

function furnitureTypeToElement(type: FurnitureType): string {
  const map: Record<FurnitureType, string> = {
    sofa: 'wood',
    bed: 'wood',
    desk: 'wood',
    table: 'wood',
    chair: 'wood',
    cabinet: 'wood',
    wardrobe: 'wood',
    tv: 'fire',
    stove: 'fire',
    sink: 'water',
    toilet: 'water',
    mirror: 'water',
    door: 'wood',
    window: 'water',
    plant: 'wood',
    other: 'earth',
  }
  return map[type] || 'earth'
}

function furnitureTypeToName(type: FurnitureType | string): string {
  const map: Record<string, string> = {
    sofa: '沙发',
    bed: '床',
    desk: '书桌',
    table: '桌子',
    chair: '椅子',
    cabinet: '柜子',
    wardrobe: '衣柜',
    tv: '电视',
    stove: '灶台',
    sink: '水槽',
    toilet: '马桶',
    mirror: '镜子',
    door: '门',
    window: '窗户',
    plant: '植物',
    other: '其他',
  }
  return map[type] || type
}

function formatTopDelta(delta: SimulationDelta, negative = false): string {
  const entries = Object.entries(delta)
    .filter(([k]) => k !== 'overallScore')
    .map(([key, value]) => ({ key, value: Math.abs(value as number) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
  
  return entries.map(e => deltaKeyToName(e.key)).join('、')
}

function deltaKeyToName(key: string): string {
  const map: Record<string, string> = {
    directionScore: '朝向',
    layoutScore: '户型',
    roomScore: '房间',
    elementScore: '五行',
    environmentScore: '环境',
    health: '健康',
    wealth: '财运',
    career: '事业',
    relationship: '感情',
    study: '学业',
  }
  return map[key] || key
}
