export interface PatternExplainResult {
  whyThisPattern: string[]
  whyNotOtherPatterns: Array<{ rejectedName: string; reason: string; scoreGap: number }>
  whyDiscardedPatterns: Array<{ discardedName: string; reason: string }>
  scoreComment: string
  priorityComment: string
  yongJiComment: string
  classicComment: string[]
  fullMarkdown: string
}

export class PatternExplainBuilder {
  build(args: {
    verdict: { name: string; category: string; confidence: number }
    score: any
    candidates: Array<{ name: string; category?: string; score: number; reason?: string }>
    winnerWeightedScore: number
    priorityMatrixReason: string
    yongshenProposal: string[]
    jishenProposal: string[]
    guJiCitations: Array<{ classicName: string; originalText: string; interpretation?: string }>
    evidenceReport?: any
  }): PatternExplainResult {
    const {
      verdict,
      score,
      candidates,
      winnerWeightedScore,
      priorityMatrixReason,
      yongshenProposal,
      jishenProposal,
      guJiCitations,
      evidenceReport,
    } = args

    const sortedCandidates = [...candidates].sort((a, b) => b.score - a.score)
    const winnerIdx = sortedCandidates.findIndex((c) => c.name === verdict.name)
    const others = sortedCandidates.filter((c) => c.name !== verdict.name)

    const whyThisPattern = this.buildWhyThisPattern(verdict, score, evidenceReport, guJiCitations)

    const runnersUp = others.slice(0, 3)
    const discardedCandidates = others.filter(c => !runnersUp.find(r => r.name === c.name) || c.score < 40)

    const whyNotOtherPatterns = this.buildWhyNotOtherPatterns(
      verdict,
      winnerWeightedScore,
      runnersUp
    )

    const whyDiscardedPatterns = this.buildWhyDiscarded(discardedCandidates)

    const scoreComment = this.buildScoreComment(verdict, score, winnerWeightedScore, evidenceReport)

    const priorityComment = this.buildPriorityComment(priorityMatrixReason, verdict, winnerIdx, sortedCandidates)

    const yongJiComment = this.buildYongJiComment(yongshenProposal, jishenProposal)

    const classicComment = this.buildClassicComment(guJiCitations)

    const result: PatternExplainResult = {
      whyThisPattern,
      whyNotOtherPatterns,
      whyDiscardedPatterns,
      scoreComment,
      priorityComment,
      yongJiComment,
      classicComment,
      fullMarkdown: '',
    }
    result.fullMarkdown = this.buildMarkdown(result, verdict)
    return result
  }

  private buildWhyThisPattern(
    verdict: { name: string; category: string; confidence: number },
    score: any,
    evidenceReport: any,
    guJiCitations: any[]
  ): string[] {
    const items: string[] = []
    if (evidenceReport) {
      const yueLingEv = evidenceReport.byKind?.yueLing?.[0]
      if (yueLingEv) {
        items.push(
          yueLingEv.satisfied
            ? `月令提纲符合：${yueLingEv.title}`
            : `虽月令非完美匹配，但${yueLingEv.title}`
        )
      }
      const riZhuEv = evidenceReport.byKind?.riZhu?.[0]
      if (riZhuEv) {
        items.push(
          riZhuEv.satisfied
            ? `日主身份契合：${riZhuEv.title}`
            : `日主条件：${riZhuEv.title}`
        )
      }
      const wangShuaiEv = evidenceReport.byKind?.wangShuai?.[0]
      if (wangShuaiEv) {
        items.push(`旺衰层面：${wangShuaiEv.title}`)
      }
    } else {
      items.push(`格局${verdict.name}在候选中评分最高，置信度 ${(verdict.confidence * 100).toFixed(0)}%`)
      if (score?.breakdown) {
        const keys = Object.keys(score.breakdown).slice(0, 2)
        keys.forEach((k) => {
          items.push(`${k}维度贡献分：${score.breakdown[k]}`)
        })
      }
    }
    if (guJiCitations.length > 0) {
      const cite = guJiCitations[0]
      items.push(`古籍佐证：${cite.classicName || '《渊海子平》'}有${verdict.name}类似记载`)
    } else {
      items.push(`依据正统子平格局体系，${verdict.name}的判定规则匹配度较高`)
    }
    while (items.length < 3) {
      items.push(`综合${verdict.category}类格局判定规则，${verdict.name}在多项指标上达标`)
    }
    return items.slice(0, 5)
  }

  private buildWhyNotOtherPatterns(
    verdict: { name: string; category: string; confidence: number },
    winnerWeightedScore: number,
    runnersUp: Array<{ name: string; category?: string; score: number; reason?: string }>
  ): Array<{ rejectedName: string; reason: string; scoreGap: number }> {
    return runnersUp.map((c) => {
      const scoreGap = Math.max(0, Math.round((winnerWeightedScore - c.score) * 10) / 10)
      let reason = c.reason || `综合评分低于${verdict.name}`
      if (!c.reason) {
        if (verdict.category === 'zhencong' && (c.category === 'jiacong' || c.name.includes('假从'))) {
          reason = `${c.name} vs ${verdict.name}：真从要求更严（日主需无根无气），该候选未满足真从严格条件`
        } else if (verdict.category === 'zhuanwang' && !c.name.includes('专旺')) {
          reason = `${c.name}未达到${verdict.name}所需的专旺纯净度（五行集中度不足）`
        } else if (c.category === 'zhuanwang' && verdict.category !== 'zhuanwang') {
          reason = `${c.name}需要五行极旺成势，但日主旺度或五行集中度未达标，故降为${verdict.name}`
        } else if (verdict.category === 'zheng' && (c.category === 'zhencong' || c.category === 'jiacong')) {
          reason = `${c.name}需日主极弱无根，但日主仍有根气，故取正格${verdict.name}而非从格`
        } else if (c.name.includes('化气')) {
          reason = `${c.name}需化神透出且月令引化，化气条件未完全满足`
        } else {
          reason = `${c.name}在月令、日主、旺衰、纯度等综合维度匹配度弱于${verdict.name}`
        }
      }
      return {
        rejectedName: c.name,
        reason,
        scoreGap,
      }
    })
  }

  private buildWhyDiscarded(
    discarded: Array<{ name: string; category?: string; score: number; reason?: string }>
  ): Array<{ discardedName: string; reason: string }> {
    return discarded
      .filter((c) => c.score < 40)
      .map((c) => {
        let reason = c.reason || `评分 ${c.score} 低于40分阈值，匹配度过低`
        if (!c.reason) {
          if (c.score < 20) {
            reason = `${c.name}核心条件（月令/日主/旺衰）严重不达标，评分为${c.score}`
          } else {
            reason = `${c.name}部分条件吻合但整体不足，评分 ${c.score} 未达入格门槛`
          }
        }
        return { discardedName: c.name, reason }
      })
      .slice(0, 8)
  }

  private buildScoreComment(
    verdict: { name: string; category: string; confidence: number },
    score: any,
    winnerWeightedScore: number,
    evidenceReport: any
  ): string {
    const ws = Math.round(winnerWeightedScore * 10) / 10
    if (evidenceReport) {
      return `综合加权分 ${ws} 分，置信度 ${(verdict.confidence * 100).toFixed(0)}%；正向权重 +${evidenceReport.positiveWeight}，负向权重 -${evidenceReport.negativeWeight}，净权重 ${evidenceReport.netWeight}，平衡分 ${evidenceReport.balanceScore}/100。`
    }
    if (score && typeof score === 'object' && score.total !== undefined) {
      const parts: string[] = []
      parts.push(`总分 ${score.total}`)
      if (score.breakdown) {
        const bd = Object.entries(score.breakdown)
          .map(([k, v]) => `${k}=${v}`)
          .join(', ')
        parts.push(`细分：${bd}`)
      }
      parts.push(`加权分 ${ws}，置信度 ${(verdict.confidence * 100).toFixed(0)}%`)
      return parts.join('；') + '。'
    }
    return `格局${verdict.name}综合加权分 ${ws}，置信度 ${(verdict.confidence * 100).toFixed(0)}%，在候选中排名前列。`
  }

  private buildPriorityComment(
    priorityMatrixReason: string,
    verdict: { name: string; category: string; confidence: number },
    winnerIdx: number,
    sortedCandidates: Array<{ name: string; category?: string; score: number }>
  ): string {
    const rank = winnerIdx >= 0 ? `第${winnerIdx + 1}名` : '前列'
    const base = `${verdict.name}在候选格局中评分排名${rank}。`
    if (priorityMatrixReason && priorityMatrixReason.trim().length > 0) {
      return `${base}优先级矩阵判定：${priorityMatrixReason}。`
    }
    const categoryPriority = ['zhencong', 'zhuanwang', 'huaqi', 'yiqi', 'jiacong', 'bingyao', 'tongguan', 'tiaohou', 'fuyi', 'zheng']
    const myRank = categoryPriority.indexOf(verdict.category as any)
    if (myRank >= 0) {
      const higher = categoryPriority.slice(0, myRank).filter((cat) =>
        sortedCandidates.some((c) => c.category === cat)
      )
      if (higher.length === 0) {
        return `${base}按优先级顺序（真从>专旺>化气>一气>假从>病药/通关/调候>扶抑>正格），${verdict.category}类别已无可替代的更高优先级格局。`
      }
    }
    return `${base}综合优先级规则、分类权重与置信度，${verdict.name}胜出。`
  }

  private buildYongJiComment(yongshenProposal: string[], jishenProposal: string[]): string {
    const yong = (yongshenProposal && yongshenProposal.length > 0) ? yongshenProposal.join('') : '待详析'
    const ji = (jishenProposal && jishenProposal.length > 0) ? jishenProposal.join('') : '待详析'
    return `用神：${yong}；忌神：${ji}。`
  }

  private buildClassicComment(
    guJiCitations: Array<{ classicName: string; originalText: string; interpretation?: string }>
  ): string[] {
    if (!guJiCitations || guJiCitations.length === 0) {
      return [
        '本格局判定参照《渊海子平》《三命通会》《滴天髓》《子平真诠》等正统子平典籍的格局篇。',
        '如需具体古籍原文对照，可补充 guJiCitations 后重新生成解释。',
      ]
    }
    return guJiCitations.map((cite) => {
      const name = cite.classicName || '古籍'
      const text = cite.originalText || '（原文略）'
      const interp = cite.interpretation ? `，释义：${cite.interpretation}` : ''
      return `- ${name}：${text}${interp}`
    })
  }

  private buildMarkdown(r: PatternExplainResult, verdict: { name: string; category: string; confidence: number }): string {
    const lines: string[] = []
    lines.push(`## 格局解释：${verdict.name}`)
    lines.push('')
    lines.push(`> 分类：${verdict.category} | 置信度：${(verdict.confidence * 100).toFixed(0)}%`)
    lines.push('')
    lines.push('### 为什么判定此格局')
    lines.push('')
    r.whyThisPattern.forEach((text, i) => {
      lines.push(`${i + 1}. ${text}`)
    })
    lines.push('')
    if (r.whyNotOtherPatterns.length > 0) {
      lines.push('### 为什么不是其它格局')
      lines.push('')
      r.whyNotOtherPatterns.forEach((item, i) => {
        lines.push(`${i + 1}. **${item.rejectedName}**（分差 ${item.scoreGap}）：${item.reason}`)
      })
      lines.push('')
    }
    if (r.whyDiscardedPatterns.length > 0) {
      lines.push('### 被舍弃的候选格局')
      lines.push('')
      r.whyDiscardedPatterns.forEach((item) => {
        lines.push(`- ${item.discardedName}：${item.reason}`)
      })
      lines.push('')
    }
    lines.push('### 评分说明')
    lines.push('')
    lines.push(r.scoreComment)
    lines.push('')
    lines.push('### 优先级说明')
    lines.push('')
    lines.push(r.priorityComment)
    lines.push('')
    lines.push('### 喜忌')
    lines.push('')
    lines.push(r.yongJiComment)
    lines.push('')
    lines.push('### 古籍依据')
    lines.push('')
    r.classicComment.forEach((line) => {
      lines.push(line)
    })
    lines.push('')
    return lines.join('\n')
  }
}

export const defaultPatternExplainBuilder = new PatternExplainBuilder()
