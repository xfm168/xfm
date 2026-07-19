/**
 * 宝宝起名辅助系统 — V4.3
 *
 * 基于八字喜用神 + 三才五格数理 + 寓意 + 读音 综合评分
 * 内置 260+ 候选字库（每五行 50+ 字），支持四种命名风格
 */

import type { BaZiChart, FiveElement } from './types'

// ═══════════════════════════════════════
// 接口定义
// ═══════════════════════════════════════

export interface NameRecommendInput {
  chart: BaZiChart
  surname: string
  gender?: 'male' | 'female'
  style?: 'traditional' | 'modern' | 'literary' | 'simple'
}

export interface NameSuggestion {
  fullName: string
  givenName: string
  strokes: { total: number; heaven: number; earth: number; human: number }
  fiveElementMatch: string
  meaning: string
  wuge: {
    heaven: number
    earth: number
    human: number
    outer: number
    total: number
    pattern: string
  }
  score: number
}

export interface NameRecommendResult {
  suggestions: NameSuggestion[]
  analysis: string
}

// ═══════════════════════════════════════
// 候选字库（康熙笔画 + 五行）
// ═══════════════════════════════════════

interface CharInfo {
  char: string
  kxStrokes: number  // 康熙笔画
  element: FiveElement
  meaning: string    // 简要寓意
  gender: 'male' | 'female' | 'neutral'
  style: ('traditional' | 'modern' | 'literary' | 'simple')[]
}

// ─── 木 (50+ 字) ───
const WOOD_CHARS: CharInfo[] = [
  { char: '林', kxStrokes: 8, element: '木', meaning: '繁茂成林，生生不息', gender: 'male', style: ['simple', 'traditional'] },
  { char: '森', kxStrokes: 12, element: '木', meaning: '森然挺立，气势磅礴', gender: 'male', style: ['traditional'] },
  { char: '楠', kxStrokes: 13, element: '木', meaning: '楠木之质，温润贵重', gender: 'male', style: ['literary', 'modern'] },
  { char: '桐', kxStrokes: 10, element: '木', meaning: '梧桐栖凤，高洁品格', gender: 'neutral', style: ['literary', 'traditional'] },
  { char: '梓', kxStrokes: 11, element: '木', meaning: '桑梓故乡，家国情怀', gender: 'male', style: ['literary', 'traditional'] },
  { char: '柯', kxStrokes: 9, element: '木', meaning: '玉叶金柯，高贵不凡', gender: 'male', style: ['literary'] },
  { char: '栩', kxStrokes: 10, element: '木', meaning: '栩栩如生，灵动活泼', gender: 'male', style: ['literary', 'modern'] },
  { char: '桢', kxStrokes: 13, element: '木', meaning: '桢干之才，国之栋梁', gender: 'male', style: ['traditional', 'literary'] },
  { char: '槿', kxStrokes: 15, element: '木', meaning: '木槿花开，朝华夕秀', gender: 'female', style: ['literary'] },
  { char: '松', kxStrokes: 18, element: '木', meaning: '青松不老，坚贞不屈', gender: 'male', style: ['traditional'] },
  { char: '柏', kxStrokes: 9, element: '木', meaning: '苍柏常青，品行高洁', gender: 'male', style: ['traditional', 'simple'] },
  { char: '柳', kxStrokes: 9, element: '木', meaning: '杨柳依依，温柔婉约', gender: 'female', style: ['literary'] },
  { char: '杉', kxStrokes: 7, element: '木', meaning: '杉木挺拔，正直不阿', gender: 'male', style: ['simple'] },
  { char: '彬', kxStrokes: 11, element: '木', meaning: '文质彬彬，儒雅有礼', gender: 'male', style: ['traditional', 'literary'] },
  { char: '栋', kxStrokes: 12, element: '木', meaning: '栋梁之才，担当重任', gender: 'male', style: ['traditional'] },
  { char: '梁', kxStrokes: 11, element: '木', meaning: '国家栋梁，卓尔不群', gender: 'male', style: ['traditional'] },
  { char: '枫', kxStrokes: 13, element: '木', meaning: '枫叶如火，热情似锦', gender: 'neutral', style: ['literary', 'modern'] },
  { char: '桂', kxStrokes: 10, element: '木', meaning: '蟾宫折桂，功名有成', gender: 'neutral', style: ['traditional', 'literary'] },
  { char: '棠', kxStrokes: 12, element: '木', meaning: '海棠依旧，风姿绰约', gender: 'female', style: ['literary'] },
  { char: '楚', kxStrokes: 13, element: '木', meaning: '楚楚不凡，清雅脱俗', gender: 'neutral', style: ['literary'] },
  { char: '榕', kxStrokes: 14, element: '木', meaning: '榕荫庇人，福泽绵长', gender: 'male', style: ['modern'] },
  { char: '梧', kxStrokes: 11, element: '木', meaning: '凤栖梧桐，才德兼备', gender: 'male', style: ['literary'] },
  { char: '槐', kxStrokes: 14, element: '木', meaning: '三槐九棘，位尊权重', gender: 'male', style: ['traditional'] },
  { char: '檀', kxStrokes: 17, element: '木', meaning: '檀香悠远，气质高雅', gender: 'neutral', style: ['literary', 'modern'] },
  { char: '椿', kxStrokes: 13, element: '木', meaning: '大椿之寿，福寿绵长', gender: 'male', style: ['traditional'] },
  { char: '桥', kxStrokes: 16, element: '木', meaning: '桥梁之才，通达四方', gender: 'male', style: ['simple', 'modern'] },
  { char: '柔', kxStrokes: 9, element: '木', meaning: '温柔敦厚，和蔼可亲', gender: 'female', style: ['literary'] },
  { char: '桓', kxStrokes: 10, element: '木', meaning: '桓桓武将，英武不凡', gender: 'male', style: ['traditional', 'literary'] },
  { char: '萱', kxStrokes: 15, element: '木', meaning: '萱草忘忧，快乐无忧', gender: 'female', style: ['literary', 'traditional'] },
  { char: '芷', kxStrokes: 10, element: '木', meaning: '芷兰之室，芳香馥郁', gender: 'female', style: ['literary'] },
  { char: '茗', kxStrokes: 12, element: '木', meaning: '品茗论道，雅致高远', gender: 'neutral', style: ['literary'] },
  { char: '荣', kxStrokes: 14, element: '木', meaning: '繁荣昌盛，欣欣向荣', gender: 'male', style: ['traditional'] },
  { char: '茂', kxStrokes: 11, element: '木', meaning: '茂盛丰盈，人才辈出', gender: 'male', style: ['traditional', 'simple'] },
  { char: '芝', kxStrokes: 10, element: '木', meaning: '灵芝瑞草，祥瑞之兆', gender: 'female', style: ['literary', 'traditional'] },
  { char: '兰', kxStrokes: 23, element: '木', meaning: '兰心蕙质，高雅不凡', gender: 'female', style: ['literary', 'traditional'] },
  { char: '蕴', kxStrokes: 22, element: '木', meaning: '蕴藉深厚，内涵丰富', gender: 'neutral', style: ['literary'] },
  { char: '蕾', kxStrokes: 19, element: '木', meaning: '含苞待放，希望无限', gender: 'female', style: ['modern'] },
  { char: '芸', kxStrokes: 10, element: '木', meaning: '芸香之雅，书卷气息', gender: 'female', style: ['literary', 'simple'] },
  { char: '莉', kxStrokes: 13, element: '木', meaning: '茉莉芬芳，清雅脱俗', gender: 'female', style: ['modern', 'simple'] },
  { char: '芳', kxStrokes: 10, element: '木', meaning: '芳华正茂，前程似锦', gender: 'female', style: ['traditional', 'simple'] },
  { char: '菲', kxStrokes: 14, element: '木', meaning: '芳菲四月，春意盎然', gender: 'female', style: ['literary', 'modern'] },
  { char: '蓉', kxStrokes: 16, element: '木', meaning: '芙蓉出水，清丽脱俗', gender: 'female', style: ['literary'] },
  { char: '薇', kxStrokes: 19, element: '木', meaning: '蔷薇花开，娇艳动人', gender: 'female', style: ['literary', 'modern'] },
  { char: '葵', kxStrokes: 15, element: '木', meaning: '葵花向阳，积极乐观', gender: 'neutral', style: ['simple'] },
  { char: '菡', kxStrokes: 14, element: '木', meaning: '菡萏初开，清纯可人', gender: 'female', style: ['literary'] },
  { char: '菱', kxStrokes: 14, element: '木', meaning: '菱角含香，灵秀聪慧', gender: 'female', style: ['literary'] },
  { char: '芯', kxStrokes: 10, element: '木', meaning: '核心中坚，聪明伶俐', gender: 'neutral', style: ['modern'] },
  { char: '苑', kxStrokes: 11, element: '木', meaning: '文苑荟萃，才华横溢', gender: 'female', style: ['literary', 'traditional'] },
  { char: '茜', kxStrokes: 12, element: '木', meaning: '茜色如霞，美丽动人', gender: 'female', style: ['modern', 'literary'] },
  { char: '茵', kxStrokes: 12, element: '木', meaning: '绿草如茵，生机盎然', gender: 'female', style: ['literary'] },
  { char: '筠', kxStrokes: 13, element: '木', meaning: '竹筠之节，高风亮节', gender: 'neutral', style: ['literary'] },
  { char: '筱', kxStrokes: 13, element: '木', meaning: '小竹细密，精致灵巧', gender: 'female', style: ['literary', 'modern'] },
  { char: '箐', kxStrokes: 14, element: '木', meaning: '箐山翠竹，清幽雅致', gender: 'female', style: ['literary'] },
  { char: '策', kxStrokes: 12, element: '木', meaning: '运筹帷幄，计策超群', gender: 'male', style: ['literary'] },
  { char: '琪', kxStrokes: 13, element: '木', meaning: '美玉琪花，珍贵无比', gender: 'female', style: ['literary', 'modern'] },
  { char: '琴', kxStrokes: 13, element: '木', meaning: '琴瑟和鸣，雅好音律', gender: 'female', style: ['literary', 'traditional'] },
]

// ─── 火 (50+ 字) ───
const FIRE_CHARS: CharInfo[] = [
  { char: '炎', kxStrokes: 8, element: '火', meaning: '炎炎烈日，光明正大', gender: 'male', style: ['simple', 'traditional'] },
  { char: '焱', kxStrokes: 12, element: '火', meaning: '光华焱焱，才华耀眼', gender: 'male', style: ['modern'] },
  { char: '烁', kxStrokes: 19, element: '火', meaning: '闪烁光芒，璀璨夺目', gender: 'neutral', style: ['modern'] },
  { char: '炜', kxStrokes: 13, element: '火', meaning: '光辉炜烨，前途光明', gender: 'male', style: ['traditional'] },
  { char: '煜', kxStrokes: 13, element: '火', meaning: '煜煜生辉，光芒四射', gender: 'male', style: ['literary', 'modern'] },
  { char: '烨', kxStrokes: 14, element: '火', meaning: '烨烨其华，光采照人', gender: 'male', style: ['literary', 'traditional'] },
  { char: '焕', kxStrokes: 13, element: '火', meaning: '焕然一新，精神焕发', gender: 'male', style: ['traditional', 'modern'] },
  { char: '煊', kxStrokes: 13, element: '火', meaning: '温暖煊赫，声名远播', gender: 'male', style: ['literary', 'modern'] },
  { char: '熙', kxStrokes: 13, element: '火', meaning: '熙熙攘攘，繁华盛世', gender: 'male', style: ['traditional', 'literary'] },
  { char: '灿', kxStrokes: 17, element: '火', meaning: '灿烂辉煌，光华耀目', gender: 'male', style: ['modern', 'simple'] },
  { char: '炫', kxStrokes: 9, element: '火', meaning: '炫彩夺目，才华横溢', gender: 'neutral', style: ['modern'] },
  { char: '炯', kxStrokes: 9, element: '火', meaning: '目光炯炯，洞察秋毫', gender: 'male', style: ['literary'] },
  { char: '炽', kxStrokes: 13, element: '火', meaning: '炽热如火，热情奔放', gender: 'male', style: ['literary'] },
  { char: '烽', kxStrokes: 11, element: '火', meaning: '烽火连天，英勇无畏', gender: 'male', style: ['traditional'] },
  { char: '焰', kxStrokes: 12, element: '火', meaning: '火焰升腾，生命力旺盛', gender: 'male', style: ['modern'] },
  { char: '燊', kxStrokes: 16, element: '火', meaning: '燊火旺盛，事业兴隆', gender: 'male', style: ['traditional'] },
  { char: '暖', kxStrokes: 13, element: '火', meaning: '温暖如春，和煦可亲', gender: 'female', style: ['modern', 'simple'] },
  { char: '晖', kxStrokes: 13, element: '火', meaning: '春晖寸草，恩泽广被', gender: 'male', style: ['literary', 'traditional'] },
  { char: '晗', kxStrokes: 11, element: '火', meaning: '天将明兮，充满希望', gender: 'neutral', style: ['modern', 'literary'] },
  { char: '晨', kxStrokes: 11, element: '火', meaning: '晨曦初露，朝气蓬勃', gender: 'neutral', style: ['modern', 'simple'] },
  { char: '晶', kxStrokes: 12, element: '火', meaning: '晶莹剔透，纯洁无瑕', gender: 'female', style: ['simple', 'modern'] },
  { char: '景', kxStrokes: 12, element: '火', meaning: '前景美好，景星庆云', gender: 'male', style: ['traditional', 'literary'] },
  { char: '晴', kxStrokes: 12, element: '火', meaning: '晴空万里，心旷神怡', gender: 'female', style: ['modern', 'simple'] },
  { char: '暄', kxStrokes: 13, element: '火', meaning: '风和日暄，温暖舒适', gender: 'female', style: ['literary'] },
  { char: '晔', kxStrokes: 16, element: '火', meaning: '才华晔晔，声名远扬', gender: 'male', style: ['literary'] },
  { char: '昕', kxStrokes: 8, element: '火', meaning: '昕旦初升，光明在前', gender: 'neutral', style: ['modern', 'literary'] },
  { char: '昀', kxStrokes: 8, element: '火', meaning: '日光温和，性情敦厚', gender: 'neutral', style: ['modern', 'simple'] },
  { char: '昊', kxStrokes: 8, element: '火', meaning: '昊天广大，心胸开阔', gender: 'male', style: ['traditional', 'simple'] },
  { char: '昂', kxStrokes: 8, element: '火', meaning: '昂首阔步，意气风发', gender: 'male', style: ['simple', 'modern'] },
  { char: '明', kxStrokes: 8, element: '火', meaning: '光明磊落，明辨是非', gender: 'male', style: ['traditional', 'simple'] },
  { char: '昱', kxStrokes: 9, element: '火', meaning: '日光明亮，前途无量', gender: 'male', style: ['literary', 'modern'] },
  { char: '星', kxStrokes: 9, element: '火', meaning: '星辰大海，志向远大', gender: 'neutral', style: ['simple', 'modern'] },
  { char: '昭', kxStrokes: 9, element: '火', meaning: '昭然若揭，光明正大', gender: 'male', style: ['traditional'] },
  { char: '晓', kxStrokes: 16, element: '火', meaning: '晓风残月，通晓事理', gender: 'female', style: ['literary'] },
  { char: '曙', kxStrokes: 18, element: '火', meaning: '曙光初现，希望之光', gender: 'male', style: ['literary'] },
  { char: '丹', kxStrokes: 4, element: '火', meaning: '丹心一片，赤诚忠贞', gender: 'female', style: ['traditional', 'simple'] },
  { char: '彤', kxStrokes: 7, element: '火', meaning: '彤云密布，红运当头', gender: 'female', style: ['modern', 'simple'] },
  { char: '彦', kxStrokes: 9, element: '火', meaning: '俊彦之士，才德兼备', gender: 'male', style: ['literary', 'traditional'] },
  { char: '彩', kxStrokes: 11, element: '火', meaning: '五彩缤纷，生活多彩', gender: 'female', style: ['simple', 'modern'] },
  { char: '影', kxStrokes: 15, element: '火', meaning: '形影不离，顾盼生辉', gender: 'female', style: ['literary'] },
  { char: '亮', kxStrokes: 9, element: '火', meaning: '光明亮丽，前途无量', gender: 'male', style: ['simple', 'modern'] },
  { char: '丽', kxStrokes: 19, element: '火', meaning: '风华绝代，美丽大方', gender: 'female', style: ['traditional', 'simple'] },
  { char: '俊', kxStrokes: 9, element: '火', meaning: '俊朗不凡，才貌双全', gender: 'male', style: ['traditional', 'simple'] },
  { char: '伦', kxStrokes: 10, element: '火', meaning: '伦理有序，德高望重', gender: 'male', style: ['traditional'] },
  { char: '佳', kxStrokes: 8, element: '火', meaning: '佳人绝代，品貌俱佳', gender: 'female', style: ['simple', 'traditional'] },
  { char: '依', kxStrokes: 8, element: '火', meaning: '小鸟依人，温柔可人', gender: 'female', style: ['modern', 'simple'] },
  { char: '伟', kxStrokes: 11, element: '火', meaning: '伟岸挺拔，功业卓著', gender: 'male', style: ['traditional', 'simple'] },
  { char: '杰', kxStrokes: 12, element: '火', meaning: '英杰之士，人中龙凤', gender: 'male', style: ['traditional', 'simple'] },
  { char: '智', kxStrokes: 12, element: '火', meaning: '智慧超群，才思敏捷', gender: 'male', style: ['traditional', 'literary'] },
  { char: '旭', kxStrokes: 6, element: '火', meaning: '旭日东升，朝气蓬勃', gender: 'male', style: ['simple', 'modern'] },
  { char: '旻', kxStrokes: 8, element: '火', meaning: '秋日高远，志存高远', gender: 'male', style: ['literary'] },
  { char: '旸', kxStrokes: 9, element: '火', meaning: '旭日旸旸，光明在前', gender: 'male', style: ['literary'] },
  { char: '曜', kxStrokes: 18, element: '火', meaning: '日月曜光，才华出众', gender: 'male', style: ['literary', 'traditional'] },
  { char: '照', kxStrokes: 13, element: '火', meaning: '光照四方，恩泽普被', gender: 'male', style: ['traditional'] },
  { char: '熠', kxStrokes: 15, element: '火', meaning: '熠熠生辉，光彩夺目', gender: 'neutral', style: ['literary', 'modern'] },
  { char: '燕', kxStrokes: 16, element: '火', meaning: '燕舞莺歌，欢乐祥和', gender: 'female', style: ['traditional', 'literary'] },
]

// ─── 土 (50+ 字) ───
const EARTH_CHARS: CharInfo[] = [
  { char: '坤', kxStrokes: 8, element: '土', meaning: '乾坤之大，厚德载物', gender: 'male', style: ['traditional', 'literary'] },
  { char: '坦', kxStrokes: 8, element: '土', meaning: '坦荡胸怀，光明磊落', gender: 'male', style: ['simple'] },
  { char: '城', kxStrokes: 10, element: '土', meaning: '众志成城，坚不可摧', gender: 'male', style: ['traditional'] },
  { char: '培', kxStrokes: 11, element: '土', meaning: '培根铸魂，厚植根基', gender: 'male', style: ['traditional', 'simple'] },
  { char: '基', kxStrokes: 11, element: '土', meaning: '基业长青，根基深厚', gender: 'male', style: ['traditional', 'simple'] },
  { char: '堂', kxStrokes: 11, element: '土', meaning: '金玉满堂，富贵荣华', gender: 'male', style: ['traditional'] },
  { char: '境', kxStrokes: 14, element: '土', meaning: '境界高远，超凡脱俗', gender: 'neutral', style: ['literary'] },
  { char: '增', kxStrokes: 14, element: '土', meaning: '日增月益，不断进步', gender: 'male', style: ['simple', 'traditional'] },
  { char: '壁', kxStrokes: 16, element: '土', meaning: '壁立千仞，坚毅果敢', gender: 'male', style: ['literary'] },
  { char: '坚', kxStrokes: 11, element: '土', meaning: '坚如磐石，意志坚定', gender: 'male', style: ['traditional', 'simple'] },
  { char: '均', kxStrokes: 7, element: '土', meaning: '均衡发展，和谐美满', gender: 'neutral', style: ['simple'] },
  { char: '坊', kxStrokes: 7, element: '土', meaning: '牌坊高耸，功名显赫', gender: 'male', style: ['traditional'] },
  { char: '坤', kxStrokes: 8, element: '土', meaning: '坤厚载物，德行天下', gender: 'male', style: ['traditional', 'literary'] },
  { char: '坡', kxStrokes: 8, element: '土', meaning: '东坡之才，文采斐然', gender: 'male', style: ['literary'] },
  { char: '坪', kxStrokes: 9, element: '土', meaning: '坦坪广阔，心胸开阔', gender: 'neutral', style: ['simple'] },
  { char: '垣', kxStrokes: 9, element: '土', meaning: '断壁残垣，历史厚重', gender: 'male', style: ['literary'] },
  { char: '威', kxStrokes: 9, element: '土', meaning: '威风凛凛，气势不凡', gender: 'male', style: ['traditional'] },
  { char: '研', kxStrokes: 11, element: '土', meaning: '研精覃思，学问渊博', gender: 'neutral', style: ['modern', 'literary'] },
  { char: '硕', kxStrokes: 14, element: '土', meaning: '硕果累累，学有成就', gender: 'male', style: ['traditional', 'modern'] },
  { char: '辰', kxStrokes: 7, element: '土', meaning: '星辰日月，良辰美景', gender: 'male', style: ['traditional', 'simple'] },
  { char: '宇', kxStrokes: 6, element: '土', meaning: '气宇轩昂，胸怀宇宙', gender: 'male', style: ['modern', 'simple'] },
  { char: '安', kxStrokes: 6, element: '土', meaning: '安居乐业，平安喜乐', gender: 'neutral', style: ['traditional', 'simple'] },
  { char: '容', kxStrokes: 10, element: '土', meaning: '雍容华贵，包容大度', gender: 'neutral', style: ['traditional', 'literary'] },
  { char: '峻', kxStrokes: 10, element: '土', meaning: '高山峻岭，巍峨雄伟', gender: 'male', style: ['literary'] },
  { char: '嵘', kxStrokes: 17, element: '土', meaning: '峥嵘岁月，不凡经历', gender: 'male', style: ['literary'] },
  { char: '崇', kxStrokes: 11, element: '土', meaning: '崇高理想，德高望重', gender: 'male', style: ['traditional'] },
  { char: '岩', kxStrokes: 8, element: '土', meaning: '坚如磐岩，不可动摇', gender: 'male', style: ['traditional', 'simple'] },
  { char: '峰', kxStrokes: 10, element: '土', meaning: '登峰造极，勇攀高峰', gender: 'male', style: ['modern', 'simple'] },
  { char: '岚', kxStrokes: 12, element: '土', meaning: '山岚缥缈，诗意盎然', gender: 'female', style: ['literary'] },
  { char: '岭', kxStrokes: 17, element: '土', meaning: '崇山峻岭，胸怀壮志', gender: 'male', style: ['literary'] },
  { char: '屹', kxStrokes: 6, element: '土', meaning: '屹立不倒，坚定果敢', gender: 'male', style: ['literary', 'simple'] },
  { char: '岳', kxStrokes: 8, element: '土', meaning: '五岳归来，心胸博大', gender: 'male', style: ['traditional'] },
  { char: '岗', kxStrokes: 11, element: '土', meaning: '站岗守卫，责任心强', gender: 'male', style: ['simple'] },
  { char: '融', kxStrokes: 16, element: '土', meaning: '融会贯通，和融美满', gender: 'neutral', style: ['literary', 'modern'] },
  { char: '翔', kxStrokes: 12, element: '土', meaning: '翱翔天际，自由不羁', gender: 'male', style: ['modern', 'simple'] },
  { char: '悠', kxStrokes: 11, element: '土', meaning: '悠然自得，闲适从容', gender: 'female', style: ['literary', 'simple'] },
  { char: '怡', kxStrokes: 9, element: '土', meaning: '心旷神怡，怡然自乐', gender: 'female', style: ['simple', 'modern'] },
  { char: '恩', kxStrokes: 10, element: '土', meaning: '恩泽广被，知恩图报', gender: 'neutral', style: ['traditional'] },
  { char: '惠', kxStrokes: 12, element: '土', meaning: '惠风和畅，仁惠待人', gender: 'female', style: ['traditional', 'simple'] },
  { char: '慧', kxStrokes: 15, element: '土', meaning: '智慧如海，慧心妙悟', gender: 'female', style: ['literary', 'traditional'] },
  { char: '婉', kxStrokes: 11, element: '土', meaning: '婉约温婉，柔美动人', gender: 'female', style: ['literary'] },
  { char: '瑛', kxStrokes: 14, element: '土', meaning: '美瑛如玉，光彩照人', gender: 'female', style: ['literary'] },
  { char: '韵', kxStrokes: 19, element: '土', meaning: '韵味悠长，格调高雅', gender: 'female', style: ['literary', 'modern'] },
  { char: '圆', kxStrokes: 13, element: '土', meaning: '圆满如意，事事顺心', gender: 'female', style: ['traditional', 'simple'] },
  { char: '婉', kxStrokes: 11, element: '土', meaning: '温婉可人，品行端正', gender: 'female', style: ['literary'] },
  { char: '维', kxStrokes: 14, element: '土', meaning: '维系万物，思维缜密', gender: 'male', style: ['modern', 'simple'] },
  { char: '越', kxStrokes: 12, element: '土', meaning: '超越自我，不断进步', gender: 'male', style: ['modern', 'simple'] },
  { char: '跃', kxStrokes: 11, element: '土', meaning: '飞跃进步，志存高远', gender: 'male', style: ['modern', 'simple'] },
  { char: '纬', kxStrokes: 15, element: '土', meaning: '经纬天地，宏图大展', gender: 'male', style: ['literary', 'traditional'] },
  { char: '伟', kxStrokes: 11, element: '土', meaning: '伟大壮志，卓尔不群', gender: 'male', style: ['traditional', 'simple'] },
]

// ─── 金 (50+ 字) ───
const METAL_CHARS: CharInfo[] = [
  { char: '鑫', kxStrokes: 24, element: '金', meaning: '金鑫鼎盛，财富充盈', gender: 'male', style: ['traditional'] },
  { char: '铭', kxStrokes: 14, element: '金', meaning: '铭记于心，志向远大', gender: 'male', style: ['traditional', 'literary'] },
  { char: '铮', kxStrokes: 16, element: '金', meaning: '铁骨铮铮，刚正不阿', gender: 'male', style: ['literary', 'modern'] },
  { char: '锐', kxStrokes: 15, element: '金', meaning: '锐意进取，锐不可当', gender: 'male', style: ['modern'] },
  { char: '钧', kxStrokes: 12, element: '金', meaning: '雷霆万钧，力量雄浑', gender: 'male', style: ['traditional', 'literary'] },
  { char: '铖', kxStrokes: 14, element: '金', meaning: '铖金之坚，意志坚定', gender: 'male', style: ['modern'] },
  { char: '锋', kxStrokes: 15, element: '金', meaning: '锋芒毕露，才思敏捷', gender: 'male', style: ['traditional', 'simple'] },
  { char: '银', kxStrokes: 14, element: '金', meaning: '银光闪耀，富贵吉祥', gender: 'neutral', style: ['traditional'] },
  { char: '锦', kxStrokes: 16, element: '金', meaning: '锦绣前程，华美绚丽', gender: 'neutral', style: ['traditional', 'literary'] },
  { char: '镇', kxStrokes: 18, element: '金', meaning: '镇定自若，沉稳大气', gender: 'male', style: ['traditional'] },
  { char: '钊', kxStrokes: 10, element: '金', meaning: '勉励奋进，志存高远', gender: 'male', style: ['traditional', 'literary'] },
  { char: '鉴', kxStrokes: 13, element: '金', meaning: '明鉴万里，洞察秋毫', gender: 'male', style: ['literary'] },
  { char: '锡', kxStrokes: 16, element: '金', meaning: '天赐之福，恩泽深厚', gender: 'male', style: ['traditional'] },
  { char: '钦', kxStrokes: 12, element: '金', meaning: '钦佩敬仰，德高望重', gender: 'male', style: ['traditional'] },
  { char: '镜', kxStrokes: 19, element: '金', meaning: '明镜高悬，公正无私', gender: 'neutral', style: ['literary'] },
  { char: '钰', kxStrokes: 13, element: '金', meaning: '珍宝美玉，珍贵无比', gender: 'female', style: ['modern', 'literary'] },
  { char: '铃', kxStrokes: 13, element: '金', meaning: '铃音清脆，灵动可爱', gender: 'female', style: ['simple', 'modern'] },
  { char: '锦', kxStrokes: 16, element: '金', meaning: '锦上添花，好上加好', gender: 'female', style: ['traditional'] },
  { char: '铄', kxStrokes: 14, element: '金', meaning: '众口铄金，金声玉振', gender: 'male', style: ['literary'] },
  { char: '铠', kxStrokes: 18, element: '金', meaning: '铠甲在身，坚不可摧', gender: 'male', style: ['traditional'] },
  { char: '铉', kxStrokes: 14, element: '金', meaning: '鼎铉重器，国之栋梁', gender: 'male', style: ['literary'] },
  { char: '铮', kxStrokes: 16, element: '金', meaning: '铮铮铁骨，刚正不阿', gender: 'male', style: ['literary', 'modern'] },
  { char: '瑞', kxStrokes: 14, element: '金', meaning: '祥瑞之气，吉星高照', gender: 'neutral', style: ['traditional', 'simple'] },
  { char: '珠', kxStrokes: 11, element: '金', meaning: '掌上明珠，珍贵可爱', gender: 'female', style: ['traditional', 'simple'] },
  { char: '珍', kxStrokes: 10, element: '金', meaning: '珍爱有加，视若珍宝', gender: 'female', style: ['traditional', 'simple'] },
  { char: '珊', kxStrokes: 10, element: '金', meaning: '珊瑚美玉，高贵典雅', gender: 'female', style: ['literary', 'modern'] },
  { char: '瑜', kxStrokes: 14, element: '金', meaning: '怀瑾握瑜，美德如玉', gender: 'female', style: ['literary'] },
  { char: '瑾', kxStrokes: 16, element: '金', meaning: '怀瑾握瑜，品行高洁', gender: 'female', style: ['literary'] },
  { char: '璇', kxStrokes: 16, element: '金', meaning: '璇玑之美，光彩照人', gender: 'female', style: ['literary'] },
  { char: '瑶', kxStrokes: 15, element: '金', meaning: '瑶池仙境，仙姿玉貌', gender: 'female', style: ['literary'] },
  { char: '琬', kxStrokes: 13, element: '金', meaning: '琬琰之美，温润如玉', gender: 'female', style: ['literary'] },
  { char: '琦', kxStrokes: 13, element: '金', meaning: '奇珍异宝，珍贵非凡', gender: 'female', style: ['literary', 'modern'] },
  { char: '琰', kxStrokes: 13, element: '金', meaning: '美玉琰琰，品行端正', gender: 'female', style: ['literary'] },
  { char: '珂', kxStrokes: 10, element: '金', meaning: '鸣珂锵玉，声名远播', gender: 'female', style: ['literary'] },
  { char: '珏', kxStrokes: 9, element: '金', meaning: '双玉合璧，美满幸福', gender: 'female', style: ['literary'] },
  { char: '玥', kxStrokes: 9, element: '金', meaning: '神珠玥玉，尊贵吉祥', gender: 'female', style: ['modern', 'literary'] },
  { char: '珺', kxStrokes: 12, element: '金', meaning: '珺玉之美，品质高洁', gender: 'female', style: ['modern', 'literary'] },
  { char: '初', kxStrokes: 7, element: '金', meaning: '初心不忘，始终如一', gender: 'female', style: ['literary', 'simple'] },
  { char: '思', kxStrokes: 9, element: '金', meaning: '深思熟虑，才思敏捷', gender: 'neutral', style: ['traditional', 'simple'] },
  { char: '悦', kxStrokes: 11, element: '金', meaning: '心悦诚服，愉悦快乐', gender: 'female', style: ['modern', 'simple'] },
  { char: '诗', kxStrokes: 13, element: '金', meaning: '诗情画意，才华横溢', gender: 'female', style: ['literary', 'traditional'] },
  { char: '靖', kxStrokes: 13, element: '金', meaning: '靖安天下，安定祥和', gender: 'male', style: ['traditional', 'literary'] },
  { char: '宸', kxStrokes: 10, element: '金', meaning: '宸宇之尊，高贵典雅', gender: 'male', style: ['literary', 'modern'] },
  { char: '尚', kxStrokes: 8, element: '金', meaning: '崇尚美德，高尚情操', gender: 'male', style: ['traditional', 'simple'] },
  { char: '宸', kxStrokes: 10, element: '金', meaning: '帝宸之星，尊贵非凡', gender: 'male', style: ['modern'] },
  { char: '承', kxStrokes: 8, element: '金', meaning: '承前启后，继往开来', gender: 'male', style: ['traditional'] },
  { char: '睿', kxStrokes: 14, element: '金', meaning: '睿智通达，洞察先机', gender: 'male', style: ['literary', 'modern'] },
  { char: '诚', kxStrokes: 14, element: '金', meaning: '诚信为本，一诺千金', gender: 'male', style: ['traditional', 'simple'] },
  { char: '修', kxStrokes: 10, element: '金', meaning: '修身养性，品德高尚', gender: 'male', style: ['traditional', 'literary'] },
  { char: '绅', kxStrokes: 11, element: '金', meaning: '绅士风度，温文尔雅', gender: 'male', style: ['traditional', 'modern'] },
  { char: '叙', kxStrokes: 9, element: '金', meaning: '叙事有条，表达清晰', gender: 'neutral', style: ['literary'] },
  { char: '创', kxStrokes: 12, element: '金', meaning: '创业创新，敢为人先', gender: 'male', style: ['modern'] },
]

// ─── 水 (50+ 字) ───
const WATER_CHARS: CharInfo[] = [
  { char: '涵', kxStrokes: 12, element: '水', meaning: '涵养深厚，包容大度', gender: 'neutral', style: ['literary', 'modern'] },
  { char: '泽', kxStrokes: 17, element: '水', meaning: '深泽广被，恩惠天下', gender: 'male', style: ['traditional', 'literary'] },
  { char: '润', kxStrokes: 16, element: '水', meaning: '温润如玉，润物无声', gender: 'male', style: ['literary', 'simple'] },
  { char: '浩', kxStrokes: 11, element: '水', meaning: '浩然正气，气宇轩昂', gender: 'male', style: ['traditional', 'simple'] },
  { char: '海', kxStrokes: 11, element: '水', meaning: '海纳百川，心胸宽广', gender: 'male', style: ['traditional', 'simple'] },
  { char: '涛', kxStrokes: 18, element: '水', meaning: '波涛汹涌，气势恢宏', gender: 'male', style: ['traditional', 'modern'] },
  { char: '渊', kxStrokes: 12, element: '水', meaning: '学识渊博，深不可测', gender: 'male', style: ['literary'] },
  { char: '源', kxStrokes: 14, element: '水', meaning: '饮水思源，不忘根本', gender: 'male', style: ['traditional'] },
  { char: '溪', kxStrokes: 14, element: '水', meaning: '清溪潺潺，纯洁无瑕', gender: 'female', style: ['literary'] },
  { char: '湘', kxStrokes: 13, element: '水', meaning: '湘水悠悠，情意绵绵', gender: 'female', style: ['literary'] },
  { char: '渝', kxStrokes: 13, element: '水', meaning: '矢志不渝，忠贞不二', gender: 'neutral', style: ['literary'] },
  { char: '渤', kxStrokes: 14, element: '水', meaning: '渤海之志，胸怀宽广', gender: 'male', style: ['traditional'] },
  { char: '瀚', kxStrokes: 20, element: '水', meaning: '浩瀚无垠，学识渊博', gender: 'male', style: ['literary'] },
  { char: '漾', kxStrokes: 15, element: '水', meaning: '碧波荡漾，温柔多情', gender: 'female', style: ['literary'] },
  { char: '漪', kxStrokes: 15, element: '水', meaning: '涟漪微起，细腻温柔', gender: 'female', style: ['literary'] },
  { char: '潇', kxStrokes: 15, element: '水', meaning: '潇洒飘逸，不拘一格', gender: 'male', style: ['literary', 'modern'] },
  { char: '漫', kxStrokes: 15, element: '水', meaning: '浪漫自由，随性洒脱', gender: 'female', style: ['modern'] },
  { char: '沐', kxStrokes: 8, element: '水', meaning: '如沐春风，温润舒心', gender: 'neutral', style: ['literary', 'modern'] },
  { char: '沛', kxStrokes: 8, element: '水', meaning: '精力充沛，生命旺盛', gender: 'male', style: ['simple', 'modern'] },
  { char: '洁', kxStrokes: 16, element: '水', meaning: '冰清玉洁，品行端正', gender: 'female', style: ['traditional', 'simple'] },
  { char: '清', kxStrokes: 12, element: '水', meaning: '清正廉明，高风亮节', gender: 'male', style: ['traditional', 'simple'] },
  { char: '澄', kxStrokes: 16, element: '水', meaning: '澄澈明净，心地纯善', gender: 'neutral', style: ['literary'] },
  { char: '洛', kxStrokes: 10, element: '水', meaning: '洛水之灵，仙姿玉貌', gender: 'female', style: ['literary'] },
  { char: '泉', kxStrokes: 9, element: '水', meaning: '清泉石上，甘甜纯净', gender: 'male', style: ['simple', 'literary'] },
  { char: '洋', kxStrokes: 10, element: '水', meaning: '汪洋大海，心胸广阔', gender: 'male', style: ['simple', 'modern'] },
  { char: '洪', kxStrokes: 10, element: '水', meaning: '洪福齐天，大吉大利', gender: 'male', style: ['traditional'] },
  { char: '波', kxStrokes: 9, element: '水', meaning: '随波不逐流，有主见', gender: 'male', style: ['simple'] },
  { char: '江', kxStrokes: 7, element: '水', meaning: '大江东去，气势磅礴', gender: 'male', style: ['traditional', 'simple'] },
  { char: '河', kxStrokes: 9, element: '水', meaning: '河清海晏，天下太平', gender: 'male', style: ['traditional', 'simple'] },
  { char: '湖', kxStrokes: 13, element: '水', meaning: '湖光山色，秀丽宜人', gender: 'neutral', style: ['literary'] },
  { char: '漫', kxStrokes: 15, element: '水', meaning: '漫漫人生，从容不迫', gender: 'female', style: ['literary'] },
  { char: '沈', kxStrokes: 8, element: '水', meaning: '沈稳内敛，不露锋芒', gender: 'male', style: ['traditional'] },
  { char: '法', kxStrokes: 9, element: '水', meaning: '法度严明，公正无私', gender: 'male', style: ['traditional'] },
  { char: '泊', kxStrokes: 9, element: '水', meaning: '淡泊明志，宁静致远', gender: 'male', style: ['literary'] },
  { char: '深', kxStrokes: 12, element: '水', meaning: '深谋远虑，城府深厚', gender: 'male', style: ['simple', 'literary'] },
  { char: '淳', kxStrokes: 12, element: '水', meaning: '淳朴厚道，真心实意', gender: 'male', style: ['traditional'] },
  { char: '沁', kxStrokes: 8, element: '水', meaning: '沁人心脾，清新脱俗', gender: 'female', style: ['literary', 'modern'] },
  { char: '溪', kxStrokes: 14, element: '水', meaning: '清溪流水，自然纯真', gender: 'female', style: ['literary', 'modern'] },
  { char: '淑', kxStrokes: 12, element: '水', meaning: '淑德贤良，温柔贤淑', gender: 'female', style: ['traditional'] },
  { char: '澜', kxStrokes: 21, element: '水', meaning: '波澜壮阔，气度不凡', gender: 'male', style: ['literary'] },
  { char: '澈', kxStrokes: 16, element: '水', meaning: '清澈见底，心地纯净', gender: 'neutral', style: ['literary'] },
  { char: '泓', kxStrokes: 9, element: '水', meaning: '一泓清泉，深藏不露', gender: 'male', style: ['literary'] },
  { char: '洵', kxStrokes: 10, element: '水', meaning: '洵美且异，真诚可信', gender: 'female', style: ['literary'] },
  { char: '漪', kxStrokes: 15, element: '水', meaning: '碧漪微澜，灵动秀美', gender: 'female', style: ['literary'] },
  { char: '洵', kxStrokes: 10, element: '水', meaning: '洵实可信，诚心诚意', gender: 'neutral', style: ['literary'] },
  { char: '溢', kxStrokes: 14, element: '水', meaning: '才华横溢，溢于言表', gender: 'neutral', style: ['literary'] },
  { char: '漪', kxStrokes: 15, element: '水', meaning: '水波漪漪，温柔多情', gender: 'female', style: ['literary'] },
  { char: '淳', kxStrokes: 12, element: '水', meaning: '淳和温厚，待人以诚', gender: 'neutral', style: ['traditional'] },
  { char: '鸿', kxStrokes: 17, element: '水', meaning: '鸿鹄之志，志向远大', gender: 'male', style: ['traditional', 'literary'] },
  { char: '霖', kxStrokes: 16, element: '水', meaning: '甘霖普降，恩泽天下', gender: 'male', style: ['traditional', 'literary'] },
  { char: '霏', kxStrokes: 16, element: '水', meaning: '雨雪霏霏，诗情画意', gender: 'female', style: ['literary'] },
  { char: '雯', kxStrokes: 12, element: '水', meaning: '云雯斑斓，美丽动人', gender: 'female', style: ['modern', 'simple'] },
  { char: '霖', kxStrokes: 16, element: '水', meaning: '润泽万物，仁爱之心', gender: 'neutral', style: ['literary'] },
  { char: '霈', kxStrokes: 15, element: '水', meaning: '霈泽广施，大爱无疆', gender: 'male', style: ['literary'] },
]

// 全部候选字
const ALL_CHARS: CharInfo[] = [
  ...WOOD_CHARS, ...FIRE_CHARS, ...EARTH_CHARS, ...METAL_CHARS, ...WATER_CHARS,
]

// ═══════════════════════════════════════
// 常见姓氏康熙笔画表
// ═══════════════════════════════════════

const SURNAME_STROKES: Record<string, number> = {
  '王': 4, '李': 7, '张': 11, '刘': 15, '陈': 17, '杨': 13, '黄': 13, '赵': 14, '吴': 7,
  '周': 8, '徐': 10, '孙': 10, '马': 10, '朱': 6, '胡': 11, '郭': 15, '何': 7, '林': 8,
  '罗': 20, '高': 10, '郑': 19, '梁': 11, '谢': 17, '宋': 7, '唐': 10, '韩': 17, '曹': 11,
  '许': 11, '邓': 19, '冯': 12, '彭': 12, '潘': 16, '袁': 10, '于': 3, '董': 15, '余': 7,
  '苏': 22, '叶': 15, '吕': 7, '魏': 18, '蒋': 17, '蔡': 17, '贾': 13, '丁': 2, '魏': 18,
  '薛': 19, '叶': 15, '阎': 16, '余': 7, '潘': 16, '杜': 7, '戴': 18, '夏': 10, '钟': 17,
  '汪': 8, '田': 5, '任': 6, '姜': 8, '范': 15, '方': 4, '石': 5, '姚': 9, '谭': 19,
  '廖': 14, '邹': 17, '熊': 14, '金': 8, '陆': 16, '郝': 14, '孔': 4, '白': 5, '崔': 11,
  '康': 11, '毛': 4, '邱': 12, '秦': 10, '江': 7, '史': 5, '顾': 21, '侯': 9, '邵': 12,
  '孟': 8, '龙': 16, '万': 15, '段': 9, '雷': 13, '钱': 16, '汤': 13, '尹': 4, '黎': 18,
  '易': 8, '常': 11, '武': 8, '乔': 6, '贺': 12, '赖': 16, '龚': 22, '文': 4, '庞': 19,
  '樊': 15, '兰': 23, '殷': 10, '施': 9, '陶': 16, '洪': 10, '翟': 14, '安': 6, '颜': 18,
  '倪': 10, '严': 20, '牛': 4, '温': 14, '芦': 22, '季': 8, '俞': 9, '章': 11, '鲁': 15,
  '葛': 15, '伍': 6, '韦': 9, '申': 5, '尤': 4, '毕': 11, '聂': 18, '丛': 18, '焦': 12,
  '向': 6, '柳': 9, '邢': 11, '路': 13, '岳': 8, '齐': 14, '沿': 8, '梅': 11, '莫': 13,
  '庄': 13, '辛': 7, '管': 14, '祝': 10, '左': 5, '涂': 13, '谷': 15, '祁': 8, '时': 10,
  '舒': 12, '耿': 10, '牟': 6, '卜': 2, '路': 13, '詹': 13, '关': 19, '苗': 11, '凌': 10,
  '费': 12, '纪': 9, '舒': 12, '屈': 8, '项': 12, '祝': 10, '董': 15, '梁': 11, '杜': 7,
}

// ═══════════════════════════════════════
// 五格数理吉凶表
// ═══════════════════════════════════════

const SHULI_MAP: Record<number, { luck: string; meaning: string }> = {
  1: { luck: '吉', meaning: '万物开泰，最大吉数' },
  2: { luck: '凶', meaning: '动摇不安，一荣一枯' },
  3: { luck: '吉', meaning: '阴阳合和，繁荣富贵' },
  4: { luck: '凶', meaning: '万事休止，凶兆无疑' },
  5: { luck: '吉', meaning: '福禄长寿，阴阳和合' },
  6: { luck: '吉', meaning: '安稳余庆，吉人天相' },
  7: { luck: '吉', meaning: '刚毅果断，勇往直前' },
  8: { luck: '吉', meaning: '坚刚志强，意念坚定' },
  9: { luck: '凶', meaning: '穷迫逆境，有才无运' },
  10: { luck: '凶', meaning: '零暗万事，有才无命' },
  11: { luck: '吉', meaning: '旱苗逢雨，挽回家运' },
  12: { luck: '凶', meaning: '薄弱无力，外观平静' },
  13: { luck: '吉', meaning: '智慧超群，博学多才' },
  14: { luck: '凶', meaning: '浮沉不定，破兆之数' },
  15: { luck: '吉', meaning: '福寿圆满，富贵荣誉' },
  16: { luck: '吉', meaning: '贵人得助，天降好运' },
  17: { luck: '吉', meaning: '排除万难，有贵人助' },
  18: { luck: '吉', meaning: '有志竟成，内外有运' },
  19: { luck: '凶', meaning: '多难困苦，遮云蔽月' },
  20: { luck: '凶', meaning: '非业空虚，灾难叠至' },
  21: { luck: '吉', meaning: '明月光照，独立权威' },
  22: { luck: '凶', meaning: '秋草逢霜，困难疾弱' },
  23: { luck: '吉', meaning: '壮丽果敢，权威显达' },
  24: { luck: '吉', meaning: '家门余庆，金钱丰盈' },
  25: { luck: '吉', meaning: '英俊刚毅，资性英敏' },
  26: { luck: '凶', meaning: '变怪之数，波澜起伏' },
  27: { luck: '凶', meaning: '足智多谋，自我心过强' },
  28: { luck: '凶', meaning: '自甘没落，孤独遭难' },
  29: { luck: '吉', meaning: '智谋优秀，财力归集' },
  30: { luck: '半吉', meaning: '浮沉不定，吉凶参半' },
  31: { luck: '吉', meaning: '春日花开，智勇得志' },
  32: { luck: '吉', meaning: '侥幸多望，贵人得助' },
  33: { luck: '吉', meaning: '旭日升天，家门隆昌' },
  34: { luck: '凶', meaning: '破家之身，见识短小' },
  35: { luck: '吉', meaning: '温和平安，优雅发展' },
  36: { luck: '凶', meaning: '波澜壮阔，风浪不息' },
  37: { luck: '吉', meaning: '权威显达，忠义智勇' },
  38: { luck: '半吉', meaning: '意志薄弱，刻意经营' },
  39: { luck: '吉', meaning: '富贵荣华，财帛丰盈' },
  40: { luck: '凶', meaning: '浮沉不定，须防灾祸' },
  41: { luck: '吉', meaning: '纯阳独秀，有德有能' },
  42: { luck: '半吉', meaning: '博识多能，精通世情' },
  43: { luck: '凶', meaning: '散财破产，诸事不遂' },
  44: { luck: '凶', meaning: '破家亡身，暗淡惨愁' },
  45: { luck: '吉', meaning: '顺风扬帆，新生泰运' },
  46: { luck: '凶', meaning: '载宝沉舟，难以挽回' },
  47: { luck: '吉', meaning: '开花结果，万事如意' },
  48: { luck: '吉', meaning: '德智兼备，最宜为人' },
  49: { luck: '凶', meaning: '吉凶参半，一成一败' },
  50: { luck: '半吉', meaning: '成败交加，先苦后甜' },
  51: { luck: '半吉', meaning: '一盛一衰，浮沉不测' },
  52: { luck: '吉', meaning: '卓识达人，目光敏锐' },
  53: { luck: '凶', meaning: '忧愁困苦，心事难遂' },
  54: { luck: '凶', meaning: '多难不幸，辛惨不绝' },
  55: { luck: '半吉', meaning: '外祥内苦，和亲不睦' },
  56: { luck: '凶', meaning: '浪里行舟，历尽艰辛' },
  57: { luck: '半吉', meaning: '寒雪青松，刚毅有志' },
  58: { luck: '凶', meaning: '晚行遇月，先苦后甜' },
  59: { luck: '凶', meaning: '寒蝉悲风，意志动摇' },
  60: { luck: '凶', meaning: '无谋无勇，黑暗迷途' },
  61: { luck: '吉', meaning: '名利双收，繁荣富贵' },
  62: { luck: '凶', meaning: '衰败之象，内外不和' },
  63: { luck: '吉', meaning: '富贵荣华，身心安泰' },
  64: { luck: '凶', meaning: '骨肉分离，孤独悲愁' },
  65: { luck: '吉', meaning: '富贵长寿，逢凶化吉' },
  66: { luck: '凶', meaning: '内外不和，进退维谷' },
  67: { luck: '吉', meaning: '天赋幸运，步步高升' },
  68: { luck: '吉', meaning: '兴家立业，才智发达' },
  69: { luck: '凶', meaning: '坐立不安，穷迫困苦' },
  70: { luck: '凶', meaning: '惨淡经营，空虚困苦' },
  71: { luck: '半吉', meaning: '吉凶参半，惟赖勇气' },
  72: { luck: '凶', meaning: '劳苦劳累，难以安宁' },
  73: { luck: '半吉', meaning: '志高力微，实难如愿' },
  74: { luck: '凶', meaning: '沉沦逆运，无力回天' },
  75: { luck: '半吉', meaning: '守此数者，有经营力' },
  76: { luck: '凶', meaning: '倾覆离散，外祥内苦' },
  77: { luck: '半吉', meaning: '先苦后甜，吉运自来' },
  78: { luck: '半吉', meaning: '晚景凄凉，劫数难逃' },
  79: { luck: '凶', meaning: '前途暗淡，辛苦劳碌' },
  80: { luck: '凶', meaning: '遁世隐居，辛苦艰难' },
  81: { luck: '吉', meaning: '万物回春，重得繁荣' },
}

// 五格对应五行（尾数）
function numberToElement(n: number): FiveElement {
  const last = n % 10
  if (last === 1 || last === 2) return '木'
  if (last === 3 || last === 4) return '火'
  if (last === 5 || last === 6) return '土'
  if (last === 7 || last === 8) return '金'
  return '水'
}

// 三才配置吉凶
const SANCAI_LUCK: Record<string, string> = {
  '木木木': '大吉', '木木火': '大吉', '木木土': '大吉', '木木金': '凶', '木木水': '大吉',
  '木火木': '大吉', '木火火': '大吉', '木火土': '大吉', '木火金': '凶', '木火水': '吉',
  '木土木': '凶', '木土火': '凶', '木土土': '凶', '木土金': '凶', '木土水': '凶',
  '木金木': '凶', '木金火': '凶', '木金土': '吉', '木金金': '凶', '木金水': '凶',
  '木水木': '大吉', '木水火': '吉', '木水土': '吉', '木水金': '大吉', '木水水': '吉',
  '火木木': '大吉', '火木火': '大吉', '火木土': '吉', '火木金': '凶', '火木水': '吉',
  '火火木': '大吉', '火火火': '凶', '火火土': '凶', '火火金': '凶', '火火水': '凶',
  '火土木': '凶', '火土火': '大吉', '火土土': '大吉', '火土金': '吉', '火土水': '凶',
  '火金木': '凶', '火金火': '凶', '火金土': '凶', '火金金': '凶', '火金水': '凶',
  '火水木': '吉', '火水火': '凶', '火水土': '凶', '火水金': '凶', '火水水': '凶',
  '土木木': '大吉', '土木火': '大吉', '土木土': '凶', '土木金': '凶', '土木水': '吉',
  '土火木': '吉', '土火火': '大吉', '土火土': '大吉', '土火金': '吉', '土火水': '凶',
  '土土木': '大吉', '土土火': '大吉', '土土土': '大吉', '土土金': '吉', '土土水': '大吉',
  '土金木': '凶', '土金火': '凶', '土金土': '吉', '土金金': '凶', '土金水': '凶',
  '土水木': '大吉', '土水火': '吉', '土水土': '吉', '土水金': '大吉', '土水水': '吉',
  '金木木': '凶', '金木火': '凶', '金木土': '吉', '金木金': '凶', '金木水': '凶',
  '金火木': '凶', '金火火': '凶', '金火土': '凶', '金火金': '凶', '金火水': '凶',
  '金土木': '大吉', '金土火': '大吉', '金土土': '大吉', '金土金': '吉', '金土水': '大吉',
  '金金木': '凶', '金金火': '凶', '金金土': '凶', '金金金': '凶', '金金水': '大吉',
  '金水木': '大吉', '金水火': '吉', '金水土': '大吉', '金水金': '大吉', '金水水': '吉',
  '水木木': '大吉', '水木火': '吉', '水木土': '吉', '水木金': '大吉', '水木水': '吉',
  '水火木': '吉', '水火火': '凶', '水火土': '凶', '水火金': '凶', '水火水': '凶',
  '水土木': '大吉', '水土火': '吉', '水土土': '吉', '水土金': '大吉', '水土水': '吉',
  '水金木': '大吉', '水金火': '吉', '水金土': '大吉', '水金金': '大吉', '水金水': '吉',
  '水水木': '吉', '水水火': '凶', '水水土': '吉', '水水金': '吉', '水水水': '凶',
}

// ═══════════════════════════════════════
// 辅助函数
// ═══════════════════════════════════════

function getSurnameStrokes(surname: string): number {
  return SURNAME_STROKES[surname] ?? surname.length * 5 // 未收录姓氏按估算
}

function calculateWuGe(surnameStrokes: number, name1Strokes: number, name2Strokes: number) {
  const heaven = surnameStrokes + 1           // 天格
  const human = surnameStrokes + name1Strokes   // 人格
  const earth = name1Strokes + name2Strokes     // 地格
  const outer = name2Strokes + 1                // 外格
  const total = surnameStrokes + name1Strokes + name2Strokes  // 总格

  return { heaven, human, earth, outer, total }
}

function getSanCaiPattern(heaven: number, human: number, earth: number): string {
  const e1 = numberToElement(heaven)
  const e2 = numberToElement(human)
  const e3 = numberToElement(earth)
  const key = `${e1}${e2}${e3}`
  return SANCAI_LUCK[key] ?? '平'
}

function getShuLi(n: number): string {
  const info = SHULI_MAP[n]
  if (!info) return `${n}数`
  return `${n}数（${info.luck}）${info.meaning}`
}

function getWuGePattern(wg: { heaven: number; human: number; earth: number; outer: number; total: number }): string {
  const parts: string[] = []
  parts.push(`天格${getShuLi(wg.heaven)}`)
  parts.push(`人格${getShuLi(wg.human)}`)
  parts.push(`地格${getShuLi(wg.earth)}`)
  parts.push(`外格${getShuLi(wg.outer)}`)
  parts.push(`总格${getShuLi(wg.total)}`)
  const sanCai = getSanCaiPattern(wg.heaven, wg.human, wg.earth)
  parts.push(`三才配置：${sanCai}`)
  return parts.join('；')
}

// 五格数理评分（0-100）
function scoreWuGe(wg: { heaven: number; human: number; earth: number; outer: number; total: number }): number {
  let score = 0
  const numbers = [wg.heaven, wg.human, wg.earth, wg.outer, wg.total]

  // 每个数理评分
  for (const n of numbers) {
    const info = SHULI_MAP[n]
    if (!info) {
      score += 10
      continue
    }
    if (info.luck === '大吉') score += 20
    else if (info.luck === '吉') score += 17
    else if (info.luck === '半吉') score += 12
    else score += 5
  }

  // 三才配置加分
  const sanCai = getSanCaiPattern(wg.heaven, wg.human, wg.earth)
  if (sanCai === '大吉') score += 10
  else if (sanCai === '吉') score += 5

  // 人格和总格最重要，额外加分
  const humanInfo = SHULI_MAP[wg.human]
  const totalInfo = SHULI_MAP[wg.total]
  if (humanInfo?.luck === '大吉') score += 5
  if (totalInfo?.luck === '大吉') score += 5

  return Math.min(100, score)
}

// 喜用神匹配评分
function scoreXiYongMatch(
  char1: CharInfo,
  char2: CharInfo,
  xiYong: BaZiChart['xiYongShen'],
): { score: number; description: string } {
  let matched = 0
  const matchedElements: FiveElement[] = []

  if (char1.element === xiYong.bestElement) {
    matched++
    matchedElements.push(char1.element)
  }
  if (char2.element === xiYong.bestElement) {
    matched++
    matchedElements.push(char2.element)
  }
  if (char1.element === (xiYong.happiness as unknown as FiveElement) || char2.element === (xiYong.happiness as unknown as FiveElement)) {
    matched += 0.5
  }

  // 忌神扣分
  const avoided = xiYong.avoidedElements || []
  let penalty = 0
  if (avoided.includes(char1.element)) penalty += 0.5
  if (avoided.includes(char2.element)) penalty += 0.5

  const rawScore = (matched / 2.5) * 100 - penalty * 20
  const score = Math.max(0, Math.min(100, Math.round(rawScore)))

  let description: string
  if (matchedElements.length === 2) {
    description = `双字均合喜用神「${xiYong.bestElement}」，五行匹配极佳`
  } else if (matchedElements.length === 1) {
    description = `「${matchedElements[0]}」合喜用神「${xiYong.bestElement}」`
  } else {
    description = `名字五行未直接对应喜用神「${xiYong.bestElement}」`
  }

  return { score, description }
}

// 读音评分（简单模拟：避免同声母/韵母重复）
function scorePronunciation(
  surname: string,
  char1: CharInfo,
  char2: CharInfo,
): number {
  let score = 70

  // 避免三个字声母相同
  const chars = [surname, char1.char, char2.char]
  const pinyinSim: Record<string, string> = {
    '王': 'w', '李': 'l', '张': 'zh', '刘': 'l', '陈': 'ch', '杨': 'y', '黄': 'h',
    '赵': 'zh', '吴': 'w', '周': 'zh', '徐': 'x', '孙': 's', '马': 'm', '朱': 'zh',
    '胡': 'h', '郭': 'g', '何': 'h', '林': 'l', '罗': 'l', '高': 'g', '郑': 'zh',
  }

  const initials = chars.map(c => pinyinSim[c] ?? c[0])
  const uniqueInitials = new Set(initials)
  if (uniqueInitials.size === 3) score += 15
  else if (uniqueInitials.size === 2) score += 8

  // 避免与姓氏同字
  if (char1.char === surname || char2.char === surname) score -= 30

  // 避免两个字相同
  if (char1.char === char2.char) score -= 20

  return Math.max(0, Math.min(100, score))
}

// 寓意评分
function scoreMeaning(char1: CharInfo, char2: CharInfo): number {
  let score = 60
  if (char1.meaning.length > 5 && char2.meaning.length > 5) score += 10
  if (char1.gender !== 'neutral' && char2.gender !== 'neutral') {
    if (char1.gender === char2.gender) score += 10
  }
  return Math.min(100, score)
}

// ═══════════════════════════════════════
// 主函数
// ═══════════════════════════════════════

/**
 * 宝宝起名辅助 — 基于八字喜用神与三才五格的综合起名推荐
 * @param input 起名输入（宝宝命盘、姓氏、性别、风格）
 * @returns 起名推荐结果（Top 20 + 八字用神分析）
 */
export function recommendNames(input: NameRecommendInput): NameRecommendResult {
  const { chart, surname, gender, style } = input
  const xiYong = chart.xiYongShen
  const surnameStrokes = getSurnameStrokes(surname)

  // 1. 确定喜用神五行
  const xiElement = xiYong.bestElement
  const allXiElements: FiveElement[] = [xiElement]
  const avoidElements = xiYong.avoidedElements || []

  // 喜神也可以用
  if (xiYong.happiness && !allXiElements.includes(xiYong.happiness as unknown as FiveElement)) {
    allXiElements.push(xiYong.happiness as unknown as FiveElement)
  }

  // 2. 筛选候选字
  const targetStyle = style ?? 'traditional'
  const targetGender = gender ?? 'male'

  // 优先选喜用神五行的字
  const xiChars = ALL_CHARS.filter(c => {
    if (!allXiElements.includes(c.element)) return false
    // 性别筛选（宽松模式）
    if (targetGender === 'male' && c.gender === 'female') return false
    if (targetGender === 'female' && c.gender === 'male') return false
    // 风格筛选
    if (!c.style.includes(targetStyle)) return false
    // 排除忌神
    if (avoidElements.includes(c.element)) return false
    return true
  })

  // 补充字库（如果喜用神字不够）
  const fallbackChars = ALL_CHARS.filter(c => {
    if (allXiElements.includes(c.element)) return false
    if (avoidElements.includes(c.element)) return true
    if (targetGender === 'male' && c.gender === 'female') return false
    if (targetGender === 'female' && c.gender === 'male') return false
    return c.style.includes(targetStyle)
  })

  const candidateChars = [...xiChars, ...fallbackChars]

  // 3. 组合名字并评分
  const suggestions: NameSuggestion[] = []

  // 限制组合数量避免性能问题
  const maxCombinations = 5000
  let combinationCount = 0

  for (let i = 0; i < candidateChars.length && combinationCount < maxCombinations; i++) {
    for (let j = 0; j < candidateChars.length && combinationCount < maxCombinations; j++) {
      if (i === j) continue
      const c1 = candidateChars[i]
      const c2 = candidateChars[j]
      const givenName = c1.char + c2.char

      // 计算五格
      const wg = calculateWuGe(surnameStrokes, c1.kxStrokes, c2.kxStrokes)

      // 各维度评分
      const xiYongScore = scoreXiYongMatch(c1, c2, xiYong)
      const wugeScore = scoreWuGe(wg)
      const pronScore = scorePronunciation(surname, c1, c2)
      const meaningScore = scoreMeaning(c1, c2)

      // 加权综合评分：喜用神40% + 三才五格30% + 寓意20% + 读音10%
      const totalScore = Math.round(
        xiYongScore.score * 0.40 +
        wugeScore * 0.30 +
        meaningScore * 0.20 +
        pronScore * 0.10
      )

      suggestions.push({
        fullName: surname + givenName,
        givenName,
        strokes: {
          total: wg.total,
          heaven: wg.heaven,
          earth: wg.earth,
          human: wg.human,
        },
        fiveElementMatch: xiYongScore.description,
        meaning: `「${c1.char}」${c1.meaning}；「${c2.char}」${c2.meaning}`,
        wuge: {
          heaven: wg.heaven,
          earth: wg.earth,
          human: wg.human,
          outer: wg.outer,
          total: wg.total,
          pattern: getWuGePattern(wg),
        },
        score: totalScore,
      })

      combinationCount++
    }
  }

  // 4. 排序取 Top 20
  suggestions.sort((a, b) => b.score - a.score)
  const top20 = suggestions.slice(0, 20)

  // 5. 生成八字用神分析
  const dayGan = chart.sixLines.day.gan
  const dayElement = chart.dayMaster.dayGanElement
  const analysis = generateXiYongAnalysis(chart, dayGan, dayElement, xiYong)

  return {
    suggestions: top20,
    analysis,
  }
}

function generateXiYongAnalysis(
  chart: BaZiChart,
  dayGan: string,
  dayElement: FiveElement,
  xiYong: BaZiChart['xiYongShen'],
): string {
  const fe = chart.fiveElementCount
  const lackings: string[] = []
  for (const e of ['木', '火', '土', '金', '水'] as const) {
    if (fe[e] <= 1) lackings.push(e)
  }

  let analysis = `宝宝日主为「${dayGan}」属${dayElement}，`
  analysis += `日主旺衰为「${chart.dayMaster.wangShuai}」，力量评分${chart.dayMaster.strengthScore}分。`
  analysis += `命盘五行分布：木${fe['木']}、火${fe['火']}、土${fe['土']}、金${fe['金']}、水${fe['水']}。`

  if (lackings.length > 0) {
    analysis += `命盘缺${lackings.join('、')}五行，`
  }

  analysis += `经分析，喜用神为「${xiYong.bestElement}」，`
  if (xiYong.avoidedElements && xiYong.avoidedElements.length > 0) {
    analysis += `忌神为「${xiYong.avoidedElements.join('、')}」。`
  }

  analysis += `起名时应优先选择五行属「${xiYong.bestElement}」的字，`
  analysis += `以补益命局，助旺运势。同时参考三才五格数理吉凶，`
  analysis += `确保名字在五行与数理两个层面均吉利。`

  return analysis
}