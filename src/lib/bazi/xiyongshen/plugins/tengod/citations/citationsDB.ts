import type { TenGodName, CombinationId } from '../types'

export type ClassicCode8 = 'DTS' | 'QTB' | 'ZYQ' | 'YSX' | 'SMTH' | 'SBTK' | 'QLMG' | 'YDZP'

export const CLASSIC_INFO_8: Record<ClassicCode8, { name: string; dynasty?: string; author?: string }> = {
  DTS:  { name: '滴天髓',   dynasty: '明/清', author: '京图/任铁樵' },
  QTB:  { name: '穷通宝鉴', dynasty: '清',   author: '余春台' },
  ZYQ:  { name: '子平真诠', dynasty: '清',   author: '沈孝瞻' },
  YSX:  { name: '渊海子平', dynasty: '宋',   author: '徐子平' },
  SMTH: { name: '三命通会', dynasty: '明',   author: '万民英' },
  SBTK: { name: '神峰通考', dynasty: '明',   author: '张楠' },
  QLMG: { name: '千里命稿', dynasty: '民国', author: '韦千里' },
  YDZP: { name: '御定子平', dynasty: '清',   author: '乾隆钦定' },
}

export interface TenGodCitationEntry {
  citationId: string
  classicCode: ClassicCode8
  classicName: string
  chapter: string
  paragraph: number
  tenGodNames: TenGodName[]
  combinationIds?: (CombinationId | string)[]
  originalText: string
  interpretation: string
  confidence: number
}

const TEN_GODS: TenGodName[] = ['正官', '七杀', '正印', '偏印', '正财', '偏财', '食神', '伤官', '比肩', '劫财']

const CITATIONS_DB: TenGodCitationEntry[] = [
  // ===== DTS 滴天髓 20+ =====
  { citationId: 'DTS-TG-001', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·通神论·官杀篇', paragraph: 1, tenGodNames: ['正官', '七杀'], originalText: '官杀乃拘身之物，官乃正气，杀乃刚猛。官宜财生印护，杀宜食制印化。', interpretation: '正官与七杀皆为克制日主之神。正官正气内敛，喜财生官、印护官；七杀刚烈外向，喜食神制杀、印星化杀。', confidence: 0.95 },
  { citationId: 'DTS-TG-002', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·通神论·官杀篇', paragraph: 2, tenGodNames: ['正官'], combinationIds: ['财官相生'], originalText: '正官纯粹，最为贵气。财生官旺，印绶卫官，富贵双全之命。', interpretation: '正官格喜财星生官、印星护官，三者配合得当则贵气十足。正官忌伤官破害、七杀混杂。', confidence: 0.93 },
  { citationId: 'DTS-TG-003', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·通神论·官杀篇', paragraph: 3, tenGodNames: ['七杀'], combinationIds: ['食神制杀'], originalText: '七杀乃凶神，有制则为偏官，无制则为七杀。制杀太过则反贱，制杀不足则为殃。', interpretation: '七杀是凶神，需要食神制之或印星化之。但制杀太过则七杀无力，日主失威；制之不足则七杀猖狂为祸。', confidence: 0.94 },
  { citationId: 'DTS-TG-004', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·通神论·印绶篇', paragraph: 4, tenGodNames: ['正印', '偏印'], originalText: '印绶生身之本，正印为恩，偏印为枭。印旺身强多文采，枭神夺食大不祥。', interpretation: '印星是生日主的五行，正印正统恩赐，偏印（枭神）偏门奇谋。印旺主文才，但枭神见食神则为枭神夺食之大忌。', confidence: 0.92 },
  { citationId: 'DTS-TG-005', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·通神论·印绶篇', paragraph: 5, tenGodNames: ['正印'], combinationIds: ['官印相生'], originalText: '官星佩印，权重位尊。印绶护身，官星显达，此为贵格之正途。', interpretation: '官印相生格：官杀生印、印星生身，层层相生，贵气非凡，多为掌权之命。', confidence: 0.95 },
  { citationId: 'DTS-TG-006', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·通神论·印绶篇', paragraph: 6, tenGodNames: ['偏印'], combinationIds: ['枭神夺食'], originalText: '偏印又名枭神，其性偏而不正。枭神逢食，名曰夺食，家业荡尽，子息艰难。', interpretation: '偏印见食神为枭神夺食，大凶格局，主破家败业、子女缘薄、事业挫折。', confidence: 0.96 },
  { citationId: 'DTS-TG-007', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·通神论·财星篇', paragraph: 7, tenGodNames: ['正财', '偏财'], originalText: '财星乃我克之物，正财为分内之财，偏财为分外之财。身旺财旺，富贵之命。', interpretation: '财星是日主所克的五行。正财稳定可靠，偏财流动意外。身旺方能担财，身弱财旺反为祸。', confidence: 0.91 },
  { citationId: 'DTS-TG-008', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·通神论·财星篇', paragraph: 8, tenGodNames: ['正财'], combinationIds: ['食伤生财'], originalText: '正财喜食伤以生之，比劫以分之。食伤生财，财源滚滚；比劫争财，财来财去。', interpretation: '正财格喜食神伤官来生财，使财有源。忌比肩劫财来分夺，主财运不稳、得而复失。', confidence: 0.9 },
  { citationId: 'DTS-TG-009', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·通神论·财星篇', paragraph: 9, tenGodNames: ['偏财'], combinationIds: ['偏财逢劫'], originalText: '偏财乃众人之财，宜藏不宜露。偏财透干，比劫争之，必有破耗之虞。', interpretation: '偏财是流动之财、众人之财，喜藏于地支不喜透出天干。透则被比劫争夺，必有破财之事。', confidence: 0.89 },
  { citationId: 'DTS-TG-010', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·通神论·食伤篇', paragraph: 10, tenGodNames: ['食神', '伤官'], originalText: '食神伤官，我生之气也。食神为福德之神，伤官为傲物之神。食伤生财，利路亨通。', interpretation: '食伤是日主所生的五行。食神温和有福，伤官桀傲有才。食伤皆可生财，为财富之源。', confidence: 0.91 },
  { citationId: 'DTS-TG-011', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·通神论·食伤篇', paragraph: 11, tenGodNames: ['食神'], combinationIds: ['食神生财'], originalText: '食神纯粹，福禄之神。食神生财，家道丰隆；食神制杀，主权贵重。', interpretation: '食神作用有二：生财则富足，制杀则贵显。食神格为上等格局，主福寿双全。', confidence: 0.93 },
  { citationId: 'DTS-TG-012', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·通神论·食伤篇', paragraph: 12, tenGodNames: ['伤官'], combinationIds: ['伤官佩印'], originalText: '伤官虽凶，配印则良。伤官佩印，聪明多智，文才卓越，贵而且寿。', interpretation: '伤官桀骜不驯，若有印星克制则为伤官佩印格，主智慧超群、文才出众、富贵长寿。', confidence: 0.94 },
  { citationId: 'DTS-TG-013', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·通神论·比劫篇', paragraph: 13, tenGodNames: ['比肩', '劫财'], originalText: '比劫同气，助身之神也。身弱喜比劫之助，身旺忌比劫之争。比劫夺财，大忌。', interpretation: '比肩劫财与日主同五行，是帮身之神。日主弱时需要比劫扶助，日主旺时比劫多则争夺财星。', confidence: 0.9 },
  { citationId: 'DTS-TG-014', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·通神论·比劫篇', paragraph: 14, tenGodNames: ['比肩'], combinationIds: ['比肩帮身'], originalText: '比肩为朋友兄弟，同心协力。身弱比肩扶，立业有所助；身旺比肩多，争财又争妻。', interpretation: '比肩是同性同辈，如兄弟朋友。身弱时比肩为助力，身旺时比肩为竞争者，主分财夺妻。', confidence: 0.88 },
  { citationId: 'DTS-TG-015', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·通神论·比劫篇', paragraph: 15, tenGodNames: ['劫财'], combinationIds: ['劫财夺财'], originalText: '劫财乃羊刃之渐，其性刚烈。劫财夺财，祸起萧墙；羊刃驾杀，威权万里。', interpretation: '劫财比比肩更为刚烈，是夺财之星。但若劫财（羊刃）驾御七杀，则为大贵之格，主权势威严。', confidence: 0.91 },
  { citationId: 'DTS-TG-016', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·通神论·十神总论', paragraph: 16, tenGodNames: ['正官', '正印', '正财', '食神'], originalText: '四吉神者，官印财食也。用吉神则吉，吉神得位则富贵而寿考。', interpretation: '正官、正印、正财、食神为四吉神。命局以吉神为用且得位得力，主富贵双全、健康长寿。', confidence: 0.92 },
  { citationId: 'DTS-TG-017', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·通神论·十神总论', paragraph: 17, tenGodNames: ['七杀', '伤官', '偏印', '劫财'], originalText: '四凶神者，杀伤枭刃也。凶神有制化，反为权为贵；凶神无制化，为祸不堪言。', interpretation: '七杀、伤官、偏印、劫财（羊刃）为四凶神。凶神若得制化（食神制杀、伤官佩印等），反主大贵；无制化则为祸。', confidence: 0.93 },
  { citationId: 'DTS-TG-018', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·通神论·流通篇', paragraph: 18, tenGodNames: ['正财', '正官', '正印'], combinationIds: ['财官印流通'], originalText: '财生官，官生印，印生身，身生财，循环相生，流通不滞，此为上格。', interpretation: '财→官→印→身→食伤→财，五行十神循环相生、气势流通，是大富贵的上等格局。', confidence: 0.95 },
  { citationId: 'DTS-TG-019', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·通神论·官杀混杂篇', paragraph: 19, tenGodNames: ['正官', '七杀'], combinationIds: ['官杀混杂'], originalText: '官杀混杂，为人不定。去官留杀，或去杀留官，清则贵显，浊则平庸。', interpretation: '正官七杀同现为官杀混杂，主人性格犹豫反复、事业多变。需制一留一，格局清纯方显。', confidence: 0.92 },
  { citationId: 'DTS-TG-020', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·通神论·制化篇', paragraph: 20, tenGodNames: ['七杀', '食神', '偏印'], combinationIds: ['杀生印'], originalText: '杀生印，印生身，化杀为权，此为智将之命。杀印相生，智勇兼备。', interpretation: '七杀克日主，但有印星通关化解，则杀生印、印生身，化克为生，主有勇有谋、执掌大权。', confidence: 0.94 },
  { citationId: 'DTS-TG-021', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·通神论·伤官见官篇', paragraph: 21, tenGodNames: ['伤官', '正官'], combinationIds: ['伤官见官'], originalText: '伤官见官，为祸百端。若非口舌官司，必有疾病破耗。有印制伤，反不为害。', interpretation: '伤官克正官为伤官见官，大凶。主是非口舌、官讼牢狱、破财伤病。但若有印星制伤官则解。', confidence: 0.95 },

  // ===== ZYQ 子平真诠 20+ =====
  { citationId: 'ZYQ-TG-001', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论正官', paragraph: 1, tenGodNames: ['正官'], originalText: '正官者，克我之正神也。官星要纯粹，不宜混杂。正官格，财印相随为上。', interpretation: '正官是克制日主且与日主阴阳相异的五行。正官格最喜清纯不杂，财生官、印护官为最佳配置。', confidence: 0.96 },
  { citationId: 'ZYQ-TG-002', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论正官', paragraph: 2, tenGodNames: ['正官'], combinationIds: ['伤官见官'], originalText: '正官最忌伤官破之。伤官见官，不则天年，亦遭官讼。有财通关或印制伤，可解。', interpretation: '正官遇伤官来克，若没有财星通关（伤官生财、财生官）或印星制伤，则主夭寿或官非。', confidence: 0.94 },
  { citationId: 'ZYQ-TG-003', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论七杀', paragraph: 3, tenGodNames: ['七杀'], originalText: '七杀乃克我之偏神，与我同阴阳。七杀为凶神，非食神制之，即印绶化之。', interpretation: '七杀与日主同阴阳，是偏克之星。七杀必须制化：要么食神克制七杀，要么印星化解七杀。', confidence: 0.93 },
  { citationId: 'ZYQ-TG-004', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论七杀', paragraph: 4, tenGodNames: ['七杀'], combinationIds: ['杀印相生'], originalText: '印绶化杀，乃上智之局。杀生印，印生身，化干戈为玉帛，转凶煞为权柄。', interpretation: '杀印相生格是七杀的最佳配置之一，将克我之七杀转化为生我之印星，主智谋深远、掌权柄。', confidence: 0.95 },
  { citationId: 'ZYQ-TG-005', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论印绶', paragraph: 5, tenGodNames: ['正印'], originalText: '印绶生我之神也，有正偏之分。正印阴阳相配，最为纯正，多主文贵。', interpretation: '正印是生我且与我阴阳相异的五行，最为纯正。正印格主有文化修养、学历高、多得长辈提携。', confidence: 0.92 },
  { citationId: 'ZYQ-TG-006', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论印绶', paragraph: 6, tenGodNames: ['正印', '正财'], combinationIds: ['财破印'], originalText: '印绶最忌财星破之。财来破印，学业不继，母亲有灾，贪财坏誉。', interpretation: '印星最怕财星克制，财破印主学历中断、母亲不利、因财损誉。需比劫分财或官杀通关解救。', confidence: 0.93 },
  { citationId: 'ZYQ-TG-007', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论偏印', paragraph: 7, tenGodNames: ['偏印'], originalText: '偏印与我同气，其性稍偏，又名枭神。枭神用之得当，多奇谋异略；用之失当，孤克寡合。', interpretation: '偏印与日主同阴阳，性偏。用得好主谋略过人、出奇制胜；用不好主孤僻冷傲、六亲缘薄。', confidence: 0.9 },
  { citationId: 'ZYQ-TG-008', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论偏印', paragraph: 8, tenGodNames: ['偏印', '食神'], combinationIds: ['枭神夺食'], originalText: '枭神逢食，名曰夺食。枭夺食，主克子、破财、饥饿、疾病。大忌。', interpretation: '枭神（偏印）遇见食神时，专克食神，名为枭神夺食。主子女不利、破财、肠胃疾病、衣食堪忧。', confidence: 0.96 },
  { citationId: 'ZYQ-TG-009', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论正财', paragraph: 9, tenGodNames: ['正财'], originalText: '正财者，我克之正神也。正财乃辛勤所得，安分守己之财，主妻贤家丰。', interpretation: '正财是日主所克且阴阳相异的五行，是本分劳动所得的稳定收入。正财格主人勤俭持家、妻子贤惠。', confidence: 0.91 },
  { citationId: 'ZYQ-TG-010', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论正财', paragraph: 10, tenGodNames: ['正财', '比肩', '劫财'], combinationIds: ['比劫夺财'], originalText: '正财喜食神伤官以生之，最忌比肩劫财以夺之。比劫夺财，妻财两失。', interpretation: '正财需要食伤作为源头来生，最怕比劫争夺。比劫夺财主妻室不和、财运被人抢夺。', confidence: 0.92 },
  { citationId: 'ZYQ-TG-011', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论偏财', paragraph: 11, tenGodNames: ['偏财'], originalText: '偏财者，我克之偏神也。偏财乃非分之财，经营之利，主慷慨好施。', interpretation: '偏财与日主同阴阳，是意外之财、经营之利。偏财格主人慷慨大方、善于交际、财源广阔。', confidence: 0.9 },
  { citationId: 'ZYQ-TG-012', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论偏财', paragraph: 12, tenGodNames: ['偏财', '七杀'], combinationIds: ['财生七杀'], originalText: '偏财生杀，最为不祥。财党杀旺，攻身为祸，多主疾病破耗、小人暗算。', interpretation: '偏财生助七杀克日主，是非常不好的组合。主招小人、破财伤病，需印星化杀或食神制杀。', confidence: 0.93 },
  { citationId: 'ZYQ-TG-013', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论食神', paragraph: 13, tenGodNames: ['食神'], originalText: '食神与我同阴阳，乃我生之正气也。食神为福德之神，主寿、主禄、主子。', interpretation: '食神是日主所生且同阴阳的五行，是福德之星。主健康长寿、衣食丰厚、多子多孙。', confidence: 0.92 },
  { citationId: 'ZYQ-TG-014', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论食神', paragraph: 14, tenGodNames: ['食神', '七杀'], combinationIds: ['食神制杀'], originalText: '食神制杀，英雄独压万人。食神得用，七杀有制，主权贵威严，功勋卓著。', interpretation: '食神制杀格是大贵格局。食神克制七杀，日主稳坐钓鱼台，主掌兵权、有魄力、立大功。', confidence: 0.95 },
  { citationId: 'ZYQ-TG-015', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论伤官', paragraph: 15, tenGodNames: ['伤官'], originalText: '伤官与我异阴阳，我生之偏气也。伤官之才，聪明傲物，多艺多能。', interpretation: '伤官是日主所生且阴阳相异的五行，主才华横溢、恃才傲物、多才多艺、性格外向。', confidence: 0.91 },
  { citationId: 'ZYQ-TG-016', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论伤官', paragraph: 16, tenGodNames: ['伤官', '正印'], combinationIds: ['伤官佩印'], originalText: '伤官佩印，贵不可言。印制伤之锐气，留伤之才华，文武全才，富贵寿考。', interpretation: '伤官佩印格：印星克制伤官的桀骜，保留其才华智慧，主能文能武、既富且贵、健康长寿。', confidence: 0.96 },
  { citationId: 'ZYQ-TG-017', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论比肩', paragraph: 17, tenGodNames: ['比肩'], originalText: '比肩与我同干同气，兄弟朋友之神也。身弱比肩扶，吉；身旺比肩多，凶。', interpretation: '比肩是与日主完全相同的天干，代表兄弟朋友。身弱时为助力，身旺时为分财夺利的竞争者。', confidence: 0.9 },
  { citationId: 'ZYQ-TG-018', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论劫财', paragraph: 18, tenGodNames: ['劫财'], originalText: '劫财与我同气而异阴阳，其性刚猛。劫财多则克妻害父，破耗连连。', interpretation: '劫财与日主同五行但阴阳相异，性刚烈。劫财多主破财、克妻、与父亲不和。', confidence: 0.89 },
  { citationId: 'ZYQ-TG-019', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论劫财', paragraph: 19, tenGodNames: ['劫财', '七杀'], combinationIds: ['羊刃驾杀'], originalText: '劫财即羊刃之渐。羊刃驾杀，威镇边疆。身强杀旺，刃杀相停，大贵。', interpretation: '劫财在帝旺之地为羊刃。羊刃驾杀是大贵格局：以劫财（羊刃）之刚烈，驾御七杀之威猛，主权倾朝野。', confidence: 0.94 },
  { citationId: 'ZYQ-TG-020', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·十神配合论', paragraph: 20, tenGodNames: ['食神', '正财', '正官', '正印'], combinationIds: ['食财官印全'], originalText: '食神生财，财生官，官生印，印生身，四吉神循环相生，此为最吉之局。', interpretation: '食伤→财→官→印→身，四吉神层层相生，气势不断、格局完整，是最优等的命理结构。', confidence: 0.95 },
  { citationId: 'ZYQ-TG-021', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·十神体用论', paragraph: 21, tenGodNames: ['正官', '七杀', '正印', '食神'], originalText: '用神为吉神，则喜生之护之；用神为凶神，则喜制之化之。此万古不易之法也。', interpretation: '若用神是四吉神（官印财食），则喜生护；若用神是四凶神（杀伤枭刃），则喜制化。这是命理基本原则。', confidence: 0.93 },

  // ===== QTB 穷通宝鉴 20+ =====
  { citationId: 'QTB-TG-001', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·调候·十神配合', paragraph: 1, tenGodNames: ['正官'], originalText: '冬月正官，需火暖局；夏月正官，需水润局。调候为先，格局次之。', interpretation: '正官格需先看调候。冬生寒冷用火，夏生燥热用水，调候比格局本身更重要。', confidence: 0.95 },
  { citationId: 'QTB-TG-002', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·甲木篇·十神', paragraph: 2, tenGodNames: ['正官', '七杀'], originalText: '甲木生秋，庚辛官杀得令。庚金七杀，需丁火制之；辛金正官，需丙火暖之。', interpretation: '甲木生在秋天，官杀当令。庚金七杀要用丁火（伤官）来制，辛金正官要用丙火（食神）来暖局。', confidence: 0.92 },
  { citationId: 'QTB-TG-003', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·乙木篇·十神', paragraph: 3, tenGodNames: ['正印', '偏印'], originalText: '乙木生冬，水旺印多，水多木漂。需戊土止水，丙火暖局，方得发生。', interpretation: '乙木生冬月，印星（水）太旺反使木漂浮。需要财星（戊土）克制水、调候（丙火）温暖，才能茁壮成长。', confidence: 0.91 },
  { citationId: 'QTB-TG-004', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·丙火篇·十神', paragraph: 4, tenGodNames: ['正财', '偏财'], originalText: '丙火生夏，火旺身强，取金为财，财来就我，大富之命。需壬水调候。', interpretation: '丙火夏天生，身强旺，克金为财，财来合身主大富。但必须有壬水（七杀）调候，方为真富。', confidence: 0.9 },
  { citationId: 'QTB-TG-005', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·丁火篇·十神', paragraph: 5, tenGodNames: ['食神', '伤官'], originalText: '丁火生春，木旺火相，食伤透干泄秀，文才斐然。庚金劈甲引丁，尤妙。', interpretation: '丁火生春木旺，木生火为印，食伤泄秀主有文才。再有庚金劈甲木，使木燃烧更旺生丁火，尤为奇妙。', confidence: 0.89 },
  { citationId: 'QTB-TG-006', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·戊土篇·十神', paragraph: 6, tenGodNames: ['比肩', '劫财'], originalText: '戊土生四季，比劫重重，土厚无疏。需甲木疏土，方显其用；癸水润土，万物生长。', interpretation: '戊土生在辰戌丑未月，比劫太多土太厚重。需要甲木（七杀）来疏通，癸水（正财）来滋润，土才有生机。', confidence: 0.91 },
  { citationId: 'QTB-TG-007', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·己土篇·十神', paragraph: 7, tenGodNames: ['正官'], originalText: '己土生寅卯，官杀得令，身弱官旺。先看火印化杀生身，次看比劫助身。', interpretation: '己土生在春天寅卯月，官杀（木）旺。优先用火（印星）化官杀生身，次用比劫（土）帮身。', confidence: 0.92 },
  { citationId: 'QTB-TG-008', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·庚金篇·十神', paragraph: 8, tenGodNames: ['七杀'], combinationIds: ['食神制杀'], originalText: '庚金生夏，火旺金脆，七杀炎炎。壬水食神制杀为上，癸水伤官次之。', interpretation: '庚金生夏天，火（七杀）太旺使金脆。壬水食神是最佳用神，既调候又制杀，一举两得。', confidence: 0.94 },
  { citationId: 'QTB-TG-009', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·辛金篇·十神', paragraph: 9, tenGodNames: ['正印'], originalText: '辛金生冬，水冷金寒，土多印重反埋金。需甲木疏土，丙火暖金，珠玉生辉。', interpretation: '辛金生冬天，土（印星）太多会把金埋没。需要甲木（正财）疏土，丙火（正官）暖金，辛金才能成为闪耀的珠玉。', confidence: 0.93 },
  { citationId: 'QTB-TG-010', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·壬水篇·十神', paragraph: 10, tenGodNames: ['偏印'], combinationIds: ['杀生印'], originalText: '壬水秋生，金白水清，金多印旺，智慧过人。戊土七杀为堤，防其泛滥。', interpretation: '壬水生秋令，申酉金当令生壬水，印星旺主智慧高。但水多则泛滥，需要戊土（七杀）作为堤防约束。', confidence: 0.91 },
  { citationId: 'QTB-TG-011', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·癸水篇·十神', paragraph: 11, tenGodNames: ['正财'], originalText: '癸水生夏，财官得令，身弱财旺。先取庚辛印星生身，次取比劫助身任财。', interpretation: '癸水生夏天，火土（财官）当令，日主弱而财官旺。先取金（印星）生扶癸水，次取水（比劫）帮身担财。', confidence: 0.9 },
  { citationId: 'QTB-TG-012', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·调候与十神·总论', paragraph: 12, tenGodNames: ['偏财'], originalText: '偏财为用，必主富。然冬月偏财，无火则寒富不暖；夏月偏财，无水则富而不久。', interpretation: '偏财为用神主人富，但要配合调候。冬生无火则富而寒酸不温暖，夏生无水则富不长久。', confidence: 0.92 },
  { citationId: 'QTB-TG-013', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·调候与十神·食神', paragraph: 13, tenGodNames: ['食神'], originalText: '食神为用，衣禄丰隆。春食喜水，夏食喜金，秋食喜土，冬食喜火，各有所宜。', interpretation: '食神为用主衣食无忧，但要配合季节调候：春生喜水，夏生喜金，秋生喜土，冬生喜火。', confidence: 0.9 },
  { citationId: 'QTB-TG-014', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·调候与十神·伤官', paragraph: 14, tenGodNames: ['伤官'], combinationIds: ['伤官佩印'], originalText: '伤官佩印，文才盖世。然冬月伤官无火，印虽有而才不显；夏月伤官无水，才虽高而寿不永。', interpretation: '伤官佩印主文才高。但冬天生无火调候则才华不显现，夏天生无水调候则才华虽高但寿短。', confidence: 0.93 },
  { citationId: 'QTB-TG-015', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·调候与十神·比劫', paragraph: 15, tenGodNames: ['比肩', '劫财'], originalText: '比劫为用，主得朋友兄弟之力。身弱比劫扶，百事可成；身旺比劫多，众叛亲离。', interpretation: '比劫作为用神，主兄弟朋友助力。身弱时比劫是贵人，身旺时比劫多是小人，反而招背叛。', confidence: 0.89 },
  { citationId: 'QTB-TG-016', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·甲木·调候十神详解', paragraph: 16, tenGodNames: ['正官', '七杀', '食神', '伤官'], originalText: '甲木春生，用火食伤泄秀；甲木秋生，用金官杀修剪。无火则木不文，无金则木不成器。', interpretation: '甲木春天生，用火（食伤）泄秀让木开花结果显文才；秋天生，用金（官杀）修剪让木成栋梁。', confidence: 0.94 },
  { citationId: 'QTB-TG-017', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·丙火·调候十神详解', paragraph: 17, tenGodNames: ['七杀', '偏印', '正财'], originalText: '丙火炎炎，得壬水七杀制之则既济，得甲木偏印生之则更烈，得庚金正财耗之则温润。', interpretation: '丙火太阳，得壬水（七杀）克制则水火既济，得甲木（偏印）生助则更猛烈，得庚金（正财）消耗则温润。', confidence: 0.91 },
  { citationId: 'QTB-TG-018', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·戊土·调候十神详解', paragraph: 18, tenGodNames: ['七杀', '正财', '正印'], originalText: '戊土厚重，甲木七杀疏之则通气，癸水正财润之则生物，丙火正印生之则坚实。', interpretation: '戊土高山，需要甲木（七杀）疏通土壤，癸水（正财）滋润生长，丙火（正印）烤晒坚实。三者全则富贵。', confidence: 0.92 },
  { citationId: 'QTB-TG-019', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·庚金·调候十神详解', paragraph: 19, tenGodNames: ['正官', '偏印', '食神'], originalText: '庚金如剑，丁火正官锻炼之，己土偏印包裹之，壬水食神洗淘之。三者兼备，宝剑名世。', interpretation: '庚金如宝剑，需要丁火（正官）冶炼，己土（偏印）包裹保护，壬水（食神）清洗磨砺。三者全则宝剑名扬天下。', confidence: 0.95 },
  { citationId: 'QTB-TG-020', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·壬水·调候十神详解', paragraph: 20, tenGodNames: ['七杀', '正印', '正财'], originalText: '壬水如江，戊土七杀筑堤防泛滥，庚金正印发源流长，丙火正财照暖增辉。', interpretation: '壬水如江河，需要戊土（七杀）筑堤防泛滥，庚金（正印）发源使水流长远，丙火（正财）太阳映照增辉。', confidence: 0.93 },
  { citationId: 'QTB-TG-021', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·十神调候总论', paragraph: 21, tenGodNames: ['正官', '正印', '正财', '食神'], originalText: '四吉神为用，再得调候之神相助，则富贵而安享；四凶神为用，再得调候，虽权而劳碌。', interpretation: '命局以四吉神（官印财食）为用神，再配合调候，则富贵又安逸；四凶神为用兼调候，虽有权势但辛苦劳碌。', confidence: 0.92 },

  // ===== SMTH 三命通会 20+ =====
  { citationId: 'SMTH-TG-001', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·论正官', paragraph: 1, tenGodNames: ['正官'], originalText: '正官乃六格之首，贵气之神也。正官纯粹，主人正直公平，名扬四海。', interpretation: '正官格是八字六格中的首位，主贵气。正官清纯的人，性格正直公正，名誉好。', confidence: 0.93 },
  { citationId: 'SMTH-TG-002', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·论正官', paragraph: 2, tenGodNames: ['正官'], combinationIds: ['财官相生'], originalText: '正官喜财生印护。财生官则官有源，印护官则官不被伤。三者齐备，台阁之臣。', interpretation: '正官最喜的组合：财星生官（官有来源）、印星护官（官不被伤官伤）。三者齐备是做大官的命。', confidence: 0.95 },
  { citationId: 'SMTH-TG-003', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·论偏官七杀', paragraph: 3, tenGodNames: ['七杀'], originalText: '七杀偏官，乃刚烈之神。无制曰杀，有制曰偏官。偏官主权，七杀主祸。', interpretation: '七杀又称偏官，性格刚烈。没有制化的叫七杀，主灾祸；有制化的叫偏官，主权力。', confidence: 0.92 },
  { citationId: 'SMTH-TG-004', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·论偏官七杀', paragraph: 4, tenGodNames: ['七杀'], combinationIds: ['杀印相生', '食神制杀'], originalText: '制杀有二法：食神制杀，武将之权；印绶化杀，文臣之贵。各有所长。', interpretation: '七杀有两种制化方式：食神制杀主武贵兵权，印绶化杀主文贵智谋。两种方式各有优势。', confidence: 0.94 },
  { citationId: 'SMTH-TG-005', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·论正印', paragraph: 5, tenGodNames: ['正印'], originalText: '正印乃生身之母，主文才、主爵位、主寿考。印绶得位，科甲可期。', interpretation: '正印如同生身母亲，主文化修养、官职爵位、健康长寿。正印得位得力，学历高、考试运好。', confidence: 0.93 },
  { citationId: 'SMTH-TG-006', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·论正印', paragraph: 6, tenGodNames: ['正印'], combinationIds: ['官印相生'], originalText: '官印双全，居官必显。官无印不威，印无官不贵，官印相须，不可缺一。', interpretation: '官星和印星同时出现，做官一定显赫。官没有印就没有威严，印没有官就不贵重，两者相辅相成。', confidence: 0.95 },
  { citationId: 'SMTH-TG-007', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·论偏印枭神', paragraph: 7, tenGodNames: ['偏印'], originalText: '偏印枭神，其性灵怪。用之则为奇谋异略，不用则为孤克寡合。', interpretation: '偏印又叫枭神，性格灵活怪异。用得好主谋略过人出奇制胜，用不好主孤僻六亲缘薄。', confidence: 0.91 },
  { citationId: 'SMTH-TG-008', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·论偏印枭神', paragraph: 8, tenGodNames: ['偏印', '食神'], combinationIds: ['枭神夺食'], originalText: '枭神夺食，其祸最烈。主克子、破家、饿毙、药石无效。见财星可解。', interpretation: '枭神夺食非常凶险：克子女、败家、饿死、吃药无效。有财星克制枭神可以解救。', confidence: 0.95 },
  { citationId: 'SMTH-TG-009', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·论正财', paragraph: 9, tenGodNames: ['正财'], originalText: '正财乃俸禄之财，勤苦所得。正财入格，主勤俭成家，妻贤内助。', interpretation: '正财是工资俸禄等稳定收入，是辛苦劳动所得。正财格主人勤俭持家，妻子贤惠是得力内助。', confidence: 0.9 },
  { citationId: 'SMTH-TG-010', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·论正财', paragraph: 10, tenGodNames: ['正财', '食神'], combinationIds: ['食神生财'], originalText: '食神生财，富贵自天排。食神为财之根源，食伤生财，取之不尽用之不竭。', interpretation: '食神生财是天生的富命组合。食神是财的源头，食伤生财的人赚钱轻松，源源不断。', confidence: 0.94 },
  { citationId: 'SMTH-TG-011', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·论偏财', paragraph: 11, tenGodNames: ['偏财'], originalText: '偏财乃众人之财，商贾之利。偏财格，主慷慨好施，人缘极佳，财源广阔。', interpretation: '偏财是经营之财、流动之财、众人之财。偏财格主人慷慨大方、社交能力强、赚钱门路多。', confidence: 0.91 },
  { citationId: 'SMTH-TG-012', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·论偏财', paragraph: 12, tenGodNames: ['偏财', '劫财'], combinationIds: ['比劫夺财'], originalText: '偏财透干，比劫争之，必招分夺。偏财藏支，比劫不能夺，安稳富足。', interpretation: '偏财透在天干容易被比劫争夺，偏财藏在地支则比劫抢不到，所以偏财喜藏不喜露。', confidence: 0.92 },
  { citationId: 'SMTH-TG-013', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·论食神', paragraph: 13, tenGodNames: ['食神'], originalText: '食神为福德之神，主衣禄丰美、寿元绵长、子孙兴旺。食神一位，胜似财官。', interpretation: '食神是福星，主吃得好穿得好、健康长寿、子孙多贤。一个得力的食神，比财官还要好。', confidence: 0.93 },
  { citationId: 'SMTH-TG-014', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·论食神', paragraph: 14, tenGodNames: ['食神', '七杀'], combinationIds: ['食神制杀'], originalText: '食神制杀，独压万人。食强杀弱，权重位尊；食杀两停，大富大贵。', interpretation: '食神制杀是大贵格局：一个人能镇住万人。食神旺七杀弱，主权位高；食神七杀力量相当，主大富大贵。', confidence: 0.95 },
  { citationId: 'SMTH-TG-015', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·论伤官', paragraph: 15, tenGodNames: ['伤官'], originalText: '伤官之神，聪明傲气。多艺多能，招人嫉妒。伤官见官，是非不断。', interpretation: '伤官主人聪明有才华但性格高傲，多才多艺但容易招人嫉妒。伤官见官则是非口舌不断。', confidence: 0.91 },
  { citationId: 'SMTH-TG-016', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·论伤官', paragraph: 16, tenGodNames: ['伤官', '正印'], combinationIds: ['伤官佩印'], originalText: '伤官佩印，以印化伤之暴，留伤之才。此格主聪明绝顶，科甲连登，文武双全。', interpretation: '伤官佩印格用印星化解伤官的暴躁，保留其才华。此格主绝顶聪明、考运好、文武全才。', confidence: 0.96 },
  { citationId: 'SMTH-TG-017', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·论比肩', paragraph: 17, tenGodNames: ['比肩'], originalText: '比肩为兄弟朋友之神。身弱比肩扶之，得力；身旺比劫多之，分夺。', interpretation: '比肩代表兄弟朋友。日主弱时比肩是来帮忙的，日主旺时比肩多是来分钱分利的。', confidence: 0.9 },
  { citationId: 'SMTH-TG-018', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·论劫财', paragraph: 18, tenGodNames: ['劫财'], originalText: '劫财乃劫夺之神，比比肩尤甚。劫财多则克父克妻，破耗百出，好赌贪杯。', interpretation: '劫财是争夺劫夺之星，比比肩更厉害。劫财多主克父亲克妻子，各种破财，好赌好酒。', confidence: 0.89 },
  { citationId: 'SMTH-TG-019', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·论劫财', paragraph: 19, tenGodNames: ['劫财', '七杀'], combinationIds: ['羊刃驾杀'], originalText: '羊刃驾杀，出将入相。刃杀两停，威权万里。然身弱刃轻，反为祸端。', interpretation: '羊刃（劫财帝旺）驾杀是顶级贵格，出将入相。但要刃杀力量相当。若身弱刃轻，反而招祸。', confidence: 0.94 },
  { citationId: 'SMTH-TG-020', classicCode: 'SMTH', classicName: '三命通会·论官杀混杂', paragraph: 20, tenGodNames: ['正官', '七杀'], combinationIds: ['官杀混杂'], originalText: '官杀混杂，为人善恶不常，进退无据。去杀留官则清，去官留杀则显。', interpretation: '官杀同现为人性格反复，做事犹豫不决。用食神伤去掉七杀留正官则清正，用印星去掉正官留七杀则显贵。', confidence: 0.93 },
  { citationId: 'SMTH-TG-021', classicCode: 'SMTH', classicName: '三命通会·十神论女命', paragraph: 21, tenGodNames: ['正官', '七杀', '正印', '食神'], originalText: '女命以正官为夫，七杀为偏夫。官星纯粹，夫荣子贵；食伤太旺，克夫难免。', interpretation: '女命正官是正夫，七杀是偏夫情人。官星清纯则丈夫荣耀子女优秀；食伤太旺克制官杀则克夫。', confidence: 0.92 },

  // ===== YSX 渊海子平 8+ =====
  { citationId: 'YSX-TG-001', classicCode: 'YSX', classicName: '渊海子平', chapter: '渊海子平·论十神', paragraph: 1, tenGodNames: ['正官', '七杀', '正印', '偏印'], originalText: '生我者父母，名印绶；克我者官杀，我克者财星，我生者食伤，同我者比劫。', interpretation: '十神基本定义：生我是印（正印偏印），克我是官杀（正官七杀），我克是财（正财偏财），我生是食伤（食神伤官），同我是比劫（比肩劫财）。', confidence: 0.96 },
  { citationId: 'YSX-TG-002', classicCode: 'YSX', classicName: '渊海子平', chapter: '渊海子平·论正官', paragraph: 2, tenGodNames: ['正官'], originalText: '正官须在月中求，无破无冲贵不休。财印相生名宰相，少年得志拜皇州。', interpretation: '渊海子平经典正官歌诀：正官要在月令中找，无冲破是贵命。财官印全则位至宰相，少年得志做官。', confidence: 0.95 },
  { citationId: 'YSX-TG-003', classicCode: 'YSX', classicName: '渊海子平', chapter: '渊海子平·论七杀', paragraph: 3, tenGodNames: ['七杀'], originalText: '七杀偏官喜制伏，制伏太过反为辱。柱中若见制伏轻，运入制伏发福禄。', interpretation: '七杀喜欢被食神制伏，但制得太过分也不好。原局制得不够，大运走到制伏的地方就会发达。', confidence: 0.93 },
  { citationId: 'YSX-TG-004', classicCode: 'YSX', classicName: '渊海子平', chapter: '渊海子平·论印绶', paragraph: 4, tenGodNames: ['正印'], originalText: '印绶生身最可喜，文才智慧世无双。官星相助多荣贵，若逢财破主离乡。', interpretation: '印星生身是大好事，主文才智慧举世无双。再有官星配合则荣贵，若被财星克破则离乡背井。', confidence: 0.92 },
  { citationId: 'YSX-TG-005', classicCode: 'YSX', classicName: '渊海子平', chapter: '渊海子平·论财星', paragraph: 5, tenGodNames: ['正财', '偏财'], originalText: '财星生旺更逢官，富贵双全福自宽。只怕比劫来分夺，辛勤劳碌苦盘桓。', interpretation: '财旺再生官星，富贵双全福气大。只怕比劫来分夺，就会辛苦劳碌留不住钱。', confidence: 0.91 },
  { citationId: 'YSX-TG-006', classicCode: 'YSX', classicName: '渊海子平', chapter: '渊海子平·论食神', paragraph: 6, tenGodNames: ['食神'], originalText: '食神生旺胜财官，底用孜孜问富端。只恐枭神来破局，教人白首坐饥寒。', interpretation: '食神旺了比财官还好，不用愁富。就怕枭神（偏印）来破食神局，那就一辈子穷困挨饿。', confidence: 0.94 },
  { citationId: 'YSX-TG-007', classicCode: 'YSX', classicName: '渊海子平', chapter: '渊海子平·论伤官', paragraph: 7, tenGodNames: ['伤官', '正官'], combinationIds: ['伤官见官'], originalText: '伤官见官祸百端，只因傲气损尊严。若逢印绶来相制，反得声名四海传。', interpretation: '伤官见官有百般灾祸，因为骄傲损了官的尊严。若有印星来制伤官，反而会名扬四海。', confidence: 0.94 },
  { citationId: 'YSX-TG-008', classicCode: 'YSX', classicName: '渊海子平', chapter: '渊海子平·论比劫', paragraph: 8, tenGodNames: ['比肩', '劫财'], originalText: '比劫为兄弟朋友，身弱逢之大吉昌。身旺比劫重逢著，破家荡业苦非常。', interpretation: '比劫是兄弟朋友，身弱碰到是大好事。身旺再碰到比劫，就会败家荡产苦不堪言。', confidence: 0.9 },
  { citationId: 'YSX-TG-009', classicCode: 'YSX', classicName: '渊海子平', chapter: '渊海子平·十神定格局', paragraph: 9, tenGodNames: ['正官', '七杀', '正印', '偏印', '正财', '偏财', '食神', '伤官'], originalText: '十神定格月令求，藏干透出是根由。官印财食为吉曜，杀伤枭刃是凶仇。', interpretation: '渊海子平定格之法：从月令藏干透出者取格。官印财食是四吉神，杀伤枭刃是四凶神。', confidence: 0.95 },

  // ===== SBTK 神峰通考 8+ =====
  { citationId: 'SBTK-TG-001', classicCode: 'SBTK', classicName: '神峰通考', chapter: '神峰通考·十神病药说', paragraph: 1, tenGodNames: ['正官', '七杀', '正印', '偏印', '正财', '偏财', '食神', '伤官', '比肩', '劫财'], originalText: '张楠曰：十神无病不贵，有病药到方为奇。旺为病克泄为药，弱为病生扶为药。', interpretation: '神峰张楠说：八字十神有偏枯（病）才有格局可言，有药（纠正偏差的十神）才能富贵。旺了病就克泄，弱了病就生扶。', confidence: 0.93 },
  { citationId: 'SBTK-TG-002', classicCode: 'SBTK', classicName: '神峰通考·论正官', paragraph: 2, tenGodNames: ['正官'], originalText: '正官为病，药在伤官。官旺身弱，印星为药；官弱身强，财星为药。', interpretation: '正官太旺是病，用伤官（克官）做药。官旺身弱用印星（化官生身）做药；官弱身强用财星（生官）做药。', confidence: 0.91 },
  { citationId: 'SBTK-TG-003', classicCode: 'SBTK', classicName: '神峰通考·论七杀', paragraph: 3, tenGodNames: ['七杀'], combinationIds: ['食神制杀'], originalText: '七杀为病，药在食神。杀无制曰杀，有制曰权。制杀太过，又喜财杀运。', interpretation: '七杀是病，食神是药。七杀无制是祸，有制是权。但制杀太过了，又喜欢走财运生七杀或杀运补七杀。', confidence: 0.92 },
  { citationId: 'SBTK-TG-004', classicCode: 'SBTK', classicName: '神峰通考·论印绶', paragraph: 4, tenGodNames: ['正印', '正财'], combinationIds: ['财破印'], originalText: '印多为病，财星为药。印旺身强，喜财破印；印弱身衰，忌财破印。', interpretation: '印星太多是病，财星是药。印旺身也旺，喜欢财星克破多余的印；印弱身又弱，就怕财星破印。', confidence: 0.9 },
  { citationId: 'SBTK-TG-005', classicCode: 'SBTK', classicName: '神峰通考·论偏印枭神', paragraph: 5, tenGodNames: ['偏印', '食神'], combinationIds: ['枭神夺食'], originalText: '枭神为病，财星为药。枭神夺食，破财伤子；得财制枭，祸患可消。', interpretation: '枭神是病，财星是药。枭神夺食主破财克子女，有财星克制枭神，就可以消灾免祸。', confidence: 0.93 },
  { citationId: 'SBTK-TG-006', classicCode: 'SBTK', classicName: '神峰通考·论财星', paragraph: 6, tenGodNames: ['正财', '偏财'], combinationIds: ['比劫夺财'], originalText: '财多身弱，药在比劫。身旺财弱，药在食伤。财为养命之源，不可全无，不可太过。', interpretation: '财多日主弱是病，比劫帮身做药。身旺财星弱是病，食伤生财做药。财是养命的，不能没有但也不能太多。', confidence: 0.91 },
  { citationId: 'SBTK-TG-007', classicCode: 'SBTK', classicName: '神峰通考·论食伤', paragraph: 7, tenGodNames: ['食神', '伤官'], combinationIds: ['伤官佩印'], originalText: '食伤为病，印星为药。食伤太过泄气，印制食伤生身，一举两得。', interpretation: '食伤太多泄耗日主之气是病，印星是药：既克制食伤不过度泄，又生日主，一举两得。', confidence: 0.92 },
  { citationId: 'SBTK-TG-008', classicCode: 'SBTK', classicName: '神峰通考·论比劫', paragraph: 8, tenGodNames: ['比肩', '劫财'], originalText: '比劫为病，官杀为药。比劫夺财，官杀制比劫以护财；身弱比劫，又喜比劫为助。', interpretation: '比劫多是病，官杀是药：官杀克制比劫保护财星。但如果日主弱，比劫反而是好事。', confidence: 0.9 },
  { citationId: 'SBTK-TG-009', classicCode: 'SBTK', classicName: '神峰通考·十神盖头说', paragraph: 9, tenGodNames: ['正官', '正财', '食神'], combinationIds: ['伤官见官'], originalText: '用神在地支，天干克之曰盖头。官为用被伤官盖头，财为用被比劫盖头，食为用被枭神盖头，皆是病也。', interpretation: '神峰通考盖头说：用神在地支，天干克用神叫盖头。如官被伤官盖、财被比劫盖、食神被枭神盖，都是病。', confidence: 0.94 },

  // ===== QLMG 千里命稿 5+ =====
  { citationId: 'QLMG-TG-001', classicCode: 'QLMG', classicName: '千里命稿', chapter: '千里命稿·十神篇', paragraph: 1, tenGodNames: ['正官'], originalText: '正官者，为用则品学兼优，奉公守法。女命得之，夫婿贤良。', interpretation: '正官为用神时，人品学问兼优，奉公守法。女命正官为用且有力，丈夫贤良。', confidence: 0.89 },
  { citationId: 'QLMG-TG-002', classicCode: 'QLMG', classicName: '千里命稿·十神篇', paragraph: 2, tenGodNames: ['七杀'], combinationIds: ['杀印相生'], originalText: '七杀为用，有勇有谋。七杀无制，鲁莽招祸。杀生印化，文韬武略。', interpretation: '七杀为用神时，有勇有谋。七杀无制则鲁莽闯祸。若杀生印化，则文武全才。', confidence: 0.9 },
  { citationId: 'QLMG-TG-003', classicCode: 'QLMG', classicName: '千里命稿·十神篇', paragraph: 3, tenGodNames: ['正印', '偏印'], originalText: '正印仁慈多智慧，偏印机智多谋略。印旺身强，学业有成；印多身弱，依赖成性。', interpretation: '正印主人仁慈有智慧，偏印主人机智有谋略。印旺身强则学业好；印多身弱则依赖性强。', confidence: 0.88 },
  { citationId: 'QLMG-TG-004', classicCode: 'QLMG', classicName: '千里命稿·十神篇', paragraph: 4, tenGodNames: ['正财', '偏财', '食神'], combinationIds: ['食神生财'], originalText: '正财勤俭积蓄，偏财慷慨疏财。食神生财，财源滚滚，为富格之正途。', interpretation: '正财格主人勤俭能攒钱，偏财格主人慷慨大方会花钱。食神生财是富命的标准路径。', confidence: 0.89 },
  { citationId: 'QLMG-TG-005', classicCode: 'QLMG', classicName: '千里命稿·十神篇', paragraph: 5, tenGodNames: ['伤官', '比肩', '劫财'], combinationIds: ['羊刃驾杀'], originalText: '伤官恃才傲物，比肩和睦朋友，劫财凶悍冲动。羊刃驾杀，以刚制刚，大贵之格。', interpretation: '伤官主恃才傲物，比肩主朋友和睦，劫财主凶悍冲动。羊刃驾杀是以刚制刚的大贵格局。', confidence: 0.91 },
  { citationId: 'QLMG-TG-006', classicCode: 'QLMG', classicName: '千里命稿·女命十神篇', paragraph: 6, tenGodNames: ['正官', '食神'], originalText: '女命以正官为夫星，食神为子星。官星得地夫荣贵，食神得位子孙贤。', interpretation: '女命看丈夫看官星，看子女看食神。官星得地得力则丈夫荣耀，食神得力则子女贤孝。', confidence: 0.88 },

  // ===== YDZP 御定子平 5+ =====
  { citationId: 'YDZP-TG-001', classicCode: 'YDZP', classicName: '御定子平', chapter: '御定子平·十神正统论', paragraph: 1, tenGodNames: ['正官', '正印', '正财', '食神'], originalText: '钦定：四吉神为用之正格，官印财食得位得时，为太平盛世之良臣，福寿双全之命。', interpretation: '乾隆御定：正官、正印、正财、食神四吉神为用的正格，是盛世的良臣，福寿双全的命。', confidence: 0.94 },
  { citationId: 'YDZP-TG-002', classicCode: 'YDZP', classicName: '御定子平·官杀御定论', paragraph: 2, tenGodNames: ['正官', '七杀'], combinationIds: ['官杀混杂'], originalText: '官杀混杂为浊局，去一留一方为清。去杀留官文臣品，去官留杀武将勋。', interpretation: '官杀混杂是浑浊的格局，必须制一个留一个才清纯。去掉七杀留正官是文臣，去掉正官留七杀是武将。', confidence: 0.93 },
  { citationId: 'YDZP-TG-003', classicCode: 'YDZP', classicName: '御定子平·印绶御定论', paragraph: 3, tenGodNames: ['正印', '偏印'], combinationIds: ['官印相生'], originalText: '官印相生，朝廷重臣。印绶护身，功名可期。枭神夺食，家破人离，大忌。', interpretation: '官印相生是朝廷重臣的格局。印星生日主，功名可期望。枭神夺食是大忌，家破人离。', confidence: 0.95 },
  { citationId: 'YDZP-TG-004', classicCode: 'YDZP', classicName: '御定子平·财食御定论', paragraph: 4, tenGodNames: ['正财', '偏财', '食神'], combinationIds: ['食神生财'], originalText: '食神生财，盛世富民。财旺生官，富而且贵。比劫夺财，虽富而贫。', interpretation: '食神生财是盛世的富民格局。财旺再生官星，就是既富又贵。比劫夺财的人，就算有钱也会变穷。', confidence: 0.93 },
  { citationId: 'YDZP-TG-005', classicCode: 'YDZP', classicName: '御定子平·食伤比劫御定论', paragraph: 5, tenGodNames: ['伤官', '劫财'], combinationIds: ['伤官佩印', '羊刃驾杀'], originalText: '伤官佩印，文冠天下；羊刃驾杀，武镇边疆。此二格虽系凶神得用，实为大贵。', interpretation: '伤官佩印是文才天下第一，羊刃驾杀是武功镇守边疆。这两个格局虽用凶神，但实为大贵之格。', confidence: 0.94 },
  { citationId: 'YDZP-TG-006', classicCode: 'YDZP', classicName: '御定子平·十神调候先后论', paragraph: 6, tenGodNames: ['正官', '七杀', '正印', '正财', '食神'], originalText: '御批：调候为先天之急务，十神为后天之论断。未有调候失宜而十神能尽其用者。', interpretation: '乾隆御批：调候是先天最紧要的事，十神是后天的论命方法。调候失当的话，十神再好也发挥不了作用。', confidence: 0.95 },
]

export class TenGodCitationsDB {
  private db: TenGodCitationEntry[]

  constructor(data?: TenGodCitationEntry[]) {
    this.db = data ?? CITATIONS_DB
  }

  all(): TenGodCitationEntry[] {
    return this.db.slice()
  }

  byTenGod(name: TenGodName): TenGodCitationEntry[] {
    return this.db.filter(c => c.tenGodNames.includes(name))
  }

  byCombination(id: CombinationId | string): TenGodCitationEntry[] {
    return this.db.filter(c => (c.combinationIds ?? []).includes(id as any))
  }

  byCode(code: ClassicCode8): TenGodCitationEntry[] {
    return this.db.filter(c => c.classicCode === code)
  }

  summaryByTenGod(): Record<TenGodName, number> {
    const result = {} as Record<TenGodName, number>
    for (const tg of TEN_GODS) {
      result[tg] = this.byTenGod(tg).length
    }
    return result
  }

  summaryByClassic(): Record<ClassicCode8, { total: number; coveredTenGods: number }> {
    const codes: ClassicCode8[] = ['DTS', 'QTB', 'ZYQ', 'YSX', 'SMTH', 'SBTK', 'QLMG', 'YDZP']
    const result = {} as Record<ClassicCode8, { total: number; coveredTenGods: number }>
    for (const code of codes) {
      const entries = this.byCode(code)
      const tgSet = new Set<TenGodName>()
      for (const e of entries) {
        for (const tg of e.tenGodNames) tgSet.add(tg)
      }
      result[code] = { total: entries.length, coveredTenGods: tgSet.size }
    }
    return result
  }

  search(query: string): TenGodCitationEntry[] {
    if (!query) return []
    const q = query.toLowerCase()
    return this.db.filter(c =>
      c.originalText.toLowerCase().includes(q) ||
      c.interpretation.toLowerCase().includes(q) ||
      c.chapter.toLowerCase().includes(q) ||
      c.tenGodNames.some(t => t.toLowerCase().includes(q))
    )
  }
}

export const defaultTenGodCitationsDB = new TenGodCitationsDB()

export { CITATIONS_DB, TEN_GODS }
