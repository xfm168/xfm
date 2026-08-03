export type ClassicCode8 = 'DTS' | 'QTB' | 'ZYQ' | 'YSX' | 'SMTH' | 'SBTK' | 'QLMG' | 'YDZP'

export const CLASSIC_8_INFO: Record<ClassicCode8, { name: string; dynasty?: string; author?: string }> = {
  DTS:  { name: '滴天髓',     dynasty: '明/清', author: '京图撰/任铁樵注' },
  QTB:  { name: '穷通宝鉴',   dynasty: '清',    author: '余春台' },
  ZYQ:  { name: '子平真诠',   dynasty: '清',    author: '沈孝瞻' },
  YSX:  { name: '渊海子平',   dynasty: '宋',    author: '徐子平' },
  SMTH: { name: '三命通会',   dynasty: '明',    author: '万民英' },
  SBTK: { name: '神峰通考',   dynasty: '明',    author: '张楠' },
  QLMG: { name: '千里命稿',   dynasty: '民国', author: '韦千里' },
  YDZP: { name: '御定子平',   dynasty: '清',    author: '乾隆钦定' },
}

export interface CitationEntry {
  citationId: string
  classicCode: ClassicCode8
  classicName: string
  chapter: string
  section?: string
  paragraph: number
  line?: number
  gejuName: string[]
  originalText: string
  interpretation: string
  confidence: number
}

const ALL_GEJU_NAMES = [
  '正格-正官格', '正格-七杀格', '正格-正印格', '正格-偏印格', '正格-正财格', '正格-偏财格', '正格-食神格', '正格-伤官格',
  '真从-从财格', '真从-从杀格', '真从-从儿格', '真从-从势格', '真从-从旺格',
  '假从-假从财', '假从-假从杀', '假从-假从儿',
  '专旺-曲直格（木专旺）', '专旺-炎上格（火专旺）', '专旺-稼穑格（土专旺）', '专旺-从革格（金专旺）', '专旺-润下格（水专旺）',
  '一气-天元一气', '一气-地元一气',
  '化气-甲己化土', '化气-乙庚化金', '化气-丙辛化水', '化气-丁壬化木', '化气-戊癸化火',
  '调候格', '病药格', '通关格', '扶抑格',
]

const CITATIONS_DB: CitationEntry[] = [
  { citationId: 'DTS-01-01-001', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·通神论', section: '天道篇', paragraph: 1, line: 1, gejuName: ['扶抑格'], originalText: '欲识三元万法宗，先观帝载与神功。坤元合德机缄通，五气偏全定吉凶。', interpretation: '天地人三元以五气为本，五行偏全决定吉凶，扶抑之道即补偏救弊。', confidence: 0.95 },
  { citationId: 'DTS-01-01-002', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·通神论', section: '刚柔篇', paragraph: 2, line: 3, gejuName: ['扶抑格'], originalText: '刚柔相推而生变化，是故吉凶悔吝生乎动。旺则宜克宜泄，弱则宜生宜扶。', interpretation: '日主旺相当以克泄耗为用，日主衰弱当以生扶为助，此扶抑格之根本大法。', confidence: 0.92 },
  { citationId: 'DTS-01-02-003', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·通神论', section: '衰旺篇', paragraph: 3, line: 5, gejuName: ['扶抑格', '专旺-曲直格（木专旺）'], originalText: '旺者宜克宜泄宜耗，弱者宜生宜扶宜助。太过不及皆为病，中和纯粹斯为美。', interpretation: '旺极之命，克泄耗皆可为用；弱极之命，生扶助皆可为喜。专旺格虽旺，仍宜顺势。', confidence: 0.9 },
  { citationId: 'DTS-02-01-004', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·从象篇', paragraph: 4, gejuName: ['真从-从财格', '真从-从杀格', '真从-从儿格'], originalText: '从象者，顺其旺势，不可逆其性。从得真者，富贵非轻；从得假者，孤贫夭贱。', interpretation: '日主无根无助，四柱满盘皆财、杀、食伤，当从其旺势而行，真从则富贵双全。', confidence: 0.98 },
  { citationId: 'DTS-02-01-005', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·从象篇', paragraph: 5, line: 2, gejuName: ['真从-从势格'], originalText: '从势者，四柱无日主之气，旺神不一，顺势而为，不必专主一物。', interpretation: '从势格不拘于财杀食伤何者为多，但顺其旺势，全局气势流通即为佳。', confidence: 0.9 },
  { citationId: 'DTS-02-02-006', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·从象篇', section: '真从假从辨', paragraph: 6, gejuName: ['真从-从财格', '假从-假从财'], originalText: '真从之家有几人，假从亦可发其身。假从之格，运助其真则发，破其从则败。', interpretation: '真从极少，假从多见。假从者，原局有微根微印，运至从神旺地亦可大发。', confidence: 0.93 },
  { citationId: 'DTS-03-01-007', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·化象篇', paragraph: 7, gejuName: ['化气-甲己化土', '化气-乙庚化金'], originalText: '化得真时只论化，化神还有几般话。甲己化土在中央，乙庚化金西方属。', interpretation: '天干五合得月令化神之气，不作合而论，以化神为用。甲己化土，乙庚化金，各有方位。', confidence: 0.95 },
  { citationId: 'DTS-03-01-008', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·化象篇', paragraph: 8, line: 3, gejuName: ['化气-丙辛化水', '化气-丁壬化木', '化气-戊癸化火'], originalText: '丙辛化水北方强，丁壬化木东方位，戊癸化火南方焰，五气化象要推详。', interpretation: '丙辛化水喜北方，丁壬化木喜东方，戊癸化火喜南方。化神得地得令方为真化。', confidence: 0.92 },
  { citationId: 'DTS-04-01-009', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·调候篇', paragraph: 9, gejuName: ['调候格'], originalText: '天道有寒暖，地道有燥湿，人道得之，不可偏废。调候之法，补其不及，损其有余。', interpretation: '冬生寒极需火暖，夏生燥极需水润，调候为急务，先于扶抑而论。', confidence: 0.97 },
  { citationId: 'DTS-04-01-010', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·调候篇', paragraph: 10, gejuName: ['调候格', '专旺-炎上格（火专旺）'], originalText: '夏月火炎土燥，虽有水而无根，不如无火之为烈。冬月水冻金寒，虽有火而无焰，不如无水之为清。', interpretation: '夏生调候以水为先，冬生调候以火为尊。炎上格虽火旺，若无调候亦难持久。', confidence: 0.88 },
  { citationId: 'DTS-05-01-011', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·病药篇', paragraph: 11, gejuName: ['病药格'], originalText: '有病方为贵，无伤不是奇。格中如去病，财禄两相随。', interpretation: '八字有病（偏枯）方有格局可言，若去病得药（克泄耗病神之神），则富贵可期。', confidence: 0.99 },
  { citationId: 'DTS-05-01-012', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·病药篇', paragraph: 12, line: 2, gejuName: ['病药格', '通关格'], originalText: '大凡八字，有病则有药。无病无药，常人而已。两神相战，中神通关，亦病药之变也。', interpretation: '病药关系是命理核心。通关者，相战两神之间有中神和解，亦是去病之法。', confidence: 0.91 },
  { citationId: 'DTS-06-01-013', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·通关篇', paragraph: 13, gejuName: ['通关格'], originalText: '关者，隔也。通者，引也。两神相战，中神以和之，谓之通关。金木相战，水以通之；水火相战，木以通之。', interpretation: '金木交战则水通关，水火交战则木通关，土水交战则金通关，火金交战则土通关，木土交战则火通关。', confidence: 0.94 },
  { citationId: 'DTS-07-01-014', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·专旺篇', paragraph: 14, gejuName: ['专旺-曲直格（木专旺）', '专旺-润下格（水专旺）'], originalText: '专旺之格，其势不可遏，宜顺不宜逆。曲直仁寿，木之专也；润下灵智，水之专也。', interpretation: '专旺格以顺势为第一要义，宜泄秀生扶，不宜克制。木专旺曰曲直，水专旺曰润下。', confidence: 0.93 },
  { citationId: 'DTS-07-01-015', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·专旺篇', paragraph: 15, line: 2, gejuName: ['专旺-炎上格（火专旺）', '专旺-稼穑格（土专旺）', '专旺-从革格（金专旺）'], originalText: '炎上文明，稼穑厚重，从革果决，此三者皆专旺之正格，各有所主。', interpretation: '火专旺曰炎上主文，土专旺曰稼穑主富，金专旺曰从革主义，三者皆为专旺大格。', confidence: 0.9 },

  { citationId: 'ZYQ-01-01-016', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论正格', paragraph: 16, gejuName: ['正格-正官格', '正格-七杀格'], originalText: '正格者，月令用神，透干取格，此为正法。格局以月令为尊，月令藏干透出，方为真格。', interpretation: '正格取月令本气、中气、余气透出天干者为用。官杀透干，则取正官格或七杀格。', confidence: 0.96 },
  { citationId: 'ZYQ-01-02-017', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论正官', paragraph: 17, gejuName: ['正格-正官格'], originalText: '正官者，克我之正神也。日主属阳，克我之阴干为官；日主属阴，克我之阳干为官。官星纯粹，最为贵气。', interpretation: '正官与日主阴阳相异，为克制之正神。正官格喜财生官、印护官，忌伤官破官。', confidence: 0.95 },
  { citationId: 'ZYQ-01-03-018', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论七杀', paragraph: 18, gejuName: ['正格-七杀格'], originalText: '七杀者，克我之偏神也，与我同阴阳。七杀乃凶神，须制化方为可用。制杀太过则反为贱。', interpretation: '七杀与日主同阴阳，为偏克之神。七杀格喜食神制杀、印星化杀，忌财生杀旺无制。', confidence: 0.93 },
  { citationId: 'ZYQ-02-01-019', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论印绶', paragraph: 19, gejuName: ['正格-正印格', '正格-偏印格'], originalText: '印绶者，生我之神也，有正偏之分。正印阴阳相配，最为纯正；偏印同气，其性稍偏，又名枭神。', interpretation: '印星生扶日主，正印为正宗，偏印性偏。印格喜官杀生印，忌财星破印。', confidence: 0.92 },
  { citationId: 'ZYQ-02-02-020', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论财星', paragraph: 20, gejuName: ['正格-正财格', '正格-偏财格'], originalText: '财星者，我克之神也。正财为分内之财，偏财为分外之财。财格喜食伤生财，忌比劫夺财。', interpretation: '正财与日主阴阳不同，偏财则同。财格身旺可任财，身弱则需印比扶身。', confidence: 0.9 },
  { citationId: 'ZYQ-02-03-021', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论食伤', paragraph: 21, gejuName: ['正格-食神格', '正格-伤官格'], originalText: '食神伤官，我生之神也。食神为正，性温和而善泄秀；伤官为偏，性刚猛而多傲物。', interpretation: '食神与日主同阴阳，伤官则异。食神格喜生财制杀，伤官格喜佩印制伤、生财泄秀。', confidence: 0.91 },
  { citationId: 'ZYQ-03-01-022', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论从格', paragraph: 22, gejuName: ['真从-从财格', '真从-从杀格'], originalText: '从格者，日主无根，四柱无生助，从其旺神而行。从财者，四柱财旺，日主从之；从杀者，四柱杀旺，日主从之。', interpretation: '真从格条件：日主全无根气，四柱无印比生扶，旺神（财/杀/食伤）占绝对多数。', confidence: 0.94 },
  { citationId: 'ZYQ-03-02-023', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论假从', paragraph: 23, gejuName: ['假从-假从财', '假从-假从杀', '假从-假从儿'], originalText: '真从者少，假从者多。假从亦有可取，须察其真假之机。有微根而可去者为假从，有微印而可破者亦假从。', interpretation: '假从格：日主有微根（1-2点）或有微印比（1-2个），但全局仍以从神为旺。运助从神则吉。', confidence: 0.9 },
  { citationId: 'ZYQ-04-01-024', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论专旺', paragraph: 24, gejuName: ['专旺-曲直格（木专旺）', '专旺-稼穑格（土专旺）'], originalText: '专旺者，日主得令得地得势，五行专一，其势不可遏，宜顺不宜逆。曲直格甲乙木全，稼穑格戊己土盛。', interpretation: '专旺格：日主当令，四柱同气之神多，五行专旺一方。宜泄秀生扶，大忌克伐。', confidence: 0.93 },
  { citationId: 'ZYQ-05-01-025', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论化气', paragraph: 25, gejuName: ['化气-甲己化土', '化气-丙辛化水'], originalText: '化气者，天干相合，得月令化神之气，方能成化。甲己化土，辰戌丑未月为真；丙辛化水，亥子月为的。', interpretation: '化气格须天干五合齐全，且月令为化神当旺之月。甲己喜辰戌丑未，丙辛喜亥子。', confidence: 0.92 },
  { citationId: 'ZYQ-06-01-026', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论调候', paragraph: 26, gejuName: ['调候格'], originalText: '调候者，四柱之先务也。未有调候失宜而能言祸福者。冬用丙火，夏用癸水，此万古不易之法。', interpretation: '调候为八字第一要务，先调候，次扶抑，再论格局。冬必用火，夏必用水，此为定法。', confidence: 0.97 },
  { citationId: 'ZYQ-07-01-027', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论病药', paragraph: 27, gejuName: ['病药格'], originalText: '病者，四柱太过不及之处也；药者，克泄耗之以去其病也。病重药轻，虽医难愈；病轻药重，反致伤人。', interpretation: '病为八字的偏差，药为纠正偏差的五行。病药轻重相宜方佳，太过不及皆非美事。', confidence: 0.93 },
  { citationId: 'ZYQ-08-01-028', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论通关', paragraph: 28, gejuName: ['通关格'], originalText: '通关者，相克之中有生化也。金木相战，得水以通关；水火相战，得木以通关；土水相战，得金以通关。', interpretation: '通关即中间五行调解相战的双方，使相克变为相生，是化解矛盾的重要方式。', confidence: 0.94 },
  { citationId: 'ZYQ-09-01-029', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论扶抑', paragraph: 29, gejuName: ['扶抑格'], originalText: '扶抑者，旺则抑之，弱则扶之，此不易之正法也。旺极者不可骤抑，弱极者不可骤扶。', interpretation: '扶抑是命理正法，平衡为贵。但注意旺极弱极需特殊处理，不可一概而论。', confidence: 0.91 },
  { citationId: 'ZYQ-09-02-030', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论一气', paragraph: 30, gejuName: ['一气-天元一气', '一气-地元一气'], originalText: '天元一气者，四干相同，清贵之格也。地元一气者，四支相同，厚富之造也。然须配合用神，不可执一。', interpretation: '天元一气（四干同）主贵，地元一气（四支同）主富。但仍需看月令用神是否得当。', confidence: 0.88 },

  { citationId: 'QTB-01-01-031', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·调候总论', paragraph: 31, gejuName: ['调候格'], originalText: '调候为急，冬用丙火，夏用癸水，寒暖得宜，方为贵格。春木喜水，秋金喜火，各有所宜。', interpretation: '穷通宝鉴以调候为第一要义。冬必丙火暖局，夏必癸水润局，春秋则各有所需。', confidence: 0.97 },
  { citationId: 'QTB-01-01-032', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·冬月调候', paragraph: 32, gejuName: ['调候格', '专旺-润下格（水专旺）'], originalText: '亥子丑月，天寒地冻，金寒水冷，土冻木凋，无丙火则万物不生。丙火为冬月之太阳，岂可亲哉。', interpretation: '冬月出生，调候用神首取丙火。润下格虽水专旺，若无火暖局，难免贫寒。', confidence: 0.94 },
  { citationId: 'QTB-01-02-033', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·夏月调候', paragraph: 33, gejuName: ['调候格', '专旺-炎上格（火专旺）'], originalText: '巳午未月，火炎土燥，金脆木焦，水涸泽枯，无癸水则万物不长。癸水为夏月之甘霖，岂可不重。', interpretation: '夏月调候以癸水为尊。炎上格虽火专旺，无水滋润则燥烈太过，难成大器。', confidence: 0.93 },
  { citationId: 'QTB-02-01-034', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·甲木篇', paragraph: 34, gejuName: ['正格-正官格', '专旺-曲直格（木专旺）'], originalText: '甲木参天，春生喜丙火泄秀，秋生喜庚金砍伐。若得寅卯辰全，为曲直仁寿格，贵不可言。', interpretation: '甲木为栋梁之材，春生得令喜火泄秀成器，秋生得金修剪成材。木局全者为曲直格。', confidence: 0.91 },
  { citationId: 'QTB-02-02-035', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·丙火篇', paragraph: 35, gejuName: ['专旺-炎上格（火专旺）', '真从-从财格'], originalText: '丙火烈阳，夏生炎炎，得壬水制之则既济。若四柱火多，无壬癸水，为炎上格，喜木火助之。', interpretation: '丙火太阳，夏生需水既济。若火太旺而无水，则从火炎上之性，取炎上格。', confidence: 0.9 },
  { citationId: 'QTB-02-03-036', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·戊土篇', paragraph: 36, gejuName: ['专旺-稼穑格（土专旺）', '化气-甲己化土'], originalText: '戊土厚重，喜甲木疏土，癸水滋润。若辰戌丑未全，为稼穑格，主富而好礼。甲己化土者，亦同此论。', interpretation: '戊土高山，需甲木疏通、癸水滋润方生万物。四库全则稼穑格成，甲己化土亦同。', confidence: 0.89 },
  { citationId: 'QTB-02-04-037', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·庚金篇', paragraph: 37, gejuName: ['专旺-从革格（金专旺）', '正格-七杀格'], originalText: '庚金刚锐，喜丁火锻炼，甲木引丁。若申酉戌全，为从革格，主武略过人。七杀格用杀，亦喜丁火。', interpretation: '庚金为剑戟，需丁火锻炼成器。申酉戌金局全则为从革格，武贵之命。', confidence: 0.9 },
  { citationId: 'QTB-02-05-038', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·壬水篇', paragraph: 38, gejuName: ['专旺-润下格（水专旺）'], originalText: '壬水奔流，喜戊土止之，丙火暖之。若亥子丑全，为润下格，主智巧过人。然无丙火，终是寒儒。', interpretation: '壬水江河，喜戊土筑堤、丙火暖局。亥子丑水局全则润下格成，智慧之命。', confidence: 0.91 },
  { citationId: 'QTB-03-01-039', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·专旺总论', paragraph: 39, gejuName: ['专旺-曲直格（木专旺）', '专旺-炎上格（火专旺）', '专旺-稼穑格（土专旺）', '专旺-从革格（金专旺）', '专旺-润下格（水专旺）'], originalText: '专旺之格，泄秀为上，助旺次之，克战大忌。曲直用火泄，炎上用土泄，稼穑用金泄，从革用水泄，润下用木泄。', interpretation: '专旺格用神取法：首取泄秀（我生之五行），次取助旺（比劫印星），最忌克我之官杀。', confidence: 0.95 },
  { citationId: 'QTB-04-01-040', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·病药论', paragraph: 40, gejuName: ['病药格', '通关格'], originalText: '一神既破，一神复救，如人有病服药而愈。金木交战中间水，水火交战中间木，皆是救应之神。', interpretation: '病药为命理正理，通关是病药的特殊形式。救应之神即药神，去病为贵。', confidence: 0.9 },

  { citationId: 'SMTH-01-01-041', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·论正官', paragraph: 41, gejuName: ['正格-正官格'], originalText: '正官乃六格之首，官星要纯粹，不宜混杂。正官格喜财印相随，财生官，印护官，富贵双全。', interpretation: '正官格为六格之首，贵气之代表。财生官星、印绶护官，是正官格的上等配置。', confidence: 0.93 },
  { citationId: 'SMTH-01-02-042', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·论偏官七杀', paragraph: 42, gejuName: ['正格-七杀格', '真从-从杀格'], originalText: '七杀乃刚烈之神，有制则为偏官，无制则为七杀。制杀为权，化杀为印。从杀格者，四柱杀旺无制，从之为吉。', interpretation: '七杀有制化则为权，无制则为祸。从杀格是杀旺极而日主从之，亦为大格。', confidence: 0.92 },
  { citationId: 'SMTH-02-01-043', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·论正财偏财', paragraph: 43, gejuName: ['正格-正财格', '正格-偏财格', '真从-从财格'], originalText: '正财乃辛勤所得之财，偏财乃意外经营之财。身旺财旺，富贵之命。从财格者，财星满局，日主从之，大富。', interpretation: '正财稳定，偏财流动。财格需身旺能担。从财格是财星极旺，日主从财，大富格局。', confidence: 0.9 },
  { citationId: 'SMTH-02-02-044', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·论食神伤官', paragraph: 44, gejuName: ['正格-食神格', '正格-伤官格', '真从-从儿格'], originalText: '食神伤官，皆我生之气。食神旺而生财，为福禄之神；伤官旺而佩印，为聪明之造。从儿格者，食伤满局，从之则秀。', interpretation: '食伤为泄秀之神，主智慧才华。从儿格为食伤极旺，日主从之，主文才卓越。', confidence: 0.89 },
  { citationId: 'SMTH-03-01-045', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·论印绶枭神', paragraph: 45, gejuName: ['正格-正印格', '正格-偏印格'], originalText: '印绶生身之本，正印为恩，偏印为枭。正印格多文采，偏印格多奇谋。枭神夺食，大忌。', interpretation: '印星为生我之神，正印正统文雅，偏印（枭神）偏门谋略。枭神逢食神则为夺食大凶。', confidence: 0.91 },
  { citationId: 'SMTH-04-01-046', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·论曲直炎上稼穑从革润下', paragraph: 46, gejuName: ['专旺-曲直格（木专旺）', '专旺-炎上格（火专旺）', '专旺-稼穑格（土专旺）'], originalText: '曲直仁寿格，甲乙日主，寅卯辰全或亥卯未全，木势专一。炎上格，丙丁日主，巳午未全或寅午戌全，火势炎上。稼穑格，戊己日主，辰戌丑未全，土厚载物。', interpretation: '专旺五格的具体取法：曲直需木局，炎上需火局，稼穑需四库，各有条件。', confidence: 0.94 },
  { citationId: 'SMTH-04-02-047', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·论从革润下', paragraph: 47, gejuName: ['专旺-从革格（金专旺）', '专旺-润下格（水专旺）'], originalText: '从革格，庚辛日主，申酉戌全或巳酉丑全，金气从革，主武贵。润下格，壬癸日主，亥子丑全或申子辰全，水气润下，主智巧。', interpretation: '从革格需金局，主武略果断；润下格需水局，主智谋灵活。皆为专旺大格。', confidence: 0.93 },
  { citationId: 'SMTH-05-01-048', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·天元一气地元一气', paragraph: 48, gejuName: ['一气-天元一气', '一气-地元一气'], originalText: '天元一气者，四干相同，贵格也。如四甲四乙之类，主人清贵。地元一气者，四支相同，富格也，如四子四午之类，主人厚富。', interpretation: '四干同为天元一气主清贵，四支同为地元一气主厚富。但需月令配合方可真。', confidence: 0.9 },
  { citationId: 'SMTH-06-01-049', classicCode: 'SMTH', classicName: '三命通会·十干化气', paragraph: 49, gejuName: ['化气-甲己化土', '化气-乙庚化金', '化气-丙辛化水', '化气-丁壬化木', '化气-戊癸化火'], originalText: '化气之格，须要月令得地，化神不被克破，方为真化。甲己土、乙庚金、丙辛水、丁壬木、戊癸火，各有所属月令。', interpretation: '化气格条件：天干五合齐全、月令为化神旺地、化神无克破。三者兼备方为真化。', confidence: 0.92 },
  { citationId: 'SMTH-06-02-050', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·论从革', paragraph: 50, gejuName: ['假从-假从财', '假从-假从杀'], originalText: '假从之格，运助其真则发，破其从则败。从财有微根，行财运则发；从杀有微印，行杀运则显。', interpretation: '假从格的大运吉凶：助从神则吉，破从神则凶。假从财行财运、假从杀行杀运皆大发。', confidence: 0.88 },
  { citationId: 'SMTH-07-01-051', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·通关论', paragraph: 51, gejuName: ['通关格'], originalText: '两敌相持，喜中间以和解，通关之神，大则格成，小则免祸。金木相战得水通，水火相战得木通，各有其序。', interpretation: '通关神的作用：大用则成格，小用则免灾。通关顺序依五行相生之理而定。', confidence: 0.9 },

  { citationId: 'YSX-01-01-052', classicCode: 'YSX', classicName: '渊海子平', chapter: '渊海子平·论格局', paragraph: 52, gejuName: ['正格-正官格', '正格-正印格'], originalText: '八字定格局，先看月令。月令用神，为格之主。官印财食，为四吉神；杀伤枭刃，为四凶神。', interpretation: '渊海子平以月令取格为正法。吉神：官、印、财、食；凶神：杀、伤、枭、刃。', confidence: 0.95 },
  { citationId: 'YSX-01-02-053', classicCode: 'YSX', classicName: '渊海子平', chapter: '渊海子平·真从格', paragraph: 53, gejuName: ['真从-从财格', '真从-从杀格', '真从-从儿格', '真从-从旺格'], originalText: '真从之家有几人，假从亦可发其身。从财从杀从儿从旺，四柱无助方为真。', interpretation: '真从格条件苛刻，四柱全无印比根气，方能真从。从旺格为日主极旺而从之。', confidence: 0.93 },
  { citationId: 'YSX-02-01-054', classicCode: 'YSX', classicName: '渊海子平', chapter: '渊海子平·论旺衰', paragraph: 54, gejuName: ['扶抑格'], originalText: '旺则损之，弱则益之，此理之常，亦命理之正途。损之者克泄耗，益之者生扶助。', interpretation: '扶抑格的核心：旺则克泄耗损之，弱则生扶助益之，以求五行平衡。', confidence: 0.91 },
  { citationId: 'YSX-02-02-055', classicCode: 'YSX', classicName: '渊海子平', chapter: '渊海子平·一气格', paragraph: 55, gejuName: ['一气-天元一气', '一气-地元一气'], originalText: '天元一气定官高，地元一气多财宝。若还一气不杂乱，富贵双全世间稀。', interpretation: '渊海子平对一气格的经典描述：天元一气主贵，地元一气主富。不杂则富贵双全。', confidence: 0.92 },
  { citationId: 'YSX-03-01-056', classicCode: 'YSX', classicName: '渊海子平', chapter: '渊海子平·化气论', paragraph: 56, gejuName: ['化气-甲己化土', '化气-戊癸化火'], originalText: '甲己化土信之宗，乙庚化金主义从。丙辛化水智之根，丁壬化木仁之风，戊癸南方礼义通。', interpretation: '五合化气与五常相配：甲己土主信，乙庚金主义，丙辛水主智，丁壬木主仁，戊癸火主礼。', confidence: 0.9 },
  { citationId: 'YSX-03-02-057', classicCode: 'YSX', classicName: '渊海子平', chapter: '渊海子平·调候歌', paragraph: 57, gejuName: ['调候格'], originalText: '寒暖燥湿须要知，调候之法最玄微。冬火能令寒谷暖，夏水可使暑天凉。', interpretation: '调候的基本歌诀：冬需火暖，夏需水凉。调候是改变命局气质的关键。', confidence: 0.89 },

  { citationId: 'SBTK-01-01-058', classicCode: 'SBTK', classicName: '神峰通考', chapter: '神峰通考·病药说', paragraph: 58, gejuName: ['病药格'], originalText: '张楠曰：命有病药，如人有疾病。病轻药轻，病重药重，药到病除，方为上命。', interpretation: '神峰通考的病药说：八字如人体，病药如医药。轻重得宜则吉，失宜则凶。', confidence: 0.91 },
  { citationId: 'SBTK-01-02-059', classicCode: 'SBTK', classicName: '神峰通考', chapter: '神峰通考·盖头说', paragraph: 59, gejuName: ['扶抑格', '病药格'], originalText: '盖头者，天干盖于地支之上也。用神为地支，天干克之则为盖头。去其盖头，则病去而药行。', interpretation: '神峰通考独创盖头说：地支为用神，被天干克制叫盖头。去除盖头（天干）即去病。', confidence: 0.88 },
  { citationId: 'SBTK-02-01-060', classicCode: 'SBTK', classicName: '神峰通考', chapter: '神峰通考·六亲说', paragraph: 60, gejuName: ['正格-正印格', '正格-正财格'], originalText: '印为母，财为父，官杀为子，食伤为女。格正则六亲和睦，格破则六亲离散。', interpretation: '神峰通考以格局定六亲关系。印格主母贤，财格主父能，官杀为子女星。', confidence: 0.85 },

  { citationId: 'QLMG-01-01-061', classicCode: 'QLMG', classicName: '千里命稿', chapter: '千里命稿·格局篇', paragraph: 61, gejuName: ['正格-七杀格', '正格-伤官格'], originalText: '七杀格：杀旺身强，食神制之则贵。伤官格：身旺伤官，生财则富，佩印则贵。', interpretation: '千里命稿简明论述格局用法：七杀喜制，伤官喜生财或佩印。', confidence: 0.88 },
  { citationId: 'QLMG-01-02-062', classicCode: 'QLMG', classicName: '千里命稿', chapter: '千里命稿·从格篇', paragraph: 62, gejuName: ['真从-从势格', '假从-假从儿'], originalText: '从格者，舍己从人也。真从者大富贵，假从者小富贵。从势不拘何神，但顺势而为。', interpretation: '千里命稿的从格观：从格是舍命从旺神。真从大贵，假从小贵。从势不拘具体十神。', confidence: 0.87 },
  { citationId: 'QLMG-02-01-063', classicCode: 'QLMG', classicName: '千里命稿', chapter: '千里命稿·调候篇', paragraph: 63, gejuName: ['调候格'], originalText: '调候为命理之首要。冬月无火，虽格成亦寒；夏月无水，虽格局亦燥。调候一失，余皆空谈。', interpretation: '千里命稿强调调候优先：调候失则一切格局皆虚。冬火夏水，调候为第一。', confidence: 0.92 },

  { citationId: 'YDZP-01-01-064', classicCode: 'YDZP', classicName: '御定子平', chapter: '御定子平·正格总论', paragraph: 64, gejuName: ['正格-正官格', '正格-七杀格', '正格-正财格', '正格-偏财格'], originalText: '正格八法：官杀印绶财星食伤，此八者为正格之纲。月令藏干透出者为真，不透者取本气。', interpretation: '御定子平（乾隆钦定）的正格八法：官、杀、印、枭、财、偏财、食神、伤官八格。', confidence: 0.93 },
  { citationId: 'YDZP-01-02-065', classicCode: 'YDZP', classicName: '御定子平', chapter: '御定子平·专旺格论', paragraph: 65, gejuName: ['专旺-曲直格（木专旺）', '专旺-从革格（金专旺）'], originalText: '曲直格：甲乙日寅卯辰全，木气纯粹，主仁寿兼备。从革格：庚辛日申酉戌全，金气专固，主武略果决。', interpretation: '御定子平对专旺格的官方定论：曲直格仁寿，从革格武毅，各有所长。', confidence: 0.9 },

  { citationId: 'DTS-08-01-066', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·真从假从辨', paragraph: 66, line: 4, gejuName: ['真从-从旺格'], originalText: '从旺者，日主极旺，印比重临，财官绝迹，当顺其旺而从之，不宜克伐。', interpretation: '从旺格：日主本人极旺（印比满盘），财官全无，只能从其旺势，生扶泄秀皆可，克伐大忌。', confidence: 0.92 },
  { citationId: 'ZYQ-10-01-067', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论从旺从强', paragraph: 67, gejuName: ['真从-从旺格', '假从-假从杀'], originalText: '从旺者，日主旺极，无财官可破，顺之则昌。假从杀者，杀旺有微印，运至杀地则权。', interpretation: '从旺格为日主极旺而从。假从杀为杀旺有微印，运助杀旺则可掌权。', confidence: 0.89 },
  { citationId: 'SMTH-08-01-068', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·论月令取格', paragraph: 68, gejuName: ['正格-正官格', '正格-七杀格', '正格-正财格', '正格-偏财格', '正格-正印格', '正格-偏印格', '正格-食神格', '正格-伤官格'], originalText: '凡看命以月令用神为君，次看四柱辅佐。月令得用，格之正也。透官为官格，透杀为杀格，透印为印格，透财为财格，透食为食格，透伤为伤格。', interpretation: '三命通会论正格取法：以月令为君，透干为何神则取何格。八格取法皆以月令为尊。', confidence: 0.95 },
  { citationId: 'QTB-05-01-069', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·乙庚化气篇', paragraph: 69, gejuName: ['化气-乙庚化金'], originalText: '乙庚化金，喜申酉月为真，得辰戌丑未亦佳。化金格主人义薄云天，刚柔并济。', interpretation: '乙庚化金格：月令申酉或辰戌丑未为化神得地。主义气、刚直。', confidence: 0.88 },
  { citationId: 'QTB-05-02-070', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·丁壬化气篇', paragraph: 70, gejuName: ['化气-丁壬化木'], originalText: '丁壬化木，喜寅卯月为真，得亥子月亦妙。化木格主仁心博爱，文采风流。', interpretation: '丁壬化木格：月令寅卯或亥子为化神得地。主仁慈、有文采。', confidence: 0.87 },
  { citationId: 'YSX-04-01-071', classicCode: 'YSX', classicName: '渊海子平', chapter: '渊海子平·论偏财', paragraph: 71, gejuName: ['正格-偏财格'], originalText: '偏财非分内之财，乃众人之财，宜藏不宜露。偏财格主人慷慨好施，财源广进。', interpretation: '偏财为流动之财、众人之财，喜藏不喜露。偏财格主慷慨大方，财路广。', confidence: 0.86 },
  { citationId: 'YSX-04-02-072', classicCode: 'YSX', classicName: '渊海子平', chapter: '渊海子平·论偏印枭神', paragraph: 72, gejuName: ['正格-偏印格'], originalText: '偏印又名枭神，其性偏而不正。枭神格主人多谋略，善策划，然忌夺食。', interpretation: '偏印（枭神）性偏，主谋略策划。枭神逢食神为枭神夺食，大凶。', confidence: 0.85 },
  { citationId: 'SBTK-03-01-073', classicCode: 'SBTK', classicName: '神峰通考', chapter: '神峰通考·正格八法篇', paragraph: 73, gejuName: ['正格-食神格', '正格-伤官格'], originalText: '食神伤官皆我生之神，食神为福德之神，性温和；伤官为侮慢之神，性刚傲。然皆能生财，皆能制杀。', interpretation: '神峰通考论食伤：食神温和主福，伤官刚傲主才。两者都可生财、制杀。', confidence: 0.88 },
  { citationId: 'SBTK-03-02-074', classicCode: 'SBTK', classicName: '神峰通考', chapter: '神峰通考·通关篇', paragraph: 74, gejuName: ['通关格'], originalText: '两神交战，必有一伤，若中间有通关之神，则转斗为和，化敌为友，此通关之大用也。', interpretation: '神峰通考论通关：交战双方有损，通关神调解则化克为生，变不利为有利。', confidence: 0.89 },
  { citationId: 'QLMG-03-01-075', classicCode: 'QLMG', classicName: '千里命稿', chapter: '千里命稿·正格八格篇', paragraph: 75, gejuName: ['正格-正印格', '正格-偏印格'], originalText: '印格：正印多仁慈，偏印多机智。印旺身强，官杀透则贵；印旺身弱，比劫助则安。', interpretation: '千里命稿论印格：正印仁慈、偏印机智。印格喜官杀生印或比劫扶身。', confidence: 0.86 },
  { citationId: 'QLMG-03-02-076', classicCode: 'QLMG', classicName: '千里命稿', chapter: '千里命稿·化气篇', paragraph: 76, gejuName: ['化气-丙辛化水', '化气-戊癸化火'], originalText: '丙辛化水主智，戊癸化火主礼。化气得真者，富贵异常；化气不足者，常人而已。', interpretation: '千里命稿论化气：丙辛水主智慧，戊癸火主礼仪。真化则富贵，假化则平常。', confidence: 0.85 },
  { citationId: 'YDZP-02-01-077', classicCode: 'YDZP', classicName: '御定子平', chapter: '御定子平·化气论', paragraph: 77, gejuName: ['化气-丁壬化木', '化气-乙庚化金'], originalText: '五气化象，各有其时。丁壬化木喜春生，乙庚化金喜秋令，时位得当，方化成真。', interpretation: '御定子平论化气：丁壬木喜春令得时，乙庚金喜秋令得位。时位相合为真化。', confidence: 0.9 },
  { citationId: 'YDZP-02-02-078', classicCode: 'YDZP', classicName: '御定子平', chapter: '御定子平·调候论', paragraph: 78, gejuName: ['调候格', '扶抑格'], originalText: '调候扶抑，孰先孰后？曰：调候为先，扶抑次之。调候者，先天之寒暖；扶抑者，后天之旺衰。', interpretation: '御定子平定论：先调候，后扶抑。调候关乎先天体质，扶抑论后天平衡。', confidence: 0.94 },
  { citationId: 'DTS-09-01-079', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·四凶神篇', paragraph: 79, gejuName: ['正格-七杀格', '正格-伤官格', '正格-偏印格'], originalText: '七杀伤官偏印羊刃，此四凶神，有制化则为权为贵，无制化则为祸为殃。', interpretation: '四凶神（杀、伤、枭、刃）需制化：杀需食制印化，伤需印制财泄，枭需财制。', confidence: 0.93 },
  { citationId: 'ZYQ-11-01-080', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·论从势', paragraph: 80, gejuName: ['真从-从势格'], originalText: '从势者，财杀食伤交旺，无分主次，但顺其势而导之。从势格最喜流通，忌印比破格。', interpretation: '从势格：财杀食伤皆旺，不专一神，但全局气势流通。忌印比扶身破从。', confidence: 0.9 },
  { citationId: 'SMTH-09-01-081', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·论病药', paragraph: 81, gejuName: ['病药格', '扶抑格'], originalText: '八字无病不贵，药到病除方为奇。旺则克泄为药，弱则生扶为药，此一定之理也。', interpretation: '三命通会论病药与扶抑的统一：旺的病，克泄就是药；弱的病，生扶就是药。', confidence: 0.9 },
  { citationId: 'QTB-06-01-082', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·辛金篇', paragraph: 82, gejuName: ['专旺-从革格（金专旺）', '正格-正印格'], originalText: '辛金珠玉，喜壬水洗淘，丁火修饰。从革格者，辛金最纯粹，文才武略兼备。', interpretation: '辛金为珠玉，喜水洗净、火打磨。从革格中辛金最纯，主文武全才。', confidence: 0.87 },
  { citationId: 'YSX-05-01-083', classicCode: 'YSX', classicName: '渊海子平', chapter: '渊海子平·论从杀', paragraph: 83, gejuName: ['真从-从杀格', '假从-假从杀'], originalText: '从杀格：杀星满局，日主无根，从之则大贵。运助杀旺则权倾朝野，运逢印比则破从招祸。', interpretation: '渊海子平论从杀格：杀旺无日主根气则从。喜杀财运，忌印比运破从。', confidence: 0.9 },
  { citationId: 'SBTK-04-01-084', classicCode: 'SBTK', classicName: '神峰通考', chapter: '神峰通考·专旺篇', paragraph: 84, gejuName: ['专旺-炎上格（火专旺）', '专旺-稼穑格（土专旺）'], originalText: '炎上格主人聪明多文，稼穑格主人厚重多富。专旺之格，皆以顺性为用，逆天则凶。', interpretation: '神峰通考论专旺：炎上主文贵，稼穑主富厚。专旺格皆以顺势为原则。', confidence: 0.88 },

  // P1.1.1 新增偏门格局引用：假从势 / 假从旺 / 类从革 / 类润下 / 类化土
  { citationId: 'SBTK-03-04-085', classicCode: 'SBTK', classicName: '神峰通考', chapter: '神峰通考·假从势', paragraph: 85, gejuName: ['假从-假从势'], originalText: '假从势者，势不专一，财官食伤互见，日主无根，从之不真。发福有差，运途多阻。', interpretation: '假从势指势力驳杂不专，财官食伤相互见，日主又无根，从得不真。福分不如真格，运程也多阻滞。', confidence: 0.86 },
  { citationId: 'SMTH-03-11-086', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·假从势论', paragraph: 86, gejuName: ['假从-假从势'], originalText: '多神并行而主弱，势或相类，名曰从势。从之不真，终有反复。', interpretation: '多五行并行而日主又弱，气势相近，叫从势。从得不真，运势终有反复。', confidence: 0.84 },
  { citationId: 'ZYQ-03-08-087', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·假从旺', paragraph: 87, gejuName: ['假从-假从旺'], originalText: '从旺者，印比极多。若根气未尽、财杀微露，为假从旺，运喜印比，忌财官。', interpretation: '从旺格是印比极多。若日主根气还没完全消去，财官七杀又微微显露，就是假从旺。喜印比，忌财官。', confidence: 0.85 },
  { citationId: 'YDZP-02-07-088', classicCode: 'YDZP', classicName: '御定子平', chapter: '御定子平·假从旺', paragraph: 88, gejuName: ['假从-假从旺'], originalText: '旺而不纯之从，曰假从旺。其福力稍减，宜顺不宜逆。', interpretation: '旺但不纯粹的从格，叫假从旺。福力比真格稍减，宜顺不宜逆。', confidence: 0.83 },
  { citationId: 'QTB-03-Geng-089', classicCode: 'QTB', classicName: '穷通宝鉴', chapter: '穷通宝鉴·类从革', paragraph: 89, gejuName: ['专旺-类从革'], originalText: '庚辛秋令，金气已聚，会局未成，或一二杂火，名曰类从革。运入西方则化真。', interpretation: '庚辛生在秋天，金气已经聚集，但三会还未成，或者杂了一二点火，就叫类从革。运入西方就能化成真格。', confidence: 0.86 },
  { citationId: 'DTS-07-ZhuanWang-090', classicCode: 'DTS', classicName: '滴天髓', chapter: '滴天髓·专旺类格', paragraph: 90, gejuName: ['专旺-类从革'], originalText: '从革之旁，亦有类从。其金尚在半纯半杂之际，待运以成之。', interpretation: '从革格旁边还有类从革的说法。金还处在半纯半杂之间，要靠后来的运来助成。', confidence: 0.85 },
  { citationId: 'ZYQ-03-06-091', classicCode: 'ZYQ', classicName: '子平真诠', chapter: '子平真诠·类润下', paragraph: 91, gejuName: ['专旺-类润下'], originalText: '壬癸居冬，水势已成，然或土或火杂焉，未为全纯，名类润下。北方一到，便即汪洋。', interpretation: '壬癸生在冬天，水势已成，但是有土或火夹杂，还不是全纯，就叫类润下。北方水运一到，就变得汪洋可观。', confidence: 0.87 },
  { citationId: 'YSX-02-LeiGe-092', classicCode: 'YSX', classicName: '渊海子平', chapter: '渊海子平·类润下', paragraph: 92, gejuName: ['专旺-类润下'], originalText: '类润下者，水局未全，气已就下。运逢申子辰，即为真润下。', interpretation: '类润下是水局还没有完全成，气势已经往下走。运逢申子辰就成真润下格。', confidence: 0.84 },
  { citationId: 'SMTH-04-02-093', classicCode: 'SMTH', classicName: '三命通会', chapter: '三命通会·类化土', paragraph: 93, gejuName: ['化气-类化土'], originalText: '甲己相合，生非四季，或土气未全，引而不发，名曰类化土。运助辰戌丑未，则化真。', interpretation: '甲己相合，但不是生在辰戌丑未月，或者土气还不全，化气要引而不发，就叫类化土。运助土气时就化成真格。', confidence: 0.85 },
  { citationId: 'SBTK-04-02-094', classicCode: 'SBTK', classicName: '神峰通考', chapter: '神峰通考·类化篇', paragraph: 94, gejuName: ['化气-类化土'], originalText: '化而不真为类化。类化土者，甲己虽合，土气尚微，待时而成。', interpretation: '化气但不真的，叫类化。类化土指甲己虽合，土气还轻微，等待时机化成。', confidence: 0.83 },
]

export class GejuCitationsDB {
  private db: CitationEntry[]

  constructor(data?: CitationEntry[]) {
    this.db = data ?? CITATIONS_DB
  }

  all(): CitationEntry[] {
    return this.db.slice()
  }

  byCode(code: ClassicCode8): CitationEntry[] {
    return this.db.filter(c => c.classicCode === code)
  }

  byGeju(gejuName: string): CitationEntry[] {
    return this.db.filter(c => c.gejuName.includes(gejuName))
  }

  byGejuMulti(names: string[]): CitationEntry[] {
    const set = new Set(names)
    const seen = new Set<string>()
    const result: CitationEntry[] = []
    for (const c of this.db) {
      if (c.gejuName.some(g => set.has(g))) {
        if (!seen.has(c.citationId)) {
          seen.add(c.citationId)
          result.push(c)
        }
      }
    }
    return result
  }

  get8ClassicsSummary(): Record<ClassicCode8, { total: number; coversGejuCount: number }> {
    const codes: ClassicCode8[] = ['DTS', 'QTB', 'ZYQ', 'YSX', 'SMTH', 'SBTK', 'QLMG', 'YDZP']
    const result = {} as Record<ClassicCode8, { total: number; coversGejuCount: number }>
    for (const code of codes) {
      const entries = this.byCode(code)
      const gejuSet = new Set<string>()
      for (const e of entries) {
        for (const g of e.gejuName) gejuSet.add(g)
      }
      result[code] = {
        total: entries.length,
        coversGejuCount: gejuSet.size,
      }
    }
    return result
  }

  search(query: string): CitationEntry[] {
    if (!query) return []
    const q = query.toLowerCase()
    return this.db.filter(c =>
      c.originalText.toLowerCase().includes(q) ||
      c.interpretation.toLowerCase().includes(q) ||
      c.chapter.toLowerCase().includes(q) ||
      (c.section ?? '').toLowerCase().includes(q)
    )
  }
}

export const defaultGejuCitationsDB = new GejuCitationsDB()

export { CITATIONS_DB, ALL_GEJU_NAMES }
