import { describe, it, expect } from 'vitest'
import { generateProjectDashboard, DASHBOARD_VERSION } from '../projectDashboardEngine'
import { statusColor, trendIcon } from '../projectDashboardTypes'
import type { ProjectDashboard } from '../projectDashboardTypes'

describe('V5.0 RC: Project Dashboard Engine', () => {
  it('版本号应为 1.0.0', () => {
    expect(DASHBOARD_VERSION).toBe('1.0.0')
  })

  it('statusColor 映射正确', () => {
    expect(statusColor('ok')).toBe('#22c55e')
    expect(statusColor('warning')).toBe('#f59e0b')
    expect(statusColor('critical')).toBe('#ef4444')
    expect(statusColor('info')).toBe('#3b82f6')
  })

  it('trendIcon 映射正确', () => {
    expect(trendIcon('up')).toBe('↑')
    expect(trendIcon('down')).toBe('↓')
    expect(trendIcon('stable')).toBe('→')
  })

  it('generateProjectDashboard 返回完整仪表盘', () => {
    const dashboard = generateProjectDashboard()
    expect(dashboard.version).toBe('1.0.0')
    expect(dashboard.generatedAt).toBeGreaterThan(0)
    expect(dashboard.sections.length).toBeGreaterThanOrEqual(5)
    expect(dashboard.overallScore).toBeGreaterThan(0)
    expect(['healthy', 'degraded', 'critical']).toContain(dashboard.overallStatus)
  })

  it('每个板块有指标', () => {
    const dashboard = generateProjectDashboard()
    for (const section of dashboard.sections) {
      expect(section.title).toBeTruthy()
      expect(section.metrics.length).toBeGreaterThan(0)
      for (const metric of section.metrics) {
        expect(metric.id).toBeTruthy()
        expect(metric.label).toBeTruthy()
        expect(metric.status).toBeTruthy()
      }
    }
  })

  it('版本板块包含所有模块', () => {
    const dashboard = generateProjectDashboard()
    const versionSection = dashboard.sections.find((s) => s.title === '引擎版本')
    expect(versionSection).toBeDefined()
    expect(versionSection!.metrics.length).toBeGreaterThanOrEqual(8)
  })

  it('质量板块包含 Quality Gate 指标', () => {
    const dashboard = generateProjectDashboard()
    const qgSection = dashboard.sections.find((s) => s.title === '质量门禁')
    expect(qgSection).toBeDefined()
    const passMetric = qgSection!.metrics.find((m) => m.id === 'qg-pass')
    expect(passMetric).toBeDefined()
  })

  it('规则板块有规则数', () => {
    const dashboard = generateProjectDashboard()
    const rrSection = dashboard.sections.find((s) => s.title === '规则中心')
    expect(rrSection).toBeDefined()
    expect(rrSection!.metrics[0].value).toBeGreaterThan(0)
  })

  it('知识板块有分类覆盖', () => {
    const dashboard = generateProjectDashboard()
    const kbSection = dashboard.sections.find((s) => s.title === '知识库')
    expect(kbSection).toBeDefined()
    const catMetric = kbSection!.metrics.find((m) => m.id === 'kb-cats')
    expect(catMetric).toBeDefined()
  })

  it('案例板块有总数', () => {
    const dashboard = generateProjectDashboard()
    const caseSection = dashboard.sections.find((s) => s.title === '案例库')
    expect(caseSection).toBeDefined()
    const totalMetric = caseSection!.metrics.find((m) => m.id === 'case-total')
    expect(totalMetric).toBeDefined()
    expect(Number(totalMetric!.value)).toBeGreaterThan(0)
  })

  it('overallStatus 与 overallScore 一致', () => {
    const dashboard = generateProjectDashboard()
    if (dashboard.overallScore >= 90) {
      expect(dashboard.overallStatus).toBe('healthy')
    } else if (dashboard.overallScore >= 70) {
      expect(dashboard.overallStatus).toBe('degraded')
    } else {
      expect(dashboard.overallStatus).toBe('critical')
    }
  })
})
