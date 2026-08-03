import type { GraphEdge, RelationKind, TenGodGraphReport, TenGodName } from '../types'
import { TenGodKnowledgeDB, defaultTenGodKnowledgeDB } from '../knowledge/knowledgeDB'

const ALL_GODS: TenGodName[] = [
  '比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'
]

export class TenGodRelationGraph {
  private edges: GraphEdge[] = []
  nodes: TenGodName[] = ALL_GODS

  constructor(private knowledge: TenGodKnowledgeDB = defaultTenGodKnowledgeDB) {
    this.buildFromKnowledge()
    this.addCombinationsAndSpecialEdges()
  }

  private addEdge(edge: GraphEdge) {
    this.edges.push(edge)
  }

  private buildFromKnowledge() {
    for (const god of ALL_GODS) {
      const k = this.knowledge.get(god)
      if (!k) continue

      for (const target of k.produces) {
        this.addEdge({
          from: god,
          to: target,
          kind: 'produce',
          weight: 8,
          description: `${god}生${target}，五行相生之义`,
          reverseKind: 'drain'
        })
      }

      for (const target of k.controls) {
        this.addEdge({
          from: god,
          to: target,
          kind: 'control',
          weight: 9,
          description: `${god}克${target}，我克者为财、克我者为官鬼之义`,
          reverseKind: 'beControlled'
        })
      }

      for (const target of k.controlledBy) {
        this.addEdge({
          from: god,
          to: target,
          kind: 'beControlled',
          weight: 9,
          description: `${god}被${target}克制`,
          reverseKind: 'control'
        })
      }

      for (const target of k.drainedBy) {
        this.addEdge({
          from: god,
          to: target,
          kind: 'drain',
          weight: 6,
          description: `${god}被${target}泄耗`,
          reverseKind: 'produce'
        })
      }

      for (const target of k.helps) {
        this.addEdge({
          from: god,
          to: target,
          kind: 'help',
          weight: 7,
          description: `${god}帮扶${target}，同气连枝之义`,
          reverseKind: 'help'
        })
      }

      for (const target of k.transformsTo) {
        this.addEdge({
          from: god,
          to: target,
          kind: 'transform',
          weight: 3,
          description: `${god}在特定条件下转化为${target}`,
          reverseKind: 'transform'
        })
      }

      for (const target of k.conflictsWith) {
        this.addEdge({
          from: god,
          to: target,
          kind: 'conflict',
          weight: 8,
          description: `${god}与${target}直接冲突`,
          reverseKind: 'conflict'
        })
      }
    }
  }

  private addCombinationsAndSpecialEdges() {
    this.addEdge({
      from: '食神', to: '七杀', kind: 'combine', weight: 10,
      description: '食神制杀，食神合化七杀为权，上格',
      reverseKind: 'combine'
    })

    this.addEdge({
      from: '伤官', to: '七杀', kind: 'combine', weight: 8,
      description: '伤官合杀，伤官与七杀相合化制，贵格',
      reverseKind: 'combine'
    })

    this.addEdge({
      from: '伤官', to: '正官', kind: 'conflict', weight: 10,
      description: '伤官见官，伤官克正官，为祸百端',
      reverseKind: 'conflict'
    })

    this.addEdge({
      from: '正官', to: '七杀', kind: 'conflict', weight: 9,
      description: '官杀混杂，正官与七杀同现，进退失据',
      reverseKind: 'conflict'
    })

    this.addEdge({
      from: '正官', to: '正印', kind: 'combine', weight: 9,
      description: '官印相生，正官生正印，功名显达',
      reverseKind: 'flow'
    })

    this.addEdge({
      from: '七杀', to: '正印', kind: 'combine', weight: 9,
      description: '杀印相生，七杀化正印，威权显赫',
      reverseKind: 'flow'
    })

    this.addEdge({
      from: '七杀', to: '偏印', kind: 'combine', weight: 9,
      description: '杀枭相生，七杀生偏印，出奇制胜',
      reverseKind: 'flow'
    })

    this.addEdge({
      from: '偏印', to: '食神', kind: 'conflict', weight: 10,
      description: '枭神夺食，偏印克食神，大凶',
      reverseKind: 'conflict'
    })

    this.addEdge({
      from: '偏印', to: '七杀', kind: 'conflict', weight: 8,
      description: '印杀相战，偏印遇七杀，枭杀相争',
      reverseKind: 'conflict'
    })

    this.addEdge({
      from: '比肩', to: '劫财', kind: 'help', weight: 7,
      description: '比劫帮身，比肩与劫财互相帮扶日主',
      reverseKind: 'help'
    })

    this.addEdge({
      from: '比肩', to: '正财', kind: 'control', weight: 9,
      description: '比肩夺财，比肩克正财，分夺妻财',
      reverseKind: 'beControlled'
    })

    this.addEdge({
      from: '劫财', to: '偏财', kind: 'control', weight: 9,
      description: '劫财夺偏财，劫财克偏财，破耗之征',
      reverseKind: 'beControlled'
    })

    this.addEdge({
      from: '食神', to: '伤官', kind: 'help', weight: 7,
      description: '食伤互助，食神与伤官同为我生，才华互增',
      reverseKind: 'help'
    })

    this.addEdge({
      from: '偏财', to: '正财', kind: 'help', weight: 7,
      description: '财星互助，偏财与正财同为我克，财富相济',
      reverseKind: 'help'
    })

    this.addEdge({
      from: '偏印', to: '正印', kind: 'help', weight: 7,
      description: '印星互助，偏印与正印同生我身，智慧相合',
      reverseKind: 'help'
    })

    this.addEdge({
      from: '食神', to: '偏财', kind: 'flow', weight: 8,
      description: '食神生偏财，食伤生财之流通',
      reverseKind: 'drain'
    })

    this.addEdge({
      from: '伤官', to: '正财', kind: 'flow', weight: 8,
      description: '伤官生正财，伤官生财之流通',
      reverseKind: 'drain'
    })

    this.addEdge({
      from: '食神', to: '正财', kind: 'flow', weight: 7,
      description: '食神生正财，食神生财之辅助流通',
      reverseKind: 'drain'
    })

    this.addEdge({
      from: '伤官', to: '偏财', kind: 'flow', weight: 7,
      description: '伤官生偏财，伤官生财之辅助流通',
      reverseKind: 'drain'
    })

    this.addEdge({
      from: '偏财', to: '七杀', kind: 'flow', weight: 8,
      description: '财滋七杀，偏财生七杀，杀得财助',
      reverseKind: 'drain'
    })

    this.addEdge({
      from: '正财', to: '正官', kind: 'flow', weight: 8,
      description: '财生正官，正财生正官，财官双美',
      reverseKind: 'drain'
    })

    this.addEdge({
      from: '正财', to: '七杀', kind: 'flow', weight: 7,
      description: '正财生七杀，财助杀旺之辅助流通',
      reverseKind: 'drain'
    })

    this.addEdge({
      from: '偏财', to: '正官', kind: 'flow', weight: 7,
      description: '偏财生正官，财生官之辅助流通',
      reverseKind: 'drain'
    })

    this.addEdge({
      from: '七杀', to: '偏印', kind: 'flow', weight: 8,
      description: '杀生偏印，七杀生枭印之流通',
      reverseKind: 'drain'
    })

    this.addEdge({
      from: '正官', to: '正印', kind: 'flow', weight: 8,
      description: '官生正印，正官生正印之流通',
      reverseKind: 'drain'
    })

    this.addEdge({
      from: '正官', to: '偏印', kind: 'flow', weight: 7,
      description: '正官生偏印，官生印之辅助流通',
      reverseKind: 'drain'
    })

    this.addEdge({
      from: '七杀', to: '正印', kind: 'flow', weight: 7,
      description: '杀生正印，杀生印之辅助流通',
      reverseKind: 'drain'
    })

    this.addEdge({
      from: '偏印', to: '比肩', kind: 'flow', weight: 8,
      description: '偏印生比肩，枭印生身之流通',
      reverseKind: 'drain'
    })

    this.addEdge({
      from: '正印', to: '劫财', kind: 'flow', weight: 8,
      description: '正印生劫财，正印生身之流通',
      reverseKind: 'drain'
    })

    this.addEdge({
      from: '正印', to: '比肩', kind: 'flow', weight: 7,
      description: '正印生比肩，印生身之辅助流通',
      reverseKind: 'drain'
    })

    this.addEdge({
      from: '偏印', to: '劫财', kind: 'flow', weight: 7,
      description: '偏印生劫财，枭印生身之辅助流通',
      reverseKind: 'drain'
    })

    this.addEdge({
      from: '比肩', to: '食神', kind: 'flow', weight: 8,
      description: '比肩生食神，比劫生食伤之流通',
      reverseKind: 'drain'
    })

    this.addEdge({
      from: '劫财', to: '伤官', kind: 'flow', weight: 8,
      description: '劫财生伤官，比劫生食伤之流通',
      reverseKind: 'drain'
    })

    this.addEdge({
      from: '劫财', to: '食神', kind: 'flow', weight: 7,
      description: '劫财生食神，比劫生食伤之辅助流通',
      reverseKind: 'drain'
    })

    this.addEdge({
      from: '比肩', to: '伤官', kind: 'flow', weight: 7,
      description: '比肩生伤官，比劫生食伤之辅助流通',
      reverseKind: 'drain'
    })

    this.addEdge({
      from: '正印', to: '偏财', kind: 'beControlled', weight: 9,
      description: '财破印，偏财克正印，财印交战',
      reverseKind: 'control'
    })

    this.addEdge({
      from: '偏印', to: '正财', kind: 'beControlled', weight: 9,
      description: '财克枭，正财克偏印，财以制枭',
      reverseKind: 'control'
    })

    this.addEdge({
      from: '正财', to: '正印', kind: 'control', weight: 9,
      description: '财破正印，正财克正印，印绶受损伤学业',
      reverseKind: 'beControlled'
    })

    this.addEdge({
      from: '偏财', to: '偏印', kind: 'control', weight: 9,
      description: '偏财制枭，偏财克偏印，财星可以制枭神',
      reverseKind: 'beControlled'
    })

    this.addEdge({
      from: '七杀', to: '比肩', kind: 'control', weight: 9,
      description: '七杀克比肩，七杀直接克制日主同类',
      reverseKind: 'beControlled'
    })

    this.addEdge({
      from: '正官', to: '劫财', kind: 'control', weight: 9,
      description: '正官克劫财，正官直接约束劫财之性',
      reverseKind: 'beControlled'
    })

    this.addEdge({
      from: '七杀', to: '劫财', kind: 'control', weight: 8,
      description: '七杀克劫财，七杀兼克劫财',
      reverseKind: 'beControlled'
    })

    this.addEdge({
      from: '正官', to: '比肩', kind: 'control', weight: 8,
      description: '正官克比肩，正官兼克比肩',
      reverseKind: 'beControlled'
    })

    this.addEdge({
      from: '食神', to: '正官', kind: 'conflict', weight: 7,
      description: '食伤见官，食神间接妨碍正官，弱于伤官见官',
      reverseKind: 'conflict'
    })

    this.addEdge({
      from: '偏财', to: '七杀', kind: 'combine', weight: 8,
      description: '杀财同透，偏财与七杀同透天干，财滋七杀',
      reverseKind: 'combine'
    })

    this.addEdge({
      from: '正财', to: '正官', kind: 'combine', weight: 9,
      description: '财官双美，正财与正官同现，财生官旺',
      reverseKind: 'combine'
    })

    this.addEdge({
      from: '正印', to: '比肩', kind: 'combine', weight: 8,
      description: '印绶护身，正印生比肩帮身，印比相扶',
      reverseKind: 'flow'
    })

    this.addEdge({
      from: '偏印', to: '劫财', kind: 'combine', weight: 8,
      description: '枭印帮身，偏印生劫财助身，偏用之印',
      reverseKind: 'flow'
    })

    this.addEdge({
      from: '正印', to: '七杀', kind: 'combine', weight: 9,
      description: '印绶化杀，正印化七杀之气，杀印相生',
      reverseKind: 'combine'
    })

    this.addEdge({
      from: '食神', to: '正财', kind: 'combine', weight: 8,
      description: '食神生财格，食神生正财，富格',
      reverseKind: 'combine'
    })

    this.addEdge({
      from: '伤官', to: '偏财', kind: 'combine', weight: 8,
      description: '伤官生财格，伤官生偏财，大富',
      reverseKind: 'combine'
    })

    this.addEdge({
      from: '偏财', to: '正官', kind: 'combine', weight: 7,
      description: '财印两现之间接，财生官间接制衡印',
      reverseKind: 'flow'
    })

    this.addEdge({
      from: '伤官', to: '正印', kind: 'beControlled', weight: 8,
      description: '印制伤官，正印克制伤官，伤官佩印',
      reverseKind: 'control'
    })

    this.addEdge({
      from: '正印', to: '伤官', kind: 'control', weight: 8,
      description: '正印克伤官，印星制伤官之锐气，伤官佩印为贵',
      reverseKind: 'beControlled'
    })
  }

  getEdges(): GraphEdge[] {
    return this.edges.slice()
  }

  getAdjacency(): Record<TenGodName, GraphEdge[]> {
    const adj: Record<string, GraphEdge[]> = {}
    for (const n of this.nodes) adj[n] = []
    for (const e of this.edges) {
      adj[e.from].push(e)
    }
    return adj as Record<TenGodName, GraphEdge[]>
  }

  getOutgoing(n: TenGodName): GraphEdge[] {
    return this.edges.filter(e => e.from === n)
  }

  getIncoming(n: TenGodName): GraphEdge[] {
    return this.edges.filter(e => e.to === n)
  }

  getFlows(minStrength = 7): Array<{ path: TenGodName[]; strength: number }> {
    const results: Array<{ path: TenGodName[]; strength: number }> = []
    const flowKinds: RelationKind[] = ['produce', 'flow', 'combine']

    function dfs(
      current: TenGodName,
      path: TenGodName[],
      minW: number,
      visited: Set<TenGodName>,
      graph: TenGodRelationGraph,
      out: Array<{ path: TenGodName[]; strength: number }>
    ) {
      if (path.length >= 3) {
        out.push({ path: path.slice(), strength: minW })
      }
      if (path.length >= 6) return
      for (const e of graph.getOutgoing(current)) {
        if (!flowKinds.includes(e.kind)) continue
        if (e.weight < minStrength) continue
        if (visited.has(e.to)) continue
        visited.add(e.to)
        path.push(e.to)
        dfs(e.to, path, Math.min(minW, e.weight), visited, graph, out)
        path.pop()
        visited.delete(e.to)
      }
    }

    for (const start of this.nodes) {
      const visited = new Set<TenGodName>([start])
      dfs(start, [start], 10, visited, this, results)
    }

    return results.sort((a, b) => b.strength - a.strength || b.path.length - a.path.length)
  }

  getConflicts(minStrength = 7): Array<{ a: TenGodName; b: TenGodName; kind: 'control' | 'conflict'; strength: number }> {
    const seen = new Set<string>()
    const result: Array<{ a: TenGodName; b: TenGodName; kind: 'control' | 'conflict'; strength: number }> = []
    for (const e of this.edges) {
      if (e.kind !== 'control' && e.kind !== 'conflict') continue
      if (e.weight < minStrength) continue
      const key = [e.from, e.to].sort().join('|')
      if (seen.has(key)) continue
      seen.add(key)
      result.push({
        a: e.from,
        b: e.to,
        kind: e.kind as 'control' | 'conflict',
        strength: e.weight
      })
    }
    return result.sort((a, b) => b.strength - a.strength)
  }

  shortestPath(a: TenGodName, b: TenGodName): TenGodName[] | null {
    if (a === b) return [a]
    const prev = new Map<TenGodName, TenGodName | null>()
    const visited = new Set<TenGodName>([a])
    const queue: TenGodName[] = [a]
    prev.set(a, null)
    while (queue.length) {
      const cur = queue.shift()!
      if (cur === b) {
        const path: TenGodName[] = []
        let node: TenGodName | null | undefined = cur
        while (node) {
          path.unshift(node)
          node = prev.get(node)
        }
        return path
      }
      for (const e of this.getOutgoing(cur)) {
        if (visited.has(e.to)) continue
        visited.add(e.to)
        prev.set(e.to, cur)
        queue.push(e.to)
      }
    }
    return null
  }

  report(): TenGodGraphReport {
    const nodes = this.nodes.slice()
    const edges = this.getEdges()
    const adjacency = this.getAdjacency()
    const flows = this.getFlows(7)
    const conflicts = this.getConflicts(7)
    return { nodes, edges, adjacency, flows, conflicts }
  }
}

export const defaultTenGodRelationGraph = new TenGodRelationGraph()
