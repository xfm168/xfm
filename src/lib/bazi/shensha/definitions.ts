import type { DefinedShenSha } from './types'

const DEFINITIONS: DefinedShenSha[] = [
  {
    id: 'tian_yi',
    name: '天乙贵人',
    aliases: ['天乙', '贵神'],
    nature: 'ji',
    source: '三命通会',
    appliesTo: ['year', 'month', 'day', 'hour', 'dayun', 'liunian'],
    condition: {
      description: '以日干或年干查地支，甲戊庚牛羊，乙己鼠猴乡，丙丁猪鸡位，壬癸兔蛇藏，六辛逢马虎，此是贵人方。',
      formula: `(dayGan='甲' && (zhi='丑'||zhi='未')) || (dayGan='乙' && (zhi='子'||zhi='申')) || (dayGan='丙' && (zhi='亥'||zhi='酉')) || (dayGan='丁' && (zhi='亥'||zhi='酉')) || (dayGan='戊' && (zhi='丑'||zhi='未')) || (dayGan='己' && (zhi='子'||zhi='申')) || (dayGan='庚' && (zhi='丑'||zhi='未')) || (dayGan='辛' && (zhi='寅'||zhi='午')) || (dayGan='壬' && (zhi='卯'||zhi='巳')) || (dayGan='癸' && (zhi='卯'||zhi='巳'))`,
      example: '甲日见丑未'
    },
    invalidation: {
      byGzAction: ['chong', 'hai'],
      description: '天乙贵人逢冲害则减力，被空亡则贵人虚而不实',
      degree: 0.5
    },
    weight: { base: 0.9, lingWeight: 0.1, touganWeight: 0.1, dediWeight: 0.1 },
    effect: {
      human: '天乙贵人为众煞之首，主逢凶化吉、遇难呈祥。命中遇之，人缘极佳，遇事多有贵人相助，事业上易得提携，危难时有人解围。',
      categories: ['贵人', '福气'],
      scenes: ['career', 'overall', 'family']
    },
    citation: [
      '《三命通会·天乙篇》："天乙者，乃天上之神，在紫微垣阊阖门外，与太乙并列，事天皇大帝，下游三辰，家在己丑斗牛之次，出乎己未井鬼之舍，执玉衡较量天人之事，名曰天乙也。"',
      '《渊海子平》："天乙贵人，命中最吉之神，若人遇之则荣，功名早达，官禄易进。"'
    ],
    version: 'B5.0'
  },
  {
    id: 'taiji',
    name: '太极贵人',
    aliases: ['太极'],
    nature: 'ji',
    source: '三命通会',
    appliesTo: ['year', 'month', 'day', 'hour'],
    condition: {
      description: '甲乙生人子午中，丙丁鸡兔定亨通，戊己两干临四季，庚辛寅亥禄丰隆，壬癸巳申偏喜美，值此应当福气钟。',
      formula: `(gan='甲'||gan='乙') && (zhi='子'||zhi='午') || (gan='丙'||gan='丁') && (zhi='酉'||zhi='卯') || (gan='戊'||gan='己') && (zhi='辰'||zhi='戌'||zhi='丑'||zhi='未') || (gan='庚'||gan='辛') && (zhi='寅'||zhi='亥') || (gan='壬'||gan='癸') && (zhi='巳'||zhi='申')`,
      example: '甲日见子或午'
    },
    invalidation: {
      byGzAction: ['chong'],
      description: '太极逢冲则减力，主贵人之气受损',
      degree: 0.4
    },
    weight: { base: 0.7, lingWeight: 0.1, touganWeight: 0.1 },
    effect: {
      human: '太极贵人主聪明好学、有钻劲，为人正直、做事有始有终。命中逢之，多有宗教、哲学、玄学之缘，理解力强，容易在某一领域有所成就。',
      categories: ['贵人', '才艺', '文星'],
      scenes: ['study', 'career', 'overall']
    },
    citation: [
      '《三命通会》："太极者，太初也，始也，物造于初为太极，成也，终也。物有所归曰极。太极即造化始终相保，乃曰太极贵也。"'
    ],
    version: 'B5.0'
  },
  {
    id: 'wenchang',
    name: '文昌',
    aliases: ['文昌星', '文曲星'],
    nature: 'ji',
    source: '渊海子平',
    appliesTo: ['year', 'month', 'day', 'hour', 'dayun', 'liunian'],
    condition: {
      description: '甲乙巳午报君知，丙戊申宫丁己鸡，庚猪辛鼠壬逢虎，癸人见兔入云梯。以日干或年干查地支。',
      formula: `(gan='甲'&&zhi='巳')||(gan='乙'&&zhi='午')||(gan='丙'&&zhi='申')||(gan='丁'&&zhi='酉')||(gan='戊'&&zhi='申')||(gan='己'&&zhi='酉')||(gan='庚'&&zhi='亥')||(gan='辛'&&zhi='子')||(gan='壬'&&zhi='寅')||(gan='癸'&&zhi='卯')`,
      example: '甲日见巳'
    },
    invalidation: {
      byGzAction: ['chong', 'hai'],
      description: '文昌逢冲害则文星受损，主文章失意',
      degree: 0.5
    },
    weight: { base: 0.8, lingWeight: 0.1, touganWeight: 0.1, dediWeight: 0.1 },
    effect: {
      human: '文昌为文星，主聪明过人、文笔出众、学业有成。命中带文昌者，读书成绩好，考试运佳，适合从事文职、教育、文化相关工作，能靠才华吃饭。',
      categories: ['文星', '才艺'],
      scenes: ['study', 'career', 'wealth']
    },
    citation: [
      '《渊海子平·论文昌》："文昌者，居寅申巳亥四生之局，乃食神生旺之方，主人聪明过人，文章盖世。"',
      '《三命通会》："文昌主聪明，能令声价重，文章盖世，名誉超群。"'
    ],
    version: 'B5.0'
  },
  {
    id: 'guoyin',
    name: '国印贵人',
    aliases: ['国印'],
    nature: 'ji',
    source: '三命通会',
    appliesTo: ['year', 'month', 'day', 'hour'],
    condition: {
      description: '甲见戌，乙见亥，丙见丑，丁见寅，戊见丑，己见寅，庚见辰，辛见巳，壬见未，癸见申。以日干查地支。',
      formula: `(gan='甲'&&zhi='戌')||(gan='乙'&&zhi='亥')||(gan='丙'&&zhi='丑')||(gan='丁'&&zhi='寅')||(gan='戊'&&zhi='丑')||(gan='己'&&zhi='寅')||(gan='庚'&&zhi='辰')||(gan='辛'&&zhi='巳')||(gan='壬'&&zhi='未')||(gan='癸'&&zhi='申')`,
      example: '甲日见戌'
    },
    invalidation: {
      byGzAction: ['chong', 'po'],
      description: '国印逢冲破则权力受损，主印绶不实',
      degree: 0.4
    },
    weight: { base: 0.7, lingWeight: 0.1, touganWeight: 0.1 },
    effect: {
      human: '国印贵人主诚实可靠、为人公道、有掌权之能。命中带国印者，适合从事公职、行政管理工作，易得贵人赏识而掌握实权，做事有原则、重承诺。',
      categories: ['贵人', '权势'],
      scenes: ['career', 'family', 'overall']
    },
    citation: [
      '《三命通会》："国印者，如人君之有印绶，所以掌信令而为百官之仪表也。得之者，主聪明好学，办事公道，诚实可靠。"'
    ],
    version: 'B5.0'
  },
  {
    id: 'jiangxing',
    name: '将星',
    aliases: ['将星'],
    nature: 'ji',
    source: '协纪辨方书',
    appliesTo: ['year', 'month', 'day', 'hour', 'dayun'],
    condition: {
      description: '将星者，三合中位也。寅午戌见午，申子辰见子，亥卯未见卯，巳酉丑见酉。以年支或日支查其余地支。',
      formula: `(branch='寅'||branch='午'||branch='戌') && zhi='午' || (branch='申'||branch='子'||branch='辰') && zhi='子' || (branch='亥'||branch='卯'||branch='未') && zhi='卯' || (branch='巳'||branch='酉'||branch='丑') && zhi='酉'`,
      example: '寅年寅午戌日见午'
    },
    invalidation: {
      byGzAction: ['chong', 'xing'],
      description: '将星逢冲刑则威力大减，主有兵权而难掌实',
      degree: 0.5
    },
    weight: { base: 0.8, lingWeight: 0.1, touganWeight: 0.1, dediWeight: 0.1 },
    effect: {
      human: '将星主权威、有领导才能，有组织管理能力。命中带将星者，在群体中能脱颖而出，适合做领导、带兵、从事管理工作，做事雷厉风行、有大将之风。',
      categories: ['武星', '权势'],
      scenes: ['career', 'wealth', 'overall']
    },
    citation: [
      '《协纪辨方书》："将星者，将帅之星也，居三合中位，主掌兵权，威猛有制。"',
      '《三命通会》："将星若与禄神同宫，主掌兵权，为将帅之材。"'
    ],
    version: 'B5.0'
  },
  {
    id: 'yima',
    name: '驿马',
    aliases: ['驿马星', '天马'],
    nature: 'zhong',
    source: '三命通会',
    appliesTo: ['year', 'month', 'day', 'hour', 'dayun', 'liunian', 'liuyue'],
    condition: {
      description: '驿马者，三合局之冲位也。申子辰马在寅，寅午戌马在申，巳酉丑马在亥，亥卯未马在巳。以年支或日支查其余地支。',
      formula: `(branch='申'||branch='子'||branch='辰') && zhi='寅' || (branch='寅'||branch='午'||branch='戌') && zhi='申' || (branch='巳'||branch='酉'||branch='丑') && zhi='亥' || (branch='亥'||branch='卯'||branch='未') && zhi='巳'`,
      example: '申年申子辰日见寅'
    },
    invalidation: {
      byGzAction: ['he'],
      description: '驿马被合则住，主行动受阻、出行不利',
      degree: 0.6
    },
    weight: { base: 0.6, lingWeight: 0.1, touganWeight: 0.1 },
    effect: {
      human: '驿马主奔波、走动、旅行、调动。命中带驿马者，一生多外出、好动不安分，适合从事外勤、贸易、运输等行业。吉则升迁调动、出外发财；凶则奔波劳碌、居无定所。',
      categories: ['驿马', '其他'],
      scenes: ['career', 'wealth', 'overall']
    },
    citation: [
      '《三命通会·论驿马》："驿马者，五行中气之异名也，所以趋吉避凶，往来不息者也。其神主升迁、远行、出入、移居之事。"',
      '《渊海子平》："驿马逢冲，身动不息；驿马遇合，羁留不行。"'
    ],
    version: 'B5.0'
  },
  {
    id: 'taohua',
    name: '桃花',
    aliases: ['咸池', '桃花煞', '红艳煞'],
    nature: 'zhong',
    source: '渊海子平',
    appliesTo: ['year', 'month', 'day', 'hour', 'dayun', 'liunian'],
    condition: {
      description: '申子辰在酉，寅午戌在卯，巳酉丑在午，亥卯未在子。以年支或日支查其余地支，又名咸池。',
      formula: `(branch='申'||branch='子'||branch='辰') && zhi='酉' || (branch='寅'||branch='午'||branch='戌') && zhi='卯' || (branch='巳'||branch='酉'||branch='丑') && zhi='午' || (branch='亥'||branch='卯'||branch='未') && zhi='子'`,
      example: '申年申子辰日见酉'
    },
    invalidation: {
      byGzAction: ['chong', 'hai'],
      description: '桃花逢冲害则桃花之性受损，吉者减吉、凶者减凶',
      degree: 0.5
    },
    weight: { base: 0.7, lingWeight: 0.1, touganWeight: 0.1 },
    effect: {
      human: '桃花主人缘、异性缘、感情与魅力。吉则貌美聪慧、人缘极佳、感情顺遂、有艺术气质；凶则风流多情、易惹桃花是非、婚姻不稳。桃花在年月为墙内桃花，主夫妻恩爱；在日时为墙外桃花，主外遇。',
      categories: ['桃花', '才艺'],
      scenes: ['marriage', 'career', 'overall']
    },
    citation: [
      '《渊海子平·论咸池》："咸池者，五行沐浴之地，又名桃花，主人奸邪淫鄙，不孝不义，好酒色，多奸诈。"',
      '《三命通会》："咸池主色欲邪淫之事，吉则风流儒雅，凶则淫奔私约。"',
      '《协纪辨方书》："桃花主人聪明秀美，得吉则文墨精通，遇凶则酒色猖狂。"'
    ],
    version: 'B5.0'
  },
  {
    id: 'huagai',
    name: '华盖',
    aliases: ['华盖星'],
    nature: 'zhong',
    source: '三命通会',
    appliesTo: ['year', 'month', 'day', 'hour', 'dayun'],
    condition: {
      description: '寅午戌见戌，申子辰见辰，巳酉丑见丑，亥卯未见未。以年支或日支查其余地支，华盖者，三合局最后一位也。',
      formula: `(branch='寅'||branch='午'||branch='戌') && zhi='戌' || (branch='申'||branch='子'||branch='辰') && zhi='辰' || (branch='巳'||branch='酉'||branch='丑') && zhi='丑' || (branch='亥'||branch='卯'||branch='未') && zhi='未'`,
      example: '寅年寅午戌日见戌'
    },
    invalidation: {
      byGzAction: ['chong'],
      description: '华盖逢冲则孤傲之性更甚，或主出世离俗',
      degree: 0.3
    },
    weight: { base: 0.6, lingWeight: 0.1, touganWeight: 0.1 },
    effect: {
      human: '华盖主孤傲、清高、有艺术才华、与宗教玄学有缘。命中带华盖者，聪明好学但性格孤僻，喜独处、不喜应酬，在艺术、哲学、宗教领域易有造诣，但婚姻上易孤独。',
      categories: ['才艺', '孤克'],
      scenes: ['study', 'marriage', 'overall']
    },
    citation: [
      '《三命通会·论华盖》："华盖者，喻如宝盖，天有此星，其形如盖，常覆乎大帝之座，故以三合低处得库为华盖。"',
      '《渊海子平》："华盖临官，聪明好学，惟孤克不免。"'
    ],
    version: 'B5.0'
  },
  {
    id: 'yangren',
    name: '羊刃',
    aliases: ['阳刃', '羊刃煞'],
    nature: 'xiong',
    source: '三命通会',
    appliesTo: ['year', 'month', 'day', 'hour', 'dayun', 'liunian'],
    condition: {
      description: '甲羊刃在卯，乙羊刃在寅，丙戊羊刃在午，丁己羊刃在巳，庚羊刃在酉，辛羊刃在申，壬羊刃在子，癸羊刃在亥。以日干查地支。',
      formula: `(gan='甲'&&zhi='卯')||(gan='乙'&&zhi='寅')||(gan='丙'&&zhi='午')||(gan='丁'&&zhi='巳')||(gan='戊'&&zhi='午')||(gan='己'&&zhi='巳')||(gan='庚'&&zhi='酉')||(gan='辛'&&zhi='申')||(gan='壬'&&zhi='子')||(gan='癸'&&zhi='亥')`,
      example: '甲日见卯'
    },
    invalidation: {
      byGzAction: ['chong', 'hehua-failed'],
      description: '羊刃逢冲则发凶，得合化或有七杀制伏则反为权贵',
      degree: 0.3
    },
    weight: { base: 0.9, lingWeight: 0.1, touganWeight: 0.1 },
    effect: {
      human: '羊刃为刚强、暴戾之煞，主性急好胜、刚强果断。身弱得刃帮身则吉，可为权贵；身旺再逢刃则凶，主血光之灾、意外伤残、官非口舌、婚姻不顺。羊刃最忌逢冲，冲则必发凶祸。',
      categories: ['血光', '官非', '武星'],
      scenes: ['health', 'career', 'marriage']
    },
    citation: [
      '《三命通会·论羊刃》："羊刃者，刚暴之神，强梁之煞，主人性情刚烈，作事果敢。然身弱得之，能扶身旺，可为权贵；身旺遇之，必招灾祸。"',
      '《渊海子平》："羊刃逢冲，祸出不测；羊刃合杀，威镇边疆。"'
    ],
    version: 'B5.0'
  },
  {
    id: 'lushen',
    name: '禄神',
    aliases: ['禄', '天禄', '爵禄'],
    nature: 'ji',
    source: '三命通会',
    appliesTo: ['year', 'month', 'day', 'hour', 'dayun', 'liunian'],
    condition: {
      description: '甲禄在寅，乙禄在卯，丙戊禄在巳，丁己禄在午，庚禄在申，辛禄在酉，壬禄在亥，癸禄在子。以日干或年干查地支。',
      formula: `(gan='甲'&&zhi='寅')||(gan='乙'&&zhi='卯')||(gan='丙'&&zhi='巳')||(gan='丁'&&zhi='午')||(gan='戊'&&zhi='巳')||(gan='己'&&zhi='午')||(gan='庚'&&zhi='申')||(gan='辛'&&zhi='酉')||(gan='壬'&&zhi='亥')||(gan='癸'&&zhi='子')`,
      example: '甲日见寅'
    },
    invalidation: {
      byGzAction: ['chong', 'hai'],
      description: '禄神逢冲害则破禄，主俸禄受损、财运下降',
      degree: 0.6
    },
    weight: { base: 0.8, lingWeight: 0.1, touganWeight: 0.1, dediWeight: 0.1 },
    effect: {
      human: '禄神主俸禄、福气、财运，是养命之源。命中带禄神者，衣食无忧、财运亨通，能享现成之福，工作稳定、收入可观。禄神得令且不被冲破，主一生富足、名利双收。',
      categories: ['财富', '福气'],
      scenes: ['wealth', 'career', 'overall']
    },
    citation: [
      '《三命通会·论禄》："禄者，爵禄也，当得势而享，乃谓之禄。故禄为养命之源，人不可无。"',
      '《渊海子平》："禄神不喜逢冲，逢冲则破禄，破财损福。"'
    ],
    version: 'B5.0'
  },
  {
    id: 'jinyu',
    name: '金舆',
    aliases: ['金舆星', '金车'],
    nature: 'ji',
    source: '协纪辨方书',
    appliesTo: ['year', 'month', 'day', 'hour'],
    condition: {
      description: '甲龙乙蛇丙戊羊，丁己猴歌庚犬方，辛猪壬牛癸逢虎，此是金舆仔细详。以日干或年干查地支。',
      formula: `(gan='甲'&&zhi='辰')||(gan='乙'&&zhi='巳')||(gan='丙'&&zhi='未')||(gan='丁'&&zhi='申')||(gan='戊'&&zhi='未')||(gan='己'&&zhi='申')||(gan='庚'&&zhi='戌')||(gan='辛'&&zhi='亥')||(gan='壬'&&zhi='丑')||(gan='癸'&&zhi='寅')`,
      example: '甲日见辰'
    },
    invalidation: {
      byGzAction: ['chong'],
      description: '金舆逢冲则车马有损，主出行不顺',
      degree: 0.4
    },
    weight: { base: 0.6, lingWeight: 0.1, touganWeight: 0.1 },
    effect: {
      human: '金舆主贵气、车马来往、出行顺利。命中带金舆者，多得长辈提携、出入有车马之福，适合从事与交通、旅游相关的行业，一生中多得交通工具之便利，出行逢吉。',
      categories: ['福气', '财富'],
      scenes: ['career', 'wealth', 'overall']
    },
    citation: [
      '《协纪辨方书》："金舆者，金车之象也，君子得之则舆马之华，常人得之则资产之盛。"',
      '《三命通会》："金舆乃富贵之象，主出入乘舆，有车马之福。"'
    ],
    version: 'B5.0'
  },
  {
    id: 'xuetang',
    name: '学堂',
    aliases: ['学堂星'],
    nature: 'ji',
    source: '三命通会',
    appliesTo: ['year', 'month', 'day', 'hour'],
    condition: {
      description: '学堂者，天干长生之位也。甲见亥，乙见午，丙戊见寅，丁己见酉，庚见巳，辛见子，壬见申，癸见卯。以日干查地支。',
      formula: `(gan='甲'&&zhi='亥')||(gan='乙'&&zhi='午')||(gan='丙'&&zhi='寅')||(gan='丁'&&zhi='酉')||(gan='戊'&&zhi='寅')||(gan='己'&&zhi='酉')||(gan='庚'&&zhi='巳')||(gan='辛'&&zhi='子')||(gan='壬'&&zhi='申')||(gan='癸'&&zhi='卯')`,
      example: '甲日见亥'
    },
    invalidation: {
      byGzAction: ['chong', 'hai'],
      description: '学堂逢冲害则学业受阻，主读书不利',
      degree: 0.5
    },
    weight: { base: 0.7, lingWeight: 0.1, touganWeight: 0.1 },
    effect: {
      human: '学堂主聪明好学、学业有成、记忆力好。命中带学堂者，从小读书成绩优异，对知识有强烈的求知欲，适合从事教育、研究、学术等工作，容易获得高学历。',
      categories: ['文星', '才艺', '学业'],
      scenes: ['study', 'career']
    },
    citation: [
      '《三命通会》："学堂者，如人读书之学堂也，主聪明好学，智识过人，学业有成。"',
      '《渊海子平》："学堂遇贵，登科及第；学堂逢冲，十载寒窗。"'
    ],
    version: 'B5.0'
  },
  {
    id: 'ciguan',
    name: '词馆',
    aliases: ['词馆星'],
    nature: 'ji',
    source: '三命通会',
    appliesTo: ['year', 'month', 'day', 'hour'],
    condition: {
      description: '甲见寅，乙见亥，丙戊见巳，丁己见午，庚见申，辛见巳，壬见亥，癸见酉。一说：纳音长生处为词馆，与学堂互为表里。',
      formula: `(gan='甲'&&zhi='寅')||(gan='乙'&&zhi='亥')||(gan='丙'&&zhi='巳')||(gan='丁'&&zhi='午')||(gan='戊'&&zhi='巳')||(gan='己'&&zhi='午')||(gan='庚'&&zhi='申')||(gan='辛'&&zhi='巳')||(gan='壬'&&zhi='亥')||(gan='癸'&&zhi='酉')`,
      example: '甲日见寅'
    },
    invalidation: {
      byGzAction: ['chong'],
      description: '词馆逢冲则文才受损，主文章词不达意',
      degree: 0.4
    },
    weight: { base: 0.6, lingWeight: 0.1, touganWeight: 0.1 },
    effect: {
      human: '词馆主文章词藻、口才佳、有文学天赋。命中带词馆者，文笔优美、善于表达、能言善辩，适合从事写作、编辑、翻译、演讲等与文字语言相关的工作。',
      categories: ['文星', '才艺'],
      scenes: ['study', 'career']
    },
    citation: [
      '《三命通会》："词馆者，文词之馆舍也，主人博学多能，文章盖世，善于词令。"',
      '《子平真诠》："学堂词馆，为文翰之司，主聪明好学，文章出众。"'
    ],
    version: 'B5.0'
  },
  {
    id: 'jiesha',
    name: '劫煞',
    aliases: ['劫煞星', '大耗'],
    nature: 'xiong',
    source: '三命通会',
    appliesTo: ['year', 'month', 'day', 'hour', 'dayun', 'liunian'],
    condition: {
      description: '劫煞者，三合局之绝地也。申子辰见亥，寅午戌见亥，巳酉丑见寅，亥卯未见申。以年支或日支查其余地支。',
      formula: `(branch='申'||branch='子'||branch='辰') && zhi='亥' || (branch='寅'||branch='午'||branch='戌') && zhi='亥' || (branch='巳'||branch='酉'||branch='丑') && zhi='寅' || (branch='亥'||branch='卯'||branch='未') && zhi='申'`,
      example: '申年申子辰日见亥'
    },
    invalidation: {
      byGzAction: ['he'],
      description: '劫煞得合则减凶，有贵人相助则化险为夷',
      degree: 0.4
    },
    weight: { base: 0.8, lingWeight: 0.1, touganWeight: 0.1 },
    effect: {
      human: '劫煞主劫夺、破财、是非、灾祸。命中带劫煞者，性情偏急、易冲动，一生多破财之事，易遇盗贼、小人陷害。身旺遇之可为武职权贵；身弱逢之则多灾祸、官非口舌、财物损失。',
      categories: ['官非', '血光', '其他'],
      scenes: ['wealth', 'health', 'career']
    },
    citation: [
      '《三命通会·论劫煞》："劫煞者，五行绝处是也，又名大耗。主劫夺财帛，伤妻克子，官灾牢狱。"',
      '《渊海子平》："劫煞为灾不可当，徒然奔走名利场，须防祖业消亡尽，妻子如何得久长。"'
    ],
    version: 'B5.0'
  },
  {
    id: 'zaisha',
    name: '灾煞',
    aliases: ['灾煞星', '白虎煞'],
    nature: 'xiong',
    source: '三命通会',
    appliesTo: ['year', 'month', 'day', 'hour', 'dayun', 'liunian'],
    condition: {
      description: '灾煞者，三合局之冲破也。申子辰见午，寅午戌见子，巳酉丑见卯，亥卯未见酉。以年支或日支查其余地支。',
      formula: `(branch='申'||branch='子'||branch='辰') && zhi='午' || (branch='寅'||branch='午'||branch='戌') && zhi='子' || (branch='巳'||branch='酉'||branch='丑') && zhi='卯' || (branch='亥'||branch='卯'||branch='未') && zhi='酉'`,
      example: '申年申子辰日见午'
    },
    invalidation: {
      byGzAction: ['he'],
      description: '灾煞得合则解，有天德月德贵人可免灾',
      degree: 0.4
    },
    weight: { base: 0.85, lingWeight: 0.1, touganWeight: 0.1 },
    effect: {
      human: '灾煞主突发灾祸、血光、疾病、意外之灾。命中带灾煞者，一生多意外事故，易患急病，需防交通事故、火灾、手术等突发凶事。灾煞最忌逢冲，冲则凶上加凶。得贵人或天月二德化解可减凶。',
      categories: ['血光', '官非', '其他'],
      scenes: ['health', 'overall']
    },
    citation: [
      '《三命通会·论灾煞》："灾煞者，其性勇猛，常居劫煞之前，冲破将星，名曰灾煞。主血光横死，疾病官灾。"',
      '《渊海子平》："灾煞怕逢冲，十命九遭凶，若还逢贵解，反得保身浓。"'
    ],
    version: 'B5.0'
  },
  {
    id: 'guchen',
    name: '孤辰',
    aliases: ['孤辰星', '孤'],
    nature: 'xiong',
    source: '三命通会',
    appliesTo: ['year', 'month', 'day', 'hour'],
    condition: {
      description: '亥子丑人见寅为孤，寅卯辰人见巳为孤，巳午未人见申为孤，申酉戌人见亥为孤。以年支查其余地支。',
      formula: `(branch='亥'||branch='子'||branch='丑') && zhi='寅' || (branch='寅'||branch='卯'||branch='辰') && zhi='巳' || (branch='巳'||branch='午'||branch='未') && zhi='申' || (branch='申'||branch='酉'||branch='戌') && zhi='亥'`,
      example: '亥子丑年见寅'
    },
    invalidation: {
      byShenSha: ['天乙贵人'],
      byGzAction: ['he'],
      description: '孤辰得合或遇天乙贵人则孤性可解',
      degree: 0.3
    },
    weight: { base: 0.7, lingWeight: 0.1, touganWeight: 0.1 },
    effect: {
      human: '孤辰主孤独、六亲缘薄、婚姻不顺。命中带孤辰者，性格独立但孤僻，与家人聚少离多，早运离家发展，婚姻上易晚婚或单身，夫妻感情淡薄，老年易孤独。',
      categories: ['孤克'],
      scenes: ['marriage', 'family', 'overall']
    },
    citation: [
      '《三命通会·论孤辰寡宿》："孤辰寡宿者，五行绝处之气也。男命孤辰，主克妻害子；女命寡宿，主伤夫克子。"',
      '《渊海子平》："男孤女寡，两意相忘，老而无子，家道凄凉。"'
    ],
    version: 'B5.0'
  },
  {
    id: 'guasu',
    name: '寡宿',
    aliases: ['寡宿星', '寡'],
    nature: 'xiong',
    source: '三命通会',
    appliesTo: ['year', 'month', 'day', 'hour'],
    condition: {
      description: '亥子丑人见戌为寡，寅卯辰人见丑为寡，巳午未人见辰为寡，申酉戌人见未为寡。以年支查其余地支。',
      formula: `(branch='亥'||branch='子'||branch='丑') && zhi='戌' || (branch='寅'||branch='卯'||branch='辰') && zhi='丑' || (branch='巳'||branch='午'||branch='未') && zhi='辰' || (branch='申'||branch='酉'||branch='戌') && zhi='未'`,
      example: '亥子丑年见戌'
    },
    invalidation: {
      byShenSha: ['天乙贵人'],
      byGzAction: ['he'],
      description: '寡宿得合或遇天乙贵人则寡性可解',
      degree: 0.3
    },
    weight: { base: 0.7, lingWeight: 0.1, touganWeight: 0.1 },
    effect: {
      human: '寡宿主孤寡、人缘薄、婚姻不幸。命中带寡宿者，性情内向、不喜社交，感情路上多波折，易丧偶或离异，朋友少、六亲助力薄。与孤辰同见则孤苦更甚，宜修心养性、广结善缘。',
      categories: ['孤克'],
      scenes: ['marriage', 'family', 'overall']
    },
    citation: [
      '《三命通会·论孤辰寡宿》："寡宿者，独居之象也。妇人遇之，夫星早丧；男子遇之，妻妾无缘。"',
      '《协纪辨方书》："孤辰寡宿，主人孤介寡合，骨肉无情，六亲少靠。"'
    ],
    version: 'B5.0'
  },
  {
    id: 'shiedabai',
    name: '十恶大败',
    aliases: ['十恶大败日', '大败'],
    nature: 'xiong',
    source: '三命通会',
    appliesTo: ['day'],
    condition: {
      description: '十恶大败日：甲辰乙巳与壬申，丙申丁亥及庚辰，戊戌癸亥加辛巳，己丑都来十位神。四柱日干支逢之即是。',
      formula: `(ganzhi='甲辰')||(ganzhi='乙巳')||(ganzhi='壬申')||(ganzhi='丙申')||(ganzhi='丁亥')||(ganzhi='庚辰')||(ganzhi='戊戌')||(ganzhi='癸亥')||(ganzhi='辛巳')||(ganzhi='己丑')`,
      example: '甲辰日、乙巳日'
    },
    invalidation: {
      byShenSha: ['天乙贵人', '禄神'],
      description: '十恶大败遇天乙贵人或禄神则减凶，反主先败后成',
      degree: 0.4
    },
    weight: { base: 0.85, lingWeight: 0.1, touganWeight: 0.1 },
    effect: {
      human: '十恶大败主诸事不顺、财运大败、做事多败少成。出生在十恶大败日者，祖业难守、幼年家境贫寒，一生多破财，做事易半途而废。若有贵人相助或身旺有制，则反主先苦后甜、大器晚成。',
      categories: ['官非', '财富', '其他'],
      scenes: ['wealth', 'career', 'overall']
    },
    citation: [
      '《三命通会·论十恶大败》："十恶者，律法中十恶不赦之罪也；大败者，兵法中百战百败之意也。其日忌为百事，主大失财物。"',
      '《渊海子平》："十恶大败干支排，十神相遇定为灾，若还值此为生日，骨肉分离百事乖。"'
    ],
    version: 'B5.0'
  },
  {
    id: 'kuigang',
    name: '魁罡',
    aliases: ['魁罡贵人', '魁罡星'],
    nature: 'ji',
    source: '渊海子平',
    appliesTo: ['day'],
    condition: {
      description: '魁罡四日最为先，庚辰壬辰戊戌连，又见庚戌是魁罡。四柱日干支见此四日者即是。',
      formula: `(ganzhi='庚辰')||(ganzhi='壬辰')||(ganzhi='戊戌')||(ganzhi='庚戌')`,
      example: '庚辰日、壬辰日'
    },
    invalidation: {
      byGzAction: ['chong', 'hehua-failed'],
      description: '魁罡逢冲则福量不足，遇财官印绶则反为破格',
      degree: 0.5
    },
    weight: { base: 0.75, lingWeight: 0.1, touganWeight: 0.1 },
    effect: {
      human: '魁罡主聪明果断、有领导才能、性格刚直。命中魁罡者，做事果断、有魄力、不畏权势，适合从事公职、执法、管理等工作。身旺得魁罡制杀为权，主大富大贵；身弱逢之则性情刚烈、易惹是非。',
      categories: ['权势', '武星', '贵人'],
      scenes: ['career', 'wealth', 'overall']
    },
    citation: [
      '《渊海子平·论魁罡》："魁罡四柱日辰逢，日主强时福寿浓，一露财官并带杀，管教终久受贫穷。"',
      '《三命通会》："魁罡者，乃天地之正气，主人聪敏智巧，文章盖世，有威权，善决断。"'
    ],
    version: 'B5.0'
  },
  {
    id: 'hongyan',
    name: '红艳',
    aliases: ['红艳煞', '红艳桃花'],
    nature: 'zhong',
    source: '三命通会',
    appliesTo: ['year', 'month', 'day', 'hour'],
    condition: {
      description: '红艳者，多红颜薄命之意。多情多欲少人知，六丙逢寅辛见鸡，癸临申上丁见未，眉开眼笑乐嬉嬉。甲乙午申庚见戌，此是桃花最旺时。',
      formula: `(gan='甲'&&zhi='午')||(gan='乙'&&zhi='申')||(gan='丙'&&zhi='寅')||(gan='丁'&&zhi='未')||(gan='戊'&&zhi='辰')||(gan='己'&&zhi='辰')||(gan='庚'&&zhi='戌')||(gan='辛'&&zhi='酉')||(gan='壬'&&zhi='子')||(gan='癸'&&zhi='申')`,
      example: '甲日见午'
    },
    invalidation: {
      byGzAction: ['chong', 'hai'],
      description: '红艳逢冲害则桃花之性减，但仍主感情波折',
      degree: 0.4
    },
    weight: { base: 0.65, lingWeight: 0.1, touganWeight: 0.1 },
    effect: {
      human: '红艳主异性缘极旺、容貌出众、感情丰富。命中带红艳者，天生丽质或气质出众，桃花旺盛，异性缘极好。吉则得贵人相助、婚姻美满；凶则易陷入多角恋情、感情纠葛不断，需防桃花劫。',
      categories: ['桃花', '才艺'],
      scenes: ['marriage', 'career', 'overall']
    },
    citation: [
      '《三命通会》："红艳煞主男女多情，淫欲无禁，若与桃花同宫，必为娼妓之流。"',
      '《渊海子平》："红艳桃花主人美貌多娇，异性缘重，情丝缠绕。"'
    ],
    version: 'B5.0'
  }
]

export default DEFINITIONS
