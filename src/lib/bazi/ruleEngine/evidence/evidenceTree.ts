/**
 * C3 Evidence Tree（证据树）
 *
 * 任何结论都必须能够一直追溯到经典依据。
 * 树形结构：root = 结论，children = 为什么（条件），每个条件可继续追问直到经典依据。
 */

/** 证据树节点 */
export interface EvidenceTreeNode {
  /** 节点唯一 ID */
  id: string
  /** 节点类型：conclusion(结论) / condition(条件) / fact(事实) / citation(经典依据) */
  type: 'conclusion' | 'condition' | 'fact' | 'citation'
  /** 节点内容（人类可读） */
  text: string
  /** 是否满足 */
  satisfied?: boolean
  /** 满足度 0~1 */
  satisfaction?: number
  /** 该节点的可信度 0~1 */
  confidence?: number
  /** 权重 0~1（在兄弟节点中的权重） */
  weight?: number
  /** 子节点：回答"为什么" */
  children?: EvidenceTreeNode[]
  /** 引用典籍名（type='citation' 时使用） */
  classicName?: string
  /** 引用典籍篇章/章节 */
  classicChapter?: string
  /** 引用原文 */
  originalText?: string
  /** 页码/出处 */
  reference?: string
  /** 元数据 */
  meta?: Record<string, any>
}

/** 完整证据树 */
export interface EvidenceTree {
  /** 树根（结论） */
  root: EvidenceTreeNode
  /** 树版本 */
  version: string
  /** 生成时间 */
  generatedAt: string
  /** 树的最大深度 */
  maxDepth: number
  /** 总节点数 */
  totalNodes: number
  /** 是否所有叶子节点都有经典引用 */
  allLeavesCited: boolean
  /** 一句话总结 */
  summary: string
}

/** 构建 EvidenceTree 的 Builder */
export class EvidenceTreeBuilder {
  private nodeCounter = 0
  private nodes: EvidenceTreeNode[] = []

  private genId(): string {
    return `ev-${++this.nodeCounter}`
  }

  /** 创建结论节点（root） */
  conclusion(text: string, opts?: { confidence?: number; satisfied?: boolean }): EvidenceTreeNode {
    return {
      id: this.genId(),
      type: 'conclusion',
      text,
      satisfied: opts?.satisfied ?? true,
      confidence: opts?.confidence,
      children: [],
    }
  }

  /** 创建条件节点 */
  condition(text: string, opts?: { satisfied?: boolean; satisfaction?: number; confidence?: number; weight?: number }): EvidenceTreeNode {
    return {
      id: this.genId(),
      type: 'condition',
      text,
      satisfied: opts?.satisfied,
      satisfaction: opts?.satisfaction,
      confidence: opts?.confidence,
      weight: opts?.weight,
      children: [],
    }
  }

  /** 创建事实节点 */
  fact(text: string, opts?: { confidence?: number; weight?: number }): EvidenceTreeNode {
    return {
      id: this.genId(),
      type: 'fact',
      text,
      confidence: opts?.confidence,
      weight: opts?.weight,
      children: [],
    }
  }

  /** 创建经典引用节点（叶子） */
  citation(classicName: string, opts?: { chapter?: string; originalText?: string; reference?: string }): EvidenceTreeNode {
    return {
      id: this.genId(),
      type: 'citation',
      text: `${classicName}${opts?.chapter ? '·' + opts.chapter : ''}`,
      classicName,
      classicChapter: opts?.chapter,
      originalText: opts?.originalText,
      reference: opts?.reference,
      satisfied: true,
      children: [],
    }
  }

  /** 添加子节点 */
  addChild(parent: EvidenceTreeNode, child: EvidenceTreeNode): EvidenceTreeNode {
    if (!parent.children) parent.children = []
    parent.children.push(child)
    return child
  }

  /** 计算树的最大深度 */
  getMaxDepth(node: EvidenceTreeNode): number {
    if (!node.children || node.children.length === 0) return 1
    return 1 + Math.max(...node.children.map(c => this.getMaxDepth(c)))
  }

  /** 计算总节点数 */
  getTotalNodes(node: EvidenceTreeNode): number {
    if (!node.children || node.children.length === 0) return 1
    return 1 + node.children.reduce((sum, c) => sum + this.getTotalNodes(c), 0)
  }

  /** 检查所有叶子节点是否有经典引用 */
  checkAllLeavesCited(node: EvidenceTreeNode): boolean {
    if (!node.children || node.children.length === 0) {
      // 叶子节点
      if (node.type === 'citation') return true
      if (node.type === 'fact' && !node.classicName) return false
      return true // condition 叶子允许无引用（但建议有）
    }
    return node.children.every(c => this.checkAllLeavesCited(c))
  }

  /** 构建完整 EvidenceTree */
  build(root: EvidenceTreeNode, summary?: string): EvidenceTree {
    const maxDepth = this.getMaxDepth(root)
    const totalNodes = this.getTotalNodes(root)
    const allLeavesCited = this.checkAllLeavesCited(root)
    return {
      root,
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      maxDepth,
      totalNodes,
      allLeavesCited,
      summary: summary ?? root.text,
    }
  }

  /**
   * 将 EvidenceTree 转为缩进文本（用于 UI 预览 / AI 引用）
   * 示例输出：
   * 事业★★★★☆
   *   ↓ 为什么？
   *   正官透干
   *     ↓ 为什么？
   *     月令得令
   *       ↓ 为什么？
   *       庚金生申月
   *         ↓ 经典依据：
   *         《子平真诠》·论用神
   */
  toIndentedText(tree: EvidenceTree): string {
    const lines: string[] = []
    const walk = (node: EvidenceTreeNode, depth: number) => {
      const indent = '  '.repeat(depth)
      const prefix = depth === 0 ? '' : '↓ '
      if (node.type === 'citation') {
        lines.push(`${indent}经典依据：`)
        lines.push(`${indent}《${node.classicName}》${node.classicChapter ? '·' + node.classicChapter : ''}`)
        if (node.originalText) lines.push(`${indent}原文：${node.originalText}`)
      } else {
        const flag = node.satisfied === false ? '✗ ' : node.satisfaction != null ? `${Math.round(node.satisfaction * 100)}% ` : ''
        lines.push(`${indent}${prefix}${flag}${node.text}`)
      }
      if (node.children && node.children.length > 0) {
        const nextIndent = '  '.repeat(depth + 1)
        const hasWhy = node.type !== 'citation'
        if (hasWhy) lines.push(`${nextIndent}↓ 为什么？`)
        for (const child of node.children) {
          walk(child, depth + 1)
        }
      }
    }
    walk(tree.root, 0)
    return lines.join('\n')
  }
}

/**
 * 示例：构建"事业★★★★☆"证据树
 * 事业★★★★☆
 *   ↓ 为什么？
 *   ✓ 正官透干
 *     ↓ 为什么？
 *     ✓ 月令得令
 *       ↓ 为什么？
 *       ✓ 庚金生申月，申金为官
 *         ↓ 经典依据：
 *         《子平真诠》·论用神
 *         原文："月令提纲之府..."
 *   ✓ 印星生身
 *     ↓ 为什么？
 *     ✓ 日支坐印
 *       ↓ 经典依据：
 *       《滴天髓》·通神论
 */
export function createDemoCareerTree(): EvidenceTree {
  const builder = new EvidenceTreeBuilder()
  const root = builder.conclusion('事业★★★★☆', { confidence: 0.85 })

  // 分支1：正官透干
  const zhengguan = builder.condition('正官透干', { satisfied: true, confidence: 0.9, weight: 0.6 })
  builder.addChild(root, zhengguan)
  const yueling = builder.condition('月令得令', { satisfied: true, confidence: 0.88 })
  builder.addChild(zhengguan, yueling)
  const fact1 = builder.fact('庚金生申月，申金为官', { confidence: 0.95 })
  builder.addChild(yueling, fact1)
  const cite1 = builder.citation('子平真诠', {
    chapter: '论用神',
    originalText: '月令提纲之府，故用神必先看月令',
    reference: '卷三·第八章',
  })
  builder.addChild(fact1, cite1)

  // 分支2：印星生身
  const yinxing = builder.condition('印星生身', { satisfied: true, confidence: 0.8, weight: 0.4 })
  builder.addChild(root, yinxing)
  const rizuo = builder.condition('日支坐印', { satisfied: true, confidence: 0.82 })
  builder.addChild(yinxing, rizuo)
  const cite2 = builder.citation('滴天髓', {
    chapter: '通神论',
    originalText: '身弱有印化杀，可保富贵',
    reference: '上卷·第七章',
  })
  builder.addChild(rizuo, cite2)

  return builder.build(root, '事业评分4星：正官透干+印星生身，两路经典依据支撑')
}
