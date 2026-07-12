/**
 * 安全审计工具（Security Audit）
 *
 * 提供一组静态审计函数，覆盖 XSS、CSRF、限流、输入验证、输出编码、
 * 硬编码密钥、依赖漏洞与许可证合规等维度，并可汇总为带评分的审计结果。
 *
 * 审计既可基于运行时 DOM（浏览器环境），也可基于传入的源码字符串数组（ctx.sources）
 * 与依赖清单（ctx.dependencies）。runDependencyScan / runLicenseScan 默认读取项目
 * package.json 的依赖信息。
 *
 * 所有字符串拼接使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

import packageJson from '../../../package.json'

/** 审计发现项 */
export interface AuditFinding {
  /** 审计类别 */
  category: string
  /** 严重程度 */
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  /** 问题描述 */
  description: string
  /** 修复建议 */
  recommendation: string
  /** 状态：pass / warn / fail */
  status: 'pass' | 'warn' | 'fail'
}

/** 完整审计结果 */
export interface SecurityAuditResult {
  /** 安全评分（0-100） */
  score: number
  /** 全部审计发现 */
  findings: AuditFinding[]
  /** 是否通过（score >= 80 且无 critical/high fail） */
  passed: boolean
}

/** 审计上下文（可选输入） */
export interface AuditContext {
  /** 待扫描的源码字符串数组 */
  sources?: string[]
  /** 依赖清单 { name: version } */
  dependencies?: Record<string, string>
  /** DOM 根节点，默认 document */
  root?: HTMLElement | Document
}

/** 通过审计的分数阈值 */
const PASS_SCORE_THRESHOLD: number = 80

/**
 * XSS 审计
 *
 * 检查源码中的 dangerouslySetInnerHTML 使用，以及 DOM 中的内联事件处理器、
 * javascript: 协议链接、未沙箱化的 iframe。
 */
export function runXSSAudit(ctx?: AuditContext): AuditFinding[] {
  const findings: AuditFinding[] = []
  const sources = ctx && ctx.sources ? ctx.sources : []

  // 源码层面：扫描 dangerouslySetInnerHTML
  let dangerCount = 0
  for (let i = 0; i < sources.length; i++) {
    const matches = sources[i].match(/dangerouslySetInnerHTML/g)
    if (matches) {
      dangerCount += matches.length
    }
  }
  if (dangerCount > 0) {
    findings.push({
      category: 'XSS',
      severity: 'high',
      description: '检测到 ' + String(dangerCount) + ' 处 dangerouslySetInnerHTML 使用，存在 XSS 风险。',
      recommendation: '尽量避免使用 dangerouslySetInnerHTML；如必须使用，请确保内容已严格消毒（sanitizeHtml）。',
      status: 'fail'
    })
  } else {
    findings.push({
      category: 'XSS',
      severity: 'info',
      description: '未检测到 dangerouslySetInnerHTML 使用。',
      recommendation: '保持现状，避免直接注入未消毒的 HTML。',
      status: 'pass'
    })
  }

  // 源码层面：扫描 eval / document.write / new Function
  let evalCount = 0
  for (let j = 0; j < sources.length; j++) {
    const m = sources[j].match(/\beval\s*\(|document\.write\s*\(|new\s+Function\s*\(/g)
    if (m) {
      evalCount += m.length
    }
  }
  if (evalCount > 0) {
    findings.push({
      category: 'XSS',
      severity: 'high',
      description: '检测到 ' + String(evalCount) + ' 处 eval/document.write/new Function 调用。',
      recommendation: '禁止使用 eval、document.write、new Function，改用安全的 JSON.parse 与 DOM API。',
      status: 'fail'
    })
  }

  // DOM 层面
  if (typeof document !== 'undefined') {
    const root = ctx && ctx.root ? ctx.root : document

    // javascript: 协议链接
    const badLinks = root.querySelectorAll('a[href^="javascript:"], iframe[src^="javascript:"]')
    if (badLinks.length > 0) {
      findings.push({
        category: 'XSS',
        severity: 'critical',
        description: '检测到 ' + String(badLinks.length) + ' 个使用 javascript: 协议的链接/资源。',
        recommendation: '移除 javascript: 协议，使用安全的事件绑定方式。',
        status: 'fail'
      })
    }

    // 未沙箱化的 iframe
    const iframes = root.querySelectorAll('iframe:not([sandbox])')
    if (iframes.length > 0) {
      findings.push({
        category: 'XSS',
        severity: 'medium',
        description: '检测到 ' + String(iframes.length) + ' 个未设置 sandbox 属性的 iframe。',
        recommendation: '为所有 iframe 添加 sandbox 属性以限制其能力。',
        status: 'warn'
      })
    }

    // 内联事件处理器
    const all = root.querySelectorAll('*')
    let inlineHandlerCount = 0
    for (let k = 0; k < all.length; k++) {
      const el = all[k] as Element
      const attrs = el.attributes
      for (let a = 0; a < attrs.length; a++) {
        if (attrs[a].name.indexOf('on') === 0 && attrs[a].name.length > 2) {
          inlineHandlerCount++
        }
      }
    }
    if (inlineHandlerCount > 0) {
      findings.push({
        category: 'XSS',
        severity: 'medium',
        description: '检测到 ' + String(inlineHandlerCount) + ' 个内联事件处理器（on* 属性）。',
        recommendation: '使用 addEventListener 或 React 事件绑定替代内联事件处理器。',
        status: 'warn'
      })
    }
  }

  return findings
}

/**
 * CSRF 防护审计
 *
 * 检查是否存在 CSRF token 机制（meta 标签或 cookie），以及源码中是否对
 * 写操作请求携带了 CSRF 防护。
 */
export function runCSRFCudit(ctx?: AuditContext): AuditFinding[] {
  const findings: AuditFinding[] = []
  const sources = ctx && ctx.sources ? ctx.sources : []

  let hasCsrfToken = false
  // DOM 层面：检查 meta csrf-token
  if (typeof document !== 'undefined') {
    const meta = document.querySelector('meta[name="csrf-token"]')
    if (meta) {
      hasCsrfToken = true
    }
    // cookie 中是否包含 csrf
    if (document.cookie.indexOf('csrf') !== -1 || document.cookie.indexOf('xsrf') !== -1) {
      hasCsrfToken = true
    }
  }

  // 源码层面：扫描 CSRF 相关模式
  let csrfInSource = false
  for (let i = 0; i < sources.length; i++) {
    if (/csrf|xsrf/i.test(sources[i])) {
      csrfInSource = true
      break
    }
  }

  if (hasCsrfToken || csrfInSource) {
    findings.push({
      category: 'CSRF',
      severity: 'info',
      description: '检测到 CSRF 防护机制（token 或源码引用）。',
      recommendation: '确保所有写操作（POST/PUT/DELETE）均校验 CSRF token，并使用 SameSite=Strict/Lax Cookie。',
      status: 'pass'
    })
  } else {
    findings.push({
      category: 'CSRF',
      severity: 'high',
      description: '未检测到 CSRF 防护机制。',
      recommendation: '为所有状态变更接口添加 CSRF token 校验，或使用 SameSite Cookie 属性。',
      status: 'fail'
    })
  }

  return findings
}

/**
 * 限流（Rate Limit）审计
 *
 * 检查源码中是否使用了限流器，并对敏感端点进行了限流配置。
 */
export function runRateLimitAudit(ctx?: AuditContext): AuditFinding[] {
  const findings: AuditFinding[] = []
  const sources = ctx && ctx.sources ? ctx.sources : []

  let limiterCount = 0
  for (let i = 0; i < sources.length; i++) {
    const m = sources[i].match(/createRateLimiter|rateLimit|rateLimiter/gi)
    if (m) {
      limiterCount += m.length
    }
  }

  if (limiterCount > 0) {
    findings.push({
      category: 'RateLimit',
      severity: 'info',
      description: '检测到 ' + String(limiterCount) + ' 处限流相关代码引用。',
      recommendation: '确认登录、注册、支付、AI 分析等敏感端点均配置了合理限流阈值。',
      status: 'pass'
    })
  } else {
    findings.push({
      category: 'RateLimit',
      severity: 'medium',
      description: '未在源码中检测到限流配置。',
      recommendation: '为敏感接口添加限流（createRateLimiter），防止暴力破解与滥用。',
      status: 'warn'
    })
  }

  return findings
}

/**
 * 输入验证审计
 *
 * 检查 DOM 表单是否为输入元素关联了标签与校验，以及源码中是否使用了消毒函数。
 */
export function runInputAudit(ctx?: AuditContext): AuditFinding[] {
  const findings: AuditFinding[] = []
  const sources = ctx && ctx.sources ? ctx.sources : []

  let sanitizeCount = 0
  for (let i = 0; i < sources.length; i++) {
    const m = sources[i].match(/sanitizeInput|sanitizeHtml|sanitizeUrl|encodeForHtml/g)
    if (m) {
      sanitizeCount += m.length
    }
  }
  if (sanitizeCount > 0) {
    findings.push({
      category: 'InputValidation',
      severity: 'info',
      description: '检测到 ' + String(sanitizeCount) + ' 处输入消毒/编码调用。',
      recommendation: '确保所有用户输入在写入 DOM 或提交前均经过消毒。',
      status: 'pass'
    })
  } else {
    findings.push({
      category: 'InputValidation',
      severity: 'medium',
      description: '未检测到输入消毒函数调用。',
      recommendation: '对所有用户输入使用 sanitizeInput / encodeForHtml 等消毒函数。',
      status: 'warn'
    })
  }

  // DOM 层面：检查未关联 label 的表单控件
  if (typeof document !== 'undefined') {
    const root = ctx && ctx.root ? ctx.root : document
    const inputs = root.querySelectorAll('input, select, textarea')
    let unlabeled = 0
    for (let i = 0; i < inputs.length; i++) {
      const el = inputs[i] as HTMLInputElement
      if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button') {
        continue
      }
      const id = el.getAttribute('id')
      const ariaLabel = el.getAttribute('aria-label')
      const hasLabel =
        (id && root.querySelector('label[for="' + id + '"]') ? true : false) ||
        (ariaLabel ? true : false) ||
        (el.closest('label') ? true : false)
      if (!hasLabel) {
        unlabeled++
      }
    }
    if (unlabeled > 0) {
      findings.push({
        category: 'InputValidation',
        severity: 'low',
        description: '检测到 ' + String(unlabeled) + ' 个未关联 label 的表单控件。',
        recommendation: '为每个表单控件提供关联的 <label> 或 aria-label。',
        status: 'warn'
      })
    }
  }

  return findings
}

/**
 * 输出编码审计
 *
 * 检查源码中是否存在不安全的输出方式（innerHTML、outerHTML 赋值、document.write）。
 */
export function runOutputAudit(ctx?: AuditContext): AuditFinding[] {
  const findings: AuditFinding[] = []
  const sources = ctx && ctx.sources ? ctx.sources : []

  let unsafeOutput = 0
  for (let i = 0; i < sources.length; i++) {
    const m = sources[i].match(/\.innerHTML\s*=|\.outerHTML\s*=|document\.write\s*\(/g)
    if (m) {
      unsafeOutput += m.length
    }
  }

  if (unsafeOutput > 0) {
    findings.push({
      category: 'OutputEncoding',
      severity: 'high',
      description: '检测到 ' + String(unsafeOutput) + ' 处不安全的输出（innerHTML/outerHTML/document.write）。',
      recommendation: '使用 textContent 或 React 文本插值替代直接设置 innerHTML。',
      status: 'fail'
    })
  } else {
    findings.push({
      category: 'OutputEncoding',
      severity: 'info',
      description: '未检测到不安全的输出方式。',
      recommendation: '保持现状，避免直接操作 innerHTML。',
      status: 'pass'
    })
  }

  return findings
}

/**
 * 硬编码密钥扫描
 *
 * 扫描源码中常见的硬编码密钥模式：API Key、密码、Token、AWS 凭证、私钥等。
 */
export function runSecretsScan(ctx?: AuditContext): AuditFinding[] {
  const findings: AuditFinding[] = []
  const sources = ctx && ctx.sources ? ctx.sources : []

  const patterns: Array<{ name: string; regex: RegExp; severity: AuditFinding['severity'] }> = [
    {
      name: 'AWS Access Key',
      regex: /AKIA[0-9A-Z]{16}/,
      severity: 'critical'
    },
    {
      name: '私钥',
      regex: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/,
      severity: 'critical'
    },
    {
      name: 'API Key/Secret 赋值',
      regex: /(?:api[_-]?key|api[_-]?secret|apikey)\s*[:=]\s*['"][A-Za-z0-9_\-]{20,}['"]/i,
      severity: 'high'
    },
    {
      name: '密码赋值',
      regex: /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"\s]{6,}['"]/i,
      severity: 'high'
    },
    {
      name: 'Token/Secret 赋值',
      regex: /(?:secret|token|auth[_-]?token|access[_-]?token)\s*[:=]\s*['"][A-Za-z0-9_\-]{20,}['"]/i,
      severity: 'high'
    },
    {
      name: 'JWT',
      regex: /eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}/,
      severity: 'medium'
    }
  ]

  let totalSecrets = 0
  const hitNames: string[] = []
  for (let i = 0; i < sources.length; i++) {
    for (let p = 0; p < patterns.length; p++) {
      if (patterns[p].regex.test(sources[i])) {
        totalSecrets++
        if (hitNames.indexOf(patterns[p].name) === -1) {
          hitNames.push(patterns[p].name)
        }
      }
    }
  }

  if (totalSecrets > 0) {
    findings.push({
      category: 'Secrets',
      severity: 'critical',
      description: '检测到 ' + String(totalSecrets) + ' 处疑似硬编码密钥（' + hitNames.join('、') + '）。',
      recommendation: '将密钥迁移到环境变量或密钥管理服务，并轮换已泄露的密钥。',
      status: 'fail'
    })
  } else {
    findings.push({
      category: 'Secrets',
      severity: 'info',
      description: '未检测到硬编码密钥。',
      recommendation: '保持密钥通过环境变量注入，勿提交到代码仓库。',
      status: 'pass'
    })
  }

  return findings
}

/** 已知存在风险的依赖包（示例黑名单，生产环境应接入 OSV/NPM Audit） */
const RISKY_PACKAGES: Record<string, string> = {
  'node-uuid': '存在重复密钥风险，请改用 uuid',
  'left-pad': '已被弃用',
  'request': '已弃用，存在已知漏洞，请改用 node-fetch/undici',
  'lodash': '请确保版本 >= 4.17.21 以避免原型污染'
}

/**
 * 依赖漏洞扫描
 *
 * 检查依赖清单是否存在未锁定版本、已知风险包，以及依赖总数是否过多。
 * 默认使用项目 package.json 的 dependencies。
 */
export function runDependencyScan(deps?: Record<string, string>): AuditFinding[] {
  const findings: AuditFinding[] = []
  const dependencies =
    deps && Object.keys(deps).length > 0
      ? deps
      : (packageJson.dependencies as Record<string, string>) || {}

  const names = Object.keys(dependencies)
  if (names.length === 0) {
    findings.push({
      category: 'Dependencies',
      severity: 'low',
      description: '未发现依赖项。',
      recommendation: '确认依赖清单是否正确加载。',
      status: 'warn'
    })
    return findings
  }

  // 未锁定版本
  const unpinned: string[] = []
  const risky: string[] = []
  for (let i = 0; i < names.length; i++) {
    const name = names[i]
    const version = dependencies[name]
    if (version === '*' || version === 'latest' || version === '') {
      unpinned.push(name)
    }
    if (RISKY_PACKAGES[name]) {
      risky.push(name + '（' + RISKY_PACKAGES[name] + '）')
    }
  }

  if (unpinned.length > 0) {
    findings.push({
      category: 'Dependencies',
      severity: 'medium',
      description: '检测到 ' + String(unpinned.length) + ' 个未锁定版本的依赖：' + unpinned.join('、') + '。',
      recommendation: '为所有依赖锁定具体版本，并使用 package-lock.json 保证可复现构建。',
      status: 'warn'
    })
  }

  if (risky.length > 0) {
    findings.push({
      category: 'Dependencies',
      severity: 'high',
      description: '检测到 ' + String(risky.length) + ' 个存在风险的依赖：' + risky.join('、') + '。',
      recommendation: '升级或替换存在已知漏洞/已弃用的依赖。',
      status: 'fail'
    })
  }

  if (names.length > 80) {
    findings.push({
      category: 'Dependencies',
      severity: 'low',
      description: '依赖总数较多（' + String(names.length) + ' 个），可能扩大攻击面。',
      recommendation: '定期审查并移除未使用的依赖。',
      status: 'warn'
    })
  }

  if (unpinned.length === 0 && risky.length === 0 && names.length <= 80) {
    findings.push({
      category: 'Dependencies',
      severity: 'info',
      description: '依赖清单未发现明显风险（共 ' + String(names.length) + ' 个依赖）。',
      recommendation: '建议定期运行 npm audit 接入官方漏洞数据库。',
      status: 'pass'
    })
  }

  return findings
}

/** 许可证风险名单（传染性/不兼容许可证） */
const RISKY_LICENSES: string[] = ['GPL', 'AGPL', 'LGPL', 'SSPL', 'BUSL']

/**
 * 许可证合规扫描
 *
 * 检查项目自身许可证是否声明，并提示关注传染性许可证依赖。
 */
export function runLicenseScan(deps?: Record<string, string>): AuditFinding[] {
  const findings: AuditFinding[] = []
  const projectLicense: string =
    typeof packageJson.license === 'string' ? packageJson.license : ''
  const dependencies =
    deps && Object.keys(deps).length > 0
      ? deps
      : (packageJson.dependencies as Record<string, string>) || {}

  if (!projectLicense) {
    findings.push({
      category: 'License',
      severity: 'medium',
      description: '项目未在 package.json 中声明 license。',
      recommendation: '在 package.json 中声明明确的许可证，避免法律风险。',
      status: 'warn'
    })
  } else {
    let licenseRisk = false
    for (let i = 0; i < RISKY_LICENSES.length; i++) {
      if (projectLicense.toUpperCase().indexOf(RISKY_LICENSES[i]) !== -1) {
        licenseRisk = true
        break
      }
    }
    if (licenseRisk) {
      findings.push({
        category: 'License',
        severity: 'high',
        description: '项目许可证为 ' + projectLicense + '，属传染性许可证。',
        recommendation: '确认该许可证与商业用途兼容，否则考虑更换为 MIT/Apache-2.0。',
        status: 'warn'
      })
    } else {
      findings.push({
        category: 'License',
        severity: 'info',
        description: '项目许可证为 ' + projectLicense + '。',
        recommendation: '保持现状，定期审查新增依赖的许可证。',
        status: 'pass'
      })
    }
  }

  // 提示关注依赖许可证（运行时无法获取传递依赖的 license，给出建议）
  const depCount = Object.keys(dependencies).length
  findings.push({
    category: 'License',
    severity: 'info',
    description: '共有 ' + String(depCount) + ' 个直接依赖，传递依赖的许可证需通过 license-checker 审查。',
    recommendation: '在 CI 中引入 license-checker / license-checker-rseidelsohn，拦截 GPL/AGPL 等不兼容许可证。',
    status: 'warn'
  })

  return findings
}

/**
 * 执行全部安全审计
 *
 * 汇总 XSS、CSRF、限流、输入验证、输出编码、密钥、依赖与许可证审计结果，
 * 计算综合评分：每个 fail 按 severity 扣分，critical=25 / high=15 / medium=8 / low=3 / info=0。
 *
 * @param ctx - 审计上下文
 * @returns 完整审计结果
 */
export function runFullAudit(ctx?: AuditContext): SecurityAuditResult {
  const findings: AuditFinding[] = []
  const audits: Array<() => AuditFinding[]> = [
    function () {
      return runXSSAudit(ctx)
    },
    function () {
      return runCSRFCudit(ctx)
    },
    function () {
      return runRateLimitAudit(ctx)
    },
    function () {
      return runInputAudit(ctx)
    },
    function () {
      return runOutputAudit(ctx)
    },
    function () {
      return runSecretsScan(ctx)
    },
    function () {
      return runDependencyScan(ctx && ctx.dependencies)
    },
    function () {
      return runLicenseScan(ctx && ctx.dependencies)
    }
  ]

  for (let i = 0; i < audits.length; i++) {
    const result = audits[i]()
    for (let j = 0; j < result.length; j++) {
      findings.push(result[j])
    }
  }

  // 计算分数
  let score = 100
  let hasCriticalFail = false
  let hasHighFail = false
  const penalty: Record<string, number> = {
    critical: 25,
    high: 15,
    medium: 8,
    low: 3,
    info: 0
  }
  for (let k = 0; k < findings.length; k++) {
    const f = findings[k]
    if (f.status === 'fail' || f.status === 'warn') {
      const p = penalty[f.severity] !== undefined ? penalty[f.severity] : 0
      // warn 仅扣一半
      score -= f.status === 'warn' ? p / 2 : p
      if (f.status === 'fail' && f.severity === 'critical') {
        hasCriticalFail = true
      }
      if (f.status === 'fail' && f.severity === 'high') {
        hasHighFail = true
      }
    }
  }
  if (score < 0) {
    score = 0
  }
  score = Math.round(score)

  const passed = score >= PASS_SCORE_THRESHOLD && !hasCriticalFail && !hasHighFail

  return {
    score: score,
    findings: findings,
    passed: passed
  }
}
