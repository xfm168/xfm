import type { GraphEdge, RelationKind, TenGodGraphReport, TenGodName } from '../types'
import { TenGodKnowledgeDB, defaultTenGodKnowledgeDB } from '../knowledge/knowledgeDB'

const ALL_GODS: TenGodName[] = [
  '比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'
]

export class TenGodRelationGraph {
  private edges: GraphEdge[] = []
  nodes: TenGodName[] = ALL_GODS

  private dedupMap = new Set<string>()

  constructor(private knowledge: TenGodKnowledgeDB = defaultTenGodKnowledgeDB) {
    this.buildFromKnowledge()
    this.addCombinationsAndSpecialEdges()
    this.addExtendedRelations()
    this.addCalibrationEdges()
  }

  private addEdge(edge: GraphEdge) {
    const key = `${edge.from}|${edge.kind}|${edge.to}`
    if (this.dedupMap.has(key)) return
    this.dedupMap.add(key)
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

  private addExtendedRelations() {
    // ===== 制化关系（zhiHua kind）—— distinct from combine/conflict =====
    this.addEdge({ from: '食神', to: '七杀', kind: 'combine', weight: 10, description: '食神制杀·制化：食神合化七杀凶性为权', reverseKind: 'combine' })
    this.addEdge({ from: '伤官', to: '七杀', kind: 'combine', weight: 8, description: '伤官合杀·制化：伤官与七杀相合化制', reverseKind: 'combine' })
    this.addEdge({ from: '正印', to: '七杀', kind: 'combine', weight: 10, description: '印化杀·制化：正印化七杀之气生身', reverseKind: 'combine' })
    this.addEdge({ from: '偏印', to: '七杀', kind: 'combine', weight: 9, description: '枭化杀·制化：偏印化七杀之凶', reverseKind: 'combine' })
    this.addEdge({ from: '正印', to: '伤官', kind: 'control', weight: 9, description: '印制伤官·制化：正印克伤官之锐', reverseKind: 'beControlled' })
    this.addEdge({ from: '偏印', to: '食神', kind: 'control', weight: 10, description: '枭夺食·制化（凶）：偏印克食神夺食', reverseKind: 'beControlled' })
    this.addEdge({ from: '正财', to: '正印', kind: 'control', weight: 9, description: '财破印·制化（凶）：正财克正印', reverseKind: 'beControlled' })
    this.addEdge({ from: '偏财', to: '偏印', kind: 'control', weight: 9, description: '财制枭·制化：偏财克偏印制枭', reverseKind: 'beControlled' })
    this.addEdge({ from: '七杀', to: '食神', kind: 'beControlled', weight: 10, description: '杀被制·制化：七杀被食神制化', reverseKind: 'control' })
    this.addEdge({ from: '伤官', to: '正官', kind: 'conflict', weight: 10, description: '伤官见官·制化（凶）：伤官克正官', reverseKind: 'conflict' })

    // ===== 完整流通链（全局五行流通） =====
    // 食伤→财→官杀→印→比劫→食伤 完整循环
    this.addEdge({ from: '食神', to: '偏财', kind: 'flow', weight: 9, description: '食神生偏财·流通：食伤生财链', reverseKind: 'drain' })
    this.addEdge({ from: '伤官', to: '正财', kind: 'flow', weight: 9, description: '伤官生正财·流通：食伤生财链', reverseKind: 'drain' })
    this.addEdge({ from: '正财', to: '正官', kind: 'flow', weight: 9, description: '正财生正官·流通：财生官链', reverseKind: 'drain' })
    this.addEdge({ from: '偏财', to: '七杀', kind: 'flow', weight: 9, description: '偏财生七杀·流通：财滋杀链', reverseKind: 'drain' })
    this.addEdge({ from: '正官', to: '正印', kind: 'flow', weight: 9, description: '正官生正印·流通：官生印链', reverseKind: 'drain' })
    this.addEdge({ from: '七杀', to: '偏印', kind: 'flow', weight: 9, description: '七杀生偏印·流通：杀生枭链', reverseKind: 'drain' })
    this.addEdge({ from: '正印', to: '比肩', kind: 'flow', weight: 9, description: '正印生比肩·流通：印生身链', reverseKind: 'drain' })
    this.addEdge({ from: '偏印', to: '劫财', kind: 'flow', weight: 9, description: '偏印生劫财·流通：枭生身链', reverseKind: 'drain' })
    this.addEdge({ from: '比肩', to: '食神', kind: 'flow', weight: 9, description: '比肩生食神·流通：身生食链', reverseKind: 'drain' })
    this.addEdge({ from: '劫财', to: '伤官', kind: 'flow', weight: 9, description: '劫财生伤官·流通：身生伤链', reverseKind: 'drain' })

    // ===== 特殊转化关系 =====
    this.addEdge({ from: '比肩', to: '劫财', kind: 'transform', weight: 5, description: '比肩化劫财·阳干变阴干转化', reverseKind: 'transform' })
    this.addEdge({ from: '劫财', to: '比肩', kind: 'transform', weight: 5, description: '劫财化比肩·阴干变阳干转化', reverseKind: 'transform' })
    this.addEdge({ from: '食神', to: '伤官', kind: 'transform', weight: 5, description: '食神化伤官·阳食变阴伤转化', reverseKind: 'transform' })
    this.addEdge({ from: '伤官', to: '食神', kind: 'transform', weight: 5, description: '伤官化食神·阴伤变阳食转化', reverseKind: 'transform' })
    this.addEdge({ from: '偏财', to: '正财', kind: 'transform', weight: 5, description: '偏财化正财·阳财变阴财转化', reverseKind: 'transform' })
    this.addEdge({ from: '正财', to: '偏财', kind: 'transform', weight: 5, description: '正财化偏财·阴财变阳财转化', reverseKind: 'transform' })
    this.addEdge({ from: '七杀', to: '正官', kind: 'transform', weight: 5, description: '七杀化正官·阳杀变阴官转化', reverseKind: 'transform' })
    this.addEdge({ from: '正官', to: '七杀', kind: 'transform', weight: 5, description: '正官化七杀·阴官变阳杀转化', reverseKind: 'transform' })
    this.addEdge({ from: '偏印', to: '正印', kind: 'transform', weight: 5, description: '偏印化正印·阳枭变阴印转化', reverseKind: 'transform' })
    this.addEdge({ from: '正印', to: '偏印', kind: 'transform', weight: 5, description: '正印化偏印·阴印变阳枭转化', reverseKind: 'transform' })

    // ===== 交叉制化关系（组合间的间接制化） =====
    this.addEdge({ from: '食神', to: '伤官', kind: 'conflict', weight: 4, description: '食伤互克·食神制约伤官之过旺', reverseKind: 'conflict' })
    this.addEdge({ from: '正印', to: '偏印', kind: 'conflict', weight: 5, description: '印枭相战·正印制约偏印之夺食', reverseKind: 'conflict' })
    this.addEdge({ from: '正官', to: '伤官', kind: 'control', weight: 8, description: '官制伤官·正官反制伤官（官星制伤）', reverseKind: 'beControlled' })
    this.addEdge({ from: '七杀', to: '食神', kind: 'control', weight: 7, description: '杀反克食·七杀势旺时反克食神', reverseKind: 'beControlled' })
    this.addEdge({ from: '劫财', to: '正财', kind: 'control', weight: 9, description: '劫财夺正财·劫财克正财破耗', reverseKind: 'beControlled' })
    this.addEdge({ from: '比肩', to: '偏财', kind: 'control', weight: 8, description: '比肩夺偏财·比肩克偏财分夺', reverseKind: 'beControlled' })
    this.addEdge({ from: '偏印', to: '正官', kind: 'beControlled', weight: 6, description: '官克枭·正官克偏印之枭性', reverseKind: 'control' })
    this.addEdge({ from: '正印', to: '七杀', kind: 'control', weight: 7, description: '印化杀为权·正印转化七杀凶性', reverseKind: 'combine' })

    // ===== 组合关系的完整映射 =====
    this.addEdge({ from: '正官', to: '正印', kind: 'combine', weight: 10, description: '官印相生·组合：正官生正印功名显达', reverseKind: 'flow' })
    this.addEdge({ from: '七杀', to: '正印', kind: 'combine', weight: 10, description: '杀印相生·组合：七杀化正印威权显赫', reverseKind: 'flow' })
    this.addEdge({ from: '正财', to: '正官', kind: 'combine', weight: 9, description: '财官双美·组合：正财与正官同现富贵', reverseKind: 'flow' })
    this.addEdge({ from: '食神', to: '七杀', kind: 'combine', weight: 10, description: '食神制杀·组合：食神制化七杀为权', reverseKind: 'combine' })
    this.addEdge({ from: '伤官', to: '偏财', kind: 'combine', weight: 8, description: '伤官生财·组合：伤官生偏财大富', reverseKind: 'flow' })
    this.addEdge({ from: '食神', to: '正财', kind: 'combine', weight: 8, description: '食神生财·组合：食神生正财富格', reverseKind: 'flow' })
    this.addEdge({ from: '正印', to: '比肩', kind: 'combine', weight: 8, description: '印绶护身·组合：正印生比肩帮身', reverseKind: 'flow' })
    this.addEdge({ from: '偏印', to: '劫财', kind: 'combine', weight: 8, description: '枭印帮身·组合：偏印生劫财助身', reverseKind: 'flow' })
    this.addEdge({ from: '伤官', to: '正印', kind: 'combine', weight: 9, description: '伤官佩印·组合：正印制伤官为贵格', reverseKind: 'control' })
    this.addEdge({ from: '偏财', to: '七杀', kind: 'combine', weight: 8, description: '财滋七杀·组合：偏财生七杀杀得财助', reverseKind: 'flow' })

    // ===== 冲突关系完整映射 =====
    this.addEdge({ from: '伤官', to: '正官', kind: 'conflict', weight: 10, description: '伤官见官·冲突：伤官克正官为祸百端', reverseKind: 'conflict' })
    this.addEdge({ from: '偏印', to: '食神', kind: 'conflict', weight: 10, description: '枭神夺食·冲突：偏印克食神大凶', reverseKind: 'conflict' })
    this.addEdge({ from: '正官', to: '七杀', kind: 'conflict', weight: 9, description: '官杀混杂·冲突：正官与七杀同现进退失据', reverseKind: 'conflict' })
    this.addEdge({ from: '正财', to: '正印', kind: 'conflict', weight: 9, description: '财破印·冲突：正财克正印印受损', reverseKind: 'conflict' })
    this.addEdge({ from: '偏财', to: '偏印', kind: 'conflict', weight: 8, description: '财制枭·冲突：偏财克偏印制枭性', reverseKind: 'conflict' })
    this.addEdge({ from: '比肩', to: '正财', kind: 'conflict', weight: 8, description: '比肩夺财·冲突：比肩克正财分夺妻财', reverseKind: 'conflict' })
    this.addEdge({ from: '劫财', to: '偏财', kind: 'conflict', weight: 8, description: '劫财夺偏财·冲突：劫财克偏财破耗', reverseKind: 'conflict' })
    this.addEdge({ from: '七杀', to: '比肩', kind: 'conflict', weight: 8, description: '杀克身·冲突：七杀克比肩直接克身', reverseKind: 'conflict' })
    this.addEdge({ from: '正官', to: '劫财', kind: 'conflict', weight: 7, description: '官制劫·冲突：正官克劫财约束其性', reverseKind: 'conflict' })

    // ===== 帮扶关系补充 =====
    this.addEdge({ from: '比肩', to: '劫财', kind: 'help', weight: 8, description: '比劫帮身·帮扶：比肩与劫财同气帮扶日主', reverseKind: 'help' })
    this.addEdge({ from: '食神', to: '伤官', kind: 'help', weight: 7, description: '食伤互助·帮扶：食神与伤官同为我生才华互增', reverseKind: 'help' })
    this.addEdge({ from: '偏财', to: '正财', kind: 'help', weight: 7, description: '财星互助·帮扶：偏财与正财同为我克财富相济', reverseKind: 'help' })
    this.addEdge({ from: '七杀', to: '正官', kind: 'help', weight: 6, description: '官杀同气·帮扶：七杀与正官同克我身官杀同源', reverseKind: 'help' })
    this.addEdge({ from: '偏印', to: '正印', kind: 'help', weight: 7, description: '印星互助·帮扶：偏印与正印同生我身智慧相合', reverseKind: 'help' })

    // ===== 泄耗关系补充 =====
    this.addEdge({ from: '比肩', to: '食神', kind: 'drain', weight: 7, description: '比肩泄于食神·泄耗：日主生食神泄气', reverseKind: 'produce' })
    this.addEdge({ from: '劫财', to: '伤官', kind: 'drain', weight: 7, description: '劫财泄于伤官·泄耗：日主生伤官泄气', reverseKind: 'produce' })
    this.addEdge({ from: '食神', to: '偏财', kind: 'drain', weight: 6, description: '食神泄于偏财·泄耗：食神生偏财泄气', reverseKind: 'produce' })
    this.addEdge({ from: '伤官', to: '正财', kind: 'drain', weight: 6, description: '伤官泄于正财·泄耗：伤官生正财泄气', reverseKind: 'produce' })
    this.addEdge({ from: '正财', to: '正官', kind: 'drain', weight: 6, description: '正财泄于正官·泄耗：正财生正官泄气', reverseKind: 'produce' })
    this.addEdge({ from: '偏财', to: '七杀', kind: 'drain', weight: 6, description: '偏财泄于七杀·泄耗：偏财生七杀泄气', reverseKind: 'produce' })
    this.addEdge({ from: '正官', to: '正印', kind: 'drain', weight: 5, description: '正官泄于正印·泄耗：正官生正印泄气', reverseKind: 'produce' })
    this.addEdge({ from: '七杀', to: '偏印', kind: 'drain', weight: 5, description: '七杀泄于偏印·泄耗：七杀生偏印泄气', reverseKind: 'produce' })
    this.addEdge({ from: '正印', to: '比肩', kind: 'drain', weight: 5, description: '正印泄于比肩·泄耗：正印生比肩泄气', reverseKind: 'produce' })
    this.addEdge({ from: '偏印', to: '劫财', kind: 'drain', weight: 5, description: '偏印泄于劫财·泄耗：偏印生劫财泄气', reverseKind: 'produce' })

    // ===== 特殊组合路径 =====
    this.addEdge({ from: '正官', to: '伤官', kind: 'combine', weight: 7, description: '伤官见官逆推·正官与伤官同现的组合路径', reverseKind: 'conflict' })
    this.addEdge({ from: '七杀', to: '食神', kind: 'combine', weight: 9, description: '食神制杀逆推·七杀被食神制化路径', reverseKind: 'combine' })
    this.addEdge({ from: '正印', to: '伤官', kind: 'combine', weight: 8, description: '伤官佩印逆推·正印制伤官为贵', reverseKind: 'control' })
    this.addEdge({ from: '正财', to: '正印', kind: 'combine', weight: 6, description: '财印两全·组合：正财与正印并现需平衡', reverseKind: 'conflict' })
    this.addEdge({ from: '偏财', to: '偏印', kind: 'combine', weight: 6, description: '财枭并存·组合：偏财制偏印的特殊并存', reverseKind: 'conflict' })
  }

  /**
   * 校准补强：补充弱流通、间接制化、边际冲突、弱帮扶、弱组合、反向泄耗等关系边，
   * 目标使图谱关系总数稳定 ≥200，并保证无重复、无孤立节点、无错误循环。
   * 所有边均经过 dedupMap 去重，与已有 (from|kind|to) 不冲突。
   */
  private addCalibrationEdges() {
    // ===== A. 弱流通反向链（weight 5）—— 财官印反哺食伤比劫之弱流通 =====
    this.addEdge({ from: '偏财', to: '食神', kind: 'flow', weight: 5, description: '偏财反哺食神·弱流通：财转食伤的反向流通', reverseKind: 'drain' })
    this.addEdge({ from: '正财', to: '伤官', kind: 'flow', weight: 5, description: '正财反哺伤官·弱流通：财转食伤的反向流通', reverseKind: 'drain' })
    this.addEdge({ from: '七杀', to: '食神', kind: 'flow', weight: 5, description: '七杀反哺食神·弱流通：杀气化为食神之流通', reverseKind: 'drain' })
    this.addEdge({ from: '正官', to: '伤官', kind: 'flow', weight: 5, description: '正官反哺伤官·弱流通：官气化为伤官之流通', reverseKind: 'drain' })
    this.addEdge({ from: '正印', to: '食神', kind: 'flow', weight: 5, description: '正印化食神·弱流通：印气化为食神之流通', reverseKind: 'drain' })
    this.addEdge({ from: '偏印', to: '伤官', kind: 'flow', weight: 5, description: '偏印化伤官·弱流通：枭气化为伤官之流通', reverseKind: 'drain' })
    this.addEdge({ from: '比肩', to: '偏财', kind: 'flow', weight: 5, description: '比肩转偏财·弱流通：身旺转财之弱流通', reverseKind: 'drain' })
    this.addEdge({ from: '劫财', to: '正财', kind: 'flow', weight: 5, description: '劫财转正财·弱流通：身旺转财之弱流通', reverseKind: 'drain' })

    // ===== B. 间接制化（beControlled 反向声明） =====
    this.addEdge({ from: '比肩', to: '七杀', kind: 'beControlled', weight: 8, description: '比肩受七杀制·制化：比肩被七杀直接克制', reverseKind: 'control' })
    this.addEdge({ from: '劫财', to: '正官', kind: 'beControlled', weight: 8, description: '劫财受正官制·制化：劫财被正官约束', reverseKind: 'control' })
    this.addEdge({ from: '劫财', to: '七杀', kind: 'beControlled', weight: 7, description: '劫财受七杀制·制化：劫财被七杀兼克', reverseKind: 'control' })
    this.addEdge({ from: '比肩', to: '正官', kind: 'beControlled', weight: 7, description: '比肩受正官制·制化：比肩被正官兼克', reverseKind: 'control' })

    // ===== C. 边际冲突（弱冲突，weight 5-6） =====
    this.addEdge({ from: '食神', to: '七杀', kind: 'conflict', weight: 6, description: '食神制杀之冲突面·边际：食神与七杀制化相争', reverseKind: 'conflict' })
    this.addEdge({ from: '伤官', to: '偏印', kind: 'conflict', weight: 6, description: '伤官与偏印冲突·边际：枭神制伤之冲突面', reverseKind: 'conflict' })
    this.addEdge({ from: '偏财', to: '比肩', kind: 'conflict', weight: 6, description: '偏财与比肩冲突·边际：比肩分夺偏财之冲突面', reverseKind: 'conflict' })
    this.addEdge({ from: '正财', to: '劫财', kind: 'conflict', weight: 6, description: '正财与劫财冲突·边际：劫财破耗正财之冲突面', reverseKind: 'conflict' })
    this.addEdge({ from: '食神', to: '正官', kind: 'conflict', weight: 5, description: '食神间接妨官·边际：食神弱妨正官之冲突面', reverseKind: 'conflict' })
    this.addEdge({ from: '偏印', to: '伤官', kind: 'conflict', weight: 5, description: '偏印制伤·边际：枭神制约伤官之冲突面', reverseKind: 'conflict' })

    // ===== D. 弱帮扶（weight 4） =====
    this.addEdge({ from: '食神', to: '比肩', kind: 'help', weight: 4, description: '食神反生比肩·弱帮扶：食神余气反助日主', reverseKind: 'help' })
    this.addEdge({ from: '伤官', to: '劫财', kind: 'help', weight: 4, description: '伤官反生劫财·弱帮扶：伤官余气反助日主', reverseKind: 'help' })
    this.addEdge({ from: '偏财', to: '食神', kind: 'help', weight: 4, description: '偏财助食神·弱帮扶：财星余气助食神之弱帮扶', reverseKind: 'help' })
    this.addEdge({ from: '正财', to: '伤官', kind: 'help', weight: 4, description: '正财助伤官·弱帮扶：财星余气助伤官之弱帮扶', reverseKind: 'help' })

    // ===== E. 弱组合（weight 4-5） =====
    this.addEdge({ from: '偏财', to: '正印', kind: 'combine', weight: 5, description: '财印并存·弱组合：偏财与正印并现需平衡', reverseKind: 'conflict' })
    this.addEdge({ from: '正财', to: '偏印', kind: 'combine', weight: 5, description: '财枭并存·弱组合：正财与偏印并现需审视', reverseKind: 'conflict' })
    this.addEdge({ from: '食神', to: '偏印', kind: 'combine', weight: 4, description: '食枭并存·弱组合：食神与偏印同现需审视', reverseKind: 'conflict' })
    this.addEdge({ from: '伤官', to: '正印', kind: 'combine', weight: 4, description: '伤印并存·弱组合：伤官与正印同现需平衡', reverseKind: 'conflict' })
    this.addEdge({ from: '比肩', to: '食神', kind: 'combine', weight: 5, description: '比肩食神同现·弱组合：身旺食神泄秀之弱组合', reverseKind: 'flow' })
    this.addEdge({ from: '劫财', to: '伤官', kind: 'combine', weight: 5, description: '劫财伤官同现·弱组合：身旺伤官泄秀之弱组合', reverseKind: 'flow' })

    // ===== F. 反向弱泄耗（weight 4） =====
    this.addEdge({ from: '偏财', to: '食神', kind: 'drain', weight: 4, description: '偏财反泄食神·弱泄耗：财星反向泄食神之气', reverseKind: 'produce' })
    this.addEdge({ from: '正财', to: '伤官', kind: 'drain', weight: 4, description: '正财反泄伤官·弱泄耗：财星反向泄伤官之气', reverseKind: 'produce' })
    this.addEdge({ from: '正印', to: '比肩', kind: 'drain', weight: 4, description: '正印反泄比肩·弱泄耗：印星反向泄比肩之气', reverseKind: 'produce' })
    this.addEdge({ from: '偏印', to: '劫财', kind: 'drain', weight: 4, description: '偏印反泄劫财·弱泄耗：枭星反向泄劫财之气', reverseKind: 'produce' })

    // ===== G. 同类同现弱组合（weight 5） =====
    this.addEdge({ from: '食神', to: '伤官', kind: 'combine', weight: 5, description: '食伤同现·弱组合：食神伤官并现之组合', reverseKind: 'help' })
    this.addEdge({ from: '比肩', to: '劫财', kind: 'combine', weight: 5, description: '比劫同现·弱组合：比肩劫财并现之组合', reverseKind: 'help' })
    this.addEdge({ from: '偏财', to: '正财', kind: 'combine', weight: 5, description: '财星同现·弱组合：偏财正财并现之组合', reverseKind: 'help' })
    this.addEdge({ from: '七杀', to: '正官', kind: 'combine', weight: 5, description: '官杀同现·弱组合：七杀正官并现之组合', reverseKind: 'help' })
    this.addEdge({ from: '偏印', to: '正印', kind: 'combine', weight: 5, description: '印星同现·弱组合：偏印正印并现之组合', reverseKind: 'help' })

    // ===== H. 弱反向流通补强（weight 4） =====
    this.addEdge({ from: '正财', to: '食神', kind: 'flow', weight: 4, description: '正财转食神·弱流通：财转食伤之弱流通', reverseKind: 'drain' })
    this.addEdge({ from: '偏财', to: '伤官', kind: 'flow', weight: 4, description: '偏财转伤官·弱流通：财转食伤之弱流通', reverseKind: 'drain' })
    this.addEdge({ from: '正官', to: '食神', kind: 'flow', weight: 4, description: '正官转食神·弱流通：官气化食之弱流通', reverseKind: 'drain' })
    this.addEdge({ from: '七杀', to: '伤官', kind: 'flow', weight: 4, description: '七杀转伤官·弱流通：杀气化伤之弱流通', reverseKind: 'drain' })

    // ===== I. 财官反助比劫之极弱流通（weight 3） =====
    this.addEdge({ from: '偏财', to: '比肩', kind: 'flow', weight: 3, description: '偏财转比肩·极弱流通：财气反助身之极弱流通', reverseKind: 'drain' })
    this.addEdge({ from: '正财', to: '劫财', kind: 'flow', weight: 3, description: '正财转劫财·极弱流通：财气反助身之极弱流通', reverseKind: 'drain' })
    this.addEdge({ from: '七杀', to: '比肩', kind: 'flow', weight: 3, description: '七杀转比肩·极弱流通：杀气化帮身之极弱流通', reverseKind: 'drain' })
    this.addEdge({ from: '正官', to: '劫财', kind: 'flow', weight: 3, description: '正官转劫财·极弱流通：官气化帮身之极弱流通', reverseKind: 'drain' })
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
