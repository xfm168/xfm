/**
 * XuanFeng Core OS - 内部 API 端点定义
 *
 * 本文件定义系统内部使用的 API 端点，仅限系统内部组件调用，
 * 需要系统令牌认证。包含生命周期管理、事件总线、插件管理、
 * 配置管理、性能监控和数据迁移等功能。
 */

/**
 * 内部 API 端点类型定义
 */
export interface InternalEndpoint {
  /** 端点路径 */
  readonly path: string
  /** HTTP 方法 */
  readonly method: 'GET' | 'POST'
  /** 是否需要系统令牌认证 */
  readonly requireSystemToken: boolean
  /** 端点功能描述 */
  readonly description: string
}

/**
 * 内部 API 基础路径
 */
export const INTERNAL_BASE_PATH = '/api/v5/internal'

/**
 * 内部 API 端点列表（共 10 个）
 */
export const internalEndpoints: InternalEndpoint[] = [
  {
    path: '/system/lifecycle/init',
    method: 'POST',
    requireSystemToken: true,
    description: '初始化系统生命周期，加载核心模块和配置',
  },
  {
    path: '/system/lifecycle/start',
    method: 'POST',
    requireSystemToken: true,
    description: '启动系统，开始接收请求并运行服务',
  },
  {
    path: '/system/lifecycle/stop',
    method: 'POST',
    requireSystemToken: true,
    description: '停止系统，优雅关闭所有服务和连接',
  },
  {
    path: '/system/eventbus/emit',
    method: 'POST',
    requireSystemToken: true,
    description: '向系统事件总线发送事件消息',
  },
  {
    path: '/system/eventbus/listeners',
    method: 'GET',
    requireSystemToken: true,
    description: '获取事件总线当前所有监听器的状态',
  },
  {
    path: '/plugins/:id/force-enable',
    method: 'POST',
    requireSystemToken: true,
    description: '强制启用指定插件，忽略健康检查',
  },
  {
    path: '/config/set-immutable',
    method: 'POST',
    requireSystemToken: true,
    description: '设置不可变配置项，设置后无法修改',
  },
  {
    path: '/config/dump',
    method: 'GET',
    requireSystemToken: true,
    description: '导出当前系统所有配置项的快照',
  },
  {
    path: '/performance/reset',
    method: 'POST',
    requireSystemToken: true,
    description: '重置性能计数器和统计数据',
  },
  {
    path: '/migration/run/:targetVersion',
    method: 'POST',
    requireSystemToken: true,
    description: '执行数据迁移到指定目标版本',
  },
]
