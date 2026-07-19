/**
 * Beta Test Framework — 玄风门 Beta 测试数据结构与工具函数
 * 禁止修改任何命理算法
 */

// ────────────────────────────────────────────────
//  测试类型
// ────────────────────────────────────────────────
export type Severity = 'critical' | 'major' | 'minor' | 'suggestion'

export type PageId =
  | 'home'
  | 'fengshui'
  | 'analysis'
  | 'premium-report'
  | 'daily'
  | 'bazi-input'
  | 'bazi-chart'
  | 'bazi-history'
  | 'liuyao'
  | 'records'
  | 'membership'
  | 'admin'

export type DeviceType = 'desktop' | 'mobile' | 'tablet'
export type BrowserType = 'chrome' | 'safari' | 'firefox' | 'wechat' | 'other'

export interface BetaTester {
  id: string
  nickname: string
  device: DeviceType
  browser: BrowserType
  joinDate: string
  totalSessions: number
  totalFeedbacks: number
}

export interface BugReport {
  id: string
  testerId: string
  page: PageId
  severity: Severity
  title: string
  description: string
  steps: string[]
  expected: string
  actual: string
  screenshot?: string
  createdAt: string
  status: 'open' | 'confirmed' | 'fixed' | 'wontfix'
}

export interface Misoperation {
  id: string
  testerId: string
  page: PageId
  action: string
  description: string
  frequency: 'once' | 'multiple' | 'frequent'
  createdAt: string
}

export interface SatisfactionRating {
  testerId: string
  page: PageId
  overall: number       // 1-5
  speed: number         // 1-5
  easeOfUse: number    // 1-5
  visual: number       // 1-5
  accuracy: number      // 1-5
  comment?: string
  createdAt: string
}

export interface Suggestion {
  id: string
  testerId: string
  page: PageId
  title: string
  description: string
  votes: number
  createdAt: string
  status: 'pending' | 'planned' | 'implemented' | 'rejected'
}

export interface PerformanceRecord {
  testerId: string
  page: PageId
  metric: 'first-contentful-paint' | 'largest-contentful-paint' | 'time-to-interactive' | 'cumulative-layout-shift'
  value: number
  device: DeviceType
  createdAt: string
}

export interface CrashRecord {
  id: string
  testerId: string
  page: PageId
  error: string
  stack: string
  device: DeviceType
  browser: BrowserType
  createdAt: string
  resolved: boolean
}

export interface WaitTimeRecord {
  testerId: string
  page: PageId
  action: string
  perceivedMs: number     // 用户感知的等待时间
  actualMs: number        // 实际测量时间
  acceptable: boolean     // 是否可接受
  createdAt: string
}

export interface BetaMetrics {
  totalTesters: number
  totalSessions: number
  totalBugReports: number
  bugsBySeverity: Record<Severity, number>
  totalMisoperations: number
  avgSatisfaction: number
  avgSpeed: number
  avgEaseOfUse: number
  avgVisual: number
  avgAccuracy: number
  totalSuggestions: number
  crashRate: number          // 崩溃次数 / 总会话数
  avgWaitTime: number        // 平均感知等待时间（秒）
  p95WaitTime: number        // P95 感知等待时间（秒）
  acceptableWaitRatio: number // 可接受等待时间占比
  pagesCovered: number
  devicesCovered: number
}

export interface BetaState {
  testers: BetaTester[]
  bugs: BugReport[]
  misoperations: Misoperation[]
  satisfactions: SatisfactionRating[]
  suggestions: Suggestion[]
  performances: PerformanceRecord[]
  crashes: CrashRecord[]
  waitTimes: WaitTimeRecord[]
}

// ────────────────────────────────────────────────
//  页面定义
// ────────────────────────────────────────────────
export interface PageDefinition {
  id: PageId
  name: string
  route: string
  description: string
  testScenarios: string[]
}

export var BETA_PAGES: PageDefinition[] = [
  {
    id: 'home',
    name: '首页',
    route: '/',
    description: '主页面，功能导航入口，展示今日卦象和功能卡片',
    testScenarios: [
      '首页加载完整性检查',
      '导航链接有效性验证',
      '指南针动画流畅性',
      '响应式布局在不同设备的表现',
    ],
  },
  {
    id: 'fengshui',
    name: '风水堪测',
    route: '/fengshui',
    description: '上传图片进行 AI 风水分析',
    testScenarios: [
      '房间类型选择交互',
      '图片上传（各种格式/大小）',
      '分析结果展示完整性',
      '风水评分准确性感知',
    ],
  },
  {
    id: 'analysis',
    name: '风水图片分析',
    route: '/analysis',
    description: '旧版 AI 图片风水分析',
    testScenarios: [
      'AI 分析流程完整性',
      '分析结果保存功能',
      '结果展示可读性',
    ],
  },
  {
    id: 'premium-report',
    name: '付费报告',
    route: '/premium-report',
    description: '付费风水详细报告',
    testScenarios: [
      '支付门控流程',
      '报告内容完整性',
      '支付模拟（当前为模拟模式）',
    ],
  },
  {
    id: 'daily',
    name: '每日卦运',
    route: '/daily',
    description: '基于日期的每日卦象展示',
    testScenarios: [
      '当日卦象正确性',
      '五维评分展示',
      '日期切换功能',
    ],
  },
  {
    id: 'bazi-input',
    name: '八字输入',
    route: '/bazi',
    description: '八字排盘输入表单',
    testScenarios: [
      '表单输入验证',
      '日期/时间选择器交互',
      '性别切换',
      '提交计算响应速度',
    ],
  },
  {
    id: 'bazi-chart',
    name: '八字命盘',
    route: '/bazi/chart',
    description: '八字详细命盘，17个 Tab 展示',
    testScenarios: [
      '17 个 Tab 切换流畅性',
      'AI 分析功能',
      '报告导出（Markdown/Word/PDF）',
      '海报生成功能',
      'Confidence 报告展示',
      '报告体验 Tab 功能',
    ],
  },
  {
    id: 'bazi-history',
    name: '命盘历史',
    route: '/bazi/history',
    description: '已保存的命盘列表',
    testScenarios: [
      '历史记录加载',
      '命盘查看/删除',
      '空状态展示',
    ],
  },
  {
    id: 'liuyao',
    name: '六爻占卜',
    route: '/liuyao',
    description: '三阶段六爻占卜交互',
    testScenarios: [
      '起课仪式交互',
      '铜钱摇卦动画',
      '卦象结果展示',
      'AI 解读完整性',
    ],
  },
  {
    id: 'records',
    name: '卦运记录',
    route: '/records',
    description: '综合记录时间线',
    testScenarios: [
      '时间线展示',
      '筛选功能（7天/30天/全部）',
      '离线记录支持',
    ],
  },
  {
    id: 'membership',
    name: '会员中心',
    route: '/membership',
    description: '会员计划、积分、优惠券',
    testScenarios: [
      '会员计划展示',
      '升级流程模拟',
      '邀请码复制功能',
      '优惠券兑换流程',
      '成长等级展示',
    ],
  },
  {
    id: 'admin',
    name: '运营后台',
    route: '/admin',
    description: '数据看板（需管理员权限）',
    testScenarios: [
      '权限验证（未登录应拒绝）',
      '数据指标展示',
      '图表渲染正确性',
      '刷新功能',
    ],
  },
]

// ────────────────────────────────────────────────
//  Mock 数据生成（用于 Beta Report 演示）
// ────────────────────────────────────────────────
export function generateMockBetaMetrics(): BetaMetrics {
  return {
    totalTesters: 128,
    totalSessions: 456,
    totalBugReports: 23,
    bugsBySeverity: {
      critical: 1,
      major: 4,
      minor: 12,
      suggestion: 6,
    },
    totalMisoperations: 47,
    avgSatisfaction: 4.1,
    avgSpeed: 3.8,
    avgEaseOfUse: 4.0,
    avgVisual: 4.4,
    avgAccuracy: 4.2,
    totalSuggestions: 34,
    crashRate: 0.004,       // 0.4%
    avgWaitTime: 1.8,       // 1.8秒
    p95WaitTime: 4.2,       // P95 4.2秒
    acceptableWaitRatio: 0.92,  // 92% 可接受
    pagesCovered: 12,
    devicesCovered: 3,
  }
}

export function generateMockWaitTimes(): WaitTimeRecord[] {
  var records: WaitTimeRecord[] = []
  var actions = [
    { page: 'home' as PageId, action: '首页加载' },
    { page: 'fengshui' as PageId, action: 'AI风水分析' },
    { page: 'bazi-input' as PageId, action: '八字排盘计算' },
    { page: 'bazi-chart' as PageId, action: 'AI分析生成' },
    { page: 'liuyao' as PageId, action: '六爻起课' },
    { page: 'daily' as PageId, action: '每日卦运加载' },
    { page: 'membership' as PageId, action: '会员页面加载' },
    { page: 'admin' as PageId, action: 'Dashboard数据加载' },
  ]

  for (var i = 0; i < 80; i++) {
    var item = actions[i % actions.length]
    var actual = item.page === 'bazi-chart' && item.action === 'AI分析生成'
      ? 800 + Math.random() * 1200
      : item.page === 'fengshui' && item.action === 'AI风水分析'
        ? 2000 + Math.random() * 3000
        : 200 + Math.random() * 600
    var perceived = actual * (0.8 + Math.random() * 0.6)

    records.push({
      testerId: 'T-' + String(Math.floor(i / 3) + 1).padStart(3, '0'),
      page: item.page,
      action: item.action,
      perceivedMs: Math.round(perceived),
      actualMs: Math.round(actual),
      acceptable: perceived < 3000,
      createdAt: '2026-07-' + String(5 + Math.floor(i / 12)).padStart(2, '0') + 'T' + String(8 + Math.floor(Math.random() * 12)).padStart(2, '0') + ':00:00Z',
    })
  }

  return records
}

export function generateMockBugs(): BugReport[] {
  return [
    {
      id: 'BUG-001',
      testerId: 'T-012',
      page: 'bazi-chart',
      severity: 'critical',
      title: 'BaziChart 页面在 iOS Safari 上首次加载白屏',
      description: '在 iOS 16.5 Safari 上首次访问 /bazi/chart 时出现 3-5 秒白屏，之后正常',
      steps: ['打开 iOS Safari', '访问 /bazi/chart', '等待加载'],
      expected: '正常展示命盘内容',
      actual: '白屏 3-5 秒后突然渲染',
      createdAt: '2026-07-06T10:23:00Z',
      status: 'confirmed',
    },
    {
      id: 'BUG-002',
      testerId: 'T-045',
      page: 'fengshui',
      severity: 'major',
      title: '风水分析上传 5MB+ 图片后页面卡顿',
      description: '上传超过 5MB 的图片后，分析过程中页面明显卡顿',
      steps: ['进入风水堪测', '上传 8MB 照片', '点击分析', '等待结果'],
      expected: '分析过程流畅',
      actual: '页面冻结约 2 秒',
      createdAt: '2026-07-07T14:15:00Z',
      status: 'open',
    },
    {
      id: 'BUG-003',
      testerId: 'T-023',
      page: 'liuyao',
      severity: 'major',
      title: '铜钱摇卦动画在低端安卓机上帧率低',
      description: 'Redmi Note 11 上铜钱旋转动画约 10fps，体验差',
      steps: ['进入六爻占卜', '点击起课', '观察铜钱动画'],
      expected: '流畅动画',
      actual: '卡顿明显',
      createdAt: '2026-07-07T16:42:00Z',
      status: 'open',
    },
    {
      id: 'BUG-004',
      testerId: 'T-067',
      page: 'membership',
      severity: 'major',
      title: '会员升级后返回页面未刷新状态',
      description: '点击升级按钮后，页面显示的会员等级未立即更新',
      steps: ['进入会员中心', '点击基础版升级', '确认支付（模拟）', '返回会员中心'],
      expected: '等级立即更新',
      actual: '需要手动刷新页面',
      createdAt: '2026-07-08T09:30:00Z',
      status: 'fixed',
    },
    {
      id: 'BUG-005',
      testerId: 'T-089',
      page: 'daily',
      severity: 'major',
      title: '每日卦运在跨日切换时未自动更新',
      description: '在午夜后继续使用页面，卦象未自动切换到新一天',
      steps: ['在 23:58 打开每日卦运', '等待跨过零点', '观察卦象是否变化'],
      expected: '自动更新',
      actual: '显示前一天的卦象',
      createdAt: '2026-07-09T00:05:00Z',
      status: 'open',
    },
    {
      id: 'BUG-006',
      testerId: 'T-034',
      page: 'bazi-chart',
      severity: 'minor',
      title: '报告 Tab 的 AI 解读内容在弱网下加载慢',
      description: '在 3G 网络环境下，AI 解读需要 8 秒以上',
      steps: ['在 Chrome DevTools 设置 3G 网络', '进入报告 Tab', '等待 AI 解读加载'],
      expected: '3 秒内展示',
      actual: '8 秒以上',
      createdAt: '2026-07-06T11:20:00Z',
      status: 'open',
    },
    {
      id: 'BUG-007',
      testerId: 'T-056',
      page: 'home',
      severity: 'minor',
      title: '首页指南针动画在 Firefox 上显示异常',
      description: 'Firefox 127 上指南针指针方向不正确',
      steps: ['使用 Firefox 127 打开首页', '观察指南针动画'],
      expected: '指针正确旋转',
      actual: '指针偏移约 30 度',
      createdAt: '2026-07-07T08:45:00Z',
      status: 'confirmed',
    },
    {
      id: 'BUG-008',
      testerId: 'T-091',
      page: 'bazi-history',
      severity: 'minor',
      title: '删除命盘确认弹窗无取消按钮焦点',
      description: '弹窗出现时焦点不在取消按钮上，容易误操作',
      steps: ['打开命盘历史', '点击删除按钮', '观察弹窗焦点'],
      expected: '焦点在取消按钮',
      actual: '焦点无明确位置',
      createdAt: '2026-07-08T15:10:00Z',
      status: 'open',
    },
  ]
}

export function generateMockSatisfaction(): SatisfactionRating[] {
  var records: SatisfactionRating[] = []
  var pages: PageId[] = ['home', 'fengshui', 'bazi-input', 'bazi-chart', 'liuyao', 'daily', 'membership']

  for (var i = 0; i < 128; i++) {
    records.push({
      testerId: 'T-' + String(i + 1).padStart(3, '0'),
      page: pages[i % pages.length],
      overall: 3.5 + Math.random() * 1.5,
      speed: 3.0 + Math.random() * 2.0,
      easeOfUse: 3.5 + Math.random() * 1.5,
      visual: 4.0 + Math.random() * 1.0,
      accuracy: 3.8 + Math.random() * 1.2,
      comment: i % 10 === 0 ? '整体体验不错，建议优化加载速度' : undefined,
      createdAt: '2026-07-' + String(5 + Math.floor(i / 20)).padStart(2, '0') + 'T12:00:00Z',
    })
  }

  return records
}
