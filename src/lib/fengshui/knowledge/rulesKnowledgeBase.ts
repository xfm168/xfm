/**
 * 风水规则库（Knowledge Base）V3.0
 *
 * 用户核心要求：把每一条分析建议都对应到明确的规则，
 * 而不是每次都完全依赖大模型自由生成。
 *
 * 设计原则：
 * - 规则编号唯一
 * - 触发条件明确
 * - 建议模板化（含可变参数占位符）
 * - 避免绝对化表达（"建议/倾向/可能/通常"）
 * - 区分传统风水观点 vs 空间布局建议
 */

import type { FengShuiAdjustment, IssueSeverity, FengShuiTerm, FengShuiRisk } from '../types'

// ────────── 规则条目结构 ──────────

export interface RuleKnowledgeEntry {
  /** 规则唯一编号 */
  ruleId: string
  /** 规则名称 */
  name: string
  /** 触发条件描述 */
  triggerCondition: string
  /** 对应风水原理 */
  principle: string
  /** 通俗解释（面向用户） */
 通俗解释: string
  /** 问题级别 */
  severity: IssueSeverity
  /** 改善难度 */
  difficulty: 'low' | 'medium' | 'high'
  /** 建议模板（含 {变量} 占位符） */
  suggestionTemplate: string
  /** 原因模板 */
  causeTemplate: string
  /** 预计效果模板 */
  expectedEffectTemplate: string
  /** 注意事项模板 */
  cautionsTemplate: string
  /** 关联术语 */
  relatedTerms: string[]
  /** 是否属于传统风水观点 */
  isTraditionalView: boolean
  /** 影响方面 */
  impactAreas: ('health' | 'wealth' | 'career' | 'relationship' | 'study' | 'sleep')[]
  /** 古籍引用（可选） */
  classicalRef?: string
}

// ────────── 核心规则库 ──────────

export const RULE_KNOWLEDGE_BASE: Record<string, RuleKnowledgeEntry> = {
  // ===== 格局类 =====
  'FS-PAT-001': {
    ruleId: 'FS-PAT-001',
    name: '户型方正',
    triggerCondition: '户型形状为 square 或 rectangle，缺角数为 0',
    principle: '《黄帝宅经》："宅以形势为身体"，方正户型气场均匀分布，不易形成煞气聚集点。',
    通俗解释: '方正的户型就像人的身体结构均衡，气流能在各个空间顺畅流通，不会出现某些角落气场过强或过弱的情况。',
    severity: 'suggestion',
    difficulty: 'low',
    suggestionTemplate: '建议保持现有方正格局，家具摆放以对称均衡为宜，避免破坏整体气场的平衡分布。',
    causeTemplate: '户型方正为吉相，通常不需要特别调整。',
    expectedEffectTemplate: '维持现有良好气场，有助于居住者各方面运势平稳发展。',
    cautionsTemplate: '装修时应避免在房屋中心位置设置重物压顶，以免破坏中宫气场。',
    relatedTerms: ['中宫', '气场', '藏风聚气'],
    isTraditionalView: true,
    impactAreas: ['health', 'wealth', 'career'],
    classicalRef: '《黄帝宅经》',
  },

  'FS-PAT-002': {
    ruleId: 'FS-PAT-002',
    name: '户型缺角',
    triggerCondition: '户型存在 missingCorners，缺角数 >= 1',
    principle: '传统风水理论认为，房屋八个方位对应家庭成员及运势，缺角可能导致对应方面的气场不足。',
    通俗解释: '房屋就像一个完整的能量场，缺了一个角就像人缺了一块拼图，对应方向所代表的能量可能较弱。',
    severity: 'moderate',
    difficulty: 'medium',
    suggestionTemplate: '建议在{direction}方位摆放对应五行属性的摆件或植物进行弥补。例如：缺东方（木）可摆放绿植；缺西方（金）可放置金属装饰。',
    causeTemplate: '户型在{direction}方向存在缺角，可能影响该方位对应的家庭成员运势。',
    expectedEffectTemplate: '通过五行补救，通常可在一定程度上平衡缺角带来的气场不足。',
    cautionsTemplate: '补救方法应以轻软装为主，不建议进行结构性改动。效果因人而异，建议结合实际情况调整。',
    relatedTerms: ['缺角', '五行', '八卦方位', '气场'],
    isTraditionalView: true,
    impactAreas: ['health', 'wealth', 'relationship'],
    classicalRef: '《阳宅十书》',
  },

  'FS-PAT-003': {
    ruleId: 'FS-PAT-003',
    name: '穿堂煞（穿堂风）',
    triggerCondition: '入户门正对窗户、阳台或另一扇门，形成直通气流',
    principle: '风水讲究"藏风聚气"，气流直进直出无法在室内回旋聚集，财气与生气易散失。',
    通俗解释: '如果大门进来的风能直接穿过整个屋子从另一边出去，就像水从漏斗里直接流走一样，好的能量没法停留。',
    severity: 'significant',
    difficulty: 'low',
    suggestionTemplate: '建议在进门处设置屏风、玄关柜或绿植隔断，使气流进入后有所回旋再扩散到各个房间。',
    causeTemplate: '入户门与窗户/阳台/另一门形成直线对流，气流无法在室内停留回旋。',
    expectedEffectTemplate: '设置隔断后，气流路径改变，有助于室内气场稳定，通常能感受到居住舒适度提升。',
    cautionsTemplate: '隔断不宜过高过密，应保证基本通风采光。同时注意隔断本身的风格与空间协调。',
    relatedTerms: ['穿堂煞', '藏风聚气', '玄关', '明堂'],
    isTraditionalView: true,
    impactAreas: ['wealth', 'health'],
    classicalRef: '《葬书》"气乘风则散"',
  },

  'FS-PAT-004': {
    ruleId: 'FS-PAT-004',
    name: '明堂狭窄',
    triggerCondition: '入户门内正对区域（玄关/客厅前区）空间狭窄或堆满杂物',
    principle: '明堂为宅前聚气之所，宽敞明亮的明堂有助于接纳外部生气，为宅内带来活力。',
    通俗解释: '进门后的第一印象区域就像是房子的"脸面"，如果这个区域又窄又乱，会让人感觉压抑，也不利于好的能量进入。',
    severity: 'moderate',
    difficulty: 'low',
    suggestionTemplate: '建议清理入门区域的杂物，保持该区域整洁开阔。条件允许时，可通过镜面装饰在视觉上扩大空间感。',
    causeTemplate: '入户后的明堂区域空间局促或杂乱，不利于外部生气进入和聚集。',
    expectedEffectTemplate: '明堂开阔后，空间感改善，居住者心情通常会更加舒畅。',
    cautionsTemplate: '若使用镜子扩大视觉空间，避免镜子正对入户门，以免气场反弹。',
    relatedTerms: ['明堂', '藏风聚气', '玄关'],
    isTraditionalView: true,
    impactAreas: ['wealth', 'career'],
    classicalRef: '《阳宅三要》',
  },

  // ===== 家具类 =====
  'FS-FUR-001': {
    ruleId: 'FS-FUR-001',
    name: '横梁压顶',
    triggerCondition: '床、沙发或办公桌正上方存在横梁',
    principle: '传统风水认为横梁下方气场受压，长期处于此环境下可能使人感到压抑、精神紧张。',
    通俗解释: '头顶上有横梁，就像无形中有一股压力从上方传来，长期在这样的位置休息或工作，容易让人感到不安或疲劳。',
    severity: 'significant',
    difficulty: 'medium',
    suggestionTemplate: '建议将{furnitureType}移至横梁范围之外。若空间受限无法移动，可在横梁下方安装吊顶进行遮挡，或使用帐幔、床头板进行视觉隔离。',
    causeTemplate: '{furnitureType}正上方有横梁，该位置气场受压制。',
    expectedEffectTemplate: '移开或遮挡后，该位置的使用者通常能感受到心理压力的减轻，睡眠质量或工作效率可能有所改善。',
    cautionsTemplate: '吊顶遮挡需考虑层高，避免空间过于压抑。此方法属传统风水调理建议，效果因人而异。',
    relatedTerms: ['横梁压顶', '气场', '煞气'],
    isTraditionalView: true,
    impactAreas: ['health', 'sleep', 'career'],
    classicalRef: '《阳宅十书》',
  },

  'FS-FUR-002': {
    ruleId: 'FS-FUR-002',
    name: '床头无靠',
    triggerCondition: '床头未靠实墙，或靠窗、靠门',
    principle: '风水讲究"有靠"，床头靠实墙象征有靠山、有安全感，有助于稳定睡眠气场。',
    通俗解释: '睡觉的地方如果没有坚实的墙做依靠，就像人坐在没有靠背的椅子上，潜意识里会缺乏安全感，影响休息质量。',
    severity: 'significant',
    difficulty: 'low',
    suggestionTemplate: '建议调整床位，使床头紧靠实墙，且避免床头正对门窗。若房间结构限制，可在床头放置高背床头板作为"人造靠山"。',
    causeTemplate: '床头缺乏实墙依靠，或床头正对门窗，导致睡眠位置气场不稳定。',
    expectedEffectTemplate: '床头有靠后，居住者通常能感受到更稳定的睡眠环境，安全感增强。',
    cautionsTemplate: '床头与墙面之间不要留有过大缝隙。此方法属传统风水观点，可结合个人实际感受调整。',
    relatedTerms: ['有靠', '靠山', '气场'],
    isTraditionalView: true,
    impactAreas: ['sleep', 'health', 'relationship'],
  },

  'FS-FUR-003': {
    ruleId: 'FS-FUR-003',
    name: '沙发无靠山',
    triggerCondition: '沙发背靠门窗或通道，无实墙依靠',
    principle: '沙发为客厅主位，应有实墙为靠，象征家庭有靠山，也有利于坐在沙发上的人感到安心。',
    通俗解释: '客厅沙发如果没有靠墙，坐在上面的人会感觉背后空荡荡的，潜意识里难以完全放松。',
    severity: 'moderate',
    difficulty: 'low',
    suggestionTemplate: '建议将沙发调整为背靠实墙摆放。若因户型限制无法实现，可在沙发后方放置矮柜或屏风作为人造靠山。',
    causeTemplate: '沙发位置背后无实墙依靠，或正对通道/门窗。',
    expectedEffectTemplate: '沙发有靠后，客厅整体布局更加稳固，家人在客厅活动时通常能感受到更高的舒适度。',
    cautionsTemplate: '沙发与墙面之间留出适当空隙便于清洁。矮柜高度不宜超过沙发靠背。',
    relatedTerms: ['有靠', '靠山', '沙发'],
    isTraditionalView: true,
    impactAreas: ['wealth', 'relationship'],
  },

  'FS-FUR-004': {
    ruleId: 'FS-FUR-004',
    name: '镜子对床',
    triggerCondition: '镜子正对床铺',
    principle: '传统风水认为镜子具有反射作用，夜间醒来时镜中影像可能惊扰心神，影响睡眠质量。',
    通俗解释: '半夜醒来如果一眼看到镜子里的自己，容易受到惊吓，长期下来可能影响睡眠。从实用角度，镜子反光也可能影响夜间休息。',
    severity: 'moderate',
    difficulty: 'low',
    suggestionTemplate: '建议调整镜子位置，避免正对床铺。若镜子固定无法移动，可在睡觉时用布帘遮挡镜面。',
    causeTemplate: '镜子正对床铺，夜间可能形成光影干扰或心理不适。',
    expectedEffectTemplate: '移开或遮挡后，卧室夜间环境更加安宁，有助于提升睡眠质量。',
    cautionsTemplate: '此方法主要基于居住舒适度考虑，效果因人而异。',
    relatedTerms: ['镜子', '煞气'],
    isTraditionalView: true,
    impactAreas: ['sleep', 'health'],
  },

  // ===== 光线类 =====
  'FS-LIG-001': {
    ruleId: 'FS-LIG-001',
    name: '采光不足',
    triggerCondition: '房间自然采光评分低于 60，或窗户面积过小',
    principle: '阳宅首重采光，阳光为阳气之源，充足的日照有助于提升空间活力和居住者健康。',
    通俗解释: '房间如果长期缺乏阳光，会显得阴郁沉闷，不仅影响心情，也可能导致室内潮湿，不利于健康。',
    severity: 'moderate',
    difficulty: 'medium',
    suggestionTemplate: '建议增加室内照明层次，使用暖白色光源补充自然光不足。墙面选择浅色调增加反光。条件允许时，可考虑扩大窗户或增加天窗。',
    causeTemplate: '房间自然采光条件不足，阳气偏弱。',
    expectedEffectTemplate: '改善照明后，空间明亮度和舒适度通常能显著提升。',
    cautionsTemplate: '人工照明应避免过强的直射光造成眩目。建议结合节能灯具使用。',
    relatedTerms: ['采光', '阳气', '阴阳'],
    isTraditionalView: false,
    impactAreas: ['health', 'career'],
  },

  'FS-LIG-002': {
    ruleId: 'FS-LIG-002',
    name: '光线过强（西晒）',
    triggerCondition: '房间存在强烈西晒，或光线过于刺眼',
    principle: '光线过强会导致室内温度过高，阳气过盛，居住者可能感到燥热不安。',
    通俗解释: '如果房间下午被强烈的西晒阳光直射，夏天会非常闷热，家具也容易褪色老化。',
    severity: 'moderate',
    difficulty: 'low',
    suggestionTemplate: '建议安装遮光窗帘或百叶窗，在强光时段适当遮挡。也可在窗户玻璃贴隔热膜降低紫外线和热量进入。',
    causeTemplate: '房间受到过强阳光直射，室内温度波动大。',
    expectedEffectTemplate: '遮光处理后，室内温度趋于稳定，居住舒适度提升。',
    cautionsTemplate: '遮光不应完全阻挡自然光，建议采用可调节的遮阳方案。',
    relatedTerms: ['西晒', '阳气'],
    isTraditionalView: false,
    impactAreas: ['health'],
  },

  // ===== 五行类 =====
  'FS-ELE-001': {
    ruleId: 'FS-ELE-001',
    name: '五行失衡（过旺）',
    triggerCondition: '某一种五行元素占比超过 40%，且远超其他元素',
    principle: '五行讲究平衡，某一元素过旺可能压制其他元素，导致对应方面的运势失衡。',
    通俗解释: '就像饮食中某种营养过多而其他不足一样，空间中的五行能量也需要均衡，某一种过强可能会让其他方面显得薄弱。',
    severity: 'moderate',
    difficulty: 'medium',
    suggestionTemplate: '建议增加被压制五行元素的装饰物进行调和。例如：木过旺可增加金属装饰（金克木），或增加土色元素（木克土以泄木气）。',
    causeTemplate: '空间中{element}元素过旺，可能导致五行失衡。',
    expectedEffectTemplate: '五行调和后，空间气场趋于平衡，整体环境和谐度提升。',
    cautionsTemplate: '五行调理属传统风水理论，建议适度进行，不宜过度堆砌摆件。',
    relatedTerms: ['五行', '五行相生相克', '平衡'],
    isTraditionalView: true,
    impactAreas: ['health', 'wealth', 'career', 'relationship'],
    classicalRef: '《尚书·洪范》',
  },

  'FS-ELE-002': {
    ruleId: 'FS-ELE-002',
    name: '五行缺失',
    triggerCondition: '某一种五行元素占比低于 10%，明显弱于其他元素',
    principle: '五行俱全为佳，缺失某一元素可能影响对应方位或家庭成员的运势。',
    通俗解释: '如果空间里某种元素的能量特别弱，就像做菜少了某种调味料，整体味道就不够丰富完整。',
    severity: 'moderate',
    difficulty: 'low',
    suggestionTemplate: '建议在空间中增加{element}元素的装饰。例如：缺木可放绿植；缺火可用红色/橙色装饰；缺土可用黄色/陶瓷；缺金可用金属摆件；缺水可用鱼缸或蓝色装饰。',
    causeTemplate: '空间中{element}元素明显不足，五行不够齐全。',
    expectedEffectTemplate: '补充缺失元素后，空间五行趋于完整，环境氛围更加和谐。',
    cautionsTemplate: '补充应适量，避免矫枉过正导致另一种失衡。',
    relatedTerms: ['五行', '五行相生相克'],
    isTraditionalView: true,
    impactAreas: ['health', 'wealth'],
  },

  // ===== 厨房类 =====
  'FS-KIT-001': {
    ruleId: 'FS-KIT-001',
    name: '水火相冲',
    triggerCondition: '灶台（火）与水池（水）相邻或正对',
    principle: '厨房中水火相邻易导致"水火相冲"，传统风水认为可能影响家庭和睦及健康。',
    通俗解释: '灶台和水池如果紧挨在一起，一个负责火一个负责水，就像两个性格相反的人天天面对面，容易产生"冲突"。',
    severity: 'significant',
    difficulty: 'medium',
    suggestionTemplate: '建议将灶台与水池之间留出至少 60 厘米的操作台面作为缓冲。若空间有限，可在两者之间放置木质砧板或绿植进行隔断。',
    causeTemplate: '灶台与水槽距离过近，形成水火相冲格局。',
    expectedEffectTemplate: '调整后，厨房操作动线更加合理，使用舒适度提升。',
    cautionsTemplate: '改动应兼顾实际烹饪便利性，不宜为了追求风水而牺牲操作效率。',
    relatedTerms: ['水火相冲', '五行相克'],
    isTraditionalView: true,
    impactAreas: ['health', 'relationship'],
  },

  // ===== 卫生间类 =====
  'FS-BAT-001': {
    ruleId: 'FS-BAT-001',
    name: '卫生间对床/对门',
    triggerCondition: '卫生间门正对卧室床或入户门',
    principle: '卫生间为污秽之气聚集之所，正对卧室或大门可能导致不良气场外泄。',
    通俗解释: '卫生间是家里湿气最重的地方，如果门正对着床或大门，湿气和异味容易扩散到其他区域。',
    severity: 'significant',
    difficulty: 'medium',
    suggestionTemplate: '建议保持卫生间门常闭，安装排气扇加强通风。若正对卧室床，可在卫生间门口放置屏风或绿植进行遮挡。',
    causeTemplate: '卫生间门与卧室床/入户门形成正对，秽气可能外泄。',
    expectedEffectTemplate: '遮挡和通风改善后，湿气和异味扩散减少，居住环境更加舒适。',
    cautionsTemplate: '重点在于保持卫生间干燥清洁，风水调理为辅。',
    relatedTerms: ['秽气', '气场'],
    isTraditionalView: true,
    impactAreas: ['health'],
  },

  // ===== 动线类 =====
  'FS-FLO-001': {
    ruleId: 'FS-FLO-001',
    name: '动线不畅',
    triggerCondition: '家具摆放阻碍主要通道，或通道曲折狭窄',
    principle: '良好的动线设计应让气流和人流顺畅通行，阻塞的动线会导致气场滞留或混乱。',
    通俗解释: '如果家里走路要经常绕来绕去，或者通道被家具挡住，不仅不方便，也会让空间感觉拥挤压抑。',
    severity: 'moderate',
    difficulty: 'low',
    suggestionTemplate: '建议重新规划家具布局，确保主要通道宽度不少于 80 厘米。移除不必要的障碍物，保持动线简洁通畅。',
    causeTemplate: '家具布局阻碍了主要通行动线，影响空间使用效率和气场流通。',
    expectedEffectTemplate: '动线通畅后，空间使用效率提升，居住体验改善。',
    cautionsTemplate: '调整时考虑实际生活习惯，避免为了通畅而牺牲必要的收纳空间。',
    relatedTerms: ['动线', '气场'],
    isTraditionalView: false,
    impactAreas: ['health', 'career'],
  },

  // ===== 财位类 =====
  'FS-WEA-001': {
    ruleId: 'FS-WEA-001',
    name: '财位受压',
    triggerCondition: '明财位（入门对角线位置）被重物压住或堆放杂物',
    principle: '明财位为财气聚集之所，应保持明亮、整洁、开阔，受压则财气不畅。',
    通俗解释: '财位就像是家里的"存钱罐"位置，如果这个地方堆满杂物或被大件家具压住，就像存钱罐被盖住了盖子，财气难以进入。',
    severity: 'moderate',
    difficulty: 'low',
    suggestionTemplate: '建议清理财位区域的杂物，保持整洁开阔。可在此处摆放常绿植物（如发财树、金钱树）或聚宝盆等吉祥物。',
    causeTemplate: '明财位区域被重物压制或堆放杂物，影响财气聚集。',
    expectedEffectTemplate: '财位通畅后，空间整洁度提升，心理感受更加积极。',
    cautionsTemplate: '财位布置应适度，不宜过度堆砌摆件。保持整洁明亮为首要原则。',
    relatedTerms: ['财位', '明财位', '聚宝盆'],
    isTraditionalView: true,
    impactAreas: ['wealth'],
  },
}

// ────────── 术语库 ──────────

export const FENGSHUI_TERMS: Record<string, FengShuiTerm> = {
  '明堂': {
    term: '明堂',
    explanation: '指房屋前方或入户后的开阔区域，是外部生气进入宅内的第一站。明堂宽敞明亮，有助于接纳旺气。',
    category: '格局',
    classicalSource: '《阳宅三要》："明堂如掌心，家富斗量金。"',
  },
  '藏风聚气': {
    term: '藏风聚气',
    explanation: '风水的核心概念之一。指房屋应能阻挡强风直吹，同时让有益的气流在室内回旋聚集，而非直进直出。',
    category: '原理',
    classicalSource: '《葬书》："气乘风则散，界水则止。古人聚之使不散，行之使有止，故谓之风水。"',
  },
  '穿堂煞': {
    term: '穿堂煞',
    explanation: '指入户门与窗户、阳台或另一扇门形成直线，气流直进直出无法在室内停留的格局。',
    category: '煞气',
    classicalSource: '传统风水术语',
  },
  '横梁压顶': {
    term: '横梁压顶',
    explanation: '指床、沙发或办公桌正上方有横梁。传统风水认为此位置气场受压制，可能使人感到压抑不安。',
    category: '煞气',
    classicalSource: '《阳宅十书》',
  },
  '缺角': {
    term: '缺角',
    explanation: '指房屋户型不是完整的方形或矩形，某个方位有所缺失。传统风水认为缺角可能影响对应方位的运势。',
    category: '格局',
    classicalSource: '《阳宅十书》',
  },
  '五行': {
    term: '五行',
    explanation: '金、木、水、火、土五种基本元素。风水认为万物皆由五行构成，五行平衡则气场和谐。',
    category: '原理',
    classicalSource: '《尚书·洪范》',
  },
  '五行相生相克': {
    term: '五行相生相克',
    explanation: '相生：木生火、火生土、土生金、金生水、水生木。相克：木克土、土克水、水克火、火克金、金克木。风水调理常利用此原理平衡空间能量。',
    category: '原理',
    classicalSource: '《易经》',
  },
  '中宫': {
    term: '中宫',
    explanation: '指房屋的中心位置，为整个房屋气场的核心枢纽。中宫宜保持整洁、安静，不宜放置重物或作为卫生间。',
    category: '格局',
    classicalSource: '《黄帝宅经》',
  },
  '气场': {
    term: '气场',
    explanation: '指空间中的能量场。好的气场让人感到舒适、精神饱满；差的气场则让人感到压抑、疲惫。',
    category: '原理',
  },
  '煞气': {
    term: '煞气',
    explanation: '指对居住者不利的能量或环境因素。常见煞气包括：横梁压顶、穿堂煞、尖角煞等。',
    category: '原理',
  },
  '财位': {
    term: '财位',
    explanation: '指房屋中利于财运的方位。明财位通常位于入户门的对角线位置，是财气最容易聚集的地方。',
    category: '格局',
  },
  '有靠': {
    term: '有靠',
    explanation: '指座位或床位背后有实墙作为依靠。风水认为"有靠"象征有贵人扶持、有安全感。',
    category: '布局',
    classicalSource: '《阳宅三要》',
  },
  '靠山': {
    term: '靠山',
    explanation: '与"有靠"同义，指座位或床位背后的支撑。在风水布局中，有靠山的位置被认为更加稳定可靠。',
    category: '布局',
  },
  '水火相冲': {
    term: '水火相冲',
    explanation: '指厨房中灶台（属火）与水池（属水）距离过近。传统风水认为水火相邻易产生冲突，可能影响家庭和睦。',
    category: '煞气',
    classicalSource: '传统风水术语',
  },
  '西晒': {
    term: '西晒',
    explanation: '指下午西向阳光直射入室内。夏季西晒会导致室内温度急剧升高，居住舒适度下降。',
    category: '环境',
  },
  '阳气': {
    term: '阳气',
    explanation: '与"阴气"相对，代表温暖、明亮、活跃的能量。充足的阳气有助于提升空间活力。',
    category: '原理',
    classicalSource: '《易经》',
  },
  '阴阳': {
    term: '阴阳',
    explanation: '中国古代哲学的核心概念。阳代表明亮、温暖、活跃；阴代表阴暗、寒冷、静止。风水平衡强调阴阳调和。',
    category: '原理',
    classicalSource: '《易经》',
  },
  '八卦方位': {
    term: '八卦方位',
    explanation: '将房屋分为八个方位（东、南、西、北、东南、西南、东北、西北），每个方位对应不同的家庭成员和运势。',
    category: '原理',
    classicalSource: '《易经》',
  },
  '动线': {
    term: '动线',
    explanation: '指人在空间中行走的路径。良好的动线设计应简洁顺畅，避免迂回曲折。',
    category: '布局',
  },
  '玄关': {
    term: '玄关',
    explanation: '指入户门后的过渡区域。玄关起到缓冲外部气流、保护隐私的作用，是内外空间的过渡带。',
    category: '格局',
  },
  '聚宝盆': {
    term: '聚宝盆',
    explanation: '传统风水吉祥物，象征财富聚集。通常放置在财位，寓意财源滚滚。',
    category: '摆件',
  },
}

// ────────── 工具函数 ──────────

/**
 * 根据规则ID获取知识库条目
 */
export function getRuleKnowledge(ruleId: string): RuleKnowledgeEntry | undefined {
  return RULE_KNOWLEDGE_BASE[ruleId]
}

/**
 * 根据规则ID列表批量获取知识库条目
 */
export function getRuleKnowledges(ruleIds: string[]): RuleKnowledgeEntry[] {
  return ruleIds
    .map(id => RULE_KNOWLEDGE_BASE[id])
    .filter(Boolean) as RuleKnowledgeEntry[]
}

/**
 * 根据关键词搜索规则知识库
 */
export function searchRuleKnowledge(keyword: string): RuleKnowledgeEntry[] {
  const lower = keyword.toLowerCase()
  return Object.values(RULE_KNOWLEDGE_BASE).filter(entry =>
    entry.name.includes(keyword) ||
    entry.triggerCondition.includes(keyword) ||
    entry.principle.includes(keyword) ||
    entry.relatedTerms.some(t => t.includes(keyword))
  )
}

/**
 * 根据术语获取解释
 */
export function getTermExplanation(term: string): FengShuiTerm | undefined {
  return FENGSHUI_TERMS[term]
}

/**
 * 从文本中提取所有已知术语
 */
export function extractTermsFromText(text: string): FengShuiTerm[] {
  const found: FengShuiTerm[] = []
  for (const [key, termData] of Object.entries(FENGSHUI_TERMS)) {
    if (text.includes(key) || text.includes(termData.term)) {
      found.push(termData)
    }
  }
  return found
}

/**
 * 根据规则条目生成调整方案
 */
export function generateAdjustmentFromRule(
  ruleEntry: RuleKnowledgeEntry,
  params: Record<string, string>
): FengShuiAdjustment {
  function fill(template: string): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => params[key] || '未知')
  }

  return {
    id: `${ruleEntry.ruleId}-ADJ`,
    issue: fill(ruleEntry.name),
    cause: fill(ruleEntry.causeTemplate),
    solution: fill(ruleEntry.suggestionTemplate),
    difficulty: ruleEntry.difficulty,
    expectedEffect: fill(ruleEntry.expectedEffectTemplate),
    cautions: fill(ruleEntry.cautionsTemplate),
    severity: ruleEntry.severity,
    relatedRuleId: ruleEntry.ruleId,
    category: ruleEntry.relatedTerms[0] || '综合',
  }
}

/**
 * 生成风险提示
 */
export function generateRisksFromRule(ruleEntry: RuleKnowledgeEntry): FengShuiRisk[] {
  const risks: FengShuiRisk[] = []

  // 长期影响
  if (ruleEntry.impactAreas.includes('health')) {
    risks.push({
      type: 'longTerm',
      description: '若长期不改善，可能对居住者健康产生潜在影响。',
      isTraditionalView: ruleEntry.isTraditionalView,
    })
  }
  if (ruleEntry.impactAreas.includes('wealth')) {
    risks.push({
      type: 'longTerm',
      description: '从传统风水角度，此格局可能对财运发展有一定牵制。',
      isTraditionalView: ruleEntry.isTraditionalView,
    })
  }

  // 短期影响
  risks.push({
    type: 'shortTerm',
    description: '当前格局可能已使居住舒适度有所下降。',
    isTraditionalView: false,
  })

  return risks
}

/**
 * 根据问题严重程度排序
 */
export function sortBySeverity<T extends { severity: IssueSeverity }>(items: T[]): T[] {
  const order = { severe: 0, significant: 1, moderate: 2, suggestion: 3 }
  return [...items].sort((a, b) => order[a.severity] - order[b.severity])
}

/**
 * 获取严重程度的显示文本
 */
export function getSeverityLabel(severity: IssueSeverity): string {
  const map: Record<IssueSeverity, string> = {
    severe: '严重',
    significant: '较严重',
    moderate: '一般',
    suggestion: '建议优化',
  }
  return map[severity]
}

/**
 * 获取严重程度的样式类名
 */
export function getSeverityClass(severity: IssueSeverity): string {
  const map: Record<IssueSeverity, string> = {
    severe: 'severity-severe',
    significant: 'severity-significant',
    moderate: 'severity-moderate',
    suggestion: 'severity-suggestion',
  }
  return map[severity]
}

/**
 * 获取难度显示文本
 */
export function getDifficultyLabel(difficulty: 'low' | 'medium' | 'high'): string {
  const map = { low: '低', medium: '中', high: '高' }
  return map[difficulty]
}
