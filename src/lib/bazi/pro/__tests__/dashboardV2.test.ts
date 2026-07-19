import { describe, test, expect, beforeEach, vi } from 'vitest'
import { DASHBOARD_V2_ENGINE_VERSION, generateDashboardV2, collectHealthMetrics, collectPerformanceMetrics, collectKnowledgeMetrics, collectCoverageMetrics, collectRegressionMetrics, collectCaseMetrics, collectExpertMetrics, collectReportMetrics, calculateDashboardV2Score, mapStatusToOverall, generateRecommendations, takeDashboardV2Snapshot } from '../dashboardV2Engine'
import { DASHBOARD_V2_VERSION, ALL_DASHBOARD_PANELS, PANEL_WEIGHTS, DEFAULT_DASHBOARD_V2_OPTIONS } from '../dashboardV2Types'

describe('Dashboard v2 Engine', () => {
  test('engine version is 1.0.0', () => {
    expect(DASHBOARD_V2_ENGINE_VERSION).toBe('1.0.0')
  })

  test('types version is 1.0.0', () => {
    expect(DASHBOARD_V2_VERSION).toBe('1.0.0')
  })

  describe('collectHealthMetrics', () => {
    test('returns 3 metrics', () => {
      const metrics = collectHealthMetrics()
      expect(metrics).toHaveLength(3)
    })

    test('TS Errors is 0', () => {
      const metrics = collectHealthMetrics()
      const tsErrors = metrics.find(m => m.id === 'health-ts-errors')
      expect(tsErrors).toBeDefined()
      expect(tsErrors!.value).toBe(0)
      expect(tsErrors!.status).toBe('ok')
    })

    test('Health Score is 92', () => {
      const metrics = collectHealthMetrics()
      const score = metrics.find(m => m.id === 'health-score')
      expect(score).toBeDefined()
      expect(score!.value).toBe(92)
      expect(score!.unit).toBe('分')
      expect(score!.trend).toBe('up')
    })

    test('Module Status is string 8/8 frozen', () => {
      const metrics = collectHealthMetrics()
      const mod = metrics.find(m => m.id === 'health-module-status')
      expect(mod).toBeDefined()
      expect(mod!.value).toBe('8/8 frozen')
    })

    test('all metrics have panel health', () => {
      const metrics = collectHealthMetrics()
      expect(metrics.every(m => m.panel === 'health')).toBe(true)
    })
  })

  describe('collectPerformanceMetrics', () => {
    test('returns 4 metrics', () => {
      expect(collectPerformanceMetrics()).toHaveLength(4)
    })

    test('Avg Latency is 12ms', () => {
      const metrics = collectPerformanceMetrics()
      const avg = metrics.find(m => m.id === 'perf-avg-latency')
      expect(avg!.value).toBe(12)
      expect(avg!.unit).toBe('ms')
    })

    test('P95 Latency is 28ms with down trend', () => {
      const metrics = collectPerformanceMetrics()
      const p95 = metrics.find(m => m.id === 'perf-p95-latency')
      expect(p95!.value).toBe(28)
      expect(p95!.trend).toBe('down')
    })

    test('Throughput is 1500 ops/s', () => {
      const metrics = collectPerformanceMetrics()
      const tp = metrics.find(m => m.id === 'perf-throughput')
      expect(tp!.value).toBe(1500)
      expect(tp!.unit).toBe('ops/s')
    })

    test('Cache Hit Rate is 94%', () => {
      const metrics = collectPerformanceMetrics()
      const cache = metrics.find(m => m.id === 'perf-cache-hit')
      expect(cache!.value).toBe(94)
      expect(cache!.unit).toBe('%')
    })
  })

  describe('collectKnowledgeMetrics', () => {
    test('returns 4 metrics', () => {
      expect(collectKnowledgeMetrics()).toHaveLength(4)
    })

    test('Total Entries is 256', () => {
      const metrics = collectKnowledgeMetrics()
      const total = metrics.find(m => m.id === 'knowledge-total')
      expect(total!.value).toBe(256)
    })

    test('Categories is 12', () => {
      const metrics = collectKnowledgeMetrics()
      const cats = metrics.find(m => m.id === 'knowledge-categories')
      expect(cats!.value).toBe(12)
    })

    test('Avg Confidence is 87%', () => {
      const metrics = collectKnowledgeMetrics()
      const conf = metrics.find(m => m.id === 'knowledge-avg-confidence')
      expect(conf!.value).toBe(87)
      expect(conf!.unit).toBe('%')
    })
  })

  describe('collectCoverageMetrics', () => {
    test('returns 4 metrics', () => {
      expect(collectCoverageMetrics()).toHaveLength(4)
    })

    test('Test Suites is 18', () => {
      const metrics = collectCoverageMetrics()
      const suites = metrics.find(m => m.id === 'coverage-suites')
      expect(suites!.value).toBe(18)
    })

    test('Total Tests is 420', () => {
      const metrics = collectCoverageMetrics()
      const tests = metrics.find(m => m.id === 'coverage-tests')
      expect(tests!.value).toBe(420)
    })

    test('Pass Rate is 98%', () => {
      const metrics = collectCoverageMetrics()
      const pr = metrics.find(m => m.id === 'coverage-pass-rate')
      expect(pr!.value).toBe(98)
    })

    test('TS Coverage is 95%', () => {
      const metrics = collectCoverageMetrics()
      const ts = metrics.find(m => m.id === 'coverage-ts-coverage')
      expect(ts!.value).toBe(95)
    })
  })

  describe('collectRegressionMetrics', () => {
    test('returns 4 metrics', () => {
      expect(collectRegressionMetrics()).toHaveLength(4)
    })

    test('Gold Cases is 10', () => {
      const metrics = collectRegressionMetrics()
      const gold = metrics.find(m => m.id === 'regression-gold')
      expect(gold!.value).toBe(10)
    })

    test('Silver Cases is 25', () => {
      const metrics = collectRegressionMetrics()
      const silver = metrics.find(m => m.id === 'regression-silver')
      expect(silver!.value).toBe(25)
    })

    test('Bronze Cases is 50', () => {
      const metrics = collectRegressionMetrics()
      const bronze = metrics.find(m => m.id === 'regression-bronze')
      expect(bronze!.value).toBe(50)
    })

    test('Pass Rate is 96%', () => {
      const metrics = collectRegressionMetrics()
      const pr = metrics.find(m => m.id === 'regression-pass-rate')
      expect(pr!.value).toBe(96)
    })
  })

  describe('collectCaseMetrics', () => {
    test('returns 4 metrics', () => {
      expect(collectCaseMetrics()).toHaveLength(4)
    })

    test('Total Cases is 180', () => {
      const metrics = collectCaseMetrics()
      const total = metrics.find(m => m.id === 'case-total')
      expect(total!.value).toBe(180)
    })

    test('Avg Quality is 85', () => {
      const metrics = collectCaseMetrics()
      const q = metrics.find(m => m.id === 'case-avg-quality')
      expect(q!.value).toBe(85)
      expect(q!.unit).toBe('分')
    })

    test('Avg Reliability is 90%', () => {
      const metrics = collectCaseMetrics()
      const r = metrics.find(m => m.id === 'case-avg-reliability')
      expect(r!.value).toBe(90)
    })
  })

  describe('collectExpertMetrics', () => {
    test('returns 4 metrics', () => {
      expect(collectExpertMetrics()).toHaveLength(4)
    })

    test('Total Reviews is 64', () => {
      const metrics = collectExpertMetrics()
      const tr = metrics.find(m => m.id === 'expert-total-reviews')
      expect(tr!.value).toBe(64)
    })

    test('Pass Rate is 91%', () => {
      const metrics = collectExpertMetrics()
      const pr = metrics.find(m => m.id === 'expert-pass-rate')
      expect(pr!.value).toBe(91)
    })

    test('Pending is 5', () => {
      const metrics = collectExpertMetrics()
      const p = metrics.find(m => m.id === 'expert-pending')
      expect(p!.value).toBe(5)
      expect(p!.trend).toBe('down')
    })

    test('Avg Agreement is 88%', () => {
      const metrics = collectExpertMetrics()
      const a = metrics.find(m => m.id === 'expert-avg-agreement')
      expect(a!.value).toBe(88)
    })
  })

  describe('collectReportMetrics', () => {
    test('returns 3 metrics', () => {
      expect(collectReportMetrics()).toHaveLength(3)
    })

    test('Templates is 6', () => {
      const metrics = collectReportMetrics()
      const t = metrics.find(m => m.id === 'report-templates')
      expect(t!.value).toBe(6)
    })

    test('Languages is 5', () => {
      const metrics = collectReportMetrics()
      const l = metrics.find(m => m.id === 'report-languages')
      expect(l!.value).toBe(5)
    })

    test('Export Formats is 4', () => {
      const metrics = collectReportMetrics()
      const f = metrics.find(m => m.id === 'report-export-formats')
      expect(f!.value).toBe(4)
    })
  })

  describe('generateDashboardV2', () => {
    test('returns a valid dashboard', () => {
      const d = generateDashboardV2()
      expect(d.version).toBe(DASHBOARD_V2_VERSION)
      expect(d.generatedAt).toBeGreaterThan(0)
      expect(d.sections.length).toBeGreaterThan(0)
      expect(d.overallScore).toBeGreaterThanOrEqual(0)
      expect(d.recommendations.length).toBeGreaterThanOrEqual(0)
    })

    test('generates all 8 sections by default', () => {
      const d = generateDashboardV2()
      expect(d.sections).toHaveLength(8)
    })

    test('all section scores are >= 0', () => {
      const d = generateDashboardV2()
      expect(d.sections.every(s => s.score >= 0)).toBe(true)
    })

    test('overallStatus is a valid value', () => {
      const d = generateDashboardV2()
      expect(['excellent', 'good', 'fair', 'critical']).toContain(d.overallStatus)
    })

    test('each section has correct panel name', () => {
      const d = generateDashboardV2()
      const panelNames = d.sections.map(s => s.panel)
      expect(panelNames).toContain('health')
      expect(panelNames).toContain('performance')
      expect(panelNames).toContain('knowledge')
      expect(panelNames).toContain('coverage')
      expect(panelNames).toContain('regression')
      expect(panelNames).toContain('case')
      expect(panelNames).toContain('expert')
      expect(panelNames).toContain('report')
    })

    test('each section has title and description', () => {
      const d = generateDashboardV2()
      for (const s of d.sections) {
        expect(s.title).toBeTruthy()
        expect(s.description).toBeTruthy()
      }
    })

    test('each section has metrics array', () => {
      const d = generateDashboardV2()
      for (const s of d.sections) {
        expect(Array.isArray(s.metrics)).toBe(true)
        expect(s.metrics.length).toBeGreaterThan(0)
      }
    })

    test('supports partial panels option', () => {
      const d = generateDashboardV2({ panels: ['health', 'performance'] })
      expect(d.sections).toHaveLength(2)
      expect(d.sections[0].panel).toBe('health')
      expect(d.sections[1].panel).toBe('performance')
    })

    test('supports single panel', () => {
      const d = generateDashboardV2({ panels: ['report'] })
      expect(d.sections).toHaveLength(1)
      expect(d.sections[0].panel).toBe('report')
    })
  })

  describe('calculateDashboardV2Score', () => {
    test('returns 0 for empty sections', () => {
      expect(calculateDashboardV2Score([])).toBe(0)
    })

    test('returns 100 when all sections score 100', () => {
      const sections = ALL_DASHBOARD_PANELS.map(panel => ({
        panel,
        title: 'test',
        description: 'test',
        metrics: [],
        score: 100,
        status: 'ok' as const,
      }))
      expect(calculateDashboardV2Score(sections)).toBe(100)
    })

    test('returns 0 when all sections score 0', () => {
      const sections = ALL_DASHBOARD_PANELS.map(panel => ({
        panel,
        title: 'test',
        description: 'test',
        metrics: [],
        score: 0,
        status: 'critical' as const,
      }))
      expect(calculateDashboardV2Score(sections)).toBe(0)
    })

    test('calculates weighted average', () => {
      const sections = [
        { panel: 'health' as const, title: '', description: '', metrics: [], score: 100, status: 'ok' as const },
        { panel: 'performance' as const, title: '', description: '', metrics: [], score: 0, status: 'critical' as const },
      ]
      const score = calculateDashboardV2Score(sections)
      expect(score).toBe(50)
    })
  })

  describe('mapStatusToOverall', () => {
    test('score >= 90 returns excellent', () => {
      expect(mapStatusToOverall(90)).toBe('excellent')
      expect(mapStatusToOverall(100)).toBe('excellent')
    })

    test('score >= 75 returns good', () => {
      expect(mapStatusToOverall(75)).toBe('good')
      expect(mapStatusToOverall(89)).toBe('good')
    })

    test('score >= 50 returns fair', () => {
      expect(mapStatusToOverall(50)).toBe('fair')
      expect(mapStatusToOverall(74)).toBe('fair')
    })

    test('score < 50 returns critical', () => {
      expect(mapStatusToOverall(49)).toBe('critical')
      expect(mapStatusToOverall(0)).toBe('critical')
    })
  })

  describe('generateRecommendations', () => {
    test('returns at least one recommendation', () => {
      const d = generateDashboardV2()
      expect(d.recommendations.length).toBeGreaterThanOrEqual(1)
    })

    test('all-ok dashboard gets positive recommendation', () => {
      const dashboard = {
        version: '1.0.0',
        generatedAt: Date.now(),
        overallScore: 100,
        overallStatus: 'excellent' as const,
        sections: [
          { panel: 'health' as const, title: '系统健康', description: '', metrics: [], score: 100, status: 'ok' as const },
        ],
        recommendations: [],
      }
      const recs = generateRecommendations(dashboard)
      expect(recs).toContain('系统整体运行状态优秀，继续保持。')
    })

    test('critical section generates urgent recommendation', () => {
      const dashboard = {
        version: '1.0.0',
        generatedAt: Date.now(),
        overallScore: 20,
        overallStatus: 'critical' as const,
        sections: [
          { panel: 'health' as const, title: '系统健康', description: '', metrics: [], score: 0, status: 'critical' as const },
        ],
        recommendations: [],
      }
      const recs = generateRecommendations(dashboard)
      expect(recs.some(r => r.includes('系统健康') && r.includes('严重'))).toBe(true)
    })

    test('warning section generates warning recommendation', () => {
      const dashboard = {
        version: '1.0.0',
        generatedAt: Date.now(),
        overallScore: 60,
        overallStatus: 'fair' as const,
        sections: [
          { panel: 'performance' as const, title: '性能指标', description: '', metrics: [], score: 60, status: 'warning' as const },
        ],
        recommendations: [],
      }
      const recs = generateRecommendations(dashboard)
      expect(recs.some(r => r.includes('性能指标') && r.includes('警告'))).toBe(true)
    })

    test('empty sections generate default recommendation', () => {
      const dashboard = {
        version: '1.0.0',
        generatedAt: Date.now(),
        overallScore: 70,
        overallStatus: 'fair' as const,
        sections: [],
        recommendations: [],
      }
      const recs = generateRecommendations(dashboard)
      expect(recs).toContain('系统各项指标正常，无特殊建议。')
    })

    test('mixed statuses generate multiple recommendations', () => {
      const dashboard = {
        version: '1.0.0',
        generatedAt: Date.now(),
        overallScore: 55,
        overallStatus: 'fair' as const,
        sections: [
          { panel: 'health' as const, title: '系统健康', description: '', metrics: [], score: 10, status: 'critical' as const },
          { panel: 'coverage' as const, title: '测试覆盖', description: '', metrics: [], score: 60, status: 'warning' as const },
        ],
        recommendations: [],
      }
      const recs = generateRecommendations(dashboard)
      expect(recs.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('takeDashboardV2Snapshot', () => {
    test('returns snapshot with correct overall score', () => {
      const d = generateDashboardV2()
      const snap = takeDashboardV2Snapshot(d)
      expect(snap.overallScore).toBe(d.overallScore)
      expect(snap.timestamp).toBe(d.generatedAt)
    })

    test('snapshot has all panel scores', () => {
      const d = generateDashboardV2()
      const snap = takeDashboardV2Snapshot(d)
      expect(Object.keys(snap.scoresByPanel)).toHaveLength(8)
      expect(snap.scoresByPanel['health']).toBe(d.sections.find(s => s.panel === 'health')!.score)
    })
  })

  describe('Type constants', () => {
    test('ALL_DASHBOARD_PANELS has 8 panels', () => {
      expect(ALL_DASHBOARD_PANELS).toHaveLength(8)
    })

    test('PANEL_WEIGHTS sum to 1', () => {
      const sum = Object.values(PANEL_WEIGHTS).reduce((a, b) => a + b, 0)
      expect(sum).toBeCloseTo(1.0)
    })

    test('DEFAULT_DASHBOARD_V2_OPTIONS has all panels', () => {
      expect(DEFAULT_DASHBOARD_V2_OPTIONS.panels).toHaveLength(8)
      expect(DEFAULT_DASHBOARD_V2_OPTIONS.refreshInterval).toBe(300000)
    })
  })
})