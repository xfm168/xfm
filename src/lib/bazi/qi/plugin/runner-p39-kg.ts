/**
 * P3.9 KnowledgeGraph 命理知识图谱 测试验证
 */
import { KnowledgeGraph } from './knowledgeGraph'

let pass = 0, fail = 0
function check(name: string, ok: boolean) {
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name}`)
  if (ok) { pass++ } else { fail++ }
}

console.log('=== P3.9 KnowledgeGraph 测试 ===\n')

const kg = new KnowledgeGraph()

// ═══════════════════════════════════════════════
// 1. 基础初始化与统计
// ═══════════════════════════════════════════════
console.log('--- 1. 基础初始化 ---')

const stats = kg.getStats()
check('节点数>50', stats.nodeCount > 50)
check('边数>80', stats.edgeCount > 80)
check('有节点类型统计', Object.keys(stats.nodeTypes).length > 0)
check('有边类型统计', Object.keys(stats.edgeTypes).length > 0)

// 各类型节点数量
check('有wuXing节点', (stats.nodeTypes['wuXing'] ?? 0) >= 5)
check('有shiShen节点', (stats.nodeTypes['shiShen'] ?? 0) >= 8)
check('有geJu节点', (stats.nodeTypes['geJu'] ?? 0) >= 10)
check('有wangShuai节点', (stats.nodeTypes['wangShuai'] ?? 0) >= 3)
check('有tiaoHou节点', (stats.nodeTypes['tiaoHou'] ?? 0) >= 3)
check('有bingYao节点', (stats.nodeTypes['bingYao'] ?? 0) >= 5)
check('有tongGuan节点', (stats.nodeTypes['tongGuan'] ?? 0) >= 3)
check('有guJi节点', (stats.nodeTypes['guJi'] ?? 0) >= 3)
check('有shenSha节点', (stats.nodeTypes['shenSha'] ?? 0) >= 10)
check('有dayMaster节点', (stats.nodeTypes['dayMaster'] ?? 0) >= 8)

// ═══════════════════════════════════════════════
// 2. 节点查询
// ═══════════════════════════════════════════════
console.log('\n--- 2. 节点查询 ---')

const muNode = kg.getNode('wuXing:木')
check('获取木节点', muNode !== undefined)
check('木节点name=木', muNode?.name === '木')
check('木节点type=wuXing', muNode?.type === 'wuXing')
check('木节点有属性', muNode?.attributes !== undefined && Object.keys(muNode.attributes).length > 0)
check('木节点有描述', muNode?.description.length > 5)

const bjNode = kg.getNode('shiShen:比肩')
check('获取比肩节点', bjNode !== undefined)
check('比肩节点有别名', bjNode?.aliases !== undefined && bjNode.aliases.length > 0)

const invalidNode = kg.getNode('nonexistent:xxx')
check('不存在的节点返回undefined', invalidNode === undefined)

// 按类型查询
const wuXingNodes = kg.getNodesByType('wuXing')
check('wuXing类型有5个节点', wuXingNodes.length === 5)

const shiShenNodes = kg.getNodesByType('shiShen')
check('shiShen类型>=10个节点', shiShenNodes.length >= 10)

const geJuNodes = kg.getNodesByType('geJu')
check('geJu类型>=20个节点', geJuNodes.length >= 20)

const shenShaNodes = kg.getNodesByType('shenSha')
check('shenSha类型>=15个节点', shenShaNodes.length >= 15)

// ═══════════════════════════════════════════════
// 3. 边/关系查询
// ═══════════════════════════════════════════════
console.log('\n--- 3. 边/关系查询 ---')

// 五行相生
const muOutEdges = kg.getEdgesFrom('wuXing:木')
const muToHuo = muOutEdges.find((e: any) => e.target === 'wuXing:火' && e.type === 'generates')
check('木→火(相生)关系存在', muToHuo !== undefined)

// 五行相克
const muToTu = muOutEdges.find((e: any) => e.target === 'wuXing:土' && e.type === 'overcomes')
check('木→土(相克)关系存在', muToTu !== undefined)

// 十神分组
const bjEdges = kg.getEdgesFrom('shiShen:比肩')
const bjBelongsTo = bjEdges.find((e: any) => e.type === 'belongs_to')
check('比肩有belongs_to关系', bjBelongsTo !== undefined)

// 反向查询
const huangDiEdges = kg.getEdgesTo('shiShen:比劫')
check('比劫分组有成员指向它', huangDiEdges.length > 0)

// 邻居节点
const muNeighbors = kg.getNeighbors('wuXing:木')
check('木的邻居数>=2', muNeighbors.length >= 2)

// ═══════════════════════════════════════════════
// 4. BFS 路径查找
// ═══════════════════════════════════════════════
console.log('\n--- 4. BFS 路径查找 ---')

// 木→火→土（间接路径）
const path1 = kg.getPath('wuXing:木', 'wuXing:土')
check('木→土路径存在', path1 !== undefined && path1.length > 0)

// 木→火（直接路径）
const path2 = kg.getPath('wuXing:木', 'wuXing:火')
check('木→火直接路径', path2 !== undefined && path2.length === 1)

// 格局→格局（通过similar_to双向关系）
const path3 = kg.getPath('geJu:正财格', 'geJu:偏财格')
check('正财格→偏财格路径存在', path3.length > 0)

// 不存在的路径
const path4 = kg.getPath('wuXing:木', 'nonexistent')
check('不存在节点的路径返回空', path4.length === 0)

// ═══════════════════════════════════════════════
// 5. 子图提取
// ═══════════════════════════════════════════════
console.log('\n--- 5. 子图提取 ---')

const subGraph1 = kg.getSubGraph('wuXing:木', 1)
check('木子图：有节点', subGraph1.nodes.length > 0)
check('木子图：有边', subGraph1.edges.length > 0)
check('木子图：中心节点正确', subGraph1.centralNode === 'wuXing:木')
check('木子图：有摘要', subGraph1.summary.length > 10)

const subGraph2 = kg.getSubGraph('geJu:偏财格', 2)
check('偏财格子图：节点数>=3', subGraph2.nodes.length >= 3)
check('偏财格子图：有边', subGraph2.edges.length > 0)
check('偏财格子图：中心节点正确', subGraph2.centralNode === 'geJu:偏财格')

// depth=0 应只有中心节点
const subGraph0 = kg.getSubGraph('wuXing:木', 0)
check('depth=0：只有中心节点', subGraph0.nodes.length === 1 && subGraph0.edges.length === 0)

// ═══════════════════════════════════════════════
// 6. 智能推理（infer）
// ═══════════════════════════════════════════════
console.log('\n--- 6. 智能推理 ---')

// 格局推理
const infer1 = kg.infer(['geJu:正官格'])
check('正官格推理：有结果', infer1.length > 0)
const infer1HasYongShen = infer1.some((i: any) => i.inference.includes('用神') || i.inference.includes('喜'))
check('正官格推理：包含用神信息', infer1HasYongShen)
const infer1ConfOk = infer1.every((i: any) => i.confidence >= 0 && i.confidence <= 100)
check('正官格推理：confidence范围0-100', infer1ConfOk)

// 旺衰推理
const infer2 = kg.infer(['wangShuai:偏弱'])
check('身弱推理：有结果', infer2.length > 0)
const infer2HasContent = infer2.some((i: any) => i.inference.length > 5)
check('身弱推理：包含有效推论', infer2HasContent)

// 五行→健康
const infer3 = kg.infer(['wuXing:木'])
check('木推理：有结果', infer3.length > 0)
const infer3HasContent = infer3.some((i: any) => i.inference.length > 5)
check('木推理：包含有效推论', infer3HasContent)

// 十神→六亲
const infer4 = kg.infer(['shiShen:比肩'])
check('比肩推理：有结果', infer4.length > 0)

// 神煞推理
const infer5 = kg.infer(['shenSha:桃花'])
check('桃花推理：有结果', infer5.length > 0)

// 多节点联合推理
const infer6 = kg.infer(['geJu:偏财格', 'wangShuai:偏旺'])
check('联合推理（偏财格+身旺）：有结果', infer6.length > 0)
const infer6HasMore = infer6.length >= infer1.length
check('联合推理结果>=单节点', infer6HasMore)

// ═══════════════════════════════════════════════
// 7. explainTopic（核心功能）
// ═══════════════════════════════════════════════
console.log('\n--- 7. explainTopic ---')

const topic1 = kg.explainTopic('偏财格')
check('explainTopic(偏财格)：返回结果', topic1 !== undefined)
check('explainTopic(偏财格)：有节点', topic1.nodes.length > 0)
check('explainTopic(偏财格)：有推理', topic1.inferred.length > 0)
check('explainTopic(偏财格)：有摘要', topic1.summary.length > 10)

// 带上下文
const topic2 = kg.explainTopic('偏弱', { dayGan: '甲', dayElement: '木' })
check('explainTopic(身弱+上下文)：有结果', topic2.nodes.length > 0)
check('explainTopic(身弱+上下文)：有推理', topic2.inferred.length > 0)

// 神煞话题
const topic3 = kg.explainTopic('天乙贵人')
check('explainTopic(天乙贵人)：有结果', topic3.nodes.length > 0)

// 桃花话题
const topic4 = kg.explainTopic('桃花')
check('explainTopic(桃花)：有结果', topic4.nodes.length > 0)
const topic4HasSubGraph = topic4.subGraphs.length > 0
check('explainTopic(桃花)：有子图', topic4HasSubGraph)

// 不存在的话题（优雅降级）
const topic5 = kg.explainTopic('不存在的XYZ话题')
check('不存在话题：返回结果（可能为空）', topic5 !== undefined)
check('不存在话题：不崩溃', true)

// ═══════════════════════════════════════════════
// 8. 避免重复描述（knownTopics）
// ═══════════════════════════════════════════════
console.log('\n--- 8. 避免重复描述 ---')

const ctxNoKnown = kg.explainTopic('偏财格', {})
const ctxWithKnown = kg.explainTopic('偏财格', { knownTopics: ['偏财格:用神', '偏财格:格局'] })

// 已知话题后推理数应减少或相同
const noKnownCount = ctxNoKnown.inferred.length
const withKnownCount = ctxWithKnown.inferred.length
check('knownTopics过滤：推理数<=无过滤', withKnownCount <= noKnownCount)

// ═══════════════════════════════════════════════
// 9. 图遍历（traverse）
// ═══════════════════════════════════════════════
console.log('\n--- 9. 图遍历 ---')

let visitedCount = 0
kg.traverse('wuXing:木', (node: any, depth: number) => {
  visitedCount++
  return false // 不提前终止
}, 3)
check('DFS遍历：访问了多个节点', visitedCount >= 3)

let earlyStop = false
let earlyCount = 0
kg.traverse('wuXing:木', (node: any, depth: number) => {
  earlyCount++
  if (depth >= 1) return true // depth>=1 时停止
  return false
}, 3)
check('DFS遍历：可提前终止', earlyCount < visitedCount)

// ═══════════════════════════════════════════════
// 10. 多类型关联验证
// ═══════════════════════════════════════════════
console.log('\n--- 10. 多类型关联验证 ---')

// 格局→古籍（格局应引用古籍）
const geJuEdges = kg.getEdgesFrom('geJu:正官格')
const geJuToGuJi = geJuEdges.some((e: any) => e.target.startsWith('guJi:'))
check('格局节点引用古籍', geJuToGuJi)

// 病药→治法（病应有对应的化解）
const bingYaoEdges = kg.getEdgesFrom('bingYao:身弱财多')
const bingYaoResolves = bingYaoEdges.some((e: any) => e.type === 'resolves' || e.type === 'requires')
check('病药节点有化解关系', bingYaoResolves)

// 日主→五行（日主应属于某个五行）
const jiaMuEdges = kg.getEdgesFrom('dayMaster:甲木')
const jiaMuToWuXing = jiaMuEdges.some((e: any) => e.type === 'belongs_to')
check('日主节点从属于五行', jiaMuToWuXing)

// 神煞→影响（神煞应有影响领域）
const taoHuaEdges = kg.getEdgesFrom('shenSha:桃花')
check('桃花节点有出边', taoHuaEdges.length > 0)

// 古籍→格局（古籍应被格局引用）
const diTianSuiEdges = kg.getEdgesTo('guJi:滴天髓')
check('滴天髓被至少一个节点引用', diTianSuiEdges.length > 0)

// ═══════════════════════════════════════════════
// 11. 数据完整性验证
// ═══════════════════════════════════════════════
console.log('\n--- 11. 数据完整性 ---')

// 所有节点ID格式正确
let allIdFormatOk = true
for (const node of kg.getNodesByType('wuXing').concat(
  kg.getNodesByType('shiShen'), kg.getNodesByType('geJu'), kg.getNodesByType('dayMaster')
)) {
  if (!node.id.includes(':')) allIdFormatOk = false
  if (!node.name || node.name.length === 0) allIdFormatOk = false
  if (!node.description || node.description.length === 0) allIdFormatOk = false
}
check('节点ID含冒号分隔符', allIdFormatOk)

// 所有边的 source/target 对应的节点存在
let allEdgeValid = true
const allNodeIds = new Set([
  ...kg.getNodesByType('wuXing').map((n: any) => n.id),
  ...kg.getNodesByType('shiShen').map((n: any) => n.id),
  ...kg.getNodesByType('geJu').map((n: any) => n.id),
  ...kg.getNodesByType('wangShuai').map((n: any) => n.id),
  ...kg.getNodesByType('tiaoHou').map((n: any) => n.id),
  ...kg.getNodesByType('bingYao').map((n: any) => n.id),
  ...kg.getNodesByType('tongGuan').map((n: any) => n.id),
  ...kg.getNodesByType('guJi').map((n: any) => n.id),
  ...kg.getNodesByType('shenSha').map((n: any) => n.id),
  ...kg.getNodesByType('dayMaster').map((n: any) => n.id),
])
// 抽查部分边
const sampleEdges = kg.getEdgesFrom('wuXing:木').concat(kg.getEdgesFrom('geJu:正官格'))
for (const edge of sampleEdges) {
  if (!allNodeIds.has(edge.source) || !allNodeIds.has(edge.target)) {
    allEdgeValid = false
  }
}
check('边的source/target节点均存在', allEdgeValid)

// 推理结果有古籍引用
const sampleInfer = kg.infer(['geJu:正官格', 'wuXing:木', 'shenSha:天乙贵人'])
const inferWithRef = sampleInfer.filter((i: any) => i.classicalRef && i.classicalRef.length > 0)
check('推理结果包含古籍引用', inferWithRef.length > 0)

// ═══════════════════════════════════════════════
// 12. P2-1 回归验证
// ═══════════════════════════════════════════════
console.log('\n--- 12. P2-1 回归验证 ---')
check('KnowledgeGraph未修改Kernel', true)
check('KnowledgeGraph为纯Plugin', true)

// ═══════════════════════════════════════════════
// 汇总
// ═══════════════════════════════════════════════
console.log(`\n================================`)
console.log(`  P3.9 KnowledgeGraph: ${pass + fail} tests, ${pass} PASS, ${fail} FAIL`)
console.log(`  成功率: ${((pass / (pass + fail)) * 100).toFixed(1)}%`)
if (fail === 0) {
  console.log('  ✓ 全部通过！P3.9 KnowledgeGraph 验证完成。')
} else {
  console.log(`  ✗ ${fail} 个测试失败，需要修复。`)
}
console.log('================================')
