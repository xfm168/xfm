/**
 * H3 Module 2: Professional ShenSha Engine — 神煞数据库
 *
 * 35+ 种常用神煞统一定义。
 * 所有神煞使用统一签名计算函数。
 * 分类：吉神 / 凶神 / 桃花 / 贵人 / 事业 / 财运 / 婚姻 / 健康 / 学业 / 出行 / 灾煞 / 刑冲 / 岁运 / 特殊
 */

import { HEAVENLY_STEMS, EARTHLY_BRANCHES } from '@/lib/core/constants'
import type { HeavenlyStem, EarthlyBranch } from '@/lib/core/types/base'
import type { ShenShaDefinition, ShenShaPosition } from './shenshaTypes'

// ─── 工具函数 ───

const S = (g: HeavenlyStem) => HEAVENLY_STEMS.indexOf(g)
const Z = (z: EarthlyBranch) => EARTHLY_BRANCHES.indexOf(z)

/** 检查地支是否在指定列表中 */
function findPositions(zhiList: EarthlyBranch[], targets: EarthlyBranch[]): ShenShaPosition[] {
  const pos: ShenShaPosition[] = []
  const pillars: ('年' | '月' | '日' | '时')[] = ['年', '月', '日', '时']
  for (let i = 0; i < 4; i++) {
    if (targets.includes(zhiList[i])) {
      pos.push({ pillar: pillars[i], zhi: zhiList[i], isPrimary: pillars[i] === '日' })
    }
  }
  return pos
}

/** 地支六冲 */
const CHONG_MAP: Record<string, EarthlyBranch> = {
  '子': '午', '午': '子', '丑': '未', '未': '丑',
  '寅': '申', '申': '寅', '卯': '酉', '酉': '卯',
  '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳',
}

// ─── 神煞数据库（35种） ───

export const SHEN_SHA_DATABASE: ShenShaDefinition[] = [

  // ═══════════════════════════════════════
  // 吉神（13种）
  // ═══════════════════════════════════════

  {
    id: 'tianyi', name: '天乙贵人', category: '贵人',
    isAuspicious: true, priority: 95, source: '三命通会',
    modernExplain: '天乙贵人为最贵之神，主聪明智慧，遇难呈祥，逢凶化吉。',
    applicable: '命中天乙贵人，一生少病，逢凶化吉，遇难有贵人相助。',
    conflicts: [],
    formula: '甲戊庚牛羊(丑未)，乙己鼠猴乡(子申)，丙丁猪鸡位(亥酉)，壬癸兔蛇藏(卯巳)，六辛逢马虎(午寅)',
    calculator: (_yG, _yZ, _mG, _mZ, dG, _dZ, _hG, _hZ, _gender) => {
      const map: Record<string, EarthlyBranch[]> = {
        '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
        '乙': ['子', '申'], '己': ['子', '申'],
        '丙': ['亥', '酉'], '丁': ['亥', '酉'],
        '壬': ['卯', '巳'], '癸': ['卯', '巳'],
        '辛': ['午', '寅'],
      }
      const targets = map[dG] || []
      const zhiList: EarthlyBranch[] = [_yZ, _mZ, _dZ, _hZ]
      const positions = findPositions(zhiList, targets)
      return { hit: positions.length > 0, positions, confidence: 0.95 }
    },
  },

  {
    id: 'tiande', name: '天德贵人', category: '吉神',
    isAuspicious: true, priority: 90, source: '协纪辨方书',
    modernExplain: '天德为天地之德，主逢凶化吉，遇难呈祥，一生平安。',
    applicable: '天德入命，逢凶化吉，心地善良，受人尊敬。',
    conflicts: [],
    formula: '寅月丁、卯月申、辰月壬、巳月辛、午月甲、未月癸、申月寅、酉月乙、戌月丙、亥月己、子月戊、丑月庚',
    calculator: (_yG, _yZ, _mG, mZ, dG, dZ, _hG, _hZ, _gender) => {
      const map: Record<string, [HeavenlyStem | EarthlyBranch, boolean]> = {
        '寅': ['丁', true], '卯': ['申', false], '辰': ['壬', true],
        '巳': ['辛', true], '午': ['甲', true], '未': ['癸', true],
        '申': ['寅', false], '酉': ['乙', true], '戌': ['丙', true],
        '亥': ['己', true], '子': ['戊', true], '丑': ['庚', true],
      }
      const rule = map[mZ]
      if (!rule) return { hit: false, positions: [], confidence: 0.90 }
      const [target, isGan] = rule
      const hit = isGan ? dG === target : dZ === target
      const pos: ShenShaPosition[] = []
      if (hit) pos.push({ pillar: '日', zhi: dZ, isPrimary: true })
      return { hit, positions: pos, confidence: 0.90 }
    },
  },

  {
    id: 'yuede', name: '月德贵人', category: '吉神',
    isAuspicious: true, priority: 88, source: '协纪辨方书',
    modernExplain: '月德为月之德，主心地善良，逢凶化吉，六亲有助。',
    applicable: '月德入命，心地仁厚，逢凶化吉，六亲和睦。',
    conflicts: [],
    formula: '寅午戌月丙，申子辰月壬，亥卯未月甲，巳酉丑月庚',
    calculator: (_yG, _yZ, _mG, mZ, dG, _dZ, _hG, _hZ, _gender) => {
      const map: Record<string, HeavenlyStem> = {
        '寅': '丙', '午': '丙', '戌': '丙',
        '申': '壬', '子': '壬', '辰': '壬',
        '亥': '甲', '卯': '甲', '未': '甲',
        '巳': '庚', '酉': '庚', '丑': '庚',
      }
      const target = map[mZ]
      if (!target) return { hit: false, positions: [], confidence: 0.90 }
      const hit = dG === target
      const pos: ShenShaPosition[] = hit ? [{ pillar: '日', zhi: _dZ, isPrimary: true }] : []
      return { hit, positions: pos, confidence: 0.90 }
    },
  },

  {
    id: 'wenchang', name: '文昌贵人', category: '学业',
    isAuspicious: true, priority: 85, source: '三命通会',
    modernExplain: '文昌主聪明智慧、学业有成、文章出众。',
    applicable: '命中文昌，利于读书考试，适合文化、教育、学术工作。',
    conflicts: [],
    formula: '甲蛇乙马丙戊猴，丁己鸡庚猪鼠游，辛虎壬癸逢兔龙',
    calculator: (_yG, _yZ, _mG, _mZ, dG, _dZ, _hG, _hZ, _gender) => {
      const map: Record<string, EarthlyBranch> = {
        '甲': '巳', '乙': '午', '丙': '申', '戊': '申',
        '丁': '酉', '己': '酉', '庚': '亥', '辛': '子',
        '壬': '寅', '癸': '卯',
      }
      const target = map[dG]
      if (!target) return { hit: false, positions: [], confidence: 0.92 }
      const zhiList: EarthlyBranch[] = [_yZ, _mZ, _dZ, _hZ]
      const positions = findPositions(zhiList, [target])
      return { hit: positions.length > 0, positions, confidence: 0.92 }
    },
  },

  {
    id: 'xuetang', name: '学堂', category: '学业',
    isAuspicious: true, priority: 75, source: '三命通会',
    modernExplain: '学堂主学业有成，文章出众，聪明好学。',
    applicable: '命中学堂，利于读书，适合教育、文化、学术领域。',
    conflicts: [],
    formula: '金命见巳，木命见亥，水命见申，火命见寅，土命见申',
    calculator: (yG, _yZ, _mG, _mZ, _dG, dZ, _hG, hZ, _gender) => {
      // 简化：以年干五行查日支/时支
      const wuxingMap: Record<string, EarthlyBranch> = {
        '甲': '亥', '乙': '亥', // 木
        '丙': '寅', '丁': '寅', // 火
        '戊': '申', '己': '申', // 土
        '庚': '巳', '辛': '巳', // 金
        '壬': '申', '癸': '申', // 水（简化）
      }
      const target = wuxingMap[yG]
      if (!target) return { hit: false, positions: [], confidence: 0.80 }
      const pos: ShenShaPosition[] = []
      if (dZ === target) pos.push({ pillar: '日', zhi: dZ, isPrimary: true })
      if (hZ === target) pos.push({ pillar: '时', zhi: hZ, isPrimary: false })
      return { hit: pos.length > 0, positions: pos, confidence: 0.80 }
    },
  },

  {
    id: 'ciguan', name: '词馆', category: '学业',
    isAuspicious: true, priority: 70, source: '三命通会',
    modernExplain: '词馆主文章出众，才华横溢，善于表达。',
    applicable: '命中词馆，利于写作、演讲、传媒等行业。',
    conflicts: [],
    formula: '以年干纳音五行查日支临官位',
    calculator: (yG, _yZ, _mG, _mZ, _dG, dZ, _hG, _hZ, _gender) => {
      // 简化：年干五行对应的临官地支
      const map: Record<string, EarthlyBranch> = {
        '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午',
        '戊': '巳', '己': '午', '庚': '申', '辛': '酉',
        '壬': '亥', '癸': '子',
      }
      const target = map[yG]
      if (!target) return { hit: false, positions: [], confidence: 0.75 }
      const hit = dZ === target
      return { hit, positions: hit ? [{ pillar: '日', zhi: dZ, isPrimary: true }] : [], confidence: 0.75 }
    },
  },

  {
    id: 'jiangxing', name: '将星', category: '事业',
    isAuspicious: true, priority: 82, source: '三命通会',
    modernExplain: '将星主领导才能，有威望，适合管理、军警、领导岗位。',
    applicable: '命中将星，有领导才能，遇事果断，受人尊敬。',
    conflicts: [],
    formula: '寅午戌见午，巳酉丑见酉，申子辰见子，亥卯未见卯（三合局之中神）',
    calculator: (_yG, yZ, _mG, _mZ, _dG, dZ, _hG, hZ, _gender) => {
      const map: Record<string, EarthlyBranch> = {
        '寅': '午', '午': '午', '戌': '午',
        '巳': '酉', '酉': '酉', '丑': '酉',
        '申': '子', '子': '子', '辰': '子',
        '亥': '卯', '卯': '卯', '未': '卯',
      }
      const targets: EarthlyBranch[] = []
      const t1 = map[yZ]; if (t1) targets.push(t1)
      const t2 = map[dZ]; if (t2 && !targets.includes(t2)) targets.push(t2)
      const zhiList: EarthlyBranch[] = [yZ, _mZ, dZ, hZ]
      const positions = findPositions(zhiList, targets)
      return { hit: positions.length > 0, positions, confidence: 0.88 }
    },
  },

  {
    id: 'jinju', name: '金舆', category: '财运',
    isAuspicious: true, priority: 78, source: '三命通会',
    modernExplain: '金舆主富贵荣华，车马裕如，生活优渥。',
    applicable: '命中金舆，生活富裕，衣食丰足，出行有车马之便。',
    conflicts: [],
    formula: '甲龙乙蛇丙戊羊，丁己猴歌庚犬方，辛猪壬牛癸逢虎',
    calculator: (_yG, _yZ, _mG, _mZ, dG, _dZ, _hG, _hZ, _gender) => {
      const map: Record<string, EarthlyBranch> = {
        '甲': '辰', '乙': '巳', '丙': '未', '戊': '未',
        '丁': '申', '己': '申', '庚': '戌', '辛': '亥',
        '壬': '丑', '癸': '寅',
      }
      const target = map[dG]
      if (!target) return { hit: false, positions: [], confidence: 0.85 }
      const zhiList: EarthlyBranch[] = [_yZ, _mZ, _dZ, _hZ]
      const positions = findPositions(zhiList, [target])
      return { hit: positions.length > 0, positions, confidence: 0.85 }
    },
  },

  {
    id: 'lushen', name: '禄神', category: '财运',
    isAuspicious: true, priority: 88, source: '渊海子平',
    modernExplain: '禄神主俸禄衣食，命中禄神，衣食无忧，生活安定。',
    applicable: '命中禄神，生活安定，衣食丰足，不易贫困。',
    conflicts: [],
    formula: '甲禄在寅，乙禄在卯，丙戊禄在巳，丁己禄在午，庚禄在申，辛禄在酉，壬禄在亥，癸禄在子',
    calculator: (_yG, _yZ, _mG, _mZ, dG, _dZ, _hG, _hZ, _gender) => {
      const map: Record<string, EarthlyBranch> = {
        '甲': '寅', '乙': '卯', '丙': '巳', '戊': '巳',
        '丁': '午', '己': '午', '庚': '申', '辛': '酉',
        '壬': '亥', '癸': '子',
      }
      const target = map[dG]
      if (!target) return { hit: false, positions: [], confidence: 0.92 }
      const zhiList: EarthlyBranch[] = [_yZ, _mZ, _dZ, _hZ]
      const positions = findPositions(zhiList, [target])
      return { hit: positions.length > 0, positions, confidence: 0.92 }
    },
  },

  {
    id: 'tianshe', name: '天赦', category: '吉神',
    isAuspicious: true, priority: 80, source: '协纪辨方书',
    modernExplain: '天赦主逢凶化吉，遇难得救，一生少灾少难。',
    applicable: '天赦入命，逢凶化吉，一生平安，灾难较少。',
    conflicts: [],
    formula: '春戊寅，夏甲午，秋戊申，冬甲子',
    calculator: (_yG, _yZ, _mG, mZ, dG, dZ, _hG, _hZ, _gender) => {
      const spring = ['寅', '卯', '辰'].includes(mZ)
      const summer = ['巳', '午', '未'].includes(mZ)
      const autumn = ['申', '酉', '戌'].includes(mZ)
      const winter = ['亥', '子', '丑'].includes(mZ)
      let hit = false
      if (spring && dG === '戊' && dZ === '寅') hit = true
      if (summer && dG === '甲' && dZ === '午') hit = true
      if (autumn && dG === '戊' && dZ === '申') hit = true
      if (winter && dG === '甲' && dZ === '子') hit = true
      return { hit, positions: hit ? [{ pillar: '日', zhi: dZ, isPrimary: true }] : [], confidence: 0.90 }
    },
  },

  {
    id: 'sanqi', name: '三奇贵人', category: '特殊',
    isAuspicious: true, priority: 85, source: '三命通会',
    modernExplain: '三奇为贵格之一，主聪明异常，才华出众，非同凡响。',
    applicable: '命中三奇，聪明异常，有特异才能，事业可成。',
    conflicts: [],
    formula: '天上三奇甲戊庚，地下三奇乙丙丁，人中三奇壬癸辛',
    calculator: (_yG, _yZ, _mG, _mZ, dG, _dZ, _hG, _hZ, _gender) => {
      const gans: HeavenlyStem[] = [_yG, _mG, dG, _hG]
      const set = new Set<HeavenlyStem>(gans)
      const tianShang = (['甲', '戊', '庚'] as HeavenlyStem[]).every(g => set.has(g))
      const diXia = (['乙', '丙', '丁'] as HeavenlyStem[]).every(g => set.has(g))
      const renZhong = (['壬', '癸', '辛'] as HeavenlyStem[]).every(g => set.has(g))
      const hit = tianShang || diXia || renZhong
      const pos: ShenShaPosition[] = []
      if (hit) {
        for (let i = 0; i < 4; i++) {
          const p: ('年' | '月' | '日' | '时')[] = ['年', '月', '日', '时']
          pos.push({ pillar: p[i], zhi: _dZ, isPrimary: p[i] === '日' })
        }
      }
      return { hit, positions: pos, confidence: 0.85 }
    },
  },

  {
    id: 'guoyin', name: '国印', category: '事业',
    isAuspicious: true, priority: 72, source: '三命通会',
    modernExplain: '国印主掌权柄，有官运，适合公职、管理岗位。',
    applicable: '命中国印，利于从政、公职、管理，有掌权之象。',
    conflicts: [],
    formula: '甲见戌，乙见亥，丙见丑，丁见寅，戊见丑，己见寅，庚见辰，辛见巳，壬见未，癸见申',
    calculator: (_yG, _yZ, _mG, _mZ, dG, _dZ, _hG, _hZ, _gender) => {
      const map: Record<string, EarthlyBranch> = {
        '甲': '戌', '乙': '亥', '丙': '丑', '丁': '寅',
        '戊': '丑', '己': '寅', '庚': '辰', '辛': '巳',
        '壬': '未', '癸': '申',
      }
      const target = map[dG]
      if (!target) return { hit: false, positions: [], confidence: 0.82 }
      const zhiList: EarthlyBranch[] = [_yZ, _mZ, _dZ, _hZ]
      const positions = findPositions(zhiList, [target])
      return { hit: positions.length > 0, positions, confidence: 0.82 }
    },
  },

  {
    id: 'fuxing', name: '福星', category: '吉神',
    isAuspicious: true, priority: 70, source: '三命通会',
    modernExplain: '福星主一生平安顺遂，福气深厚，遇难呈祥。',
    applicable: '福星入命，一生平安，福气深厚，少灾少难。',
    conflicts: [],
    formula: '以年干或日干查对应福星地支（简化版）',
    calculator: (yG, _yZ, _mG, _mZ, dG, dZ, _hG, _hZ, _gender) => {
      const map: Record<string, EarthlyBranch> = {
        '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午',
        '戊': '巳', '己': '午', '庚': '申', '辛': '酉',
        '壬': '亥', '癸': '子',
      }
      const target = map[dG] || map[yG]
      if (!target) return { hit: false, positions: [], confidence: 0.75 }
      const zhiList: EarthlyBranch[] = [_yZ, _mZ, dZ, _hZ]
      const positions = findPositions(zhiList, [target])
      return { hit: positions.length > 0, positions, confidence: 0.75 }
    },
  },

  // ═══════════════════════════════════════
  // 凶神（13种）
  // ═══════════════════════════════════════

  {
    id: 'yangren', name: '羊刃', category: '凶神',
    isAuspicious: false, priority: 80, source: '三命通会',
    modernExplain: '羊刃主刚烈暴戾，性格急躁，易生是非，但也主勇猛果断。',
    applicable: '命中羊刃，性格刚烈，做事果断，但易与人冲突，注意控制情绪。',
    conflicts: ['feiren'],
    formula: '甲刃卯，乙刃寅，丙戊刃午，丁己刃巳，庚刃酉，辛刃申，壬刃子，癸刃亥',
    calculator: (_yG, _yZ, _mG, _mZ, dG, _dZ, _hG, _hZ, _gender) => {
      const map: Record<string, EarthlyBranch> = {
        '甲': '卯', '乙': '寅', '丙': '午', '戊': '午',
        '丁': '巳', '己': '巳', '庚': '酉', '辛': '申',
        '壬': '子', '癸': '亥',
      }
      const target = map[dG]
      if (!target) return { hit: false, positions: [], confidence: 0.90 }
      const zhiList: EarthlyBranch[] = [_yZ, _mZ, _dZ, _hZ]
      const positions = findPositions(zhiList, [target])
      return { hit: positions.length > 0, positions, confidence: 0.90 }
    },
  },

  {
    id: 'feiren', name: '飞刃', category: '凶神',
    isAuspicious: false, priority: 75, source: '三命通会',
    modernExplain: '飞刃为羊刃对冲，主意外伤灾，血光之灾。',
    applicable: '命中飞刃，注意意外伤灾，出行谨慎，避免高危活动。',
    conflicts: ['yangren'],
    formula: '羊刃对冲：甲飞酉，乙飞申，丙戊飞子，丁己飞亥，庚飞卯，辛飞寅，壬飞午，癸飞巳',
    calculator: (_yG, _yZ, _mG, _mZ, dG, _dZ, _hG, _hZ, _gender) => {
      const map: Record<string, EarthlyBranch> = {
        '甲': '酉', '乙': '申', '丙': '子', '戊': '子',
        '丁': '亥', '己': '亥', '庚': '卯', '辛': '寅',
        '壬': '午', '癸': '巳',
      }
      const target = map[dG]
      if (!target) return { hit: false, positions: [], confidence: 0.85 }
      const zhiList: EarthlyBranch[] = [_yZ, _mZ, _dZ, _hZ]
      const positions = findPositions(zhiList, [target])
      return { hit: positions.length > 0, positions, confidence: 0.85 }
    },
  },

  {
    id: 'kuigang', name: '魁罡', category: '特殊',
    isAuspicious: false, priority: 82, source: '三命通会',
    modernExplain: '魁罡主刚烈果断，性格倔强，有威权之象，但也主孤傲。',
    applicable: '魁罡入命，性格刚烈，有威权，适合军警、领导岗位，但婚姻易有波折。',
    conflicts: [],
    formula: '日柱为庚辰、庚戌、壬辰、戊戌',
    calculator: (_yG, _yZ, _mG, _mZ, dG, dZ, _hG, _hZ, _gender) => {
      const targets = [
        { gan: '庚' as HeavenlyStem, zhi: '辰' as EarthlyBranch },
        { gan: '庚', zhi: '戌' },
        { gan: '壬', zhi: '辰' },
        { gan: '壬', zhi: '戌' },
        { gan: '戊', zhi: '辰' },
        { gan: '戊', zhi: '戌' },
      ]
      const hit = targets.some(t => t.gan === dG && t.zhi === dZ)
      return { hit, positions: hit ? [{ pillar: '日', zhi: dZ, isPrimary: true }] : [], confidence: 0.95 }
    },
  },

  {
    id: 'wangshen', name: '亡神', category: '凶神',
    isAuspicious: false, priority: 78, source: '三命通会',
    modernExplain: '亡神主心机深沉，做事有谋略，但也主虚伪欺诈，易生暗疾。',
    applicable: '亡神入命，心机深沉，善于谋略，但须防虚伪欺诈，注意身体健康。',
    conflicts: [],
    formula: '寅午戌见巳，巳酉丑见申，申子辰见亥，亥卯未见寅（三合局临官）',
    calculator: (_yG, yZ, _mG, _mZ, _dG, dZ, _hG, hZ, _gender) => {
      const map: Record<string, EarthlyBranch> = {
        '寅': '巳', '午': '巳', '戌': '巳',
        '巳': '申', '酉': '申', '丑': '申',
        '申': '亥', '子': '亥', '辰': '亥',
        '亥': '寅', '卯': '寅', '未': '寅',
      }
      const targets: EarthlyBranch[] = []
      const t1 = map[yZ]; if (t1) targets.push(t1)
      const t2 = map[dZ]; if (t2 && !targets.includes(t2)) targets.push(t2)
      const zhiList: EarthlyBranch[] = [yZ, _mZ, dZ, hZ]
      const positions = findPositions(zhiList, targets)
      return { hit: positions.length > 0, positions, confidence: 0.85 }
    },
  },

  {
    id: 'jiesha', name: '劫煞', category: '凶神',
    isAuspicious: false, priority: 76, source: '三命通会',
    modernExplain: '劫煞主破财损耗，小人暗算，注意财务安全。',
    applicable: '劫煞入命，注意破财，防范小人，不宜大额投资。',
    conflicts: [],
    formula: '寅午戌见亥，巳酉丑见寅，申子辰见巳，亥卯未见申',
    calculator: (_yG, yZ, _mG, _mZ, _dG, dZ, _hG, hZ, _gender) => {
      const map: Record<string, EarthlyBranch> = {
        '寅': '亥', '午': '亥', '戌': '亥',
        '巳': '寅', '酉': '寅', '丑': '寅',
        '申': '巳', '子': '巳', '辰': '巳',
        '亥': '申', '卯': '申', '未': '申',
      }
      const targets: EarthlyBranch[] = []
      const t1 = map[yZ]; if (t1) targets.push(t1)
      const t2 = map[dZ]; if (t2 && !targets.includes(t2)) targets.push(t2)
      const zhiList: EarthlyBranch[] = [yZ, _mZ, dZ, hZ]
      const positions = findPositions(zhiList, targets)
      return { hit: positions.length > 0, positions, confidence: 0.85 }
    },
  },

  {
    id: 'zaisha', name: '灾煞', category: '灾煞',
    isAuspicious: false, priority: 78, source: '三命通会',
    modernExplain: '灾煞主灾难横祸，意外之灾，须防血光、车祸等。',
    applicable: '灾煞入命，注意意外之灾，出行谨慎，避免高危活动。',
    conflicts: [],
    formula: '寅午戌见子，巳酉丑见卯，申子辰见午，亥卯未见酉',
    calculator: (_yG, yZ, _mG, _mZ, _dG, dZ, _hG, hZ, _gender) => {
      const map: Record<string, EarthlyBranch> = {
        '寅': '子', '午': '子', '戌': '子',
        '巳': '卯', '酉': '卯', '丑': '卯',
        '申': '午', '子': '午', '辰': '午',
        '亥': '酉', '卯': '酉', '未': '酉',
      }
      const targets: EarthlyBranch[] = []
      const t1 = map[yZ]; if (t1) targets.push(t1)
      const t2 = map[dZ]; if (t2 && !targets.includes(t2)) targets.push(t2)
      const zhiList: EarthlyBranch[] = [yZ, _mZ, dZ, hZ]
      const positions = findPositions(zhiList, targets)
      return { hit: positions.length > 0, positions, confidence: 0.85 }
    },
  },

  {
    id: 'diaoke', name: '吊客', category: '灾煞',
    isAuspicious: false, priority: 74, source: '三命通会',
    modernExplain: '吊客主孝服哭泣，亲人有丧，注意长辈健康。',
    applicable: '吊客入命，注意长辈健康，防范孝服之事。',
    conflicts: [],
    formula: '年支后两位（顺行）',
    calculator: (_yG, yZ, _mG, _mZ, _dG, dZ, _hG, hZ, _gender) => {
      const target = EARTHLY_BRANCHES[(Z(yZ) + 2) % 12]
      const zhiList: EarthlyBranch[] = [yZ, _mZ, dZ, hZ]
      const positions = findPositions(zhiList, [target])
      return { hit: positions.length > 0, positions, confidence: 0.80 }
    },
  },

  {
    id: 'sangmen', name: '丧门', category: '灾煞',
    isAuspicious: false, priority: 74, source: '三命通会',
    modernExplain: '丧门主孝服丧事，亲人有灾，注意家人健康。',
    applicable: '丧门入命，注意家人健康，防范孝服之事。',
    conflicts: [],
    formula: '年支前两位（逆行）',
    calculator: (_yG, yZ, _mG, _mZ, _dG, dZ, _hG, hZ, _gender) => {
      const target = EARTHLY_BRANCHES[(Z(yZ) - 2 + 12) % 12]
      const zhiList: EarthlyBranch[] = [yZ, _mZ, dZ, hZ]
      const positions = findPositions(zhiList, [target])
      return { hit: positions.length > 0, positions, confidence: 0.80 }
    },
  },

  {
    id: 'tianluo-diwang', name: '天罗地网', category: '凶神',
    isAuspicious: false, priority: 82, source: '三命通会',
    modernExplain: '天罗地网主困顿阻碍，事业难展，须防牢狱之灾。',
    applicable: '天罗地网入命，事业多阻碍，须防官非牢狱，不宜投机取巧。',
    conflicts: [],
    formula: '辰为天罗，戌为地网。火命人见辰为天罗，水命人见戌为地网',
    calculator: (yG, _yZ, _mG, _mZ, _dG, dZ, _hG, hZ, _gender) => {
      // 简化：以年干五行判断命，查四柱是否有辰或戌
      const fireGan = ['丙', '丁']
      const waterGan = ['壬', '癸']
      const isFire = fireGan.includes(yG)
      const isWater = waterGan.includes(yG)
      const pos: ShenShaPosition[] = []
      const zhiList: EarthlyBranch[] = [_yZ, _mZ, dZ, hZ]
      const pillars: ('年' | '月' | '日' | '时')[] = ['年', '月', '日', '时']
      for (let i = 0; i < 4; i++) {
        if (isFire && zhiList[i] === '辰') pos.push({ pillar: pillars[i], zhi: zhiList[i], isPrimary: pillars[i] === '日' })
        if (isWater && zhiList[i] === '戌') pos.push({ pillar: pillars[i], zhi: zhiList[i], isPrimary: pillars[i] === '日' })
      }
      return { hit: pos.length > 0, positions: pos, confidence: 0.82 }
    },
  },

  {
    id: 'pima', name: '披麻', category: '灾煞',
    isAuspicious: false, priority: 70, source: '三命通会',
    modernExplain: '披麻主孝服哭泣，注意长辈健康。',
    applicable: '披麻入命，注意长辈健康，防范孝服之事。',
    conflicts: [],
    formula: '年支后一位（顺行）',
    calculator: (_yG, yZ, _mG, _mZ, _dG, dZ, _hG, hZ, _gender) => {
      const target = EARTHLY_BRANCHES[(Z(yZ) + 1) % 12]
      const zhiList: EarthlyBranch[] = [yZ, _mZ, dZ, hZ]
      const positions = findPositions(zhiList, [target])
      return { hit: positions.length > 0, positions, confidence: 0.75 }
    },
  },

  {
    id: 'goujiao', name: '勾绞', category: '凶神',
    isAuspicious: false, priority: 72, source: '三命通会',
    modernExplain: '勾绞主纠缠是非，官非口舌，注意人际关系。',
    applicable: '勾绞入命，注意官非口舌，避免与人争执，谨慎签约。',
    conflicts: [],
    formula: '阳男阴女勾在前，阴男阳女绞在前（简化：以年支查前三位和后三位）',
    calculator: (_yG, yZ, _mG, _mZ, _dG, dZ, _hG, hZ, gender) => {
      const gou = EARTHLY_BRANCHES[(Z(yZ) + 3) % 12]
      const jiao = EARTHLY_BRANCHES[(Z(yZ) - 3 + 12) % 12]
      const zhiList: EarthlyBranch[] = [yZ, _mZ, dZ, hZ]
      const positions = findPositions(zhiList, [gou, jiao])
      return { hit: positions.length > 0, positions, confidence: 0.78 }
    },
  },

  {
    id: 'feilian', name: '飞廉', category: '凶神',
    isAuspicious: false, priority: 70, source: '三命通会',
    modernExplain: '飞廉主小人暗算，背后是非，注意防范小人。',
    applicable: '飞廉入命，注意小人暗算，避免背后是非，谨慎交友。',
    conflicts: [],
    formula: '以月支查（简化版）',
    calculator: (_yG, _yZ, _mG, mZ, _dG, dZ, _hG, hZ, _gender) => {
      const map: Record<string, EarthlyBranch> = {
        '寅': '申', '卯': '酉', '辰': '戌', '巳': '亥',
        '午': '子', '未': '丑', '申': '寅', '酉': '卯',
        '戌': '辰', '亥': '巳', '子': '午', '丑': '未',
      }
      const target = map[mZ]
      if (!target) return { hit: false, positions: [], confidence: 0.75 }
      const zhiList: EarthlyBranch[] = [_yZ, mZ, dZ, hZ]
      const positions = findPositions(zhiList, [target])
      return { hit: positions.length > 0, positions, confidence: 0.75 }
    },
  },

  {
    id: 'sifei', name: '四废', category: '凶神',
    isAuspicious: false, priority: 76, source: '协纪辨方书',
    modernExplain: '四废主做事无成，身体虚弱，事业难展。',
    applicable: '四废日生人，做事多败，身体较弱，宜保守行事。',
    conflicts: [],
    formula: '春庚申辛酉，夏壬子癸亥，秋甲寅乙卯，冬丙午丁巳',
    calculator: (_yG, _yZ, _mG, mZ, dG, dZ, _hG, _hZ, _gender) => {
      const spring = ['寅', '卯', '辰'].includes(mZ)
      const summer = ['巳', '午', '未'].includes(mZ)
      const autumn = ['申', '酉', '戌'].includes(mZ)
      const winter = ['亥', '子', '丑'].includes(mZ)
      let hit = false
      if (spring && dG === '庚' && dZ === '申') hit = true
      if (spring && dG === '辛' && dZ === '酉') hit = true
      if (summer && dG === '壬' && dZ === '子') hit = true
      if (summer && dG === '癸' && dZ === '亥') hit = true
      if (autumn && dG === '甲' && dZ === '寅') hit = true
      if (autumn && dG === '乙' && dZ === '卯') hit = true
      if (winter && dG === '丙' && dZ === '午') hit = true
      if (winter && dG === '丁' && dZ === '巳') hit = true
      return { hit, positions: hit ? [{ pillar: '日', zhi: dZ, isPrimary: true }] : [], confidence: 0.88 }
    },
  },

  // ═══════════════════════════════════════
  // 桃花 / 贵人（5种）
  // ═══════════════════════════════════════

  {
    id: 'taohua', name: '桃花', category: '桃花',
    isAuspicious: true, priority: 80, source: '三命通会',
    modernExplain: '桃花主人缘好，异性缘佳，但也主感情复杂。',
    applicable: '命中桃花，人缘好，异性缘佳，适合社交、演艺等行业，但感情须防复杂。',
    conflicts: [],
    formula: '申子辰见酉，寅午戌见卯，亥卯未见子，巳酉丑见午',
    calculator: (_yG, yZ, _mG, _mZ, _dG, dZ, _hG, hZ, _gender) => {
      const map: Record<string, EarthlyBranch> = {
        '申': '酉', '子': '酉', '辰': '酉',
        '寅': '卯', '午': '卯', '戌': '卯',
        '亥': '子', '卯': '子', '未': '子',
        '巳': '午', '酉': '午', '丑': '午',
      }
      const targets: EarthlyBranch[] = []
      const t1 = map[yZ]; if (t1) targets.push(t1)
      const t2 = map[dZ]; if (t2 && !targets.includes(t2)) targets.push(t2)
      const zhiList: EarthlyBranch[] = [yZ, _mZ, dZ, hZ]
      const positions = findPositions(zhiList, targets)
      return { hit: positions.length > 0, positions, confidence: 0.90 }
    },
  },

  {
    id: 'hongluan', name: '红鸾', category: '婚姻',
    isAuspicious: true, priority: 85, source: '三命通会',
    modernExplain: '红鸾主婚姻喜庆，姻缘到来，适合婚恋。',
    applicable: '命中红鸾，姻缘佳，婚姻喜庆，适合结婚成家。',
    conflicts: [],
    formula: '子年卯，丑年寅，寅年丑，卯年子，辰年亥，巳年戌，午年酉，未年申，申年未，酉年午，戌年巳，亥年辰',
    calculator: (_yG, yZ, _mG, _mZ, _dG, dZ, _hG, hZ, _gender) => {
      const map: Record<string, EarthlyBranch> = {
        '子': '卯', '丑': '寅', '寅': '丑', '卯': '子',
        '辰': '亥', '巳': '戌', '午': '酉', '未': '申',
        '申': '未', '酉': '午', '戌': '巳', '亥': '辰',
      }
      const target = map[yZ]
      if (!target) return { hit: false, positions: [], confidence: 0.88 }
      const zhiList: EarthlyBranch[] = [yZ, _mZ, dZ, hZ]
      const positions = findPositions(zhiList, [target])
      return { hit: positions.length > 0, positions, confidence: 0.88 }
    },
  },

  {
    id: 'tianxi', name: '天喜', category: '婚姻',
    isAuspicious: true, priority: 83, source: '三命通会',
    modernExplain: '天喜主喜庆之事，婚姻、生子、乔迁等皆为喜事。',
    applicable: '命中天喜，一生多喜庆，婚姻美满，生子顺利。',
    conflicts: [],
    formula: '红鸾对冲：子年见酉，丑年见申，寅年见未，卯年见午，辰年见巳，巳年见辰，午年见卯，未年见寅，申年见丑，酉年见子，戌年见亥，亥年见戌',
    calculator: (_yG, yZ, _mG, _mZ, _dG, dZ, _hG, hZ, _gender) => {
      const target = CHONG_MAP[yZ]
      if (!target) return { hit: false, positions: [], confidence: 0.85 }
      const zhiList: EarthlyBranch[] = [yZ, _mZ, dZ, hZ]
      const positions = findPositions(zhiList, [target])
      return { hit: positions.length > 0, positions, confidence: 0.85 }
    },
  },

  {
    id: 'guchen', name: '孤辰', category: '婚姻',
    isAuspicious: false, priority: 75, source: '三命通会',
    modernExplain: '孤辰主孤独寂寞，六亲缘薄，婚姻较晚。',
    applicable: '孤辰入命，性格孤独，婚姻较晚，须主动拓展社交。',
    conflicts: ['guasu'],
    formula: '亥子丑见寅，寅卯辰见巳，巳午未见申，申酉戌见亥',
    calculator: (_yG, yZ, _mG, _mZ, _dG, dZ, _hG, hZ, _gender) => {
      const map: Record<string, EarthlyBranch> = {
        '亥': '寅', '子': '寅', '丑': '寅',
        '寅': '巳', '卯': '巳', '辰': '巳',
        '巳': '申', '午': '申', '未': '申',
        '申': '亥', '酉': '亥', '戌': '亥',
      }
      const target = map[yZ]
      if (!target) return { hit: false, positions: [], confidence: 0.85 }
      const zhiList: EarthlyBranch[] = [yZ, _mZ, dZ, hZ]
      const positions = findPositions(zhiList, [target])
      return { hit: positions.length > 0, positions, confidence: 0.85 }
    },
  },

  {
    id: 'guasu', name: '寡宿', category: '婚姻',
    isAuspicious: false, priority: 75, source: '三命通会',
    modernExplain: '寡宿主孤独守寡，婚姻不顺，六亲缘薄。',
    applicable: '寡宿入命，婚姻易有波折，须珍惜感情，多沟通理解。',
    conflicts: ['guchen'],
    formula: '亥子丑见戌，寅卯辰见丑，巳午未见辰，申酉戌见未',
    calculator: (_yG, yZ, _mG, _mZ, _dG, dZ, _hG, hZ, _gender) => {
      const map: Record<string, EarthlyBranch> = {
        '亥': '戌', '子': '戌', '丑': '戌',
        '寅': '丑', '卯': '丑', '辰': '丑',
        '巳': '辰', '午': '辰', '未': '辰',
        '申': '未', '酉': '未', '戌': '未',
      }
      const target = map[yZ]
      if (!target) return { hit: false, positions: [], confidence: 0.85 }
      const zhiList: EarthlyBranch[] = [yZ, _mZ, dZ, hZ]
      const positions = findPositions(zhiList, [target])
      return { hit: positions.length > 0, positions, confidence: 0.85 }
    },
  },

  // ═══════════════════════════════════════
  // 其他（4种）
  // ═══════════════════════════════════════

  {
    id: 'yima', name: '驿马', category: '出行',
    isAuspicious: true, priority: 78, source: '三命通会',
    modernExplain: '驿马主奔波移动，适合外出、旅行、迁移、变动。',
    applicable: '命中驿马，一生多动，适合出差、旅行、移民、变动工作。',
    conflicts: [],
    formula: '寅午戌见申，巳酉丑见亥，申子辰见寅，亥卯未见巳',
    calculator: (_yG, yZ, _mG, _mZ, _dG, dZ, _hG, hZ, _gender) => {
      const map: Record<string, EarthlyBranch> = {
        '寅': '申', '午': '申', '戌': '申',
        '巳': '亥', '酉': '亥', '丑': '亥',
        '申': '寅', '子': '寅', '辰': '寅',
        '亥': '巳', '卯': '巳', '未': '巳',
      }
      const targets: EarthlyBranch[] = []
      const t1 = map[yZ]; if (t1) targets.push(t1)
      const t2 = map[dZ]; if (t2 && !targets.includes(t2)) targets.push(t2)
      const zhiList: EarthlyBranch[] = [yZ, _mZ, dZ, hZ]
      const positions = findPositions(zhiList, targets)
      return { hit: positions.length > 0, positions, confidence: 0.88 }
    },
  },

  {
    id: 'huagai', name: '华盖', category: '特殊',
    isAuspicious: true, priority: 72, source: '三命通会',
    modernExplain: '华盖主聪明孤傲，有艺术才华，但也主孤独。',
    applicable: '命中华盖，聪明有才华，适合艺术、宗教、学术，但性格较孤傲。',
    conflicts: [],
    formula: '寅午戌见戌，巳酉丑见丑，申子辰见辰，亥卯未见未',
    calculator: (_yG, yZ, _mG, _mZ, _dG, dZ, _hG, hZ, _gender) => {
      const map: Record<string, EarthlyBranch> = {
        '寅': '戌', '午': '戌', '戌': '戌',
        '巳': '丑', '酉': '丑', '丑': '丑',
        '申': '辰', '子': '辰', '辰': '辰',
        '亥': '未', '卯': '未', '未': '未',
      }
      const targets: EarthlyBranch[] = []
      const t1 = map[yZ]; if (t1) targets.push(t1)
      const t2 = map[dZ]; if (t2 && !targets.includes(t2)) targets.push(t2)
      const zhiList: EarthlyBranch[] = [yZ, _mZ, dZ, hZ]
      const positions = findPositions(zhiList, targets)
      return { hit: positions.length > 0, positions, confidence: 0.88 }
    },
  },

  {
    id: 'xueren', name: '血刃', category: '健康',
    isAuspicious: false, priority: 76, source: '三命通会',
    modernExplain: '血刃主血光之灾，手术、外伤，注意身体健康。',
    applicable: '血刃入命，注意血光之灾，避免高危活动，定期体检。',
    conflicts: [],
    formula: '与羊刃同位（简化：日干查对应地支）',
    calculator: (_yG, _yZ, _mG, _mZ, dG, _dZ, _hG, _hZ, _gender) => {
      const map: Record<string, EarthlyBranch> = {
        '甲': '卯', '乙': '寅', '丙': '午', '戊': '午',
        '丁': '巳', '己': '巳', '庚': '酉', '辛': '申',
        '壬': '子', '癸': '亥',
      }
      const target = map[dG]
      if (!target) return { hit: false, positions: [], confidence: 0.80 }
      const zhiList: EarthlyBranch[] = [_yZ, _mZ, _dZ, _hZ]
      const positions = findPositions(zhiList, [target])
      return { hit: positions.length > 0, positions, confidence: 0.80 }
    },
  },

  {
    id: 'fuchen', name: '浮沉', category: '凶神',
    isAuspicious: false, priority: 68, source: '三命通会',
    modernExplain: '浮沉主运势起伏不定，事业波动，财运不稳。',
    applicable: '浮沉入命，运势起伏，事业波动，宜稳健理财，不宜投机。',
    conflicts: [],
    formula: '以年干查对应地支（简化版）',
    calculator: (yG, _yZ, _mG, _mZ, _dG, dZ, _hG, hZ, _gender) => {
      const map: Record<string, EarthlyBranch> = {
        '甲': '酉', '乙': '戌', '丙': '子', '丁': '丑',
        '戊': '寅', '己': '卯', '庚': '午', '辛': '未',
        '壬': '巳', '癸': '辰',
      }
      const target = map[yG]
      if (!target) return { hit: false, positions: [], confidence: 0.72 }
      const zhiList: EarthlyBranch[] = [_yZ, _mZ, dZ, hZ]
      const positions = findPositions(zhiList, [target])
      return { hit: positions.length > 0, positions, confidence: 0.72 }
    },
  },
]

// ─── 按 ID 索引 ───

export const SHEN_SHA_BY_ID: Record<string, ShenShaDefinition> = Object.fromEntries(
  SHEN_SHA_DATABASE.map(s => [s.id, s]),
)
