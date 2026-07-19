/**
 * 知识中心数据 — 7 个分类，每分类 5-8 篇初始文章
 */

export interface KnowledgeCategory {
  id: string
  name: string
  icon: string
  description: string
}

export interface KnowledgeArticle {
  id: string
  title: string
  summary: string
  slug: string
}

var CATEGORIES: KnowledgeCategory[] = [
  { id: 'bazi', name: '八字百科', icon: '\u2609', description: '八字命理基础理论' },
  { id: 'shishen', name: '十神百科', icon: '\u2605', description: '十神关系详解' },
  { id: 'wuxing', name: '五行百科', icon: '\u2601', description: '五行生克制化' },
  { id: 'tiangan', name: '天干地支', icon: '\u221E', description: '干支纪年系统' },
  { id: 'liuyao', name: '六十四卦', icon: '\u262F', description: '周易卦象解读' },
  { id: 'fengshui', name: '风水百科', icon: '\u25B3', description: '风水基础理论' },
  { id: 'terminology', name: '命理术语', icon: '\u270E', description: '常见命理名词解释' },
]

var ARTICLES: Record<string, KnowledgeArticle[]> = {
  'bazi': [
    { id: 'bazi-01', title: '什么是八字命理', summary: '八字命理是中国传统文化中的重要术数体系，通过出生年、月、日、时对应的天干地支来推算人生运势吉凶。本文介绍八字命理的起源、基本原理及其在现代社会的应用。', slug: 'what-is-bazi' },
    { id: 'bazi-02', title: '四柱排盘方法', summary: '四柱即年柱、月柱、日柱、时柱，是八字命理的基础框架。排盘需要根据出生时间精确换算为天干地支，涉及节气、时辰等知识。', slug: 'four-pillars-method' },
    { id: 'bazi-03', title: '日主详解', summary: '日主是八字命盘的核心，代表命主自身。日主的五行属性决定了命主的先天禀赋与基本性格特征，是分析八字的第一步。', slug: 'day-master-explained' },
    { id: 'bazi-04', title: '大运与流年', summary: '大运是人生每十年的运势走向，流年则是每一年的具体变化。大运与流年的干支与命局产生生克合化，影响个人各方面运势。', slug: 'dayun-liunian' },
    { id: 'bazi-05', title: '用神与喜神', summary: '用神是八字中最关键的概念之一，指命局中最需要的五行力量。喜神则是辅助用神的五行，二者共同构成命局调候的关键。', slug: 'yongshen-xishen' },
    { id: 'bazi-06', title: '八字格局概述', summary: '八字格局是根据命局中十神配合关系分类的体系，常见格局包括正官格、七杀格、正财格、偏财格、食神格等，不同格局代表不同的人生倾向。', slug: 'bazi-geju' },
    { id: 'bazi-07', title: '八字中的神煞', summary: '神煞是八字命理中的特殊星曜，如天乙贵人、文昌星、桃花星等。它们对命局的吉凶影响有辅助参考价值。', slug: 'bazi-shensha' },
  ],
  'shishen': [
    { id: 'ss-01', title: '十神基础概念', summary: '十神是八字命理中描述天干之间关系的核心体系，包括正官、七杀、正财、偏财、食神、伤官、正印、偏印、比肩、劫财十种关系。', slug: 'shishen-basics' },
    { id: 'ss-02', title: '正官与七杀', summary: '正官代表正统、约束与管理能力，七杀代表威权、魄力与挑战。二者同为克我之物，但性质截然不同，在命局中各有吉凶。', slug: 'zhengguan-qisha' },
    { id: 'ss-03', title: '正财与偏财', summary: '正财代表稳定的收入与物质基础，偏财代表意外之财与投资理财能力。财星是日主所克之五行，反映一个人的财富运势。', slug: 'zhengcai-piancai' },
    { id: 'ss-04', title: '食神与伤官', summary: '食神代表才华、口福与温和的表达，伤官代表叛逆、创造力与强烈的表达欲。二者同为日主所生之五行，但表现方式差异显著。', slug: 'shishen-shangguan' },
    { id: 'ss-05', title: '正印与偏印', summary: '正印代表学识、贵人、母亲，偏印又称枭神，代表偏门学问与独特见解。印星是生助日主的力量，关乎智慧与依靠。', slug: 'zhengyin-pianyin' },
    { id: 'ss-06', title: '比肩与劫财', summary: '比肩代表同辈朋友与竞争者，劫财代表争夺与消耗。比劫二星反映命主的人际关系与独立自主程度。', slug: 'bijie-jiecai' },
  ],
  'wuxing': [
    { id: 'wx-01', title: '五行基础理论', summary: '五行即金、木、水、火、土，是中国古代哲学的核心概念。五行之间通过相生相克的关系构建了一个动态平衡的系统，广泛应用于命理、中医、风水等领域。', slug: 'wuxing-basics' },
    { id: 'wx-02', title: '五行相生相克', summary: '五行相生：木生火、火生土、土生金、金生水、水生木。五行相克：木克土、土克水、水克火、火克金、金克木。生克关系构成了五行理论的核心。', slug: 'wuxing-shengke' },
    { id: 'wx-03', title: '五行旺衰判断', summary: '判断五行在命局中的旺衰是八字分析的关键步骤。通过月令、得令、得地、得势等条件，综合判断各五行的力量强弱。', slug: 'wuxing-wangshuai' },
    { id: 'wx-04', title: '五行与四季', summary: '五行的力量随季节变化而不同：春季木旺、夏季火旺、秋季金旺、冬季水旺、四季之交土旺。月令对命局五行旺衰有决定性影响。', slug: 'wuxing-seasons' },
    { id: 'wx-05', title: '五行对应关系', summary: '五行与方位、颜色、脏腑、情志等有系统的对应关系。木对应东方青色肝胆，火对应南方红色心小肠，土对应中央黄色脾胃，金对应西方白色肺大肠，水对应北方黑色肾膀胱。', slug: 'wuxing-correspondences' },
    { id: 'wx-06', title: '五行调候与平衡', summary: '调候是八字中的重要概念，指通过五行的生克来调节命局的寒暖燥湿。夏季出生需水调候，冬季出生需火调候，以达致命局平衡。', slug: 'wuxing-tiaohou' },
  ],
  'tiangan': [
    { id: 'tg-01', title: '天干详解', summary: '天干共十个：甲、乙、丙、丁、戊、己、庚、辛、壬、癸。每个天干都有独特的五行属性与阴阳属性，是干支纪年系统的核心组成部分。', slug: 'tiangan-explained' },
    { id: 'tg-02', title: '地支详解', summary: '地支共十二个：子、丑、寅、卯、辰、巳、午、未、申、酉、戌、亥。地支对应十二生肖，也对应一年十二个月份与十二时辰。', slug: 'dizhi-explained' },
    { id: 'tg-03', title: '天干五合', summary: '天干五合是甲己合化土、乙庚合化金、丙辛合化水、丁壬合化木、戊癸合化火。五合关系反映天干之间的亲和力与化气变化。', slug: 'tiangan-wuhe' },
    { id: 'tg-04', title: '地支六合', summary: '地支六合是子丑合土、寅亥合木、卯戌合火、辰酉合金、巳申合水、午未合火。六合代表地支之间的和谐关系与合化可能。', slug: 'dizhi-liuhe' },
    { id: 'tg-05', title: '地支三合', summary: '地支三合局：申子辰合水局、亥卯未合木局、寅午戌合火局、巳酉丑合金局。三合局是三个地支组成强力五行局的条件。', slug: 'dizhi-sanhe' },
    { id: 'tg-06', title: '地支相冲', summary: '地支六冲：子午冲、丑未冲、寅申冲、卯酉冲、辰戌冲、巳亥冲。相冲代表对立与冲突，在命局中往往带来变化与动荡。', slug: 'dizhi-xiangchong' },
    { id: 'tg-07', title: '地支三刑', summary: '地支三刑包括寅巳申无恩之刑、丑戌未恃势之刑、子卯无礼之刑、辰辰自刑、午午自刑、酉酉自刑、亥亥自刑。三刑主刑罚、是非与灾祸。', slug: 'dizhi-sanxing' },
  ],
  'liuyao': [
    { id: 'ly-01', title: '六十四卦概述', summary: '六十四卦源于《周易》，由八个基本卦（乾、坤、震、巽、坎、离、艮、兑）两两组合而成。每卦六爻，共三百八十四爻，构成了完整的卦象体系。', slug: 'liuyao-overview' },
    { id: 'ly-02', title: '八卦基础', summary: '八卦是六十四卦的基本构成元素。乾为天、坤为地、震为雷、巽为风、坎为水、离为火、艮为山、兑为泽，每种卦象代表不同的自然现象与人事。', slug: 'bagua-basics' },
    { id: 'ly-03', title: '乾卦与坤卦', summary: '乾卦为纯阳之卦，象征天、刚健、父亲；坤卦为纯阴之卦，象征地、柔顺、母亲。乾坤两卦是六十四卦的门户，理解它们是学习周易的基础。', slug: 'qian-kun-gua' },
    { id: 'ly-04', title: '卦变与互卦', summary: '卦变指一卦变为另一卦的过程，互卦是由本卦二至五爻组成的新卦。卦变与互卦的分析能揭示事物发展的深层趋势与隐藏因素。', slug: 'guabian-hugua' },
    { id: 'ly-05', title: '六爻占卜方法', summary: '六爻占卜通过铜钱摇卦或时间起卦获得卦象，结合用神、六亲、六神、世应关系进行分析。六爻占卜是周易预测术中最常用的方法之一。', slug: 'liuyao-method' },
  ],
  'fengshui': [
    { id: 'fs-01', title: '风水基础理论', summary: '风水学是中国传统的环境学问，核心思想是通过调整人居环境与自然气场的关系，达到趋吉避凶的目的。风水分为形峦派与理气派两大流派。', slug: 'fengshui-basics' },
    { id: 'fs-02', title: '形峦派风水', summary: '形峦派注重山水形势、建筑形态的外在观察，讲究"龙、穴、砂、水、向"五大要素。通过直观的环境分析来判断风水吉凶。', slug: 'xingluan-school' },
    { id: 'fs-03', title: '理气派风水', summary: '理气派运用罗盘方位与时间推算，以八卦、九星、玄空飞星等理论分析气场的流动与变化。强调方位、时间与空间的配合。', slug: 'liqi-school' },
    { id: 'fs-04', title: '家居风水要点', summary: '家居风水关注客厅、卧室、厨房、卫生间等区域的风水布局。包括门的朝向、床位摆放、灶台位置、卫生间方位等关键要素。', slug: 'home-fengshui' },
    { id: 'fs-05', title: '办公室风水', summary: '办公室风水涉及办公桌朝向、座位布局、植物摆放、财位设置等方面。良好的办公风水有助于提升工作效率与事业运势。', slug: 'office-fengshui' },
    { id: 'fs-06', title: '玄空飞星基础', summary: '玄空飞星是理气派风水的重要方法，通过九宫飞星的轮转推算不同时间段各方位的吉凶。每二十年为一个元运，是现代阳宅风水中常用的技术。', slug: 'xuankong-feixing' },
  ],
  'terminology': [
    { id: 'tm-01', title: '命盘与排盘', summary: '命盘是根据出生时间排出的天干地支组合图，包括四柱八字、大运、流年等信息。排盘是命理分析的第一步，准确排盘是准确分析的前提。', slug: 'mingpai-paipan' },
    { id: 'tm-02', title: '命宫与身宫', summary: '命宫是八字命理中代表命主核心特质的宫位，身宫则反映后天努力的方向。二者配合分析能更全面地了解一个人的先天与后天特征。', slug: 'minggong-shengong' },
    { id: 'tm-03', title: '贵人星与文昌星', summary: '天乙贵人是命理中最吉的神煞之一，代表逢凶化吉的贵人运。文昌星主学业与文职，对考试、写作、学术研究有利。', slug: 'guiren-wenchang' },
    { id: 'tm-04', title: '桃花星与红鸾星', summary: '桃花星与红鸾星都与感情婚姻相关。桃花星主异性缘与社交魅力，红鸾星主喜庆婚嫁。在命局中的位置与强弱影响个人的感情运势。', slug: 'taohua-hongluan' },
    { id: 'tm-05', title: '驿马星与迁移', summary: '驿马星主奔波、迁移与变动，命中带驿马的人往往有较多出差、搬迁或远行的机会。驿马的吉凶取决于与命局的配合关系。', slug: 'yima-qianyi' },
    { id: 'tm-06', title: '空亡与截路', summary: '空亡是命理中的重要概念，指某些干支组合中缺少的五行力量。空亡影响命局的完整性与某些十神的力量发挥。', slug: 'kongwang-jielu' },
    { id: 'tm-07', title: '纳音五行', summary: '纳音五行是将六十甲子分为三十对，每对对应一种特定的五行属性与象征物。纳音在八字合婚、择日等领域有重要应用。', slug: 'nayin-wuxing' },
    { id: 'tm-08', title: '神煞总览', summary: '神煞是八字命理中的辅助判断工具，包括吉神与凶煞两大类。常见的吉神有天乙贵人、文昌、天德、月德等，凶煞有羊刃、孤辰、寡宿等。', slug: 'shensha-overview' },
  ],
}

/** 获取某分类下的所有文章 */
function getArticlesByCategory(categoryId: string): KnowledgeArticle[] {
  return ARTICLES[categoryId] || []
}

/** 根据 slug 查找文章及其所属分类 */
function findArticleBySlug(slug: string): { article: KnowledgeArticle; categoryId: string; categoryName: string } | null {
  for (var i = 0; i < CATEGORIES.length; i++) {
    var cat = CATEGORIES[i]
    var articles = ARTICLES[cat.id]
    if (!articles) continue
    for (var j = 0; j < articles.length; j++) {
      if (articles[j].slug === slug) {
        return { article: articles[j], categoryId: cat.id, categoryName: cat.name }
      }
    }
  }
  return null
}

/** 获取所有文章总数 */
function getTotalArticleCount(): number {
  var count = 0
  var keys = Object.keys(ARTICLES)
  for (var i = 0; i < keys.length; i++) {
    count += ARTICLES[keys[i]].length
  }
  return count
}

export { CATEGORIES, ARTICLES, getArticlesByCategory, findArticleBySlug, getTotalArticleCount }