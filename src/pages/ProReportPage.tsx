/**
 * Professional Report 页面 — 三层报告架构
 *
 * 第一层：核心摘要（30秒看懂）
 *   - 四柱展示 + 命盘定位 + 一句话总结 + 优势/风险
 * 第二层：专业分析（折叠式模块）
 *   - 五维评分 + 格局 + 喜用神 + 十神 + 神煞
 * 第三层：人生规划
 *   - 大运流年时间轴 + 风险建议 + 机会 + 调理建议 + AI解释
 *
 * 数据来源：POST /api/pro/master-report → useProReport Hook
 * 不修改 Professional Engine，纯展示层
 */

import { useState, useEffect, useRef, type ReactNode } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useProReport } from '../hooks/useProReport'
import type { ProReportData } from '../types/proReport'
import { usePageSEO } from '../hooks/usePageSEO'

// 报告子组件
import { ReportSummary } from '../components/report/ReportSummary'
import { FiveElementCard } from '../components/report/FiveElementCard'
import { PatternCard } from '../components/report/PatternCard'
import { XiYongCard } from '../components/report/XiYongCard'
import { TenGodCard } from '../components/report/TenGodCard'
import { FortuneTimeline } from '../components/report/FortuneTimeline'
import { RiskAdviceCard } from '../components/report/RiskAdviceCard'
import { ConfidenceBadge } from '../components/report/ConfidenceBadge'
import ReportFeedbackForm from '../components/report/ReportFeedbackForm'
import './ProReportPage.css'

// 折叠式模块
interface CollapsibleSectionProps {
  title: string
  subtitle?: string
  defaultOpen?: boolean
  children: ReactNode
}

function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="xr-collapsible">
      <button
        className={'xr-collapsible__header' + (open ? ' xr-collapsible__header--open' : '')}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="xr-collapsible__title">{title}</span>
        {subtitle && <span className="xr-collapsible__subtitle">{subtitle}</span>}
        <span className="xr-collapsible__arrow">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="xr-collapsible__body">{children}</div>}
    </div>
  )
}

export default function ProReportPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { data, loading, error, generateReport } = useProReport()
  const [showTrace, setShowTrace] = useState(false)

  // 从 URL 参数读取出生信息
  const birthDate = searchParams.get('birth_date') || ''
  const birthTime = searchParams.get('birth_time') || ''
  const gender = searchParams.get('gender') as 'male' | 'female' | null
  const birthplace = searchParams.get('birthplace') || undefined

  // 生成请求的唯一 key，防止 StrictMode 重复请求
  const requestKey = birthDate && birthTime && gender
    ? birthDate + '|' + birthTime + '|' + gender
    : ''

  const hasRequested = useRef(false)

  // SEO
  usePageSEO({
    title: '专业命理报告 | 玄风门',
    description: '玄风门专业三层命理报告，含核心摘要、五维评分、格局分析、喜用神、十神、大运流年及AI解读。',
    keywords: '专业命理报告,八字分析,五维评分,格局分析,喜用神,大运流年',
    canonical: 'https://xuanfengmen.com/pro-report',
  })

  // 如果有完整参数且未请求过，自动生成报告
  useEffect(() => {
    if (requestKey && !data && !loading && !hasRequested.current) {
      hasRequested.current = true
      generateReport({
        birth_date: birthDate,
        birth_time: birthTime,
        gender,
        birthplace,
      })
    }
  }, [requestKey, data, loading, generateReport, birthDate, birthTime, gender, birthplace])

  // 加载状态
  if (loading) {
    return (
      <div className="xr-page">
        <div className="xr-loading">
          <div className="xr-loading__spinner" />
          <p className="xr-loading__text">专业命理引擎计算中...</p>
          <p className="xr-loading__hint">正在调用 Module 1~7 生成完整报告</p>
        </div>
      </div>
    )
  }

  // 错误状态
  if (error) {
    return (
      <div className="xr-page">
        <div className="xr-error">
          <h2 className="xr-error__title">报告生成失败</h2>
          <p className="xr-error__message">{error}</p>
          <button className="xr-error__retry" onClick={() => navigate('/bazi')}>
            重新输入
          </button>
        </div>
      </div>
    )
  }

  // 无参数提示
  if (!birthDate || !birthTime || !gender) {
    return (
      <div className="xr-page">
        <div className="xr-error">
          <h2 className="xr-error__title">缺少出生信息</h2>
          <p className="xr-error__message">请先输入完整的出生信息</p>
          <button className="xr-error__retry" onClick={() => navigate('/bazi')}>
            前往输入
          </button>
        </div>
      </div>
    )
  }

  // 无数据
  if (!data) return null

  const report = data as ProReportData

  return (
    <div className="xr-page">
      {/* ═══ 第一层：核心摘要（30秒看懂）═══ */}
      <ReportSummary
        chart={report.chart}
        quickSummary={report.analysis.quickSummary}
      />

      {/* ═══ 第二层：专业分析（折叠式）═══ */}

      <CollapsibleSection
        title="五维评分"
        subtitle="事业 · 财富 · 婚姻 · 健康 · 学业"
        defaultOpen={true}
      >
        <FiveElementCard dimensions={report.analysis.fiveDimensions} />
      </CollapsibleSection>

      <CollapsibleSection title="格局分析" subtitle="主格 · 副格 · 成格评分">
        <PatternCard pattern={report.analysis.patternAnalysis} />
      </CollapsibleSection>

      <CollapsibleSection title="喜用神分析" subtitle="用神 · 喜神 · 忌神 · 调理方向">
        <XiYongCard xiYong={report.analysis.xiYongAnalysis} />
      </CollapsibleSection>

      <CollapsibleSection title="十神分析" subtitle="十神结构 · 主要关系">
        <TenGodCard tenGod={report.analysis.tenGodHighlights} />
      </CollapsibleSection>

      {/* ═══ 第三层：人生规划 ═══ */}

      <CollapsibleSection
        title="大运流年"
        subtitle="人生阶段 · 趋势分析"
        defaultOpen={true}
      >
        <FortuneTimeline timeline={report.analysis.timeline as unknown as Array<{
          stage: string
          ageRange: string
          summary: string
          fortuneInfluence: string
          xiYongInfluence: string
          keyEvents: string[]
          confidence: number
        }>} />
      </CollapsibleSection>

      <CollapsibleSection
        title="风险与建议"
        subtitle="风险提醒 · 机会把握 · 行动建议"
        defaultOpen={true}
      >
        <RiskAdviceCard
          risks={report.analysis.risks as unknown as Array<{
            type: string
            level: string
            reason: string
            suggestion: string
            avoidance: string
            confidence: number
          }>}
          opportunities={report.analysis.opportunities as unknown as Array<{
            type: string
            timing: string
            reason: string
            confidence: number
          }>}
          recommendations={report.analysis.recommendations as unknown as Array<{
            category: string
            content: string
            relatedElements: string[]
            reasoning: string
          }>}
        />
      </CollapsibleSection>

      <CollapsibleSection title="AI 命理解释" subtitle="古籍引用 · 现代解读">
        <div className="xr-explains">
          {(report.analysis.explains as unknown as Array<{
            topic: string
            plainExplanation: string
            professionalExplanation: string
            classicalReference: string
            keywords: string[]
          }>).map((item, idx) => (
            <div key={idx} className="xr-explain-item">
              <h4 className="xr-explain-item__topic">{item.topic}</h4>
              <p className="xr-explain-item__plain">{item.plainExplanation}</p>
              <p className="xr-explain-item__pro">{item.professionalExplanation}</p>
              <p className="xr-explain-item__ref">
                <span className="xr-explain-item__ref-label">古籍参考：</span>
                {item.classicalReference}
              </p>
              {item.keywords && item.keywords.length > 0 && (
                <div className="xr-explain-item__tags">
                  {item.keywords.map((kw, ki) => (
                    <span key={ki} className="xr-explain-item__tag">{kw}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* ═══ 置信度 & Trace ═══ */}
      <CollapsibleSection title="报告可信度" subtitle="交叉验证 · 执行追踪">
        <ConfidenceBadge
          confidence={report.confidence}
          trace={report.trace}
          onShowTrace={() => setShowTrace(!showTrace)}
        />
        {showTrace && (
          <div className="xr-trace-detail">
            <h4>执行追踪（TraceChain）</h4>
            <p>总步骤数：{report.trace.totalSteps}</p>
            {report.trace.modules.map((mod, i) => (
              <div key={i} className="xr-trace-module">
                <span className="xr-trace-module__name">{mod.module}</span>
                <span className="xr-trace-module__count">{mod.stepCount} 步</span>
                <span className="xr-trace-module__desc">{mod.description}</span>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* 反馈入口 */}
      {data && (
        <ReportFeedbackForm
          reportId={data.reportId}
          userId={undefined}
          engineVersion={data.engineVersion}
        />
      )}

      {/* 底部操作 */}
      <div className="xr-footer-actions">
        <button className="xr-footer-actions__btn xr-footer-actions__btn--primary"
          onClick={() => navigate('/bazi')}
        >
          重新排盘
        </button>
        <button className="xr-footer-actions__btn xr-footer-actions__btn--secondary"
          onClick={() => navigate('/bazi/history')}
        >
          历史报告
        </button>
      </div>
    </div>
  )
}
