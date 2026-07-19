/**
 * 四柱详解引擎
 * 对年柱、月柱、日柱、时柱分别进行七个维度的深度分析：
 * 1. 含义 2. 天干作用 3. 地支作用 4. 藏干分析
 * 5. 十神分析 6. 纳音分析 7. 对人生影响
 */

import type {
  BaZiChart,
  FiveElement,
  ShenShi,
  HeavenlyStem,
  EarthlyBranch,
  GanZhi,
  CangGan,
} from './types'
import { getNaYin } from './nayin'
import { getChangSheng } from './changsheng'

// ========== 导出类型 ==========

export interface PillarSectionDetail {
  title: string
  content: string
}

export interface PillarDetail {
  label: string
  gan: string
  zhi: string
  sections: PillarSectionDetail[]
  summary: string
  totalWords: number
}

export interface PillarAnalysisResult {
  year: PillarDetail
  month: PillarDetail
  day: PillarDetail
  hour: PillarDetail
}

// ========== 常量表 ==========

/** 地支六合 */
const LIU_HE: Record<string, string> = {
  '子': '丑', '丑': '子', '寅': '亥', '亥': '寅',
  '卯': '戌', '戌': '卯', '辰': '酉', '酉': '辰',
  '巳': '申', '申': '巳', '午': '未', '未': '午',
}

/** 地支六冲 */
const LIU_CHONG: Record<string, string> = {
  '子': '午', '午': '子', '丑': '未', '未': '丑',
  '寅': '申', '申': '寅', '卯': '酉', '酉': '卯',
  '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳',
}

/** 地支三合局 */
const SAN_HE: Record<string, { group: string[]; element: FiveElement; name: string }> = {
  '申': { group: ['申', '子', '辰'], element: '水', name: '申子辰三合水局' },
  '子': { group: ['申', '子', '辰'], element: '水', name: '申子辰三合水局' },
  '辰': { group: ['申', '子', '辰'], element: '水', name: '申子辰三合水局' },
  '亥': { group: ['亥', '卯', '未'], element: '木', name: '亥卯未三合木局' },
  '卯': { group: ['亥', '卯', '未'], element: '木', name: '亥卯未三合木局' },
  '未': { group: ['亥', '卯', '未'], element: '木', name: '亥卯未三合木局' },
  '寅': { group: ['寅', '午', '戌'], element: '火', name: '寅午戌三合火局' },
  '午': { group: ['寅', '午', '戌'], element: '火', name: '寅午戌三合火局' },
  '戌': { group: ['寅', '午', '戌'], element: '火', name: '寅午戌三合火局' },
  '巳': { group: ['巳', '酉', '丑'], element: '金', name: '巳酉丑三合金局' },
  '酉': { group: ['巳', '酉', '丑'], element: '金', name: '巳酉丑三合金局' },
  '丑': { group: ['巳', '酉', '丑'], element: '金', name: '巳酉丑三合金局' },
}

/** 地支三会局 */
const SAN_HUI: Record<string, { group: string[]; element: FiveElement; name: string }> = {
  '寅': { group: ['寅', '卯', '辰'], element: '木', name: '寅卯辰三会东方木局' },
  '卯': { group: ['寅', '卯', '辰'], element: '木', name: '寅卯辰三会东方木局' },
  '辰': { group: ['寅', '卯', '辰'], element: '木', name: '寅卯辰三会东方木局' },
  '巳': { group: ['巳', '午', '未'], element: '火', name: '巳午未三会南方火局' },
  '午': { group: ['巳', '午', '未'], element: '火', name: '巳午未三会南方火局' },
  '未': { group: ['巳', '午', '未'], element: '火', name: '巳午未三会南方火局' },
  '申': { group: ['申', '酉', '戌'], element: '金', name: '申酉戌三会西方金局' },
  '酉': { group: ['申', '酉', '戌'], element: '金', name: '申酉戌三会西方金局' },
  '戌': { group: ['申', '酉', '戌'], element: '金', name: '申酉戌三会西方金局' },
  '亥': { group: ['亥', '子', '丑'], element: '水', name: '亥子丑三会北方水局' },
  '子': { group: ['亥', '子', '丑'], element: '水', name: '亥子丑三会北方水局' },
  '丑': { group: ['亥', '子', '丑'], element: '水', name: '亥子丑三会北方水局' },
}

/** 地支相刑 */
const DI_ZHI_XING: Record<string, string[]> = {
  '寅': ['巳'], '巳': ['申', '寅'], '申': ['寅'],
  '丑': ['戌'], '戌': ['丑', '未'], '未': ['丑'],
  '子': ['卯'], '卯': ['子'],
  '辰': ['辰'], '午': ['午'], '酉': ['酉'], '亥': ['亥'],
}

/** 地支相害 */
const DI_ZHI_HAI: Record<string, string> = {
  '子': '未', '未': '子', '丑': '午', '午': '丑',
  '寅': '巳', '巳': '寅', '卯': '辰', '辰': '卯',
  '申': '亥', '亥': '申', '酉': '戌', '戌': '酉',
}

/** 天干五合 */
const TIAN_GAN_HE: Record<string, { target: string; element: FiveElement }> = {
  '甲': { target: '己', element: '土' },
  '己': { target: '甲', element: '土' },
  '乙': { target: '庚', element: '金' },
  '庚': { target: '乙', element: '金' },
  '丙': { target: '辛', element: '水' },
  '辛': { target: '丙', element: '水' },
  '丁': { target: '壬', element: '木' },
  '壬': { target: '丁', element: '木' },
  '戊': { target: '癸', element: '火' },
  '癸': { target: '戊', element: '火' },
}

/** 天干相冲 */
const TIAN_GAN_CHONG: Record<string, string> = {
  '甲': '庚', '庚': '甲', '乙': '辛', '辛': '乙',
  '丙': '壬', '壬': '丙', '丁': '癸', '癸': '丁',
}

/** 天干五行 */
const GAN_ELEMENT: Record<HeavenlyStem, FiveElement> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
}

/** 地支五行 */
const ZHI_ELEMENT: Record<EarthlyBranch, FiveElement> = {
  '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火',
  '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
  '子': '水', '丑': '土',
}

/** 五行生克 */
const GENERATE: Record<FiveElement, FiveElement> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
}
const OVERCOME: Record<FiveElement, FiveElement> = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木',
}

/** 五行方位 */
const ELEMENT_DIR: Record<FiveElement, string> = {
  '木': '东方', '火': '南方', '土': '中央', '金': '西方', '水': '北方',
}

/** 五行颜色 */
const ELEMENT_COLOR: Record<FiveElement, string> = {
  '木': '青绿色', '火': '赤红色', '土': '黄褐色', '金': '白色', '水': '黑色',
}

/** 五行季节 */
const ELEMENT_SEASON: Record<FiveElement, string> = {
  '木': '春季', '火': '夏季', '土': '四季之交', '金': '秋季', '水': '冬季',
}

/** 纳音象征意义 */
const NAYIN_SYMBOLISM: Record<string, string> = {
  '海中金': '沉于海底之金，深藏不露，需待时机方可显露光芒，象征内涵深厚之人',
  '炉中火': '冶炼之火，可锻造万物，象征经得起考验、百炼成钢之人',
  '大林木': '参天古木，枝繁叶茂，根基深厚，象征稳固可靠、庇荫他人之人',
  '路旁土': '道路两旁之土，平凡但不可或缺，象征踏实肯干、默默奉献之人',
  '剑锋金': '宝剑之锋，锐利无比，象征才华出众、锋芒毕露之人',
  '山头火': '山顶之火，照耀四方，象征光芒万丈、远见卓识之人',
  '涧下水': '山涧流水，清澈见底，象征纯净通透、智慧明达之人',
  '城头土': '城墙之土，坚不可摧，象征意志坚定、守卫正义之人',
  '白蜡金': '蜡烛之光金，微弱但持久，象征默默付出、坚持不懈之人',
  '杨柳木': '岸柳飘摇，柔韧不折，象征善于变通、适应力强之人',
  '泉中水': '泉水涌出，清冽甘甜，象征才华初露、生机勃发之人',
  '屋上土': '屋顶之土，遮风挡雨，象征顾全大局、保护家人之人',
  '霹雳火': '雷电之火，惊天动地，象征突发奇想、一鸣惊人之人',
  '松柏木': '岁寒松柏，四季常青，象征坚韧不拔、品格高洁之人',
  '长流水': '源远流长，奔流不息，象征生命力旺盛、持之以恒之人',
  '沙中金': '沙中淘金，珍贵难得，象征经历磨砺方显价值之人',
  '山下火': '山下灯火，温暖有限，象征默默温暖他人、不求回报之人',
  '平地木': '平地之木，随处可见，象征平易近人、普普通通却有根基之人',
  '壁上土': '墙壁之土，分隔空间，象征有界限感、有原则之人',
  '金箔金': '薄金箔片，华丽外表，象征外表光鲜、内心需充实之人',
  '覆灯火': '灯盏之火，照亮黑暗，象征给人以方向、指引他人之人',
  '天河水': '天上银河，浩瀚无际，象征胸怀宽广、格局宏大之人',
  '大驿土': '驿站之土，四通八达，象征善于交际、人脉广泛之人',
  '钗钏金': '首饰之金，精致典雅，象征品味高雅、注重细节之人',
  '桑柘木': '桑蚕之木，养蚕织丝，象征勤劳致富、造福他人之人',
  '大溪水': '溪流之水，欢快奔涌，象征活泼开朗、生命力旺盛之人',
  '沙中土': '沙地之土，松散不固，象征自由奔放、不受拘束之人',
  '天上火': '日月之火，普照大地，象征光明磊落、胸怀天下之人',
  '石榴木': '石榴之木，硕果累累，象征多子多福、丰收富足之人',
  '大海水': '大海之水，深沉广阔，象征胸襟辽阔、包容万物之人',
}

// ========== 辅助函数 ==========

function isYangStem(gan: HeavenlyStem): boolean {
  return '甲丙戊庚壬'.includes(gan)
}

/** 获取十神关系描述 */
function getShenShiRelation(dayGan: HeavenlyStem, targetGan: HeavenlyStem): ShenShi {
  const dayElement = GAN_ELEMENT[dayGan]
  const dayYY = isYangStem(dayGan) ? '阳' : '阴'
  const targetElement = GAN_ELEMENT[targetGan]
  const targetYY = isYangStem(targetGan) ? '阳' : '阴'

  if (dayElement === targetElement) {
    return dayYY === targetYY ? '比肩' : '劫财'
  }
  if (GENERATE[dayElement] === targetElement) {
    return dayYY === targetYY ? '食神' : '伤官'
  }
  if (OVERCOME[dayElement] === targetElement) {
    return dayYY === targetYY ? '偏财' : '正财'
  }
  for (const [k, v] of Object.entries(OVERCOME)) {
    if (v === dayElement && k === targetElement) {
      return dayYY === targetYY ? '偏官' : '正官'
    }
  }
  for (const [k, v] of Object.entries(GENERATE)) {
    if (v === dayElement && k === targetElement) {
      return dayYY === targetYY ? '偏印' : '正印'
    }
  }
  return '比肩'
}

/** 获取十神对日主的影响描述 */
function getShenShiImpact(shenShi: ShenShi): string {
  const impacts: Record<ShenShi, string> = {
    '比肩': '比肩帮身，增强日主力量，主人独立自主，但过旺则竞争争财',
    '劫财': '劫财夺财，增强日主力量但易耗财，主人交际广泛，花钱大方',
    '食神': '食神泄秀，泄日主之气而生财，主人才华出众，温和宽厚',
    '伤官': '伤官泄秀，泄日主之气极盛，主人聪明绝顶，但易傲慢叛逆',
    '偏财': '偏财旺相，财源充沛但易外泄，主人商业头脑发达，善于投资',
    '正财': '正财稳健，财源稳定，主人踏实肯干，理财有方，家庭责任感强',
    '偏官': '偏官制身，给日主压力但也锻炼能力，主人有魄力有领导力',
    '正官': '正官约身，约束日主但不失正气，主人品行端正，适合管理',
    '偏印': '偏印生身，生扶日主但有时过度保护，主人思维独特，直觉敏锐',
    '正印': '正印护身，生扶日主且温和有力，主人学识渊博，贵人运旺',
  }
  return impacts[shenShi] || ''
}

/** 获取天干与日主的五行关系描述 */
function getGanRelationDesc(dayGan: HeavenlyStem, targetGan: HeavenlyStem): string {
  const dayEl = GAN_ELEMENT[dayGan]
  const targetEl = GAN_ELEMENT[targetGan]
  if (dayEl === targetEl) return '与日元同属' + dayEl + '，同类帮身'
  if (GENERATE[dayEl] === targetEl) return dayEl + '生' + targetEl + '，日元生此干，为泄气'
  if (GENERATE[targetEl] === dayEl) return targetEl + '生' + dayEl + '，此干生日元，为生扶'
  if (OVERCOME[dayEl] === targetEl) return dayEl + '克' + targetEl + '，日元克此干，为耗力但主得财'
  if (OVERCOME[targetEl] === dayEl) return targetEl + '克' + dayEl + '，此干克日元，为制约'
  return '五行关系平和'
}

/** 确定性选择 */
function pickBySeed<T>(arr: T[], seed: string): T {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0
  }
  return arr[Math.abs(hash) % arr.length]
}

/** 获取柱中地支与其他三支的关系 */
function getZhiRelations(zhi: EarthlyBranch, allZhis: EarthlyBranch[]): string {
  const parts: string[] = []
  const otherZhis = allZhis.filter(z => z !== zhi)
  for (const otherZhi of otherZhis) {
    if (LIU_HE[zhi] === otherZhi) {
      parts.push(zhi + otherZhi + '六合，主合来合往，关系亲密')
    }
    if (LIU_CHONG[zhi] === otherZhi) {
      parts.push(zhi + otherZhi + '相冲，主冲动变化，不稳之象')
    }
    if (SAN_HE[zhi] && SAN_HE[zhi].group.includes(otherZhi)) {
      parts.push(zhi + '与' + otherZhi + '三合，主合力互助，可增强力量')
    }
    if (SAN_HUI[zhi] && SAN_HUI[zhi].group.includes(otherZhi)) {
      parts.push(zhi + '与' + otherZhi + '三会，主会合成局，力量极大')
    }
    if (DI_ZHI_XING[zhi]?.includes(otherZhi)) {
      parts.push(zhi + otherZhi + '相刑，主刑伤折磨，需防口舌是非')
    }
    if (DI_ZHI_HAI[zhi] === otherZhi) {
      parts.push(zhi + otherZhi + '相害，主暗中损害，需防小人')
    }
  }
  return parts.length > 0 ? parts.join('\uFF1B') : zhi + '与其他地支无特殊关系，关系平和'
}

/** 获取天干与其他天干的关系 */
function getGanRelations(gan: HeavenlyStem, allGans: HeavenlyStem[]): string {
  const parts: string[] = []
  const otherGans = allGans.filter(g => g !== gan)
  for (const otherGan of otherGans) {
    if (TIAN_GAN_HE[gan]?.target === otherGan) {
      parts.push(gan + otherGan + '五合，化' + TIAN_GAN_HE[gan].element + '，主合化有情')
    }
    if (TIAN_GAN_CHONG[gan] === otherGan) {
      parts.push(gan + otherGan + '相冲，主冲动竞争')
    }
  }
  return parts.length > 0 ? parts.join('\uFF1B') : gan + '与其他天干无特殊合冲关系'
}

/** 获取天干与日主之间的多层五行关系描述 */
function getGanDayRelation(dayGan: HeavenlyStem, gan: HeavenlyStem, ganElement: FiveElement, dayElement: FiveElement): string {
  if (ganElement === dayElement) {
    return '与日主同气，祖辈与命主缘分深厚，早年得祖荫庇护。'
  }
  if (ganElement === GENERATE[dayElement]) {
    return '生日主，祖辈有恩于命主，早年环境温暖。'
  }
  if (GENERATE[ganElement] === dayElement) {
    return '泄日主，早年家庭虽有但付出较多。'
  }
  if (OVERCOME[ganElement] === dayElement) {
    return '克日主，早年家庭管束较严，或有压力。'
  }
  return '为日主所克，早年家庭需命主付出，反哺之情重。'
}

/** 获取纳音五行属性文字 */
function getNaYinElementStr(naYin: string): string {
  if (naYin.includes('\u91D1')) return '\u5C5E\u91D1'
  if (naYin.includes('\u6728')) return '\u5C5E\u6728'
  if (naYin.includes('\u6C34')) return '\u5C5E\u6C34'
  if (naYin.includes('\u706B')) return '\u5C5E\u706B'
  return '\u5C5E\u571F'
}

/** 获取纳音特质描述 */
function getNaYinTraitStr(naYin: string): string {
  if (naYin.includes('\u91D1')) return '\u575A\u6BC5\u679C\u51B3\u3001\u91CD\u4E49\u6C14'
  if (naYin.includes('\u6728')) return '\u751F\u673A\u52C3\u52C3\u3001\u5411\u4E0A\u53D1\u5C55'
  if (naYin.includes('\u6C34')) return '\u806A\u660E\u7075\u6D3B\u3001\u9002\u5E94\u529B\u5F3A'
  if (naYin.includes('\u706B')) return '\u70ED\u60C5\u5F00\u6717\u3001\u5149\u660E\u78CA\u843D'
  return '\u7A33\u91CD\u8E0F\u5B9E\u3001\u5305\u5BB9\u5927\u5EA6'
}

/** 获取十神在某柱的位置描述 */
function getShenShiPillarDesc(shenShi: ShenShi, pillar: string): string {
  if (shenShi.includes('\u5370')) {
    return '\u5370\u661F\u5728' + pillar + '\uFF0C\u4E3B' + pillar + '\u65F6\u671F\u5F97\u957F\u8F88\u5E87\u62A4\uFF0C\u8D35\u4EBA\u591A\u52A9\u3002'
  }
  if (shenShi.includes('\u8D22')) {
    return '\u8D22\u661F\u5728' + pillar + '\uFF0C\u4E3B' + pillar + '\u65F6\u671F\u8D22\u8FD0\u6D3B\u8DC3\uFF0C\u7ECF\u6D4E\u5BBD\u88D5\u3002'
  }
  if (shenShi.includes('\u5B98') || shenShi.includes('\u6740')) {
    return '\u5B98\u6740\u5728' + pillar + '\uFF0C\u4E3B' + pillar + '\u65F6\u671F\u4E8B\u4E1A\u5FC3\u5F3A\uFF0C\u6709\u7BA1\u7406\u4E4B\u6743\u3002'
  }
  if (shenShi.includes('\u98DF') || shenShi.includes('\u4F24')) {
    return '\u98DF\u4F24\u5728' + pillar + '\uFF0C\u4E3B' + pillar + '\u65F6\u671F\u624D\u534E\u6A2A\u6EA2\uFF0C\u9002\u5408\u521B\u610F\u5DE5\u4F5C\u3002'
  }
  return '\u6BD4\u52AB\u5728' + pillar + '\uFF0C\u4E3B' + pillar + '\u65F6\u671F\u793E\u4EA4\u6D3B\u8DC3\uFF0C\u72EC\u7ACB\u6027\u5F3A\u3002'
}

/** 获取日支十神对婚姻的影响 */
function getDayZhiShenShiMarriage(ss: ShenShi): string {
  if (ss.includes('\u8D22')) return '\u8D22\u661F\u5750\u592B\u59BB\u5BAB\uFF0C\u914D\u5076\u5584\u4E8E\u7406\u8D22\uFF0C\u5BB6\u5EAD\u7ECF\u6D4E\u6761\u4EF6\u597D\u3002'
  if (ss.includes('\u5B98') || ss.includes('\u6740')) return '\u5B98\u6740\u5750\u592B\u59BB\u5BAB\uFF0C\u914D\u5076\u6709\u5A01\u4E25\uFF0C\u4E8B\u4E1A\u6709\u6210\uFF0C\u4F46\u5A5A\u59FB\u4E2D\u6709\u538B\u529B\u3002'
  if (ss.includes('\u5370')) return '\u5370\u661F\u5750\u592B\u59BB\u5BAB\uFF0C\u914D\u5076\u6E29\u539A\u6148\u7231\uFF0C\u5BB6\u5EAD\u548C\u7766\uFF0C\u5F97\u914D\u5076\u52A9\u529B\u3002'
  if (ss.includes('\u98DF') || ss.includes('\u4F24')) return '\u98DF\u4F24\u5750\u592B\u59BB\u5BAB\uFF0C\u914D\u5076\u6709\u624D\u534E\uFF0C\u6D6A\u6F2B\u591A\u60C5\uFF0C\u4F46\u9700\u9632\u611F\u60C5\u6CE2\u52A8\u3002'
  return '\u6BD4\u52AB\u5750\u592B\u59BB\u5BAB\uFF0C\u914D\u5076\u6027\u683C\u72EC\u7ACB\uFF0C\u5A5A\u59FB\u4E2D\u6709\u7ADE\u4E89\u6027\u3002'
}

/** 获取十二长生阶段描述 */
function getChangShengLevelDesc(cs: string): string {
  const WANG: string[] = ['\u957F\u751F', '\u6C90\u6D74', '\u51A0\u5E26', '\u4E34\u5B98', '\u5E1D\u65FA']
  const SHUAI: string[] = ['\u8870', '\u75C5', '\u6B7B', '\u5893', '\u7EDD']
  if (WANG.includes(cs)) return '\u5904\u4E8E\u65FA\u76DB\u4E4B\u5730'
  if (SHUAI.includes(cs)) return '\u5904\u4E8E\u8870\u5F31\u4E4B\u5730'
  return '\u5904\u4E8E\u5E73\u7F13\u4E4B\u5730'
}

// ========== 年柱分析 ==========

function analyzeYearPillar(chart: BaZiChart): PillarDetail {
  const gan = chart.sixLines.year.gan
  const zhi = chart.sixLines.year.zhi
  const dayGan = chart.sixLines.day.gan
  const dayElement = chart.dayMaster.dayGanElement
  const naYin = getNaYin(gan, zhi)
  const ganElement = GAN_ELEMENT[gan]
  const zhiElement = ZHI_ELEMENT[zhi]
  const cangGan = chart.cangGan[zhi] as CangGan
  const allGans = [chart.sixLines.year.gan, chart.sixLines.month.gan, chart.sixLines.day.gan, chart.sixLines.hour.gan]
  const allZhis = [chart.sixLines.year.zhi, chart.sixLines.month.zhi, chart.sixLines.day.zhi, chart.sixLines.hour.zhi]
  const shenShi = getShenShiRelation(dayGan, gan)

  const sections: PillarSectionDetail[] = []

  // 1. 含义
  const relation1 = getGanDayRelation(dayGan, gan, ganElement, dayElement)
  const meaning1 = '\u5E74\u67F1' + gan + zhi + '\uFF0C\u7EB3\u97F3' + naYin + '\uFF0C\u4E3B\u7BA1\u547D\u4E3B\u4E00\u81F3\u5341\u4E94\u5C81\u5C11\u5E74\u8FD0\u7A0B\uFF0C\u4EA6\u4EE3\u8868\u7956\u8F88\u6839\u57FA\u3001\u5BB6\u65CF\u80CC\u666F\u4E0E\u65E9\u5E74\u73AF\u5883\u3002\u5E74\u67F1\u4E3A\u547D\u5C40\u4E4B\u6839\uFF0C\u5982\u6811\u4E4B\u6839\u57FA\uFF0C\u6839\u57FA\u6DF1\u5219\u679D\u53F6\u7E41\u8302\u3002\u5E74\u67F1' + ganElement + relation1
  const meaning2 = '\u89C2\u5E74\u67F1' + gan + zhi + naYin + '\uFF0C\u6B64\u4E3A\u547D\u4E3B\u5C11\u5E74\u8FD0\u5BAB\uFF0C\u7BA1\u4E00\u81F3\u5341\u4E94\u5C81\u4E4B\u8FD0\u7A0B\u3002\u5E74\u67F1\u4EA6\u4E3A\u7956\u8F88\u5BAB\uFF0C\u4EE3\u8868\u5BB6\u65CF\u6839\u57FA\u4E0E\u9057\u4F20\u4FE1\u606F\u3002\u5E74\u67F1' + ganElement + zhiElement + '\uFF0C' + relation1
  sections.push({
    title: '\u542B\u4E49',
    content: pickBySeed([meaning1, meaning2], gan + zhi + 'meaning'),
  })

  // 2. 天干作用
  const ganContent = '\u5E74\u5E72' + gan + '\u5C5E' + ganElement + '\uFF0C' + getGanRelationDesc(dayGan, gan) + '\u3002'
  const ganDetail = gan === dayGan
    ? '\u5E74\u5E72\u5373\u4E3A\u65E5\u4E3B\u672C\u8EAB\uFF0C\u6B64\u4E3A\u5E74\u5E72\u900F\u65E5\u4E3B\uFF0C\u4E3B\u5C11\u5E74\u65F6\u671F\u81EA\u8EAB\u8868\u73B0\u7A81\u51FA\u3002'
    : '\u5BF9\u65E5\u4E3B\u4E3A' + shenShi + '\uFF0C' + getShenShiImpact(shenShi) + '\u3002' + getGanRelations(gan, allGans)
  sections.push({
    title: '\u5929\u5E72\u4F5C\u7528',
    content: ganContent + ganDetail,
  })

  // 3. 地支作用
  const zhiContent = '\u5E74\u652F' + zhi + '\u5C5E' + zhiElement + '\uFF0C\u4E3A\u65E5\u4E3B\u5E74\u67F1\u4E4B\u6839\u57FA\u3002'
  const zhiExtra = zhi === chart.sixLines.month.zhi
    ? '\u5E74\u652F\u6708\u652F\u76F8\u540C\uFF0C\u4E3B\u5C11\u5E74\u5BB6\u5EAD\u73AF\u5883\u96C6\u4E2D\u4E8E\u6B64\u4E94\u884C\u3002'
    : zhi === chart.sixLines.day.zhi
      ? '\u5E74\u652F\u4E0E\u65E5\u652F\u76F8\u540C\uFF0C\u4E3B\u5BB6\u5EAD\u4E0E\u81EA\u8EAB\u5BAB\u4F4D\u540C\u6C14\uFF0C\u6839\u57FA\u4E0E\u81EA\u8EAB\u5173\u7CFB\u5BC6\u5207\u3002'
      : ''
  sections.push({
    title: '\u5730\u652F\u4F5C\u7528',
    content: zhiContent + zhiExtra + getZhiRelations(zhi, allZhis),
  })

  // 4. 藏干分析
  const cangParts: string[] = []
  cangParts.push('\u5E74\u652F' + zhi + '\u85CF\u5E72\uFF1A\u672C\u6C14' + cangGan.ben + '\u5C5E' + GAN_ELEMENT[cangGan.ben] + '\uFF0C\u4E3A' + zhi + '\u4E4B\u4E3B\u6C14')
  if (cangGan.zhong) {
    cangParts.push('\u4E2D\u6C14' + cangGan.zhong + '\u5C5E' + GAN_ELEMENT[cangGan.zhong])
  }
  if (cangGan.yao) {
    cangParts.push('\u4F59\u6C14' + cangGan.yao + '\u5C5E' + GAN_ELEMENT[cangGan.yao])
  }
  cangParts.push('\u672C\u6C14' + cangGan.ben + '\u5BF9\u65E5\u4E3B\u4E3A' + getShenShiRelation(dayGan, cangGan.ben) + '\uFF0C\u529B\u91CF\u6700\u5F3A')
  if (cangGan.zhong) {
    cangParts.push('\u4E2D\u6C14' + cangGan.zhong + '\u4E3A' + getShenShiRelation(dayGan, cangGan.zhong) + '\uFF0C\u8F85\u52A9\u672C\u6C14\u53D1\u6325\u4F5C\u7528')
  }
  if (cangGan.yao) {
    cangParts.push('\u4F59\u6C14' + cangGan.yao + '\u4E3A' + getShenShiRelation(dayGan, cangGan.yao) + '\uFF0C\u529B\u91CF\u5FAE\u5F31\u4F46\u4E0D\u53EF\u5FFD\u89C6')
  }
  sections.push({
    title: '\u85CF\u5E72\u5206\u6790',
    content: cangParts.join('\uFF1B') + '\u3002',
  })

  // 5. 十神分析
  const shenContent = '\u5E74\u5E72' + gan + '\u5BF9\u65E5\u4E3B' + dayGan + '\u4E3A' + shenShi + '\uFF0C'
  const shenDetail = shenShi.includes('\u5370')
    ? '\u5370\u661F\u5728\u5E74\u67F1\uFF0C\u4E3B\u7956\u4E0A\u6709\u5FB7\uFF0C\u5C11\u5E74\u65F6\u671F\u5F97\u957F\u8F88\u5E87\u62A4\uFF0C\u5B66\u4E1A\u8FD0\u4F73\u3002'
    : shenShi.includes('\u8D22')
      ? '\u8D22\u661F\u5728\u5E74\u67F1\uFF0C\u4E3B\u7956\u4E0A\u7ECF\u6D4E\u6761\u4EF6\u5C1A\u53EF\uFF0C\u5C11\u5E74\u65F6\u671F\u7269\u8D28\u751F\u6D3B\u8F83\u597D\u3002'
      : shenShi.includes('\u5B98') || shenShi.includes('\u6740')
        ? '\u5B98\u6740\u5728\u5E74\u67F1\uFF0C\u4E3B\u7956\u4E0A\u6709\u5A01\u671B\u6216\u5B98\u804C\uFF0C\u4F46\u5C11\u5E74\u65F6\u671F\u7BA1\u675F\u8F83\u4E25\u3002'
        : shenShi.includes('\u98DF') || shenShi.includes('\u4F24')
          ? '\u98DF\u4F24\u5728\u5E74\u67F1\uFF0C\u4E3B\u7956\u4E0A\u6709\u624D\u534E\uFF0C\u547D\u4E3B\u5C11\u5E74\u65F6\u671F\u806A\u660E\u6D3B\u6CFC\u3002'
          : '\u6BD4\u52AB\u5728\u5E74\u67F1\uFF0C\u4E3B\u7956\u4E0A\u4E0E\u4EBA\u5408\u4F19\u7ECF\u8425\uFF0C\u5C11\u5E74\u65F6\u671F\u72EC\u7ACB\u6027\u5F3A\u3002'
  sections.push({
    title: '\u5341\u795E\u5206\u6790',
    content: shenContent + shenDetail + '\u5E74\u652F\u672C\u6C14' + cangGan.ben + '\u4E3A' + getShenShiRelation(dayGan, cangGan.ben) + '\uFF0C' + getShenShiImpact(getShenShiRelation(dayGan, cangGan.ben)),
  })

  // 6. 纳音分析
  const nayinSymbol = NAYIN_SYMBOLISM[naYin] || '\u6B64\u7EB3\u97F3\u8C61\u5F81\u7279\u6B8A\u547D\u683C\uFF0C\u9700\u7ED3\u5408\u5168\u5C40\u8BBA\u65AD\u3002'
  const nayinElemStr = getNaYinElementStr(naYin)
  const nayinTraitStr = getNaYinTraitStr(naYin)
  sections.push({
    title: '\u7EB3\u97F3\u5206\u6790',
    content: '\u5E74\u67F1' + gan + zhi + '\u7EB3\u97F3' + naYin + '\uFF0C' + nayinSymbol + '\u7EB3\u97F3' + nayinElemStr + '\uFF0C\u4E0E\u5E74\u67F1' + ganElement + '\u4E94\u884C\u4E0D\u540C\u8BBA\uFF0C\u4E43\u53E4\u6CD5\u4E4B\u79D8\u3002\u7EB3\u97F3\u8BBA\u547D\u4EE5\u5E74\u67F1\u4E3A\u51C6\uFF0C' + naYin + '\u4E4B\u4EBA\u5148\u5929\u5E26\u6709' + nayinTraitStr + '\u4E4B\u7279\u8D28\u3002',
  })

  // 7. 对人生影响
  const impact = ganElement === dayElement
    ? '\u4E0E\u65E5\u4E3B\u540C\u6C14\uFF0C\u5148\u5929\u6839\u57FA\u6DF1\u539A\uFF0C\u4E00\u751F\u5F97\u7956\u8F88\u52A9\u529B\u3002'
    : ganElement === GENERATE[dayElement]
      ? '\u5370\u661F\u4E4B\u6C14\u5E87\u62A4\u547D\u4E3B\uFF0C\u4E00\u751F\u8D35\u4EBA\u8FD0\u65FA\uFF0C\u5B66\u4E1A\u4E8B\u4E1A\u7686\u5F97\u52A9\u529B\u3002'
      : GENERATE[ganElement] === dayElement
        ? '\u6CC4\u79C0\u4E4B\u6C14\uFF0C\u5C11\u5E74\u65F6\u671F\u5373\u663E\u624D\u534E\uFF0C\u4F46\u9700\u6CE8\u610F\u8EAB\u4F53\u5065\u5EB7\u3002'
        : OVERCOME[ganElement] === dayElement
          ? '\u5B98\u6740\u4E4B\u6C14\u5236\u7EA6\u547D\u4E3B\uFF0C\u5C11\u5E74\u65F6\u671F\u538B\u529B\u8F83\u5927\uFF0C\u4F46\u9006\u5883\u51FA\u4EBA\u624D\u3002'
          : '\u8D22\u661F\u4E4B\u6C14\u6ECB\u517B\u547D\u4E3B\uFF0C\u5148\u5929\u8D22\u8FD0\u6839\u57FA\u597D\uFF0C\u4F46\u9700\u9632\u56E0\u8D22\u60F9\u7978\u3002'
  sections.push({
    title: '\u5BF9\u4EBA\u751F\u5F71\u54CD',
    content: '\u5E74\u67F1' + gan + zhi + naYin + '\uFF0C' + impact + '\u65E9\u5E74\u8FD0\u52BF\u4EE5\u5E74\u67F1\u4E3A\u4E3B\uFF0C\u4E00\u81F3\u5341\u4E94\u5C81\u671F\u95F4\u5BB6\u5EAD\u73AF\u5883\u3001\u7956\u8F88\u72B6\u51B5\u3001\u5E7C\u5E74\u6559\u80B2\u7B49\u7686\u53D7\u6B64\u67F1\u5F71\u54CD\u3002',
  })

  // summary
  const summary = '\u5E74\u67F1' + gan + zhi + naYin + '\uFF0C' + ganElement + zhiElement + '\uFF0C\u5BF9\u65E5\u4E3B\u4E3A' + shenShi + '\u3002\u7BA1\u4E00\u81F3\u5341\u4E94\u5C81\u5C11\u5E74\u8FD0\u7A0B\uFF0C\u4EE3\u8868\u7956\u8F88\u6839\u57FA\u4E0E\u5BB6\u65CF\u80CC\u666F\u3002\u85CF\u5E72' + cangGan.ben + (cangGan.zhong ? '\u3001' + cangGan.zhong : '') + (cangGan.yao ? '\u3001' + cangGan.yao : '') + '\uFF0C\u672C\u6C14\u529B\u91CF\u6700\u5F3A\u3002\u7EB3\u97F3' + naYin + '\uFF0C' + (NAYIN_SYMBOLISM[naYin] || '').slice(0, 20) + '\u3002' + getZhiRelations(zhi, allZhis).split('\uFF1B')[0] + '\u3002\u7EFC\u5408\u8BBA\u4E4B\uFF0C\u5E74\u67F1\u4E3A\u547D\u5C40\u6839\u57FA\uFF0C\u6839\u57FA\u7A33\u56FA\u5219\u4E00\u751F\u5B89\u5EB7\u3002'

  const totalWords = sections.reduce((sum, s) => sum + s.content.length, 0) + summary.length
  return { label: '\u5E74\u67F1', gan, zhi, sections, summary, totalWords }
}

// ========== 月柱分析 ==========

function analyzeMonthPillar(chart: BaZiChart): PillarDetail {
  const gan = chart.sixLines.month.gan
  const zhi = chart.sixLines.month.zhi
  const dayGan = chart.sixLines.day.gan
  const dayElement = chart.dayMaster.dayGanElement
  const naYin = getNaYin(gan, zhi)
  const ganElement = GAN_ELEMENT[gan]
  const zhiElement = ZHI_ELEMENT[zhi]
  const cangGan = chart.cangGan[zhi] as CangGan
  const allGans = [chart.sixLines.year.gan, chart.sixLines.month.gan, chart.sixLines.day.gan, chart.sixLines.hour.gan]
  const allZhis = [chart.sixLines.year.zhi, chart.sixLines.month.zhi, chart.sixLines.day.zhi, chart.sixLines.hour.zhi]
  const shenShi = getShenShiRelation(dayGan, gan)
  const changSheng = getChangSheng(dayGan, zhi)

  const sections: PillarSectionDetail[] = []

  // 1. 含义
  const csDesc = changSheng === '\u5E1D\u65FA' || changSheng === '\u4E34\u5B98'
    ? '\u65E5\u4E3B\u5728' + changSheng + '\u4E4B\u5730\uFF0C\u5F97\u65F6\u4EE4\u4E4B\u52A9\uFF0C\u547D\u4E3B' + dayElement + '\u6C14\u65FA\u76DB\u3002'
    : changSheng === '\u957F\u751F' || changSheng === '\u51A0\u5E26'
      ? '\u65E5\u4E3B\u5728' + changSheng + '\u4E4B\u5730\uFF0C\u6B63\u5728\u6210\u957F\uFF0C\u524D\u9014\u53EF\u671F\u3002'
      : changSheng === '\u8870' || changSheng === '\u75C5'
        ? '\u65E5\u4E3B\u5728' + changSheng + '\u4E4B\u5730\uFF0C\u6C14\u6570\u6E10\u8870\uFF0C\u9700\u751F\u6276\u3002'
        : '\u65E5\u4E3B\u5728' + changSheng + '\u4E4B\u5730\uFF0C\u6C14\u8FD0\u5E73\u548C\u3002'
  const meaning1 = '\u6708\u67F1' + gan + zhi + '\uFF0C\u7EB3\u97F3' + naYin + '\uFF0C\u4E3B\u7BA1\u547D\u4E3B\u5341\u516D\u81F3\u4E09\u5341\u5C81\u9752\u5E74\u8FD0\u7A0B\uFF0C\u4EA6\u4EE3\u8868\u7236\u6BCD\u3001\u5144\u5F1F\u3001\u4E8B\u4E1A\u57FA\u7840\u4E0E\u793E\u4F1A\u73AF\u5883\u3002\u6708\u67F1\u4E3A\u547D\u5C40\u4E4B\u82D7\uFF0C\u5982\u6811\u4E4B\u4E3B\u5E72\uFF0C\u51B3\u5B9A\u547D\u4E3B\u9752\u58EE\u5E74\u53D1\u5C55\u65B9\u5411\u3002\u6708\u652F' + zhi + '\u4E3A\u6708\u4EE4\uFF0C' + csDesc
  const meaning2 = '\u89C2\u6708\u67F1' + gan + zhi + naYin + '\uFF0C\u6B64\u4E3A\u547D\u4E3B\u9752\u5E74\u8FD0\u5BAB\uFF0C\u7BA1\u5341\u516D\u81F3\u4E09\u5341\u5C81\u8FD0\u7A0B\u3002\u6708\u67F1\u4EA6\u4E3A\u7236\u6BCD\u5144\u5F1F\u5BAB\uFF0C\u4EE3\u8868\u539F\u751F\u5BB6\u5EAD\u4E0E\u6210\u957F\u73AF\u5883\u3002\u6708\u652F' + zhi + '\u4E3A\u6708\u4EE4\u63D0\u7EB2\uFF0C\u662F\u5224\u65AD\u547D\u5C40\u65FA\u8870\u4E4B\u5173\u952E\u3002\u65E5\u4E3B' + dayGan + '\u5728\u6708\u652F' + zhi + '\u9022' + changSheng + '\uFF0C' + csDesc
  sections.push({
    title: '\u542B\u4E49',
    content: pickBySeed([meaning1, meaning2], gan + zhi + 'meaning'),
  })

  // 2. 天干作用
  const ganDesc = '\u6708\u5E72' + gan + '\u5C5E' + ganElement + '\uFF0C' + getGanRelationDesc(dayGan, gan) + '\u3002'
  const ganDetail = gan === dayGan
    ? '\u6708\u5E72\u4E3A\u65E5\u4E3B\u900F\u51FA\uFF0C\u4E3B\u9752\u5E74\u65F6\u671F\u547D\u4E3B\u81EA\u6211\u610F\u8BC6\u6781\u5F3A\uFF0C\u6709\u72EC\u7ACB\u53D1\u5C55\u4E4B\u8C61\u3002'
    : '\u5BF9\u65E5\u4E3B\u4E3A' + shenShi + '\uFF0C' + getShenShiImpact(shenShi) + '\u3002' + getShenShiPillarDesc(shenShi, '\u9752\u5E74\u65F6\u671F') + getGanRelations(gan, allGans)
  sections.push({
    title: '\u5929\u5E72\u4F5C\u7528',
    content: ganDesc + ganDetail,
  })

  // 3. 地支作用
  const csLevel = getChangShengLevelDesc(changSheng)
  sections.push({
    title: '\u5730\u652F\u4F5C\u7528',
    content: '\u6708\u652F' + zhi + '\u5C5E' + zhiElement + '\uFF0C\u4E3A\u547D\u5C40\u6708\u4EE4\u63D0\u7EB2\uFF0C\u638C\u7BA1\u547D\u5C40\u65FA\u8870\u4E4B\u5173\u952E\u3002\u65E5\u4E3B' + dayGan + '\u5728\u6B64\u9022' + changSheng + '\uFF0C' + csLevel + '\uFF0C\u547D\u4E3B\u7CBE\u529B\u5145\u6C9B\uFF0C\u4E8B\u4E1A\u5FC3\u5F3A\u3002' + getZhiRelations(zhi, allZhis),
  })

  // 4. 藏干分析
  const cangParts: string[] = []
  cangParts.push('\u6708\u652F' + zhi + '\u85CF\u5E72\uFF1A\u672C\u6C14' + cangGan.ben + '\u5C5E' + GAN_ELEMENT[cangGan.ben])
  if (cangGan.zhong) cangParts.push('\u4E2D\u6C14' + cangGan.zhong + '\u5C5E' + GAN_ELEMENT[cangGan.zhong])
  if (cangGan.yao) cangParts.push('\u4F59\u6C14' + cangGan.yao + '\u5C5E' + GAN_ELEMENT[cangGan.yao])
  cangParts.push('\u6708\u652F\u672C\u6C14' + cangGan.ben + '\u4E3A' + getShenShiRelation(dayGan, cangGan.ben) + '\uFF0C\u6708\u4EE4\u65FA\u76DB\uFF0C\u672C\u6C14\u529B\u91CF\u6781\u5927\uFF0C\u4E3A\u547D\u5C40\u5173\u952E\u7528\u795E\u6240\u5728\u3002')
  if (cangGan.zhong) {
    cangParts.push('\u4E2D\u6C14' + cangGan.zhong + '\u4E3A' + getShenShiRelation(dayGan, cangGan.zhong) + '\uFF0C\u8F85\u52A9\u672C\u6C14\uFF0C\u6709\u65F6\u53EF\u8F6C\u5316\u4E3A\u4E3B\u6C14')
  }
  sections.push({
    title: '\u85CF\u5E72\u5206\u6790',
    content: cangParts.join('\uFF1B') + '\u3002',
  })

  // 5. 十神分析
  sections.push({
    title: '\u5341\u795E\u5206\u6790',
    content: '\u6708\u5E72' + gan + '\u5BF9\u65E5\u4E3B' + dayGan + '\u4E3A' + shenShi + '\uFF0C' + getShenShiPillarDesc(shenShi, '\u6708\u67F1') + '\u6708\u652F\u672C\u6C14' + cangGan.ben + '\u4E3A' + getShenShiRelation(dayGan, cangGan.ben) + '\uFF0C\u529B\u91CF\u6700\u5F3A\uFF0C\u662F\u5224\u65AD\u6708\u4EE4\u5341\u795E\u4E4B\u5173\u952E\u3002',
  })

  // 6. 纳音分析
  const yearNaYin = getNaYin(chart.sixLines.year.gan, chart.sixLines.year.zhi)
  sections.push({
    title: '\u7EB3\u97F3\u5206\u6790',
    content: '\u6708\u67F1' + gan + zhi + '\u7EB3\u97F3' + naYin + '\uFF0C' + (NAYIN_SYMBOLISM[naYin] || '\u6B64\u7EB3\u97F3\u8C61\u5F81\u9752\u5E74\u65F6\u671F\u7684\u8FD0\u52BF\u7279\u5F81\u3002') + '\u7EB3\u97F3' + getNaYinElementStr(naYin) + '\u3002\u6708\u67F1\u7EB3\u97F3\u4E0E\u5E74\u67F1\u7EB3\u97F3' + yearNaYin + '\u7684\u5173\u7CFB\uFF1A\u540C\u7C7B\u76F8\u6276\uFF0C\u6839\u57FA\u4E0E\u9752\u5E74\u8FD0\u534F\u8C03\u3002',
  })

  // 7. 对人生影响
  const impact = changSheng === '\u5E1D\u65FA' || changSheng === '\u4E34\u5B98'
    ? '\u6708\u4EE4\u65FA\u76DB\uFF0C\u65E5\u4E3B\u5F97\u65F6\uFF0C\u9752\u5E74\u8FD0\u6781\u4F73\uFF0C\u4E8B\u4E1A\u5B66\u4E1A\u5747\u6709\u5927\u7A81\u7834\u3002'
    : changSheng === '\u957F\u751F' || changSheng === '\u51A0\u5E26'
      ? '\u6708\u4EE4\u6210\u957F\uFF0C\u65E5\u4E3B\u6B63\u5728\u5D1B\u8D77\uFF0C\u9752\u5E74\u8FD0\u9010\u6B65\u5411\u597D\u3002'
      : changSheng === '\u8870' || changSheng === '\u75C5'
        ? '\u6708\u4EE4\u529B\u5F31\uFF0C\u9752\u5E74\u8FD0\u6709\u6311\u6218\uFF0C\u9700\u4F9D\u9760\u81EA\u8EAB\u52AA\u529B\u3002'
        : '\u6708\u4EE4\u5E73\u548C\uFF0C\u9752\u5E74\u8FD0\u5E73\u7A33\u4E2D\u6C42\u53D1\u5C55\u3002'
  sections.push({
    title: '\u5BF9\u4EBA\u751F\u5F71\u54CD',
    content: '\u6708\u67F1' + gan + zhi + naYin + '\uFF0C' + impact + '\u5341\u516D\u81F3\u4E09\u5341\u5C81\u671F\u95F4\uFF0C\u4E8B\u4E1A\u57FA\u7840\u3001\u793E\u4F1A\u5173\u7CFB\u3001\u4E13\u4E1A\u65B9\u5411\u7B49\u7686\u53D7\u6B64\u67F1\u5F71\u54CD\u3002\u6708\u67F1\u4E3A\u547D\u5C40\u63D0\u7EB2\uFF0C\u51B3\u5B9A\u65E5\u4E3B\u65FA\u8870\u4E0E\u683C\u5C40\u9AD8\u4F4E\u3002',
  })

  const summary = '\u6708\u67F1' + gan + zhi + naYin + '\uFF0C' + ganElement + zhiElement + '\uFF0C\u65E5\u4E3B\u9022' + changSheng + '\u3002\u7BA1\u5341\u516D\u81F3\u4E09\u5341\u5C81\u9752\u5E74\u8FD0\u7A0B\uFF0C\u4EE3\u8868\u7236\u6BCD\u5144\u5F1F\u4E0E\u4E8B\u4E1A\u57FA\u7840\u3002\u6708\u4EE4' + zhi + '\u4E3A\u547D\u5C40\u63D0\u7EB2\uFF0C' + getChangShengLevelDesc(changSheng) + '\u3002\u6708\u5E72' + shenShi + '\u900F\u51FA\u3002\u85CF\u5E72' + cangGan.ben + '\u4E3A\u672C\u6C14\u4E3B\u4E8B\u3002\u7EB3\u97F3' + naYin + '\uFF0C\u8C61\u5F81\u9752\u5E74\u65F6\u671F\u4E4B\u7279\u8D28\u3002\u6708\u67F1\u4E3A\u547D\u5C40\u5173\u952E\uFF0C\u51B3\u5B9A\u65E5\u4E3B\u65FA\u8870\u4E0E\u683C\u5C40\u9AD8\u4F4E\u3002'

  const totalWords = sections.reduce((sum, s) => sum + s.content.length, 0) + summary.length
  return { label: '\u6708\u67F1', gan, zhi, sections, summary, totalWords }
}

// ========== 日柱分析 ==========

function analyzeDayPillar(chart: BaZiChart): PillarDetail {
  const gan = chart.sixLines.day.gan
  const zhi = chart.sixLines.day.zhi
  const dayGan = gan
  const dayElement = chart.dayMaster.dayGanElement
  const naYin = getNaYin(gan, zhi)
  const ganElement = GAN_ELEMENT[gan]
  const zhiElement = ZHI_ELEMENT[zhi]
  const cangGan = chart.cangGan[zhi] as CangGan
  const allGans = [chart.sixLines.year.gan, chart.sixLines.month.gan, chart.sixLines.day.gan, chart.sixLines.hour.gan]
  const allZhis = [chart.sixLines.year.zhi, chart.sixLines.month.zhi, chart.sixLines.day.zhi, chart.sixLines.hour.zhi]
  const changSheng = getChangSheng(dayGan, zhi)

  const sections: PillarSectionDetail[] = []

  // 1. 含义
  const ganZhiRelation = ganElement === zhiElement
    ? '\u65E5\u5E72\u65E5\u652F\u540C\u5C5E' + ganElement + '\uFF0C\u592B\u59BB\u5BAB\u4E0E\u81EA\u8EAB\u540C\u6C14\uFF0C\u5A5A\u59FB\u5173\u7CFB\u7D27\u5BC6\u3002'
    : OVERCOME[ganElement] === zhiElement
      ? '\u76F8\u514B\uFF0C\u5A5A\u59FB\u4E2D\u6709\u6469\u64E6\u4F46\u4E92\u8865\u3002'
      : OVERCOME[zhiElement] === ganElement
        ? '\u65E5\u652F\u514B\u65E5\u5E72\uFF0C\u914D\u5076\u7BA1\u675F\u547D\u4E3B\u3002'
        : GENERATE[ganElement] === zhiElement
          ? '\u76F8\u751F\uFF0C\u592B\u59BB\u611F\u60C5\u548C\u8C10\u3002'
          : '\u65E5\u5E72\u751F\u65E5\u652F\uFF0C\u547D\u4E3B\u4ED8\u51FA\u8F83\u591A\u3002'
  const meaning1 = '\u65E5\u67F1' + gan + zhi + '\uFF0C\u7EB3\u97F3' + naYin + '\uFF0C\u4E3A\u547D\u4E3B\u81EA\u8EAB\u5BAB\u4F4D\uFF0C\u4EE3\u8868\u547D\u4E3B\u672C\u4EBA\u4E4B\u6027\u683C\u3001\u80FD\u529B\u4E0E\u5A5A\u59FB\u611F\u60C5\u3002\u65E5\u5E72' + gan + '\u5373\u4E3A\u65E5\u4E3B\u672C\u4EBA\uFF0C\u65E5\u652F' + zhi + '\u4E3A\u592B\u59BB\u5BAB\uFF0C\u4EA6\u4EE3\u8868\u914D\u5076\u4E4B\u7279\u8D28\u3002' + ganZhiRelation + '\u65E5\u67F1\u5929\u5E72\u5730\u652F\u7684\u5173\u7CFB\uFF0C\u76F4\u63A5\u53CD\u6620\u547D\u4E3B\u5185\u5728\u4E0E\u5916\u5728\u7684\u534F\u8C03\u7A0B\u5EA6\u3002'
  const meaning2 = '\u89C2\u65E5\u67F1' + gan + zhi + naYin + '\uFF0C\u6B64\u4E3A\u547D\u4E3B\u6838\u5FC3\u5BAB\u4F4D\u3002\u65E5\u5E72' + gan + ganElement + '\u4E3A\u547D\u4E3B\u81EA\u8EAB\uFF0C\u662F\u547D\u5C40\u5206\u6790\u4E4B\u6838\u5FC3\u3002\u65E5\u652F' + zhi + zhiElement + '\u4E3A\u592B\u59BB\u5BAB\uFF0C\u53C8\u79F0\u5A5A\u59FB\u5BAB\uFF0C\u4EE3\u8868\u914D\u5076\u4E4B\u7279\u5F81\u4E0E\u5A5A\u59FB\u72B6\u51B5\u3002\u65E5\u4E3B\u5728\u65E5\u652F\u9022' + changSheng + '\uFF0C' + getChangShengLevelDesc(changSheng) + '\u3002'
  sections.push({
    title: '\u542B\u4E49',
    content: pickBySeed([meaning1, meaning2], gan + zhi + 'meaning'),
  })

  // 2. 天干作用
  const monthShenShi = getShenShiRelation(dayGan, chart.sixLines.month.gan)
  const hourShenShi = getShenShiRelation(dayGan, chart.sixLines.hour.gan)
  const sideDesc = monthShenShi.includes('\u5370') || hourShenShi.includes('\u5370')
    ? '\u8EAB\u65C1\u6709\u5370\u661F\u62A4\u4F0F\uFF0C\u547D\u4E3B\u4E00\u751F\u591A\u5F97\u8D35\u4EBA\u5E2E\u52A9\u3002'
    : monthShenShi.includes('\u8D22') || hourShenShi.includes('\u8D22')
      ? '\u8EAB\u65C1\u6709\u8D22\u661F\uFF0C\u547D\u4E3B\u8D22\u8FD0\u4E0D\u79BB\u5DE6\u53F3\u3002'
      : monthShenShi.includes('\u5B98') || hourShenShi.includes('\u5B98')
        ? '\u8EAB\u65C1\u6709\u5B98\u661F\uFF0C\u547D\u4E3B\u6709\u7BA1\u675F\u4E5F\u6709\u7EA6\u675F\u3002'
        : '\u8EAB\u65C1\u6BD4\u52AB\u591A\uFF0C\u547D\u4E3B\u72EC\u7ACB\u6027\u6781\u5F3A\u3002'
  sections.push({
    title: '\u5929\u5E72\u4F5C\u7528',
    content: '\u65E5\u5E72' + gan + '\u5373\u4E3A\u65E5\u4E3B\u672C\u4EBA\uFF0C\u5C5E' + ganElement + '\uFF0C' + (isYangStem(gan) ? '\u9633\u6027\u521A\u5F3A\uFF0C\u79EF\u6781\u4E3B\u52A8' : '\u9634\u67D4\u6E29\u987A\uFF0C\u5185\u655B\u542B\u84C4') + '\u3002\u5DE6\u6709\u6708\u5E72' + chart.sixLines.month.gan + '\u4E3A' + monthShenShi + '\uFF0C\u53F3\u6709\u65F6\u5E72' + chart.sixLines.hour.gan + '\u4E3A' + hourShenShi + '\uFF0C' + sideDesc + getGanRelations(gan, allGans),
  })

  // 3. 地支作用
  const zhiExtra = zhi === chart.sixLines.month.zhi
    ? '\u65E5\u652F\u6708\u652F\u76F8\u540C\uFF0C\u914D\u5076\u53EF\u80FD\u6765\u81EA\u76F8\u8FD1\u73AF\u5883\u6216\u540C\u5B66\u540C\u4E61\u3002'
    : zhi === chart.sixLines.hour.zhi
      ? '\u65E5\u652F\u65F6\u652F\u76F8\u540C\uFF0C\u592B\u59BB\u5BAB\u4E0E\u5B50\u5973\u5BAB\u540C\u6C14\uFF0C\u5BB6\u5EAD\u89C2\u5FF5\u6781\u91CD\u3002'
      : ''
  sections.push({
    title: '\u5730\u652F\u4F5C\u7528',
    content: '\u65E5\u652F' + zhi + '\u5C5E' + zhiElement + '\uFF0C\u4E3A\u592B\u59BB\u5BAB\u4F4D\uFF0C\u4EE3\u8868\u914D\u5076\u4E4B\u6027\u683C\u7279\u8D28\u4E0E\u5A5A\u59FB\u72B6\u51B5\u3002' + zhiExtra + getZhiRelations(zhi, allZhis),
  })

  // 4. 藏干分析
  const cangParts: string[] = []
  cangParts.push('\u65E5\u652F' + zhi + '\u85CF\u5E72\uFF1A\u672C\u6C14' + cangGan.ben + '\u5C5E' + GAN_ELEMENT[cangGan.ben])
  if (cangGan.zhong) cangParts.push('\u4E2D\u6C14' + cangGan.zhong + '\u5C5E' + GAN_ELEMENT[cangGan.zhong])
  if (cangGan.yao) cangParts.push('\u4F59\u6C14' + cangGan.yao + '\u5C5E' + GAN_ELEMENT[cangGan.yao])
  cangParts.push('\u65E5\u652F\u672C\u6C14' + cangGan.ben + '\u4E3A' + getShenShiRelation(dayGan, cangGan.ben) + '\uFF0C\u4EE3\u8868\u914D\u5076\u7684\u6838\u5FC3\u7279\u8D28')
  if (cangGan.zhong) {
    cangParts.push('\u4E2D\u6C14' + cangGan.zhong + '\u4E3A' + getShenShiRelation(dayGan, cangGan.zhong) + '\uFF0C\u4EE3\u8868\u914D\u5076\u7684\u6B21\u8981\u7279\u5F81')
  }
  if (cangGan.yao) {
    cangParts.push('\u4F59\u6C14' + cangGan.yao + '\u4E3A' + getShenShiRelation(dayGan, cangGan.yao) + '\uFF0C\u914D\u5076\u6DF1\u5C42\u7279\u8D28')
  }
  sections.push({
    title: '\u85CF\u5E72\u5206\u6790',
    content: cangParts.join('\uFF1B') + '\u3002',
  })

  // 5. 十神分析
  const dayBenSS = getShenShiRelation(dayGan, cangGan.ben)
  sections.push({
    title: '\u5341\u795E\u5206\u6790',
    content: '\u65E5\u5E72' + gan + '\u4E3A\u65E5\u4E3B\u672C\u8EAB\uFF0C\u662F\u547D\u5C40\u5206\u6790\u7684\u6838\u5FC3\u3002\u65E5\u652F\u672C\u6C14' + cangGan.ben + '\u4E3A' + dayBenSS + '\uFF0C' + getDayZhiShenShiMarriage(dayBenSS) + '\u65E5\u652F\u5341\u795E\u662F\u5224\u65AD\u5A5A\u59FB\u8D28\u91CF\u7684\u91CD\u8981\u4F9D\u636E\u3002',
  })

  // 6. 纳音分析
  const marriageStable = naYin.includes('\u677E\u67CF') || naYin.includes('\u5927\u6797\u6728')
  const marriageRich = naYin.includes('\u5927\u6EAA') || naYin.includes('\u957F\u6D41')
  const marriageIntense = naYin.includes('\u5251\u950B') || naYin.includes('\u9739\u96F3')
  const marriageDesc = marriageStable
    ? '\u5A5A\u59FB\u7A33\u56FA\u6301\u4E45\u3002'
    : marriageRich
      ? '\u5A5A\u59FB\u611F\u60C5\u4E30\u5BCC\u591A\u53D8\u3002'
      : marriageIntense
        ? '\u5A5A\u59FB\u4E2D\u6709\u6FC0\u70C8\u7684\u78B0\u649E\u3002'
        : '\u5A5A\u59FB\u5E73\u6DE1\u4E2D\u6709\u771F\u60C5\u3002'
  sections.push({
    title: '\u7EB3\u97F3\u5206\u6790',
    content: '\u65E5\u67F1' + gan + zhi + '\u7EB3\u97F3' + naYin + '\uFF0C' + (NAYIN_SYMBOLISM[naYin] || '\u6B64\u7EB3\u97F3\u4EE3\u8868\u547D\u4E3B\u81EA\u8EAB\u4E4B\u5148\u5929\u7980\u8D4B\u3002') + '\u7EB3\u97F3' + getNaYinElementStr(naYin) + '\u3002\u65E5\u67F1\u7EB3\u97F3\u4EE3\u8868\u547D\u4E3B\u4E0E\u914D\u5076\u7684\u5148\u5929\u7F18\u5206\u6DF1\u6D45\uFF0C' + marriageDesc,
  })

  // 7. 对人生影响
  sections.push({
    title: '\u5BF9\u4EBA\u751F\u5F71\u54CD',
    content: '\u65E5\u67F1' + gan + zhi + naYin + '\u4E3A\u547D\u5C40\u6838\u5FC3\uFF0C\u76F4\u63A5\u5F71\u54CD\u547D\u4E3B\u4E00\u751F\u4E4B\u6027\u683C\u3001\u5A5A\u59FB\u4E0E\u4E8B\u4E1A\u3002' + getChangShengLevelDesc(changSheng) + '\uFF0C\u65E5\u67F1\u5929\u5E72\u5730\u652F\u7684\u914D\u5408\u597D\u574F\uFF0C\u76F4\u63A5\u51B3\u5B9A\u547D\u5C40\u7684\u57FA\u672C\u683C\u5C40\u4E0E\u4EBA\u751F\u8D70\u5411\u3002',
  })

  const summary = '\u65E5\u67F1' + gan + zhi + naYin + '\uFF0C\u65E5\u5E72' + ganElement + '\u4E3A\u547D\u4E3B\u81EA\u8EAB\uFF0C\u65E5\u652F' + zhiElement + '\u4E3A\u592B\u59BB\u5BAB\u3002\u65E5\u4E3B\u5728\u65E5\u652F\u9022' + changSheng + '\u3002\u65E5\u652F\u672C\u6C14' + cangGan.ben + '\u4E3A' + dayBenSS + '\uFF0C' + getDayZhiShenShiMarriage(dayBenSS) + '\u7EB3\u97F3' + naYin + '\uFF0C\u8C61\u5F81\u547D\u4E3B\u5148\u5929\u7980\u8D4B\u3002\u65E5\u67F1\u4E3A\u547D\u5C40\u4E4B\u6838\u5FC3\uFF0C\u4E00\u5207\u5206\u6790\u7686\u4EE5\u65E5\u4E3B\u4E3A\u4E2D\u5FC3\u5C55\u5F00\u3002'

  const totalWords = sections.reduce((sum, s) => sum + s.content.length, 0) + summary.length
  return { label: '\u65E5\u67F1', gan, zhi, sections, summary, totalWords }
}

// ========== 时柱分析 ==========

function analyzeHourPillar(chart: BaZiChart): PillarDetail {
  const gan = chart.sixLines.hour.gan
  const zhi = chart.sixLines.hour.zhi
  const dayGan = chart.sixLines.day.gan
  const dayElement = chart.dayMaster.dayGanElement
  const naYin = getNaYin(gan, zhi)
  const ganElement = GAN_ELEMENT[gan]
  const zhiElement = ZHI_ELEMENT[zhi]
  const cangGan = chart.cangGan[zhi] as CangGan
  const allGans = [chart.sixLines.year.gan, chart.sixLines.month.gan, chart.sixLines.day.gan, chart.sixLines.hour.gan]
  const allZhis = [chart.sixLines.year.zhi, chart.sixLines.month.zhi, chart.sixLines.day.zhi, chart.sixLines.hour.zhi]
  const shenShi = getShenShiRelation(dayGan, gan)
  const changSheng = getChangSheng(dayGan, zhi)

  const sections: PillarSectionDetail[] = []

  // 1. 含义
  const relation1 = getGanDayRelation(dayGan, gan, ganElement, dayElement)
  const meaning1 = '\u65F6\u67F1' + gan + zhi + '\uFF0C\u7EB3\u97F3' + naYin + '\uFF0C\u4E3B\u7BA1\u547D\u4E3B\u4E94\u5341\u4E94\u5C81\u4EE5\u540E\u665A\u5E74\u8FD0\u7A0B\uFF0C\u4EA6\u4EE3\u8868\u5B50\u5973\u3001\u4E0B\u5C5E\u4E0E\u4E8B\u4E1A\u6210\u679C\u3002\u65F6\u67F1\u4E3A\u547D\u5C40\u4E4B\u679C\uFF0C\u5982\u6811\u4E4B\u679C\u5B9E\uFF0C\u51B3\u5B9A\u547D\u4E3B\u665A\u5E74\u6536\u83B7\u4E0E\u540E\u4EE3\u53D1\u5C55\u3002\u65F6\u67F1' + ganElement + relation1
  const csDesc = changSheng === '\u5E1D\u65FA' || changSheng === '\u4E34\u5B98'
    ? '\u5B50\u5973\u5BAB\u65FA\u76DB\uFF0C\u5B50\u5973\u6709\u51FA\u606F\uFF0C\u665A\u5E74\u5F97\u4EAB\u5929\u4F26\u3002'
    : changSheng === '\u8870' || changSheng === '\u75C5'
      ? '\u5B50\u5973\u5BAB\u504F\u5F31\uFF0C\u5B50\u5973\u9700\u591A\u5173\u7231\u6276\u6301\u3002'
      : '\u5B50\u5973\u5BAB\u5E73\u7A33\uFF0C\u665A\u5E74\u5BB6\u5EAD\u5B89\u6CF0\u3002'
  const meaning2 = '\u89C2\u65F6\u67F1' + gan + zhi + naYin + '\uFF0C\u6B64\u4E3A\u547D\u4E3B\u665A\u5E74\u8FD0\u5BAB\uFF0C\u7BA1\u4E94\u5341\u4E94\u5C81\u4EE5\u540E\u8FD0\u7A0B\u3002\u65F6\u67F1\u4EA6\u4E3A\u5B50\u5973\u5BAB\uFF0C\u4EE3\u8868\u5B50\u5973\u4E4B\u7D20\u8D28\u4E0E\u665A\u5E74\u5BB6\u5EAD\u72B6\u51B5\u3002\u65F6\u652F' + zhi + zhiElement + '\u4E3A\u5B50\u5973\u5BAB\u4F4D\uFF0C' + csDesc
  sections.push({
    title: '\u542B\u4E49',
    content: pickBySeed([meaning1, meaning2], gan + zhi + 'meaning'),
  })

  // 2. 天干作用
  const ganDesc = '\u65F6\u5E72' + gan + '\u5C5E' + ganElement + '\uFF0C' + getGanRelationDesc(dayGan, gan) + '\u3002'
  const ganDetail = gan === dayGan
    ? '\u65F6\u5E72\u4E3A\u65E5\u4E3B\u900F\u51FA\uFF0C\u4E3B\u665A\u5E74\u547D\u4E3B\u4ECD\u4FDD\u6301\u72EC\u7ACB\u6027\u4E0E\u6D3B\u529B\u3002'
    : '\u5BF9\u65E5\u4E3B\u4E3A' + shenShi + '\uFF0C' + getShenShiImpact(shenShi) + '\u3002' + getShenShiPillarDesc(shenShi, '\u65F6\u67F1') + getGanRelations(gan, allGans)
  sections.push({
    title: '\u5929\u5E72\u4F5C\u7528',
    content: ganDesc + ganDetail,
  })

  // 3. 地支作用
  const zhiExtra = zhi === chart.sixLines.day.zhi
    ? '\u65F6\u652F\u65E5\u652F\u76F8\u540C\uFF0C\u5B50\u5973\u5BAB\u4E0E\u592B\u59BB\u5BAB\u540C\u6C14\uFF0C\u5BB6\u5EAD\u89C2\u5FF5\u6781\u91CD\uFF0C\u4E09\u4EE3\u540C\u5802\u4E4B\u8C61\u3002'
    : zhi === chart.sixLines.month.zhi
      ? '\u65F6\u652F\u6708\u652F\u76F8\u540C\uFF0C\u5B50\u5973\u4E0E\u9752\u5E74\u65F6\u671F\u540C\u6C14\uFF0C\u4E8B\u4E1A\u53EF\u4F20\u627F\u3002'
      : ''
  sections.push({
    title: '\u5730\u652F\u4F5C\u7528',
    content: '\u65F6\u652F' + zhi + '\u5C5E' + zhiElement + '\uFF0C\u4E3A\u5B50\u5973\u5BAB\u4F4D\uFF0C\u4EA6\u4EE3\u8868\u665A\u5E74\u751F\u6D3B\u4E4B\u6839\u57FA\u3002' + zhiExtra + getZhiRelations(zhi, allZhis),
  })

  // 4. 藏干分析
  const cangParts: string[] = []
  cangParts.push('\u65F6\u652F' + zhi + '\u85CF\u5E72\uFF1A\u672C\u6C14' + cangGan.ben + '\u5C5E' + GAN_ELEMENT[cangGan.ben])
  if (cangGan.zhong) cangParts.push('\u4E2D\u6C14' + cangGan.zhong + '\u5C5E' + GAN_ELEMENT[cangGan.zhong])
  if (cangGan.yao) cangParts.push('\u4F59\u6C14' + cangGan.yao + '\u5C5E' + GAN_ELEMENT[cangGan.yao])
  cangParts.push('\u65F6\u652F\u672C\u6C14' + cangGan.ben + '\u4E3A' + getShenShiRelation(dayGan, cangGan.ben) + '\uFF0C\u4EE3\u8868\u5B50\u5973\u7684\u6838\u5FC3\u7279\u8D28\u4E0E\u5BF9\u547D\u4E3B\u7684\u5F71\u54CD')
  if (cangGan.zhong) {
    cangParts.push('\u4E2D\u6C14' + cangGan.zhong + '\u4E3A' + getShenShiRelation(dayGan, cangGan.zhong) + '\uFF0C\u5B50\u5973\u7684\u6B21\u8981\u7279\u5F81')
  }
  if (cangGan.yao) {
    cangParts.push('\u4F59\u6C14' + cangGan.yao + '\u4E3A' + getShenShiRelation(dayGan, cangGan.yao) + '\uFF0C\u5B50\u5973\u6DF1\u5C42\u6F5C\u80FD')
  }
  sections.push({
    title: '\u85CF\u5E72\u5206\u6790',
    content: cangParts.join('\uFF1B') + '\u3002',
  })

  // 5. 十神分析
  sections.push({
    title: '\u5341\u795E\u5206\u6790',
    content: '\u65F6\u5E72' + gan + '\u5BF9\u65E5\u4E3B' + dayGan + '\u4E3A' + shenShi + '\uFF0C' + getShenShiPillarDesc(shenShi, '\u65F6\u67F1') + '\u65F6\u652F\u672C\u6C14' + cangGan.ben + '\u4E3A' + getShenShiRelation(dayGan, cangGan.ben) + '\uFF0C' + getShenShiImpact(getShenShiRelation(dayGan, cangGan.ben)),
  })

  // 6. 纳音分析
  const dayNaYin = getNaYin(dayGan, chart.sixLines.day.zhi)
  sections.push({
    title: '\u7EB3\u97F3\u5206\u6790',
    content: '\u65F6\u67F1' + gan + zhi + '\u7EB3\u97F3' + naYin + '\uFF0C' + (NAYIN_SYMBOLISM[naYin] || '\u6B64\u7EB3\u97F3\u8C61\u5F81\u665A\u5E74\u8FD0\u52BF\u4E4B\u7279\u5F81\u3002') + '\u7EB3\u97F3' + getNaYinElementStr(naYin) + '\u3002\u65F6\u67F1\u7EB3\u97F3' + naYin + '\uFF0C\u4E0E\u65E5\u67F1\u7EB3\u97F3' + dayNaYin + '\u76F8\u4E92\u914D\u5408\uFF0C\u665A\u5E74\u8FD0\u52BF\u4E0E\u5148\u5929\u7980\u8D4B\u534F\u8C03\u3002',
  })

  // 7. 对人生影响
  const impact = changSheng === '\u5E1D\u65FA' || changSheng === '\u4E34\u5B98'
    ? '\u665A\u5E74\u8FD0\u6781\u4F73\uFF0C\u5B50\u5973\u6709\u6210\uFF0C\u4E8B\u4E1A\u6210\u679C\u4E30\u7855\uFF0C\u7CBE\u795E\u751F\u6D3B\u5BCC\u8DB3\u3002'
    : changSheng === '\u957F\u751F' || changSheng === '\u51A0\u5E26'
      ? '\u665A\u5E74\u8FD0\u9010\u6B65\u5411\u597D\uFF0C\u6709\u6301\u7EED\u53D1\u5C55\u7684\u52BF\u5934\u3002'
      : changSheng === '\u8870' || changSheng === '\u75C5'
        ? '\u665A\u5E74\u8FD0\u52BF\u504F\u5F31\uFF0C\u9700\u63D0\u524D\u89C4\u5212\u517B\u8001\uFF0C\u4FDD\u517B\u8EAB\u4F53\u3002'
        : '\u665A\u5E74\u8FD0\u5E73\u7A33\uFF0C\u5B89\u4EAB\u592A\u5E73\u3002'
  sections.push({
    title: '\u5BF9\u4EBA\u751F\u5F71\u54CD',
    content: '\u65F6\u67F1' + gan + zhi + naYin + '\uFF0C' + impact + '\u4E94\u5341\u4E94\u5C81\u4EE5\u540E\u7684\u8FD0\u7A0B\u3001\u5B50\u5973\u53D1\u5C55\u72B6\u51B5\u3001\u665A\u5E74\u5BB6\u5EAD\u751F\u6D3B\u54C1\u8D28\u7B49\u7686\u53D7\u6B64\u67F1\u5F71\u54CD\u3002\u65F6\u67F1\u4E3A\u547D\u5C40\u4E4B\u679C\uFF0C\u79CD\u4EC0\u4E48\u56E0\u5F97\u4EC0\u4E48\u679C\uFF0C\u524D\u534A\u751F\u7684\u52AA\u529B\u5728\u6B64\u9636\u6BB5\u6536\u83B7\u3002',
  })

  const summary = '\u65F6\u67F1' + gan + zhi + naYin + '\uFF0C' + ganElement + zhiElement + '\uFF0C\u5BF9\u65E5\u4E3B\u4E3A' + shenShi + '\u3002\u7BA1\u4E94\u5341\u4E94\u5C81\u4EE5\u540E\u665A\u5E74\u8FD0\u7A0B\uFF0C\u4EE3\u8868\u5B50\u5973\u4E0E\u4E8B\u4E1A\u6210\u679C\u3002\u65E5\u4E3B\u5728\u65F6\u652F\u9022' + changSheng + '\u3002\u65F6\u5E72' + shenShi + '\uFF0C' + getShenShiPillarDesc(shenShi, '\u65F6\u67F1') + '\u85CF\u5E72' + cangGan.ben + '\u4E3A\u672C\u6C14\u4E3B\u4E8B\u3002\u7EB3\u97F3' + naYin + '\uFF0C\u8C61\u5F81\u665A\u5E74\u4E4B\u7279\u8D28\u3002\u65F6\u67F1\u4E3A\u547D\u5C40\u6536\u5B98\u4E4B\u67F1\uFF0C\u51B3\u5B9A\u547D\u4E3B\u4E00\u751F\u6700\u7EC8\u6210\u5C31\u3002'

  const totalWords = sections.reduce((sum, s) => sum + s.content.length, 0) + summary.length
  return { label: '\u65F6\u67F1', gan, zhi, sections, summary, totalWords }
}

// ========== 主函数 ==========

/**
 * 分析四柱详解
 * @param chart 八字排盘结果
 */
export function analyzeFourPillars(chart: BaZiChart): PillarAnalysisResult {
  return {
    year: analyzeYearPillar(chart),
    month: analyzeMonthPillar(chart),
    day: analyzeDayPillar(chart),
    hour: analyzeHourPillar(chart),
  }
}
