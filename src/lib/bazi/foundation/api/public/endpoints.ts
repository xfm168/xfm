/**
 * XuanFeng Core OS - 公共 API 端点定义
 *
 * 本文件定义面向用户和前端 UI 的公共 API 端点，
 * 包含决策分析、规则引擎、案例库、经典文献、
 * 质量监控和评分解释等业务功能。
 */

/**
 * 公共 API 端点类型定义
 */
export interface PublicEndpoint {
  /** 端点路径 */
  readonly path: string
  /** HTTP 方法 */
  readonly method: 'GET' | 'POST'
  /** 是否需要用户认证 */
  readonly requireAuth: boolean
  /** 速率限制（每分钟请求次数，可选） */
  readonly rateLimit?: number
  /** 端点功能描述 */
  readonly description: string
}

/**
 * 公共 API 基础路径
 */
export const PUBLIC_BASE_PATH = '/api/v5/public'

/**
 * 公共 API 端点列表（共 12 个）
 */
export const publicEndpoints: PublicEndpoint[] = [
  {
    path: '/decision/analyze',
    method: 'POST',
    requireAuth: true,
    rateLimit: 60,
    description: '执行八字决策分析，返回综合分析结果',
  },
  {
    path: '/decision/schools',
    method: 'GET',
    requireAuth: false,
    rateLimit: 120,
    description: '获取支持的命理流派列表和说明',
  },
  {
    path: '/rules',
    method: 'GET',
    requireAuth: false,
    rateLimit: 120,
    description: '获取规则引擎中的所有规则列表',
  },
  {
    path: '/rules/:id',
    method: 'GET',
    requireAuth: false,
    rateLimit: 120,
    description: '根据 ID 获取单条规则的详细信息',
  },
  {
    path: '/cases',
    method: 'GET',
    requireAuth: false,
    rateLimit: 120,
    description: '获取案例库中的案例列表（分页）',
  },
  {
    path: '/cases/:id',
    method: 'GET',
    requireAuth: false,
    rateLimit: 120,
    description: '根据 ID 获取单个案例的详细内容',
  },
  {
    path: '/cases/similarity',
    method: 'POST',
    requireAuth: true,
    rateLimit: 60,
    description: '查询与给定八字相似的历史案例',
  },
  {
    path: '/classics',
    method: 'GET',
    requireAuth: false,
    rateLimit: 120,
    description: '获取经典命理文献目录列表',
  },
  {
    path: '/classics/search',
    method: 'GET',
    requireAuth: false,
    rateLimit: 120,
    description: '在经典文献中搜索关键词',
  },
  {
    path: '/quality/accuracy',
    method: 'GET',
    requireAuth: false,
    rateLimit: 60,
    description: '获取系统准确率评估数据',
  },
  {
    path: '/quality/dashboard',
    method: 'GET',
    requireAuth: true,
    rateLimit: 60,
    description: '获取质量监控仪表盘数据',
  },
  {
    path: '/explain/score/:id',
    method: 'GET',
    requireAuth: true,
    rateLimit: 120,
    description: '获取指定分析结果的评分解释和推理链',
  },
]
