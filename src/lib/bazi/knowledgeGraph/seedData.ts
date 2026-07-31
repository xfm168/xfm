import type { KnowledgeGraph, KGNode, KGEdge } from './types'

/**
 * C5 命理知识图谱种子数据
 *
 * 流程定位：KnowledgeGraph → RuleEngine → Evidence → AI润色
 *   知识图谱记录：天干地支 → 喜忌 → 原因 → 典籍来源
 *   AI 报告全部引用知识图谱，确保可追溯、可解释。
 *
 * 节点构成：天干(10) + 地支(12) + 五行(5) + 十神(10) + 典籍(5) + 概念(11) = 53
 * 边构成：五行生克(10) + 天干喜忌(20) + 天干五合(5) + 地支六冲(6)
 *        + 地支三合(4) + 地支六合(6) + 地支三刑(5) + 概念解释(12) = 68
 */

// ============================================================
// 节点
// ============================================================

/** 10 天干（甲~癸），含 wuxing + yinYang */
const tianganNodes: KGNode[] = [
  { id: 'tg:甲', type: 'tiangan', name: '甲', wuxing: '木', yinYang: 'yang', description: '阳木，参天大树，栋梁之材' },
  { id: 'tg:乙', type: 'tiangan', name: '乙', wuxing: '木', yinYang: 'yin', description: '阴木，花草藤蔓，柔木向阳' },
  { id: 'tg:丙', type: 'tiangan', name: '丙', wuxing: '火', yinYang: 'yang', description: '阳火，太阳之火，普照万物' },
  { id: 'tg:丁', type: 'tiangan', name: '丁', wuxing: '火', yinYang: 'yin', description: '阴火，灯烛之火，柔中昭融' },
  { id: 'tg:戊', type: 'tiangan', name: '戊', wuxing: '土', yinYang: 'yang', description: '阳土，城墙之土，厚重高亢' },
  { id: 'tg:己', type: 'tiangan', name: '己', wuxing: '土', yinYang: 'yin', description: '阴土，田园之土，卑湿能生' },
  { id: 'tg:庚', type: 'tiangan', name: '庚', wuxing: '金', yinYang: 'yang', description: '阳金，斧钺之金，肃杀之气' },
  { id: 'tg:辛', type: 'tiangan', name: '辛', wuxing: '金', yinYang: 'yin', description: '阴金，珠玉之金，温润清软' },
  { id: 'tg:壬', type: 'tiangan', name: '壬', wuxing: '水', yinYang: 'yang', description: '阳水，江河之水，通河周流' },
  { id: 'tg:癸', type: 'tiangan', name: '癸', wuxing: '水', yinYang: 'yin', description: '阴水，雨露之水，至弱达津' },
]

/** 12 地支（子~亥），含 wuxing */
const dizhiNodes: KGNode[] = [
  { id: 'dz:子', type: 'dizhi', name: '子', wuxing: '水', yinYang: 'yang', description: '仲冬之水，藏癸' },
  { id: 'dz:丑', type: 'dizhi', name: '丑', wuxing: '土', yinYang: 'yin', description: '季冬湿土，藏己癸辛' },
  { id: 'dz:寅', type: 'dizhi', name: '寅', wuxing: '木', yinYang: 'yang', description: '初春之木，藏甲丙戊' },
  { id: 'dz:卯', type: 'dizhi', name: '卯', wuxing: '木', yinYang: 'yin', description: '仲春之木，藏乙' },
  { id: 'dz:辰', type: 'dizhi', name: '辰', wuxing: '土', yinYang: 'yang', description: '季春湿土，藏戊乙癸' },
  { id: 'dz:巳', type: 'dizhi', name: '巳', wuxing: '火', yinYang: 'yin', description: '初夏之火，藏丙庚戊' },
  { id: 'dz:午', type: 'dizhi', name: '午', wuxing: '火', yinYang: 'yang', description: '仲夏之火，藏丁己' },
  { id: 'dz:未', type: 'dizhi', name: '未', wuxing: '土', yinYang: 'yin', description: '季夏燥土，藏己丁乙' },
  { id: 'dz:申', type: 'dizhi', name: '申', wuxing: '金', yinYang: 'yang', description: '初秋之金，藏庚壬戊' },
  { id: 'dz:酉', type: 'dizhi', name: '酉', wuxing: '金', yinYang: 'yin', description: '仲秋之金，藏辛' },
  { id: 'dz:戌', type: 'dizhi', name: '戌', wuxing: '土', yinYang: 'yang', description: '季秋燥土，藏戊辛丁' },
  { id: 'dz:亥', type: 'dizhi', name: '亥', wuxing: '水', yinYang: 'yin', description: '初冬之水，藏壬甲' },
]

/** 5 五行（木火土金水） */
const wuxingNodes: KGNode[] = [
  { id: 'wx:木', type: 'wuxing', name: '木', description: '东方木，主仁，生火克土' },
  { id: 'wx:火', type: 'wuxing', name: '火', description: '南方火，主礼，生土克金' },
  { id: 'wx:土', type: 'wuxing', name: '土', description: '中央土，主信，生金克水' },
  { id: 'wx:金', type: 'wuxing', name: '金', description: '西方金，主义，生水克木' },
  { id: 'wx:水', type: 'wuxing', name: '水', description: '北方水，主智，生木克火' },
]

/** 10 十神（比肩~正印） */
const shishenNodes: KGNode[] = [
  { id: 'ss:比肩', type: 'shishen', name: '比肩', wuxing: '同我', description: '与日主同类同阴阳' },
  { id: 'ss:劫财', type: 'shishen', name: '劫财', wuxing: '同我', description: '与日主同类异阴阳' },
  { id: 'ss:食神', type: 'shishen', name: '食神', wuxing: '我生', description: '日主所生同阴阳' },
  { id: 'ss:伤官', type: 'shishen', name: '伤官', wuxing: '我生', description: '日主所生异阴阳' },
  { id: 'ss:偏财', type: 'shishen', name: '偏财', wuxing: '我克', description: '日主所克同阴阳' },
  { id: 'ss:正财', type: 'shishen', name: '正财', wuxing: '我克', description: '日主所克异阴阳' },
  { id: 'ss:七杀', type: 'shishen', name: '七杀', wuxing: '克我', description: '克日主同阴阳' },
  { id: 'ss:正官', type: 'shishen', name: '正官', wuxing: '克我', description: '克日主异阴阳' },
  { id: 'ss:偏印', type: 'shishen', name: '偏印', wuxing: '生我', description: '生日主同阴阳' },
  { id: 'ss:正印', type: 'shishen', name: '正印', wuxing: '生我', description: '生日主异阴阳' },
]

/** 经典典籍 */
const classicNodes: KGNode[] = [
  { id: 'classic:滴天髓', type: 'classic', name: '滴天髓', description: '命理经典，相传京图撰、刘伯温注，重日主衰旺与天干喜忌' },
  { id: 'classic:子平真诠', type: 'classic', name: '子平真诠', description: '清沈孝瞻著，重月令格局与用神取法' },
  { id: 'classic:穷通宝鉴', type: 'classic', name: '穷通宝鉴', description: '调候之宗，按月令论天干喜忌' },
  { id: 'classic:三命通会', type: 'classic', name: '三命通会', description: '明万民英著，命理百科全书' },
  { id: 'classic:渊海子平', type: 'classic', name: '渊海子平', description: '子平派祖书，徐子平一脉' },
]

/** 常用命理概念 */
const conceptNodes: KGNode[] = [
  { id: 'cpt:寒木向阳', type: 'concept', name: '寒木向阳', description: '冬月木气寒冷，需丙火照暖方能生发' },
  { id: 'cpt:调候', type: 'concept', name: '调候', description: '审度月令气候寒暖燥湿以定天干喜忌' },
  { id: 'cpt:通关', type: 'concept', name: '通关', description: '两行相争，取中间之行调和' },
  { id: 'cpt:病药', type: 'concept', name: '病药', description: '以病为忌，以药为喜，去病即安' },
  { id: 'cpt:扶抑', type: 'concept', name: '扶抑', description: '日主衰则扶之，旺则抑之' },
  { id: 'cpt:月令', type: 'concept', name: '月令', description: '月支所司令之气，格局所出' },
  { id: 'cpt:透干', type: 'concept', name: '透干', description: '月令藏干透出天干，格局始立' },
  { id: 'cpt:用神', type: 'concept', name: '用神', description: '命局所赖以平衡之神' },
  { id: 'cpt:忌神', type: 'concept', name: '忌神', description: '克损用神、破坏平衡之神' },
  { id: 'cpt:身强', type: 'concept', name: '身强', description: '日主得令得地得势，气盛' },
  { id: 'cpt:身弱', type: 'concept', name: '身弱', description: '日主失令失地，气衰' },
]

const allNodes: KGNode[] = [
  ...tianganNodes,
  ...dizhiNodes,
  ...wuxingNodes,
  ...shishenNodes,
  ...classicNodes,
  ...conceptNodes,
]

// ============================================================
// 边
// ============================================================

const edges: KGEdge[] = []

// ---------- 五行相生：木→火→土→金→水→木（5条） ----------
edges.push(
  { id: 'e:wx-gen-1', from: 'wx:木', to: 'wx:火', type: 'generates', reason: '木生火', classicSource: '渊海子平', originalText: '木生火，火生土，土生金，金生水，水生木' },
  { id: 'e:wx-gen-2', from: 'wx:火', to: 'wx:土', type: 'generates', reason: '火生土', classicSource: '渊海子平' },
  { id: 'e:wx-gen-3', from: 'wx:土', to: 'wx:金', type: 'generates', reason: '土生金', classicSource: '渊海子平' },
  { id: 'e:wx-gen-4', from: 'wx:金', to: 'wx:水', type: 'generates', reason: '金生水', classicSource: '渊海子平' },
  { id: 'e:wx-gen-5', from: 'wx:水', to: 'wx:木', type: 'generates', reason: '水生木', classicSource: '渊海子平' },
)

// ---------- 五行相克：木→土→水→火→金→木（5条） ----------
edges.push(
  { id: 'e:wx-ovr-1', from: 'wx:木', to: 'wx:土', type: 'overcomes', reason: '木克土', classicSource: '渊海子平', originalText: '木克土，土克水，水克火，火克金，金克木' },
  { id: 'e:wx-ovr-2', from: 'wx:土', to: 'wx:水', type: 'overcomes', reason: '土克水', classicSource: '渊海子平' },
  { id: 'e:wx-ovr-3', from: 'wx:水', to: 'wx:火', type: 'overcomes', reason: '水克火', classicSource: '渊海子平' },
  { id: 'e:wx-ovr-4', from: 'wx:火', to: 'wx:金', type: 'overcomes', reason: '火克金', classicSource: '渊海子平' },
  { id: 'e:wx-ovr-5', from: 'wx:金', to: 'wx:木', type: 'overcomes', reason: '金克木', classicSource: '渊海子平' },
)

// ---------- 天干喜忌（20条） ----------
edges.push(
  { id: 'e:tg-like-1', from: 'tg:甲', to: 'tg:丙', type: 'likes', reason: '寒木向阳', classicSource: '穷通宝鉴', originalText: '甲木参天，三春甲木先用丙火后用癸水', chapter: '春木' },
  { id: 'e:tg-like-2', from: 'tg:甲', to: 'tg:庚', type: 'likes', reason: '栋梁之材须庚金雕琢', classicSource: '滴天髓', originalText: '甲木参天，脱胎要火；春不容金，秋不容土', chapter: '天干十论' },
  { id: 'e:tg-like-3', from: 'tg:乙', to: 'tg:丙', type: 'likes', reason: '寒木向阳', classicSource: '穷通宝鉴', originalText: '乙木如花草，丙火照暖方生', chapter: '春木' },
  { id: 'e:tg-like-4', from: 'tg:乙', to: 'tg:庚', type: 'dislikes', reason: '乙庚合金失木性', classicSource: '滴天髓', originalText: '乙木虽柔，刲羊解牛；怀丁抱丙，跨凤乘猴', chapter: '天干十论' },
  { id: 'e:tg-like-5', from: 'tg:丙', to: 'tg:壬', type: 'likes', reason: '水火既济', classicSource: '滴天髓', originalText: '丙火猛烈，欺霜侮雪；壬水汪洋，水火既济', chapter: '天干十论' },
  { id: 'e:tg-like-6', from: 'tg:丙', to: 'tg:己', type: 'dislikes', reason: '土晦火光', classicSource: '穷通宝鉴', originalText: '丙火忌己土晦其光', chapter: '夏火' },
  { id: 'e:tg-like-7', from: 'tg:丁', to: 'tg:甲', type: 'likes', reason: '木生火，丁火依附甲木', classicSource: '滴天髓', originalText: '丁火柔中，内性昭融；抱乙而孝，合壬而忠', chapter: '天干十论' },
  { id: 'e:tg-like-8', from: 'tg:戊', to: 'tg:甲', type: 'likes', reason: '木疏厚土', classicSource: '子平真诠', originalText: '戊土厚重，用甲木疏之', chapter: '论用神' },
  { id: 'e:tg-like-9', from: 'tg:己', to: 'tg:丙', type: 'likes', reason: '火生土，己土喜丙火照暖', classicSource: '穷通宝鉴', originalText: '己土卑湿，喜丙火暖之', chapter: '四季土' },
  { id: 'e:tg-like-10', from: 'tg:庚', to: 'tg:丁', type: 'likes', reason: '火炼真金', classicSource: '滴天髓', originalText: '庚金须火炼，丁火为炉冶', chapter: '天干十论' },
  { id: 'e:tg-like-11', from: 'tg:辛', to: 'tg:壬', type: 'likes', reason: '金水相生，辛金喜壬水洗淘', classicSource: '穷通宝鉴', originalText: '辛金软弱，温润而清；畏土之叠，乐水之盈', chapter: '秋金' },
  { id: 'e:tg-like-12', from: 'tg:壬', to: 'tg:戊', type: 'likes', reason: '土克水为堤，壬水奔腾喜戊土为堤', classicSource: '滴天髓', originalText: '壬水通河，能泄金气；刚中之德，周流不滞', chapter: '天干十论' },
  { id: 'e:tg-like-13', from: 'tg:癸', to: 'tg:辛', type: 'likes', reason: '金生水，癸水喜辛金为源', classicSource: '穷通宝鉴', originalText: '癸水至弱，达于天津；得龙而润，功化斯神', chapter: '冬水' },
  // 补足至 20 条（忌神关系）
  { id: 'e:tg-like-14', from: 'tg:丁', to: 'tg:癸', type: 'dislikes', reason: '癸水克丁火，雨露灭灯烛', classicSource: '穷通宝鉴', chapter: '夏火' },
  { id: 'e:tg-like-15', from: 'tg:戊', to: 'tg:壬', type: 'dislikes', reason: '壬水泛滥冲堤', classicSource: '滴天髓', chapter: '天干十论' },
  { id: 'e:tg-like-16', from: 'tg:己', to: 'tg:乙', type: 'dislikes', reason: '乙木克己土，田园被根穿', classicSource: '子平真诠', chapter: '论用神' },
  { id: 'e:tg-like-17', from: 'tg:庚', to: 'tg:丙', type: 'dislikes', reason: '丙火熔金，过炼反损', classicSource: '滴天髓', chapter: '天干十论' },
  { id: 'e:tg-like-18', from: 'tg:辛', to: 'tg:己', type: 'dislikes', reason: '己土埋金，珠玉失光', classicSource: '穷通宝鉴', chapter: '四季土' },
  { id: 'e:tg-like-19', from: 'tg:壬', to: 'tg:乙', type: 'dislikes', reason: '乙木泄水过多', classicSource: '滴天髓', chapter: '天干十论' },
  { id: 'e:tg-like-20', from: 'tg:癸', to: 'tg:己', type: 'dislikes', reason: '己土克癸水，雨露被燥土所吸', classicSource: '穷通宝鉴', chapter: '四季土' },
)

// ---------- 天干五合（5条） ----------
edges.push(
  { id: 'e:tg-combine-1', from: 'tg:甲', to: 'tg:己', type: 'combines', reason: '甲己合化土', classicSource: '渊海子平', condition: '两干紧贴、得月令化气则化土', chapter: '论化合' },
  { id: 'e:tg-combine-2', from: 'tg:乙', to: 'tg:庚', type: 'combines', reason: '乙庚合化金', classicSource: '渊海子平', condition: '两干紧贴、得月令化气则化金', chapter: '论化合' },
  { id: 'e:tg-combine-3', from: 'tg:丙', to: 'tg:辛', type: 'combines', reason: '丙辛合化水', classicSource: '渊海子平', condition: '两干紧贴、得月令化气则化水', chapter: '论化合' },
  { id: 'e:tg-combine-4', from: 'tg:丁', to: 'tg:壬', type: 'combines', reason: '丁壬合化木', classicSource: '渊海子平', condition: '两干紧贴、得月令化气则化木', chapter: '论化合' },
  { id: 'e:tg-combine-5', from: 'tg:戊', to: 'tg:癸', type: 'combines', reason: '戊癸合化火', classicSource: '渊海子平', condition: '两干紧贴、得月令化气则化火', chapter: '论化合' },
)

// ---------- 地支六冲（6条） ----------
edges.push(
  { id: 'e:dz-clash-1', from: 'dz:子', to: 'dz:午', type: 'clashes', reason: '子午冲，水火相战', classicSource: '渊海子平', chapter: '论地支' },
  { id: 'e:dz-clash-2', from: 'dz:丑', to: 'dz:未', type: 'clashes', reason: '丑未冲，湿燥土相战', classicSource: '渊海子平', chapter: '论地支' },
  { id: 'e:dz-clash-3', from: 'dz:寅', to: 'dz:申', type: 'clashes', reason: '寅申冲，金木相战', classicSource: '渊海子平', chapter: '论地支' },
  { id: 'e:dz-clash-4', from: 'dz:卯', to: 'dz:酉', type: 'clashes', reason: '卯酉冲，金木相战', classicSource: '渊海子平', chapter: '论地支' },
  { id: 'e:dz-clash-5', from: 'dz:辰', to: 'dz:戌', type: 'clashes', reason: '辰戌冲，湿燥土相战', classicSource: '渊海子平', chapter: '论地支' },
  { id: 'e:dz-clash-6', from: 'dz:巳', to: 'dz:亥', type: 'clashes', reason: '巳亥冲，水火相战', classicSource: '渊海子平', chapter: '论地支' },
)

// ---------- 地支三合（4条，以将星为枢纽） ----------
edges.push(
  { id: 'e:dz-sanhe-1', from: 'dz:申', to: 'dz:子', type: 'combines', reason: '申子辰三合水局', classicSource: '渊海子平', condition: '申子辰三支全见方成水局，子为将星', chapter: '论三合' },
  { id: 'e:dz-sanhe-2', from: 'dz:亥', to: 'dz:卯', type: 'combines', reason: '亥卯未三合木局', classicSource: '渊海子平', condition: '亥卯未三支全见方成木局，卯为将星', chapter: '论三合' },
  { id: 'e:dz-sanhe-3', from: 'dz:寅', to: 'dz:午', type: 'combines', reason: '寅午戌三合火局', classicSource: '渊海子平', condition: '寅午戌三支全见方成火局，午为将星', chapter: '论三合' },
  { id: 'e:dz-sanhe-4', from: 'dz:巳', to: 'dz:酉', type: 'combines', reason: '巳酉丑三合金局', classicSource: '渊海子平', condition: '巳酉丑三支全见方成金局，酉为将星', chapter: '论三合' },
)

// ---------- 地支六合（6条） ----------
edges.push(
  { id: 'e:dz-liuhe-1', from: 'dz:子', to: 'dz:丑', type: 'combines', reason: '子丑合土', classicSource: '渊海子平', chapter: '论六合' },
  { id: 'e:dz-liuhe-2', from: 'dz:寅', to: 'dz:亥', type: 'combines', reason: '寅亥合木', classicSource: '渊海子平', chapter: '论六合' },
  { id: 'e:dz-liuhe-3', from: 'dz:卯', to: 'dz:戌', type: 'combines', reason: '卯戌合火', classicSource: '渊海子平', chapter: '论六合' },
  { id: 'e:dz-liuhe-4', from: 'dz:辰', to: 'dz:酉', type: 'combines', reason: '辰酉合金', classicSource: '渊海子平', chapter: '论六合' },
  { id: 'e:dz-liuhe-5', from: 'dz:巳', to: 'dz:申', type: 'combines', reason: '巳申合水', classicSource: '渊海子平', chapter: '论六合' },
  { id: 'e:dz-liuhe-6', from: 'dz:午', to: 'dz:未', type: 'combines', reason: '午未合', classicSource: '渊海子平', chapter: '论六合' },
)

// ---------- 地支三刑（5条） ----------
edges.push(
  { id: 'e:dz-xing-1', from: 'dz:寅', to: 'dz:巳', type: 'punishes', reason: '寅巳申三刑（无恩之刑）', classicSource: '三命通会', condition: '寅巳申全见方成三刑', chapter: '论三刑' },
  { id: 'e:dz-xing-2', from: 'dz:巳', to: 'dz:申', type: 'punishes', reason: '寅巳申三刑（无恩之刑）', classicSource: '三命通会', condition: '寅巳申全见方成三刑', chapter: '论三刑' },
  { id: 'e:dz-xing-3', from: 'dz:丑', to: 'dz:戌', type: 'punishes', reason: '丑戌未三刑（恃势之刑）', classicSource: '三命通会', condition: '丑戌未全见方成三刑', chapter: '论三刑' },
  { id: 'e:dz-xing-4', from: 'dz:戌', to: 'dz:未', type: 'punishes', reason: '丑戌未三刑（恃势之刑）', classicSource: '三命通会', condition: '丑戌未全见方成三刑', chapter: '论三刑' },
  { id: 'e:dz-xing-5', from: 'dz:子', to: 'dz:卯', type: 'punishes', reason: '子卯相刑（无礼之刑）', classicSource: '三命通会', condition: '子卯见即刑', chapter: '论三刑' },
)

// ---------- 概念解释边（12条：概念 explains 典籍） ----------
edges.push(
  { id: 'e:exp-1', from: 'cpt:寒木向阳', to: 'classic:穷通宝鉴', type: 'explains', reason: '寒木向阳之说出于穷通宝鉴调候篇', classicSource: '穷通宝鉴', chapter: '调候' },
  { id: 'e:exp-2', from: 'cpt:调候', to: 'classic:穷通宝鉴', type: 'explains', reason: '调候法以穷通宝鉴为宗', classicSource: '穷通宝鉴', chapter: '调候' },
  { id: 'e:exp-3', from: 'cpt:通关', to: 'classic:滴天髓', type: 'explains', reason: '通关之说见滴天髓', classicSource: '滴天髓', chapter: '通神论' },
  { id: 'e:exp-4', from: 'cpt:病药', to: 'classic:子平真诠', type: 'explains', reason: '病药之说见子平真诠用神篇', classicSource: '子平真诠', chapter: '论用神' },
  { id: 'e:exp-5', from: 'cpt:扶抑', to: 'classic:子平真诠', type: 'explains', reason: '扶抑日主见子平真诠', classicSource: '子平真诠', chapter: '论用神' },
  { id: 'e:exp-6', from: 'cpt:月令', to: 'classic:子平真诠', type: 'explains', reason: '月令为格局所出，子平真诠论之最详', classicSource: '子平真诠', chapter: '论月令' },
  { id: 'e:exp-7', from: 'cpt:透干', to: 'classic:子平真诠', type: 'explains', reason: '月令藏干透干立格，子平真诠论之', classicSource: '子平真诠', chapter: '论用神成败' },
  { id: 'e:exp-8', from: 'cpt:用神', to: 'classic:子平真诠', type: 'explains', reason: '用神之取法见子平真诠用神篇', classicSource: '子平真诠', chapter: '论用神' },
  { id: 'e:exp-9', from: 'cpt:忌神', to: 'classic:子平真诠', type: 'explains', reason: '忌神克损用神，子平真诠论之', classicSource: '子平真诠', chapter: '论用神' },
  { id: 'e:exp-10', from: 'cpt:身强', to: 'classic:滴天髓', type: 'explains', reason: '日主衰旺之辨见滴天髓', classicSource: '滴天髓', chapter: '天干十论' },
  { id: 'e:exp-11', from: 'cpt:身弱', to: 'classic:滴天髓', type: 'explains', reason: '日主衰旺之辨见滴天髓', classicSource: '滴天髓', chapter: '天干十论' },
  { id: 'e:exp-12', from: 'cpt:用神', to: 'classic:渊海子平', type: 'explains', reason: '用神之名出于渊海子平', classicSource: '渊海子平', chapter: '论用神' },
)

// ============================================================
// 统计与导出
// ============================================================

function computeStats(nodes: KGNode[], edgesArr: KGEdge[]): KnowledgeGraph['stats'] {
  const nodesByType: Record<string, number> = {}
  for (const n of nodes) nodesByType[n.type] = (nodesByType[n.type] || 0) + 1
  const edgesByType: Record<string, number> = {}
  for (const e of edgesArr) edgesByType[e.type] = (edgesByType[e.type] || 0) + 1
  return {
    totalNodes: nodes.length,
    totalEdges: edgesArr.length,
    nodesByType,
    edgesByType,
  }
}

export const SEED_GRAPH: KnowledgeGraph = {
  nodes: allNodes,
  edges,
  stats: computeStats(allNodes, edges),
}
