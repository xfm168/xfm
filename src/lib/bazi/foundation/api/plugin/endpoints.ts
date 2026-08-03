/**
 * XuanFeng Core OS - 插件 API 端点定义
 *
 * 本文件定义面向插件系统的 API 端点，
 * 包含插件注册、事件发送、服务注册、
 * 配置管理和数据查询等插件能力接口。
 */

/**
 * 插件 API 端点类型定义
 */
export interface PluginEndpoint {
  /** 端点路径 */
  readonly path: string
  /** HTTP 方法 */
  readonly method: 'GET' | 'POST'
  /** 是否需要插件 ID 认证 */
  readonly requirePluginId: boolean
  /** 端点功能描述 */
  readonly description: string
}

/**
 * 插件 API 基础路径
 */
export const PLUGIN_BASE_PATH = '/api/v5/plugin'

/**
 * 插件 API 端点列表（共 10 个）
 */
export const pluginEndpoints: PluginEndpoint[] = [
  {
    path: '/plugin/register',
    method: 'POST',
    requirePluginId: false,
    description: '注册新插件到插件管理器',
  },
  {
    path: '/plugin/event/emit',
    method: 'POST',
    requirePluginId: true,
    description: '插件向系统发送事件消息',
  },
  {
    path: '/plugin/status/:id',
    method: 'GET',
    requirePluginId: true,
    description: '获取指定插件的运行状态',
  },
  {
    path: '/plugin/service/register',
    method: 'POST',
    requirePluginId: true,
    description: '插件注册可被其他插件调用的服务',
  },
  {
    path: '/plugin/service/list',
    method: 'GET',
    requirePluginId: true,
    description: '获取当前所有已注册的插件服务列表',
  },
  {
    path: '/plugin/config/get',
    method: 'POST',
    requirePluginId: true,
    description: '获取当前插件的配置项',
  },
  {
    path: '/plugin/config/set',
    method: 'POST',
    requirePluginId: true,
    description: '设置当前插件的配置项',
  },
  {
    path: '/plugin/case/query',
    method: 'POST',
    requirePluginId: true,
    description: '插件查询案例库数据',
  },
  {
    path: '/plugin/classic/query',
    method: 'POST',
    requirePluginId: true,
    description: '插件查询经典文献数据',
  },
  {
    path: '/plugin/rule/query',
    method: 'POST',
    requirePluginId: true,
    description: '插件查询规则引擎数据',
  },
]
