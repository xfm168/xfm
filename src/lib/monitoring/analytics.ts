/**
 * Analytics 集成封装
 *
 * 集成 Google Analytics 4 (gtag.js) 与 Microsoft Clarity (clarity.js)。
 * 通过环境变量控制是否加载，为空时所有函数为 no-op。
 */

/** 事件参数 */
type EventParams = Record<string, string | number | boolean>

/** GA4 全局数据层类型 */
interface GtagEvent {
  command: string
  eventName?: string
  eventParams?: EventParams
  pagePath?: string
}

/** 缓存初始化状态 */
let gaInitialized = false
let clarityInitialized = false

/**
 * 动态加载外部脚本
 *
 * @param src - 脚本 URL
 * @param id - script 标签 ID（避免重复加载）
 * @param async - 是否异步加载，默认 true
 * @param onloadCallback - 加载完成回调
 */
function loadScript(
  src: string,
  id: string,
  async: boolean = true,
  onloadCallback?: () => void
): void {
  if (document.getElementById(id)) {
    return
  }

  const script = document.createElement('script')
  script.id = id
  script.async = async
  script.src = src
  if (onloadCallback) {
    script.onload = onloadCallback
  }
  document.head.appendChild(script)
}

/**
 * 初始化 GA4 与 Clarity
 *
 * - GA4: 如果 VITE_GA_MEASUREMENT_ID 存在，动态加载 gtag.js
 * - Clarity: 如果 VITE_CLARITY_PROJECT_ID 存在，动态加载 clarity.js
 */
export function initAnalytics(): void {
  /* ---------- GA4 ---------- */
  const gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string || ''

  if (gaMeasurementId) {
    // 注入 gtag.js 数据层配置
    const dataLayerScript = document.createElement('script')
    dataLayerScript.innerHTML =
      'window.dataLayer = window.dataLayer || [];\n' +
      'function gtag(){dataLayer.push(arguments);}'
    document.head.appendChild(dataLayerScript)

    // 加载 gtag.js
    loadScript(
      'https://www.googletagmanager.com/gtag/js?id=' + gaMeasurementId,
      'ga-gtag-script',
      true,
      function () {
        // 配置 GA4
        ;(window as unknown as Record<string, (...args: unknown[]) => void>).gtag(
          'config',
          gaMeasurementId
        )
        gaInitialized = true
      }
    )
  }

  /* ---------- Microsoft Clarity ---------- */
  const clarityProjectId = import.meta.env.VITE_CLARITY_PROJECT_ID as string || ''

  if (clarityProjectId) {
    const clarityScript = document.createElement('script')
    clarityScript.innerHTML =
      '(function(c,l,a,r,i,t,y){' +
      'c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};' +
      't=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;' +
      'y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);' +
      '})(window,document,"clarity","script","' + clarityProjectId + '");'
    document.head.appendChild(clarityScript)
    clarityInitialized = true
  }
}

/**
 * 记录页面浏览
 *
 * @param page - 页面路径，例如 '/dashboard'
 */
export function trackPageView(page: string): void {
  if (!gaInitialized) {
    return
  }

  ;(window as unknown as Record<string, (...args: unknown[]) => void>).gtag(
    'event',
    'page_view',
    { page_path: page }
  )
}

/**
 * 记录自定义事件
 *
 * @param name - 事件名称，例如 'click_premium_button'
 * @param params - 事件参数
 */
export function trackEvent(name: string, params?: EventParams): void {
  if (!gaInitialized) {
    return
  }

  ;(window as unknown as Record<string, (...args: unknown[]) => void>).gtag(
    'event',
    name,
    params || {}
  )
}

/**
 * 记录转化事件
 *
 * @param name - 转化名称，例如 'purchase'
 * @param value - 转化价值（金额）
 */
export function trackConversion(name: string, value: number): void {
  if (!gaInitialized) {
    return
  }

  ;(window as unknown as Record<string, (...args: unknown[]) => void>).gtag(
    'event',
    name,
    { value: value, currency: 'CNY' }
  )
}

/**
 * 设置用户属性
 *
 * @param name - 属性名
 * @param value - 属性值
 */
export function setUserProperty(name: string, value: string): void {
  if (!gaInitialized) {
    return
  }

  var config: Record<string, unknown> = {}
  config['user_property.' + name] = value
  ;(window as unknown as Record<string, (...args: unknown[]) => void>).gtag(
    'config',
    import.meta.env.VITE_GA_MEASUREMENT_ID as string || '',
    config
  )
}
