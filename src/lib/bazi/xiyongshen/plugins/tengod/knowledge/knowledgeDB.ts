import type { TenGodKnowledge, TenGodName } from '../types'

export const ENTRIES: TenGodKnowledge[] = [
  {
    name: '比肩',
    wuxing: 'same',
    sameWuxing: true,
    yinYang: '阴',
    polarity: '偏',
    nature: ['独立自主', '自尊心强', '刚直不阿', '重朋友义气', '意志坚定', '不喜约束'],
    role: '同辈手足、合作伙伴、竞争对手，代表自我意识与独立行动能力',
    likes: ['喜身强有根，独立自主', '喜食伤泄秀，才华发挥', '喜财星透出，以财养身', '喜官杀适度制身，避免过刚'],
    dislikes: ['忌身弱多见，兄弟无靠反成拖累', '忌比劫重重夺财，破耗不利', '忌官杀太旺克身，压力过大', '忌印星过重生身，反而壅塞'],
    effects: ['增强日主力量，身弱时为用神', '代表同辈助力与竞争并存', '夺财之性，命局财弱时不利财运', '助身抗官杀，身弱官杀旺时可帮扶'],
    classicRules: ['比肩一位为清，多则兄弟不和、竞争激烈', '身强比肩旺，宜用官杀制之或食伤泄之'],
    produces: ['食神', '伤官'],
    controls: ['偏财', '正财'],
    controlledBy: ['七杀', '正官'],
    drainedBy: ['食神', '伤官'],
    helps: ['劫财'],
    transformsTo: ['劫财'],
    conflictsWith: ['正财', '偏财'],
    classicCitations: [
      {
        code: 'DTS-001',
        classicName: '滴天髓',
        chapter: '通神论·理气',
        originalText: '五阳皆阳丙为最，五阴皆阴癸为至。比肩同类，其性刚直。',
        interpretation: '比肩为同类同气之神，性格刚直不阿，阳干之比肩尤为刚烈，阴干之比肩柔韧而有主见。'
      },
      {
        code: 'ZYQ-001',
        classicName: '子平真诠',
        chapter: '论用神',
        originalText: '比肩为兄弟，主帮助之力，亦主争夺之患。',
        interpretation: '比肩既代表兄弟朋友的助力，也暗藏竞争与争夺，身旺时比肩多反为忌，主财被分夺。'
      }
    ]
  },
  {
    name: '劫财',
    wuxing: 'same',
    sameWuxing: true,
    yinYang: '阳',
    polarity: '偏',
    nature: ['积极进取', '冒险敢为', '慷慨大方', '好面子重名誉', '行动力强', '易冲动'],
    role: '异性同辈、得力助手、也代表小人暗害，主行动力与冒险精神',
    likes: ['喜身弱遇之，得朋友助力', '喜食伤配合，将冲劲化为才华', '喜有官杀制约，避免鲁莽行事', '喜财星有根，劫而不尽'],
    dislikes: ['忌身旺多见，破财招祸', '忌羊刃同柱，刚烈易出横事', '忌冲克财星太甚，家破财散', '忌无制化，鲁莽惹祸'],
    effects: ['身弱时帮身有力，胜过比肩', '行动果断，善于抓住机遇', '夺财之力强于比肩，对财运威胁大', '人缘广但易交损友'],
    classicRules: ['劫财与羊刃并见，为凶最甚，宜官杀制之', '劫财透干而无财，反主虚浮不实'],
    produces: ['食神', '伤官'],
    controls: ['正财', '偏财'],
    controlledBy: ['正官', '七杀'],
    drainedBy: ['伤官', '食神'],
    helps: ['比肩'],
    transformsTo: ['比肩'],
    conflictsWith: ['正财', '偏财'],
    classicCitations: [
      {
        code: 'YSX-001',
        classicName: '渊海子平',
        chapter: '论劫财',
        originalText: '劫财又名羊刃，主克妻害父，好斗贪淫。',
        interpretation: '劫财旺而无制，主破财伤身，性格刚烈好斗，需官杀制伏或食伤化泄方吉。'
      },
      {
        code: 'SMTH-001',
        classicName: '三命通会',
        chapter: '论十神',
        originalText: '劫财败财，心高下贱，见者贪婪。',
        interpretation: '劫财旺盛之人多心高气傲，贪多务得，若逢财星透出则生争夺之心，宜修养心性。'
      }
    ]
  },
  {
    name: '食神',
    wuxing: 'output',
    sameWuxing: false,
    yinYang: '阴',
    polarity: '偏',
    nature: ['温和厚道', '聪明智慧', '言语不多但有见地', '知足常乐', '品味高雅', '饮食口福好'],
    role: '才华表现、口福食禄、子女晚辈、生财之源，代表温和的创造与表达',
    likes: ['喜身旺，泄秀有力', '喜财星接续，食伤生财', '喜七杀有制，食神制杀为贵格', '喜有根气，才华稳定持久'],
    dislikes: ['忌偏印（枭神）夺食，凶祸立至', '忌身弱食多，泄身太过反为累', '忌冲克太过，才华被压制', '忌官杀混杂，食伤受克无用'],
    effects: ['生财之源，食伤生财为富格', '制杀有功，食神制杀为将才', '代表子女得力，晚年享福', '主人有口福，身心健康'],
    classicRules: ['食神制杀，英雄独压万人', '食神一位胜财官，多则反为不秀'],
    produces: ['偏财', '正财'],
    controls: ['七杀'],
    controlledBy: ['偏印'],
    drainedBy: ['偏财', '正财'],
    helps: ['伤官'],
    transformsTo: ['伤官'],
    conflictsWith: ['偏印', '七杀'],
    classicCitations: [
      {
        code: 'QTB-001',
        classicName: '穷通宝鉴',
        chapter: '甲木论',
        originalText: '食神得禄，衣食丰隆。食神制杀，化凶为吉。',
        interpretation: '食神旺相主衣食无忧，若能制伏七杀，则将凶暴之气化为威权，主大贵。'
      },
      {
        code: 'SBTK-001',
        classicName: '神峰通考',
        chapter: '五星正论',
        originalText: '食神枭神两不立，见之定然主哭泣。',
        interpretation: '食神最怕偏印（枭神）来克，名为枭神夺食，主疾病、破财、损子息，为凶格。'
      }
    ]
  },
  {
    name: '伤官',
    wuxing: 'output',
    sameWuxing: false,
    yinYang: '阳',
    polarity: '偏',
    nature: ['才华横溢', '聪明外露', '能言善辩', '恃才傲物', '创新求变', '不喜约束'],
    role: '才智表现、言语表达、晚辈学生、也代表是非官非，主外向型创造力',
    likes: ['喜身旺泄秀，大展才华', '喜财星转化，伤官生财为富', '喜印星制之，伤官佩印为贵', '喜七杀配合，伤官合杀有功'],
    dislikes: ['忌见正官，伤官见官为祸百端', '忌身弱伤重，反成聪明反被聪明误', '忌过多过杂，华而不实', '忌无财转化，才华不能变现'],
    effects: ['才华出众，技艺超群', '生财有力，伤官生财大于食神', '克官之性，易得罪权贵惹是非', '配印则贵，文武双全'],
    classicRules: ['伤官见官，为祸百端', '伤官佩印，贵不可言；伤官生财，富甲一方'],
    produces: ['正财', '偏财'],
    controls: ['正官'],
    controlledBy: ['正印'],
    drainedBy: ['正财', '偏财'],
    helps: ['食神'],
    transformsTo: ['食神'],
    conflictsWith: ['正官', '正印'],
    classicCitations: [
      {
        code: 'QLMG-001',
        classicName: '千里命稿',
        chapter: '十神篇',
        originalText: '伤官见官，不讼则病。其祸最烈，不可不察。',
        interpretation: '伤官与正官同柱或相冲，名伤官见官，主官非诉讼、疾病横祸，为命局大忌。'
      },
      {
        code: 'YDZP-001',
        classicName: '玉照定真经',
        chapter: '吉凶格局',
        originalText: '伤官逢财以发财，伤官逢印以贵显。',
        interpretation: '伤官遇财星则才华变现主大富，遇印星则才华受到约束和提升主大贵，两者皆为上格。'
      }
    ]
  },
  {
    name: '偏财',
    wuxing: 'wealth',
    sameWuxing: false,
    yinYang: '阴',
    polarity: '偏',
    nature: ['慷慨大方', '善于交际', '投机取巧', '重义轻财', '人缘极佳', '喜动不喜静'],
    role: '偏业之财、意外之财、父星、异性缘，代表流动性财富与社交能力',
    likes: ['喜身旺能担财，财多身弱反为祸', '喜食伤生财，财源滚滚', '喜官杀护财，防止比劫夺财', '喜有根有库，财富能聚'],
    dislikes: ['忌比劫争夺，破财败业', '忌身弱不胜财，富屋贫人', '忌刑冲克害，财来财去', '忌印星破财，两败俱伤'],
    effects: ['代表偏财运、中彩票、投资获利', '父缘深厚，得长辈资助', '异性缘旺，感情丰富', '善交际，经商之才'],
    classicRules: ['偏财透出，慷慨施财，人人敬爱', '偏财逢比劫，父与妻两不利'],
    produces: ['七杀', '正官'],
    controls: ['偏印', '正印'],
    controlledBy: ['比肩', '劫财'],
    drainedBy: ['七杀', '正官'],
    helps: ['正财'],
    transformsTo: ['正财'],
    conflictsWith: ['比肩', '劫财', '偏印', '正印'],
    classicCitations: [
      {
        code: 'DTS-002',
        classicName: '滴天髓',
        chapter: '财富论',
        originalText: '何知其人富，财气通门户。偏财为众，善财善施。',
        interpretation: '偏财旺相主人财源广阔，且为人乐善好施，财气通门户者，必为大富之人。'
      },
      {
        code: 'ZYQ-002',
        classicName: '子平真诠',
        chapter: '论财星',
        originalText: '偏财乃众人之财，宜藏不宜露。露则比劫争之。',
        interpretation: '偏财为公共之财，暗藏则聚，透出则易遭人觊觎，比劫争夺，反主破财。'
      }
    ]
  },
  {
    name: '正财',
    wuxing: 'wealth',
    sameWuxing: false,
    yinYang: '阳',
    polarity: '正',
    nature: ['勤劳节俭', '脚踏实地', '诚实守信', '重视家庭', '按部就班', '稳扎稳打'],
    role: '正业之财、固定收入、妻星、物质基础，代表稳定的财富与家庭责任',
    likes: ['喜身旺任财，安享其富', '喜食伤相生，财有源头', '喜官星卫财，防盗贼抢夺', '喜财星清纯，一位为贵'],
    dislikes: ['忌比劫争财，婚姻破财两不顺', '忌财多身弱，反为财所累', '忌冲克刑害，动荡不安', '忌印星来破，祖业难守'],
    effects: ['正财运稳定，工薪收入好', '妻贤子孝，家庭美满', '为人正派，守信用', '事业稳步发展'],
    classicRules: ['正财一位为真，多则杂而不专', '财旺生官，富贵双全'],
    produces: ['正官', '七杀'],
    controls: ['正印', '偏印'],
    controlledBy: ['劫财', '比肩'],
    drainedBy: ['正官', '七杀'],
    helps: ['偏财'],
    transformsTo: ['偏财'],
    conflictsWith: ['劫财', '比肩', '正印', '偏印'],
    classicCitations: [
      {
        code: 'YSX-002',
        classicName: '渊海子平',
        chapter: '论正财',
        originalText: '正财喜旺喜身强，比劫枭神总见伤。',
        interpretation: '正财需要日主身强才能担当，最怕比劫争夺和印星破害，遇之则财物受损，婚姻不利。'
      },
      {
        code: 'SMTH-002',
        classicName: '三命通会',
        chapter: '论财',
        originalText: '正财乃天财，主勤俭成家，得妻财之力。',
        interpretation: '正财为正道之财，主人勤劳节俭，白手成家，且多得妻子或妻家之力而致富。'
      }
    ]
  },
  {
    name: '七杀',
    wuxing: 'power',
    sameWuxing: false,
    yinYang: '阴',
    polarity: '偏',
    nature: ['威严果断', '勇猛刚烈', '有魄力', '好胜心强', '多疑善变', '易怒易躁'],
    role: '权威武职、竞争对手、疾病灾祸、压力挑战，代表刚性约束力与危机',
    likes: ['喜食神制之，七杀有制化为权', '喜印星化之，杀印相生为贵', '喜身强能担，掌权有威', '喜羊刃并，杀刃双显将相才'],
    dislikes: ['忌无制无化，攻身为祸', '忌官杀混杂，进退失据', '忌身弱杀重，夭贫交加', '忌财多生杀，雪上加霜'],
    effects: ['有制则为权贵，威镇一方', '无制则为灾祸，疾病官非', '代表魄力与决断力', '遇印化杀生身，文武全才'],
    classicRules: ['七杀有制化为权，无制为祸是小人', '一杀一制为贵，多制反为不奇'],
    produces: ['偏印', '正印'],
    controls: ['比肩', '劫财'],
    controlledBy: ['食神'],
    drainedBy: ['偏印', '正印'],
    helps: ['正官'],
    transformsTo: ['正官'],
    conflictsWith: ['食神', '比肩', '劫财'],
    classicCitations: [
      {
        code: 'QTB-002',
        classicName: '穷通宝鉴',
        chapter: '庚金论',
        originalText: '七杀逢制化为权，英雄豪杰定非凡。',
        interpretation: '七杀旺而有食神制伏或印星化解，主人有大魄力大作为，必为出类拔萃的英雄豪杰。'
      },
      {
        code: 'SBTK-002',
        classicName: '神峰通考',
        chapter: '论七杀',
        originalText: '七杀乃凶神，有制则吉，无制则凶。制之太过则人懦。',
        interpretation: '七杀为猛烈凶神，必须有制化方吉，但制伏太过反而使人懦弱无能，贵在适中。'
      }
    ]
  },
  {
    name: '正官',
    wuxing: 'power',
    sameWuxing: false,
    yinYang: '阳',
    polarity: '正',
    nature: ['正直稳重', '奉公守法', '有责任感', '举止端庄', '重视名誉', '循规蹈矩'],
    role: '事业名位、上级领导、丈夫星、法律规范，代表正统约束力与社会地位',
    likes: ['喜清纯一位，官星清透为贵', '喜财星相生，财官双美', '喜印星接续，官印相生', '喜身强能任，掌实权'],
    dislikes: ['忌七杀混官，官杀混杂不吉', '忌伤官克破，伤官见官为祸', '忌刑冲克害，名位受损', '忌身弱官重，压力致病'],
    effects: ['代表事业运、官运、名誉地位', '丈夫星，女命得之为良缘', '为人正直，受社会尊重', '财官印全，富贵之命'],
    classicRules: ['正官一位为贵，多则官多不荣', '官星清纯，终为大贵之人'],
    produces: ['正印', '偏印'],
    controls: ['劫财', '比肩'],
    controlledBy: ['伤官'],
    drainedBy: ['正印', '偏印'],
    helps: ['七杀'],
    transformsTo: ['七杀'],
    conflictsWith: ['伤官', '劫财', '比肩'],
    classicCitations: [
      {
        code: 'QLMG-002',
        classicName: '千里命稿',
        chapter: '官杀篇',
        originalText: '正官为禄神，主名誉地位，不可损伤。',
        interpretation: '正官是命局中的禄贵之星，主名誉地位和事业成就，最忌伤官克破和七杀混杂。'
      },
      {
        code: 'YDZP-002',
        classicName: '玉照定真经',
        chapter: '贵格论',
        originalText: '官印相生，少年及第。财官双美，早岁成名。',
        interpretation: '正官得正印相生，主早年科举及第；财星生正官，名财两得，都是少年得志的贵格。'
      }
    ]
  },
  {
    name: '偏印',
    wuxing: 'resource',
    sameWuxing: false,
    yinYang: '阴',
    polarity: '偏',
    nature: ['思维独特', '多才多艺', '敏感多疑', '喜新厌旧', '孤僻内向', '领悟力强'],
    role: '偏门学识、继母长辈、非正统教育、艺术玄学，代表非主流的智慧与支持',
    likes: ['喜身弱得生，偏印生身有功', '喜七杀配合，杀印相生', '喜财星制约，避免过旺', '喜得根气，学识扎实'],
    dislikes: ['忌夺食神，枭神夺食大凶', '忌身旺再生，壅塞不通', '忌正财偏财克破太过', '忌过多杂乱，所学不精'],
    effects: ['主偏门学问，玄学、艺术、宗教天赋', '身弱时生身有力，出奇制胜', '枭神夺食时主疾病破财损子', '代表继母或非亲生长辈关系'],
    classicRules: ['偏印又名枭神，忌见食神，见则夺', '偏印逢杀化杀生身，反成大贵'],
    produces: ['比肩', '劫财'],
    controls: ['食神'],
    controlledBy: ['偏财', '正财'],
    drainedBy: ['比肩', '劫财'],
    helps: ['正印'],
    transformsTo: ['正印'],
    conflictsWith: ['食神', '偏财', '正财'],
    classicCitations: [
      {
        code: 'DTS-003',
        classicName: '滴天髓',
        chapter: '论枭神',
        originalText: '枭神夺食，破家亡身。枭逢杀化，威镇边疆。',
        interpretation: '偏印（枭神）遇食神必夺，主破家亡身之大凶；但若遇七杀，反能化杀生身，主掌兵权威镇四方。'
      },
      {
        code: 'ZYQ-003',
        classicName: '子平真诠',
        chapter: '论印绶',
        originalText: '偏印为倒食，主性乖僻，多学少成。',
        interpretation: '偏印又名倒食，主人性格乖僻独特，兴趣广泛但难以专精，若能专注一门反有大成就。'
      }
    ]
  },
  {
    name: '正印',
    wuxing: 'resource',
    sameWuxing: false,
    yinYang: '阳',
    polarity: '正',
    nature: ['仁慈宽厚', '学识渊博', '稳重踏实', '重感情讲孝道', '有包容心', '重视精神生活'],
    role: '学问文才、母亲长辈、教育学历、贵人扶持，代表正统的智慧与庇护',
    likes: ['喜身弱得生，印绶护身有功', '喜官星相生，官印两全', '喜七杀化之，杀印相生', '喜根气充足，学识深厚'],
    dislikes: ['忌财星破印，学业有损母缘薄', '忌身旺印多，反成愚鲁', '忌伤官克制，才华被抑', '忌刑冲克害，长辈不利'],
    effects: ['主学业、文凭、学问成就', '母亲康健，长辈助力大', '印绶护身，逢凶化吉', '官印相生，仕途顺利'],
    classicRules: ['印绶逢官，名登金榜', '印多身旺，反为无用，需财破印'],
    produces: ['劫财', '比肩'],
    controls: ['伤官'],
    controlledBy: ['正财', '偏财'],
    drainedBy: ['劫财', '比肩'],
    helps: ['偏印'],
    transformsTo: ['偏印'],
    conflictsWith: ['伤官', '正财', '偏财'],
    classicCitations: [
      {
        code: 'YSX-003',
        classicName: '渊海子平',
        chapter: '论印绶',
        originalText: '印绶生身，逢官则贵，遇财则破。',
        interpretation: '正印生助日主，若得正官来生印，则官印双全必大贵；若逢财星来克印，则印绶被伤，学业和名誉俱损。'
      },
      {
        code: 'SMTH-003',
        classicName: '三命通会',
        chapter: '论印',
        originalText: '正印为文星，主聪明多智，文章盖世。',
        interpretation: '正印是文贵之星，主人聪明好学，记忆力强，文章出众，学业有成，多得长辈师长喜爱提携。'
      }
    ]
  }
]

export class TenGodKnowledgeDB {
  private map = new Map<TenGodName, TenGodKnowledge>()

  constructor(entries: TenGodKnowledge[] = ENTRIES) {
    for (const e of entries) {
      this.map.set(e.name, e)
    }
  }

  get(name: TenGodName): TenGodKnowledge | undefined {
    return this.map.get(name)
  }

  has(name: TenGodName): boolean {
    return this.map.has(name)
  }

  all(): TenGodKnowledge[] {
    return Array.from(this.map.values())
  }

  byPolarity(p: '正' | '偏'): TenGodKnowledge[] {
    return this.all().filter(e => e.polarity === p)
  }

  byGroup(g: 'same' | 'output' | 'wealth' | 'power' | 'resource'): TenGodKnowledge[] {
    return this.all().filter(e => e.wuxing === g)
  }

  getCitations(name: TenGodName): TenGodKnowledge['classicCitations'] {
    return this.get(name)?.classicCitations ?? []
  }
}

export const defaultTenGodKnowledgeDB = new TenGodKnowledgeDB()
