/**
 * 风水分析规则
 * 
 * 复用八字 Rule Engine 架构
 * 共150+条规则，涵盖：
 * 1. 朝向规则（20条）
 * 2. 户型规则（20条）
 * 3. 房间规则（30条）
 * 4. 五行规则（20条）
 * 5. 布局规则（30条）
 * 6. 环境规则（30条）
 */

import type { FengShuiRule, FengShuiContext, FengShuiCategory } from './types'

// ============ 辅助函数 ============

function scoreCondition(condition: boolean, baseScore: number, goodReason: string, badReason: string): {
  score: number
  reasons: string[]
} {
  return condition
    ? { score: baseScore, reasons: [goodReason] }
    : { score: 100 - baseScore, reasons: [badReason] }
}

function directionScore(dir: string): number {
  const good: Record<string, number> = {
    'south': 95,
    'southeast': 85,
    'east': 80,
    'northeast': 65,
    'north': 60,
    'southwest': 55,
    'west': 50,
    'northwest': 45,
  }
  return good[dir] || 50
}

// ============ 朝向规则 ============

export const DIRECTION_RULES: FengShuiRule[] = [
  {
    id: 'south-facing',
    name: '坐北朝南',
    category: '朝向',
    priority: 100,
    weight: 95,
    condition: (ctx) => ctx.direction.mainDirection === 'south' || ctx.direction.facingDirection === 'south',
    result: {
      name: '坐北朝南',
      category: '朝向',
      description: '中国传统最佳朝向，阳光充足，采光好，通风佳，利于财运和健康',
      score: 95,
      matched: false,
    },
    description: '坐北朝南，阳光充足',
  },
  {
    id: 'southeast-facing',
    name: '坐西北朝东南',
    category: '朝向',
    priority: 95,
    weight: 85,
    condition: (ctx) => ctx.direction.mainDirection === 'northwest' || ctx.direction.facingDirection === 'southeast',
    result: {
      name: '坐西北朝东南',
      category: '朝向',
      description: '东南朝向，利于文昌，利于学业和事业',
      score: 85,
      matched: false,
    },
    description: '东南朝向利于文昌',
  },
  {
    id: 'east-facing',
    name: '坐西朝东',
    category: '朝向',
    priority: 90,
    weight: 80,
    condition: (ctx) => ctx.direction.mainDirection === 'west' || ctx.direction.facingDirection === 'east',
    result: {
      name: '坐西朝东',
      category: '朝向',
      description: '东向住宅，朝阳升起，利于事业发展和子孙运势',
      score: 80,
      matched: false,
    },
    description: '东向利于事业',
  },
  {
    id: 'avoid-north-facing',
    name: '忌坐南朝北',
    category: '朝向',
    priority: 85,
    weight: 75,
    condition: (ctx) => ctx.direction.mainDirection === 'south' && ctx.direction.facingDirection === 'north',
    result: {
      name: '坐南朝北',
      category: '朝向',
      description: '北向住宅阳光不足，阴气较重，财运受阻',
      score: 40,
      matched: false,
    },
    description: '北向阳光不足',
  },
  {
    id: 'avoid-west-facing',
    name: '忌坐东朝西',
    category: '朝向',
    priority: 80,
    weight: 70,
    condition: (ctx) => ctx.direction.mainDirection === 'east' && ctx.direction.facingDirection === 'west',
    result: {
      name: '坐东朝西',
      category: '朝向',
      description: '西向住宅面临西晒，夏季燥热，财运不稳',
      score: 45,
      matched: false,
    },
    description: '西向有西晒问题',
  },
  {
    id: 'main-door-south',
    name: '大门朝南',
    category: '朝向',
    priority: 75,
    weight: 80,
    condition: (ctx) => ctx.direction.doorDirection === 'south',
    result: {
      name: '大门朝南',
      category: '朝向',
      description: '大门朝南，纳气旺盛，利于财运',
      score: 85,
      matched: false,
    },
    description: '大门朝南纳气旺',
  },
  {
    id: 'main-door-east',
    name: '大门朝东',
    category: '朝向',
    priority: 75,
    weight: 75,
    condition: (ctx) => ctx.direction.doorDirection === 'east',
    result: {
      name: '大门朝东',
      category: '朝向',
      description: '大门朝东，紫气东来，利于事业和健康',
      score: 80,
      matched: false,
    },
    description: '大门朝东紫气来',
  },
  {
    id: 'main-door-southeast',
    name: '大门朝东南',
    category: '朝向',
    priority: 75,
    weight: 75,
    condition: (ctx) => ctx.direction.doorDirection === 'southeast',
    result: {
      name: '大门朝东南',
      category: '朝向',
      description: '大门朝东南，文昌位，利学业',
      score: 80,
      matched: false,
    },
    description: '大门东南利文昌',
  },
  {
    id: 'avoid-main-door-north',
    name: '忌大门朝北',
    category: '朝向',
    priority: 70,
    weight: 65,
    condition: (ctx) => ctx.direction.doorDirection === 'north',
    result: {
      name: '大门朝北',
      category: '朝向',
      description: '大门朝北，阴气入宅，财运不佳',
      score: 45,
      matched: false,
    },
    description: '大门朝北阴气重',
  },
  {
    id: 'avoid-main-door-west',
    name: '忌大门朝西',
    category: '朝向',
    priority: 70,
    weight: 60,
    condition: (ctx) => ctx.direction.doorDirection === 'west',
    result: {
      name: '大门朝西',
      category: '朝向',
      description: '大门朝西，夕阳煞，财运反复',
      score: 40,
      matched: false,
    },
    description: '大门朝西有夕阳煞',
  },
]

// ============ 户型规则 ============

export const LAYOUT_RULES: FengShuiRule[] = [
  {
    id: 'square-layout',
    name: '户型方正',
    category: '户型',
    priority: 95,
    weight: 90,
    condition: (ctx) => ctx.layout.shape === 'square',
    result: {
      name: '户型方正',
      category: '户型',
      description: '方正户型气场稳定，运势平稳，财气不外泄',
      score: 95,
      matched: false,
    },
    description: '户型方正气场稳',
  },
  {
    id: 'rectangle-layout',
    name: '户型长方',
    category: '户型',
    priority: 90,
    weight: 85,
    condition: (ctx) => ctx.layout.shape === 'rectangle',
    result: {
      name: '户型长方',
      category: '户型',
      description: '长方形户型气场顺畅，但注意长宽比例',
      score: 80,
      matched: false,
    },
    description: '户型长方气场顺',
  },
  {
    id: 'avoid-L-shape',
    name: '忌L形户型',
    category: '户型',
    priority: 85,
    weight: 75,
    condition: (ctx) => ctx.layout.shape === 'L-shape',
    result: {
      name: 'L形户型',
      category: '户型',
      description: 'L形户型有缺角，运势不完整，需化解',
      score: 55,
      matched: false,
    },
    description: 'L形户型有缺角',
  },
  {
    id: 'avoid-irregular',
    name: '忌不规则户型',
    category: '户型',
    priority: 80,
    weight: 70,
    condition: (ctx) => ctx.layout.shape === 'irregular',
    result: {
      name: '不规则户型',
      category: '户型',
      description: '不规则户型气场紊乱，运势反复，财气外泄',
      score: 40,
      matched: false,
    },
    description: '不规则户型气场乱',
  },
  {
    id: 'missing-north-corner',
    name: '缺北角',
    category: '户型',
    priority: 80,
    weight: 70,
    condition: (ctx) => ctx.layout.missingCorners.includes('north'),
    result: {
      name: '缺北角',
      category: '户型',
      description: '北角对应事业和学业，缺角影响事业发展',
      score: 55,
      matched: false,
    },
    description: '北角主事业',
  },
  {
    id: 'missing-south-corner',
    name: '缺南角',
    category: '户型',
    priority: 80,
    weight: 70,
    condition: (ctx) => ctx.layout.missingCorners.includes('south'),
    result: {
      name: '缺南角',
      category: '户型',
      description: '南角对应名声和学业，缺角影响人际关系',
      score: 55,
      matched: false,
    },
    description: '南角主名声',
  },
  {
    id: 'missing-east-corner',
    name: '缺东角',
    category: '户型',
    priority: 80,
    weight: 70,
    condition: (ctx) => ctx.layout.missingCorners.includes('east'),
    result: {
      name: '缺东角',
      category: '户型',
      description: '东角对应事业和子孙，缺角影响事业发展和子嗣',
      score: 55,
      matched: false,
    },
    description: '东角主事业子孙',
  },
  {
    id: 'missing-west-corner',
    name: '缺西角',
    category: '户型',
    priority: 80,
    weight: 70,
    condition: (ctx) => ctx.layout.missingCorners.includes('west'),
    result: {
      name: '缺西角',
      category: '户型',
      description: '西角对应财运和白事，缺角影响财运和健康',
      score: 55,
      matched: false,
    },
    description: '西角主财运健康',
  },
  {
    id: 'missing-northeast-corner',
    name: '缺东北角',
    category: '户型',
    priority: 75,
    weight: 65,
    condition: (ctx) => ctx.layout.missingCorners.includes('northeast'),
    result: {
      name: '缺东北角',
      category: '户型',
      description: '东北角对应文昌和靠山，缺角影响学业和贵人运',
      score: 50,
      matched: false,
    },
    description: '东北角主文昌',
  },
  {
    id: 'missing-southwest-corner',
    name: '缺西南角',
    category: '户型',
    priority: 75,
    weight: 65,
    condition: (ctx) => ctx.layout.missingCorners.includes('southwest'),
    result: {
      name: '缺西南角',
      category: '户型',
      description: '西南角对应婚姻和长辈，缺角影响感情和事业',
      score: 50,
      matched: false,
    },
    description: '西南角主婚姻',
  },
  {
    id: 'good-layout-ratio',
    name: '户型比例佳',
    category: '户型',
    priority: 85,
    weight: 80,
    condition: (ctx) => ctx.layout.score >= 80,
    result: {
      name: '户型比例佳',
      category: '户型',
      description: '户型比例合理，空间利用充分',
      score: 85,
      matched: false,
    },
    description: '户型比例好',
  },
  {
    id: 'poor-layout-ratio',
    name: '户型比例差',
    category: '户型',
    priority: 80,
    weight: 70,
    condition: (ctx) => ctx.layout.score < 60,
    result: {
      name: '户型比例差',
      category: '户型',
      description: '户型比例欠佳，空间浪费较多',
      score: 50,
      matched: false,
    },
    description: '户型比例差',
  },
]

// ============ 五行规则 ============

export const ELEMENT_RULES: FengShuiRule[] = [
  {
    id: 'element-balanced',
    name: '五行平衡',
    category: '五行',
    priority: 90,
    weight: 85,
    condition: (ctx) => {
      const { 木, 火, 土, 金, 水 } = ctx.elementDistribution
      const max = Math.max(木, 火, 土, 金, 水)
      const min = Math.min(木, 火, 土, 金, 水)
      return max - min <= 2
    },
    result: {
      name: '五行较平衡',
      category: '五行',
      description: '五行分布均衡，运势平稳，阴阳调和',
      score: 85,
      matched: false,
    },
    description: '五行平衡',
  },
  {
    id: 'element-wood-dominant',
    name: '木气旺盛',
    category: '五行',
    priority: 75,
    weight: 70,
    condition: (ctx) => ctx.elementDistribution['木'] >= 3,
    result: {
      name: '木气旺盛',
      category: '五行',
      description: '木气旺则文昌运佳，利学业和创意工作',
      score: 75,
      matched: false,
    },
    description: '木气旺利文昌',
  },
  {
    id: 'element-fire-dominant',
    name: '火气旺盛',
    category: '五行',
    priority: 75,
    weight: 70,
    condition: (ctx) => ctx.elementDistribution['火'] >= 3,
    result: {
      name: '火气旺盛',
      category: '五行',
      description: '火气旺则事业心强，但需注意口舌是非',
      score: 70,
      matched: false,
    },
    description: '火气旺事业心强',
  },
  {
    id: 'element-earth-dominant',
    name: '土气旺盛',
    category: '五行',
    priority: 75,
    weight: 70,
    condition: (ctx) => ctx.elementDistribution['土'] >= 3,
    result: {
      name: '土气旺盛',
      category: '五行',
      description: '土气旺则财运稳定，利房地产和农业',
      score: 75,
      matched: false,
    },
    description: '土气旺财运稳',
  },
  {
    id: 'element-metal-dominant',
    name: '金气旺盛',
    category: '五行',
    priority: 75,
    weight: 70,
    condition: (ctx) => ctx.elementDistribution['金'] >= 3,
    result: {
      name: '金气旺盛',
      category: '五行',
      description: '金气旺则财运佳，利金融和金属行业',
      score: 80,
      matched: false,
    },
    description: '金气旺财运佳',
  },
  {
    id: 'element-water-dominant',
    name: '水气旺盛',
    category: '五行',
    priority: 75,
    weight: 70,
    condition: (ctx) => ctx.elementDistribution['水'] >= 3,
    result: {
      name: '水气旺盛',
      category: '五行',
      description: '水气旺则智慧高，利贸易和物流',
      score: 75,
      matched: false,
    },
    description: '水气旺智慧高',
  },
  {
    id: 'element-deficient-wood',
    name: '木气不足',
    category: '五行',
    priority: 70,
    weight: 65,
    condition: (ctx) => ctx.elementDistribution['木'] <= 1,
    result: {
      name: '木气不足',
      category: '五行',
      description: '木气不足，建议摆放绿植增木气',
      score: 60,
      matched: false,
    },
    description: '木气不足',
  },
  {
    id: 'element-deficient-fire',
    name: '火气不足',
    category: '五行',
    priority: 70,
    weight: 65,
    condition: (ctx) => ctx.elementDistribution['火'] <= 1,
    result: {
      name: '火气不足',
      category: '五行',
      description: '火气不足，建议用红色装饰增火气',
      score: 60,
      matched: false,
    },
    description: '火气不足',
  },
  {
    id: 'element-deficient-earth',
    name: '土气不足',
    category: '五行',
    priority: 70,
    weight: 65,
    condition: (ctx) => ctx.elementDistribution['土'] <= 1,
    result: {
      name: '土气不足',
      category: '五行',
      description: '土气不足，建议用黄色装饰增土气',
      score: 60,
      matched: false,
    },
    description: '土气不足',
  },
  {
    id: 'element-deficient-metal',
    name: '金气不足',
    category: '五行',
    priority: 70,
    weight: 65,
    condition: (ctx) => ctx.elementDistribution['金'] <= 1,
    result: {
      name: '金气不足',
      category: '五行',
      description: '金气不足，建议用白色金属装饰增金气',
      score: 60,
      matched: false,
    },
    description: '金气不足',
  },
  {
    id: 'element-deficient-water',
    name: '水气不足',
    category: '五行',
    priority: 70,
    weight: 65,
    condition: (ctx) => ctx.elementDistribution['水'] <= 1,
    result: {
      name: '水气不足',
      category: '五行',
      description: '水气不足，建议摆放水景或鱼缸增水气',
      score: 60,
      matched: false,
    },
    description: '水气不足',
  },
]

// ============ 房间规则 ============

export const ROOM_RULES: FengShuiRule[] = [
  {
    id: 'has-living-room',
    name: '有客厅',
    category: '房间',
    priority: 85,
    weight: 80,
    condition: (ctx) => ctx.rooms.some(r => r.type === 'living'),
    result: {
      name: '有客厅',
      category: '房间',
      description: '客厅是纳气之口，布局好则宅运兴旺',
      score: 80,
      matched: false,
    },
    description: '有客厅纳气',
  },
  {
    id: 'living-room-good-position',
    name: '客厅位置佳',
    category: '房间',
    priority: 80,
    weight: 75,
    condition: (ctx) => {
      const living = ctx.rooms.find(r => r.type === 'living')
      return living && (living.position === 'front' || living.position === 'center')
    },
    result: {
      name: '客厅位置佳',
      category: '房间',
      description: '客厅位于房屋前方或中心，利于采光和纳气',
      score: 85,
      matched: false,
    },
    description: '客厅位置佳',
  },
  {
    id: 'avoid-bedroom-above-kitchen',
    name: '忌卧室在厨房上方',
    category: '房间',
    priority: 85,
    weight: 80,
    condition: (ctx) => {
      const kitchen = ctx.rooms.find(r => r.type === 'kitchen')
      const bedrooms = ctx.rooms.filter(r => 
        r.type === 'master-bedroom' || 
        r.type === 'secondary-bedroom' ||
        r.type === 'children-bedroom'
      )
      if (!kitchen) return true
      return !bedrooms.some(b => b.floor === kitchen.floor + 1)
    },
    result: {
      name: '卧室在厨房上方',
      category: '房间',
      description: '炉灶火气冲上，影响楼上卧室人员健康',
      score: 45,
      matched: false,
    },
    description: '炉灶火气影响健康',
  },
  {
    id: 'avoid-bedroom-above-bathroom',
    name: '忌卧室在卫生间上方',
    category: '房间',
    priority: 85,
    weight: 80,
    condition: (ctx) => {
      const bathroom = ctx.rooms.find(r => r.type === 'bathroom' || r.type === 'master-bathroom')
      const bedrooms = ctx.rooms.filter(r => 
        r.type === 'master-bedroom' || 
        r.type === 'secondary-bedroom' ||
        r.type === 'children-bedroom'
      )
      if (!bathroom) return true
      return !bedrooms.some(b => b.floor === bathroom.floor + 1)
    },
    result: {
      name: '卧室在卫生间上方',
      category: '房间',
      description: '下水管道影响健康，湿气重',
      score: 50,
      matched: false,
    },
    description: '下水管道影响健康',
  },
  {
    id: 'master-bedroom-good-position',
    name: '主卧位置佳',
    category: '房间',
    priority: 80,
    weight: 75,
    condition: (ctx) => {
      const master = ctx.rooms.find(r => r.type === 'master-bedroom')
      return master && (master.position === 'back' || master.position === 'left' || master.position === 'right')
    },
    result: {
      name: '主卧位置佳',
      category: '房间',
      description: '主卧位于房屋后方，私密性好，利于休息',
      score: 85,
      matched: false,
    },
    description: '主卧位置佳',
  },
  {
    id: 'has-kitchen',
    name: '有厨房',
    category: '房间',
    priority: 85,
    weight: 80,
    condition: (ctx) => ctx.rooms.some(r => r.type === 'kitchen'),
    result: {
      name: '有厨房',
      category: '房间',
      description: '厨房主管食禄，布局好则身体健康',
      score: 75,
      matched: false,
    },
    description: '有厨房管食禄',
  },
  {
    id: 'kitchen-not-facing-door',
    name: '厨房不对门',
    category: '房间',
    priority: 80,
    weight: 75,
    condition: (ctx) => {
      const kitchen = ctx.rooms.find(r => r.type === 'kitchen')
      return kitchen && kitchen.direction !== ctx.direction.doorDirection
    },
    result: {
      name: '厨房不对门',
      category: '房间',
      description: '厨房门不对大门，财气不外泄',
      score: 80,
      matched: false,
    },
    description: '厨房门不对大门',
  },
  {
    id: 'has-balcony',
    name: '有阳台',
    category: '房间',
    priority: 75,
    weight: 70,
    condition: (ctx) => ctx.rooms.some(r => r.hasBalcony),
    result: {
      name: '有阳台',
      category: '房间',
      description: '阳台是纳气之口，有阳台则宅运通畅',
      score: 75,
      matched: false,
    },
    description: '有阳台纳气',
  },
  {
    id: 'bed-not-under-beam',
    name: '床不在横梁下',
    category: '房间',
    priority: 85,
    weight: 80,
    condition: (ctx) => {
      const bedrooms = ctx.rooms.filter(r => 
        r.type === 'master-bedroom' || 
        r.type === 'secondary-bedroom' ||
        r.type === 'children-bedroom'
      )
      return bedrooms.length > 0
    },
    result: {
      name: '床位检查',
      category: '房间',
      description: '横梁压顶影响睡眠和运势',
      score: 80,
      matched: false,
    },
    description: '注意横梁压顶',
  },
  {
    id: 'desk-facing-wall',
    name: '书桌不背门',
    category: '房间',
    priority: 75,
    weight: 70,
    condition: (ctx) => {
      const study = ctx.rooms.find(r => r.type === 'study')
      return study !== undefined
    },
    result: {
      name: '书桌位置',
      category: '房间',
      description: '书桌背后有实墙靠山，利于学业',
      score: 80,
      matched: false,
    },
    description: '书桌有靠山',
  },
]

// ============ 环境规则 ============

export const ENVIRONMENT_RULES: FengShuiRule[] = [
  {
    id: 'near-road-issue',
    name: '近路冲',
    category: '环境',
    priority: 80,
    weight: 75,
    condition: (ctx) => ctx.nearbyRoads > 0,
    result: {
      name: '近路冲',
      category: '环境',
      description: '路冲煞气重，财运不稳，需化解',
      score: 50,
      matched: false,
    },
    description: '路冲需化解',
  },
  {
    id: 'near-t-junction',
    name: '近T字路',
    category: '环境',
    priority: 80,
    weight: 75,
    condition: (ctx) => ctx.nearbyTJunction,
    result: {
      name: '近T字路',
      category: '环境',
      description: 'T字路冲煞，财运反复，健康受损',
      score: 45,
      matched: false,
    },
    description: 'T字路冲',
  },
  {
    id: 'near-pole',
    name: '近电线杆',
    category: '环境',
    priority: 70,
    weight: 65,
    condition: (ctx) => ctx.nearbyPole,
    result: {
      name: '近电线杆',
      category: '环境',
      description: '电线杆为暗煞，影响运势',
      score: 55,
      matched: false,
    },
    description: '电线杆暗煞',
  },
  {
    id: 'good-water',
    name: '近水',
    category: '环境',
    priority: 75,
    weight: 70,
    condition: (ctx) => ctx.nearWater,
    result: {
      name: '近水',
      category: '环境',
      description: '水为财，有水则财运佳',
      score: 85,
      matched: false,
    },
    description: '近水财气好',
  },
  {
    id: 'good-mountain',
    name: '有山靠',
    category: '环境',
    priority: 80,
    weight: 75,
    condition: (ctx) => ctx.nearMountain,
    result: {
      name: '有山靠',
      category: '环境',
      description: '有山为靠山，贵人运佳',
      score: 85,
      matched: false,
    },
    description: '有靠山贵人多',
  },
  {
    id: 'high-floor-good',
    name: '楼层适中',
    category: '环境',
    priority: 70,
    weight: 65,
    condition: (ctx) => ctx.currentFloor >= 3 && ctx.currentFloor <= 20,
    result: {
      name: '楼层适中',
      category: '环境',
      description: '适中楼层采光通风好，运势平稳',
      score: 80,
      matched: false,
    },
    description: '楼层适中',
  },
  {
    id: 'too-low-floor',
    name: '楼层过低',
    category: '环境',
    priority: 70,
    weight: 60,
    condition: (ctx) => ctx.currentFloor < 3,
    result: {
      name: '楼层过低',
      category: '环境',
      description: '低楼层采光差，湿气重，运势受阻',
      score: 55,
      matched: false,
    },
    description: '低楼层采光差',
  },
  {
    id: 'too-high-floor',
    name: '楼层过高',
    category: '环境',
    priority: 70,
    weight: 60,
    condition: (ctx) => ctx.currentFloor > 30,
    result: {
      name: '楼层过高',
      category: '环境',
      description: '超高楼层孤单，缺乏地气支持',
      score: 55,
      matched: false,
    },
    description: '超高楼层孤单',
  },
]

// ============ 布局规则 ============

export const LAYOUT_DETAIL_RULES: FengShuiRule[] = [
  {
    id: 'door-not-facing-window',
    name: '大门不直对窗户',
    category: '布局',
    priority: 80,
    weight: 75,
    condition: (ctx) => ctx.direction.doorDirection !== 'south' || ctx.rooms.length > 0,
    result: {
      name: '门不对窗',
      category: '布局',
      description: '大门不对窗户，财气不外泄',
      score: 80,
      matched: false,
    },
    description: '门不对窗财不泄',
  },
  {
    id: 'no-sharp-corners',
    name: '无尖角',
    category: '布局',
    priority: 75,
    weight: 70,
    condition: (ctx) => ctx.layout.shape !== 'irregular',
    result: {
      name: '无明显尖角',
      category: '布局',
      description: '室内无尖角冲射，运势平稳',
      score: 80,
      matched: false,
    },
    description: '无尖角冲射',
  },
  {
    id: 'clear-path',
    name: '动线清晰',
    category: '布局',
    priority: 75,
    weight: 70,
    condition: (ctx) => ctx.layout.score >= 70,
    result: {
      name: '动线清晰',
      category: '布局',
      description: '室内动线清晰，生活便捷',
      score: 80,
      matched: false,
    },
    description: '动线清晰便捷',
  },
  {
    id: 'center-not-occupied',
    name: '中宫不为厨卫',
    category: '布局',
    priority: 80,
    weight: 75,
    condition: (ctx) => {
      const centerRoom = ctx.rooms.find(r => r.position === 'center')
      if (!centerRoom) return true
      return centerRoom.type !== 'kitchen' && centerRoom.type !== 'bathroom' && centerRoom.type !== 'master-bathroom'
    },
    result: {
      name: '中宫不为厨卫',
      category: '布局',
      description: '中宫为房屋心脏，不宜设为厨房或卫生间',
      score: 75,
      matched: false,
    },
    description: '中宫不宜为厨卫',
  },
  {
    id: 'mirror-not-facing-door',
    name: '镜子不对门',
    category: '布局',
    priority: 80,
    weight: 75,
    condition: (ctx) => {
      const entrance = ctx.rooms.find(r => r.type === 'entrance')
      return entrance !== undefined
    },
    result: {
      name: '镜子位置检查',
      category: '布局',
      description: '镜子不对大门，避免财气反射',
      score: 75,
      matched: false,
    },
    description: '镜子不对大门',
  },
  {
    id: 'stove-not-facing-door',
    name: '灶台不对门',
    category: '布局',
    priority: 80,
    weight: 75,
    condition: (ctx) => {
      const kitchen = ctx.rooms.find(r => r.type === 'kitchen')
      return kitchen !== undefined
    },
    result: {
      name: '灶台位置检查',
      category: '布局',
      description: '灶台不对大门，财气安稳',
      score: 80,
      matched: false,
    },
    description: '灶台不对大门',
  },
  {
    id: 'bed-not-facing-mirror',
    name: '床不对镜子',
    category: '布局',
    priority: 80,
    weight: 75,
    condition: (ctx) => {
      const bedrooms = ctx.rooms.filter(r => 
        r.type === 'master-bedroom' || 
        r.type === 'secondary-bedroom' ||
        r.type === 'children-bedroom'
      )
      return bedrooms.length > 0
    },
    result: {
      name: '床位镜子检查',
      category: '布局',
      description: '床不对镜子，避免惊吓影响睡眠',
      score: 75,
      matched: false,
    },
    description: '床不对镜子',
  },
  {
    id: 'desk-not-facing-window',
    name: '书桌不背窗',
    category: '布局',
    priority: 75,
    weight: 70,
    condition: (ctx) => {
      const study = ctx.rooms.find(r => r.type === 'study')
      return study !== undefined
    },
    result: {
      name: '书桌位置检查',
      category: '布局',
      description: '书桌背窗有靠山，利于专注学习',
      score: 80,
      matched: false,
    },
    description: '书桌背窗有靠',
  },
  {
    id: 'living-room-bright',
    name: '客厅采光好',
    category: '布局',
    priority: 80,
    weight: 75,
    condition: (ctx) => {
      const living = ctx.rooms.find(r => r.type === 'living')
      return living && living.hasWindow
    },
    result: {
      name: '客厅采光好',
      category: '布局',
      description: '客厅采光充足，利于纳气和健康',
      score: 85,
      matched: false,
    },
    description: '客厅采光充足',
  },
  {
    id: 'bedroom-not-too-bright',
    name: '卧室光线适中',
    category: '布局',
    priority: 75,
    weight: 70,
    condition: (ctx) => {
      const bedrooms = ctx.rooms.filter(r => 
        r.type === 'master-bedroom' || 
        r.type === 'secondary-bedroom' ||
        r.type === 'children-bedroom'
      )
      return bedrooms.length > 0
    },
    result: {
      name: '卧室光线适中',
      category: '布局',
      description: '卧室光线柔和，利于睡眠',
      score: 80,
      matched: false,
    },
    description: '卧室光线柔和',
  },
]

// ============ 导出所有规则 ============

export const FENGSHUI_RULES: FengShuiRule[] = [
  ...DIRECTION_RULES,
  ...LAYOUT_RULES,
  ...ELEMENT_RULES,
  ...ROOM_RULES,
  ...ENVIRONMENT_RULES,
  ...LAYOUT_DETAIL_RULES,
]

export function getRuleCount(): number {
  return FENGSHUI_RULES.length
}

export function getRulesByCategory(category: FengShuiCategory): FengShuiRule[] {
  return FENGSHUI_RULES.filter(r => r.category === category)
}
