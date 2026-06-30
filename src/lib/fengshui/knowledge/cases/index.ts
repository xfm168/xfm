/**
 * 案例知识库
 * 
 * 常见风水案例，用于AI匹配和参考
 */

import type { FengShuiCase, FengShuiSchool, KnowledgeCategory } from '../types'

export const FENGSHUI_CASES: FengShuiCase[] = [
  // ===== 煞气类 =====
  {
    id: 'case-chuan-tang-sha',
    title: '穿堂煞',
    category: 'wealth',
    type: 'sha',
    description: '大门正对阳台或窗户，形成气流直冲，财来财去不留',
    characteristics: [
      '大门正对阳台',
      '大门正对窗户',
      '前后直通无遮挡',
      '气流直来直去',
    ],
    effects: [
      '财运不稳，财来财去',
      '事业反复，难以积累',
      '家人容易心浮气躁',
    ],
    solutions: [
      '设置屏风或玄关柜遮挡',
      '摆放高大绿植缓冲气流',
      '安装珠帘或布帘',
      '在阳台放置储物柜或置物架',
    ],
    references: [
      {
        entryId: 'yzsy-002',
        bookId: 'yangzhai-sanyao',
        quote: '前门对后窗，财来财去一场空。',
      },
    ],
    relatedRules: ['practical-chuan-tang'],
    severity: 'moderate',
    visualFeatures: [
      '大门直通阳台',
      '大门正对窗户',
      '前后无遮挡',
    ],
    confidence: 90,
    verified: true,
  },
  {
    id: 'case-lu-chong',
    title: '路冲煞',
    category: 'wealth',
    type: 'sha',
    description: '大门正对道路，形成直冲之气',
    characteristics: [
      '大门正对马路',
      '道路直通门前',
      '车辆直冲而来',
    ],
    effects: [
      '财运大起大落',
      '易有意外灾祸',
      '健康受损',
      '口舌是非多',
    ],
    solutions: [
      '设置围墙或栅栏',
      '门前种植绿植挡煞',
      '悬挂凸镜反射',
      '设置屏风遮挡',
    ],
    references: [
      {
        entryId: 'yzdc-001',
        bookId: 'yangzhai-dacheng',
        quote: '路冲为硬煞，主凶祸，需以屏风、绿植挡之。',
      },
    ],
    relatedRules: ['practical-lu-chong'],
    severity: 'severe',
    visualFeatures: [
      '门前道路直冲',
      '门对路口',
      'T字路口',
    ],
    confidence: 88,
    verified: true,
  },
  {
    id: 'case-liang-ya',
    title: '横梁压顶',
    category: 'health',
    type: 'sha',
    description: '横梁压在床、书桌或沙发上方',
    characteristics: [
      '床上方有横梁',
      '书桌上方有横梁',
      '沙发上方有横梁',
      '人常坐位置上方有梁',
    ],
    effects: [
      '精神压力大',
      '睡眠质量差',
      '易有头痛、肩颈问题',
      '事业受阻，压力大',
    ],
    solutions: [
      '吊顶遮挡横梁',
      '安装假天花',
      '调整床或沙发位置避开横梁',
      '在梁下悬挂葫芦或五帝钱',
      '梁下安装向上照射的灯',
    ],
    references: [
      {
        entryId: 'wgyz-001',
        bookId: 'wanggong-yangzhai',
        quote: '梁压床，人不安，主疾病缠绵。',
      },
    ],
    relatedRules: ['practical-beam-press'],
    severity: 'moderate',
    visualFeatures: [
      '天花板有横梁',
      '床在梁下',
      '书桌在梁下',
    ],
    confidence: 92,
    verified: true,
  },
  {
    id: 'case-kai-men-jian-zao',
    title: '开门见灶',
    category: 'wealth',
    type: 'sha',
    description: '进门就看见厨房灶台',
    characteristics: [
      '大门正对厨房门',
      '进门就能看见灶台',
      '灶台与大门相冲',
    ],
    effects: [
      '财运不利，钱财难聚',
      '家人易有口舌是非',
      '女主人健康受影响',
    ],
    solutions: [
      '设置屏风遮挡',
      '安装厨房门帘',
      '调整灶台位置',
      '厨房门常关',
    ],
    references: [
      {
        entryId: 'yzsy-004',
        bookId: 'yangzhai-sanyao',
        quote: '开门见灶，钱财多耗。',
      },
    ],
    relatedRules: ['practical-open-stove'],
    severity: 'mild',
    visualFeatures: [
      '大门正对厨房',
      '进门见灶台',
    ],
    confidence: 85,
    verified: true,
  },
  {
    id: 'case-ce-zhong-gong',
    title: '厕压中宫',
    category: 'health',
    type: 'sha',
    description: '卫生间位于房屋中心位置',
    characteristics: [
      '卫生间在房屋正中',
      '中宫位置是卫生间',
    ],
    effects: [
      '健康受损，易有腹疾',
      '宅运不稳',
      '污秽之气弥漫',
      '财运受阻',
    ],
    solutions: [
      '保持卫生间清洁干爽',
      '马桶盖常关闭',
      '安装强力排气扇',
      '摆放绿植净化空气',
      '使用香薰或精油',
    ],
    references: [
      {
        entryId: 'yzss-003',
        bookId: 'yangzhai-shishu',
        quote: '中宫为宅之心脏，卫生间居之，主心腹之疾。',
      },
    ],
    relatedRules: ['practical-toilet-center'],
    severity: 'severe',
    visualFeatures: [
      '卫生间在房屋中间',
    ],
    confidence: 88,
    verified: true,
  },
  {
    id: 'case-jing-zi-dui-men',
    title: '镜子对门',
    category: 'wealth',
    type: 'sha',
    description: '镜子正对大门或房门',
    characteristics: [
      '镜子正对大门',
      '镜子正对房门',
      '镜子反射门口',
    ],
    effects: [
      '财气被反射出去',
      '易有噩梦',
      '精神不安',
    ],
    solutions: [
      '调整镜子位置',
      '用布帘遮挡镜子',
      '移除门口的镜子',
    ],
    references: [],
    relatedRules: [],
    severity: 'mild',
    visualFeatures: [
      '门口有镜子',
      '镜子正对门',
    ],
    confidence: 75,
    verified: true,
  },
  {
    id: 'case-chuang-dui-men',
    title: '床对门',
    category: 'health',
    type: 'sha',
    description: '床正对房门',
    characteristics: [
      '床头正对门口',
      '床脚正对门口',
      '进门就能看见整张床',
    ],
    effects: [
      '睡眠质量差',
      '缺乏安全感',
      '易受惊吓',
      '健康受损',
    ],
    solutions: [
      '调整床的位置',
      '设置屏风遮挡',
      '安装门帘',
    ],
    references: [],
    relatedRules: [],
    severity: 'mild',
    visualFeatures: [
      '床正对门',
      '进门见床',
    ],
    confidence: 80,
    verified: true,
  },
  {
    id: 'case-fan-gong',
    title: '反弓煞',
    category: 'wealth',
    type: 'sha',
    description: '道路或河流呈弓形向外弯，如弓背对准住宅',
    characteristics: [
      '门前道路呈反弓形',
      '河流弯弓向外',
      '弧形道路弓背朝向住宅',
    ],
    effects: [
      '财运反复，财来财去',
      '易有口舌是非',
      '家人容易离心离德',
    ],
    solutions: [
      '种植绿植缓冲',
      '设置围墙遮挡',
      '悬挂八卦镜',
      '摆放石敢当',
    ],
    references: [],
    relatedRules: [],
    severity: 'moderate',
    visualFeatures: [
      '道路呈弧形',
      '弓背朝向住宅',
    ],
    confidence: 82,
    verified: true,
  },
  {
    id: 'case-qiang-sha',
    title: '枪煞',
    category: 'health',
    type: 'sha',
    description: '长直走廊或巷道直冲住宅，如枪杆对准',
    characteristics: [
      '长走廊直冲大门',
      '巷道正对房门',
      '长直通道直冲',
    ],
    effects: [
      '易有意外血光之灾',
      '健康受损，易生急症',
      '财运大起大落',
    ],
    solutions: [
      '设置屏风遮挡',
      '安装门帘',
      '摆放绿植缓冲',
      '悬挂珠帘',
    ],
    references: [],
    relatedRules: [],
    severity: 'severe',
    visualFeatures: [
      '长直走廊',
      '直冲大门',
    ],
    confidence: 85,
    verified: true,
  },
  {
    id: 'case-que-jiao',
    title: '缺角',
    category: 'wealth',
    type: 'sha',
    description: '户型某一方位有明显缺角，对应宫位受损',
    characteristics: [
      '户型不方正',
      '某方位向内凹陷',
      '缺角超过总面积1/9',
    ],
    effects: [
      '对应方位家人运势受损',
      '宅气不稳',
      '事业有缺',
    ],
    solutions: [
      '缺角处放置泰山石敢当',
      '摆放高大绿植补角',
      '安装镜子延伸视觉',
      '用灯光照亮缺角区域',
    ],
    references: [
      {
        entryId: 'yzss-002',
        bookId: 'yangzhai-shishu',
        quote: '凡阳宅贵乎方正，缺则有损。',
      },
    ],
    relatedRules: [],
    severity: 'moderate',
    visualFeatures: [
      '户型缺角',
      '房屋不方正',
    ],
    confidence: 88,
    verified: true,
  },
  {
    id: 'case-dianti-chong-men',
    title: '电梯冲门',
    category: 'wealth',
    type: 'sha',
    description: '电梯门正对住宅大门，一开一合形成冲煞',
    characteristics: [
      '大门正对电梯门',
      '电梯门与家门相对',
      '出门就是电梯',
    ],
    effects: [
      '财运不稳，财来财去',
      '家人健康起伏',
      '隐私感差，心神不宁',
    ],
    solutions: [
      '设置玄关屏风',
      '安装门帘',
      '门口摆放绿植',
      '悬挂五帝钱',
    ],
    references: [],
    relatedRules: [],
    severity: 'moderate',
    visualFeatures: [
      '电梯正对大门',
      '门对电梯',
    ],
    confidence: 80,
    verified: true,
  },
  {
    id: 'case-jingzi-dui-chuang',
    title: '镜子对床',
    category: 'health',
    type: 'sha',
    description: '镜子正对床铺，夜半容易惊吓',
    characteristics: [
      '床尾有镜子',
      '镜子正对床头',
      '半夜起夜能见镜中影',
    ],
    effects: [
      '睡眠质量差，易做噩梦',
      '精神恍惚，心神不宁',
      '夫妻感情易生隔阂',
    ],
    solutions: [
      '调整镜子位置',
      '用布帘遮盖镜子',
      '移除卧室镜子',
      '把镜子装在衣柜门内',
    ],
    references: [],
    relatedRules: [],
    severity: 'mild',
    visualFeatures: [
      '镜子对着床',
      '卧室有大镜子',
    ],
    confidence: 82,
    verified: true,
  },
  
  // ===== 吉格类 =====
  {
    id: 'case-ming-tang',
    title: '明堂开阔',
    category: 'wealth',
    type: 'auspicious',
    description: '宅前空间开阔明亮，为聚财之象',
    characteristics: [
      '门前有开阔空间',
      '客厅宽敞明亮',
      '阳台视野开阔',
    ],
    effects: [
      '财运亨通',
      '事业顺利',
      '心胸开阔',
      '贵人相助',
    ],
    solutions: [],
    references: [
      {
        entryId: 'yzss-001',
        bookId: 'yangzhai-shishu',
        quote: '凡阳宅前有明堂，后有靠山，左有青龙，右有白虎，为上吉之宅。',
      },
    ],
    relatedRules: ['classical-ming-tang'],
    severity: 'mild',
    visualFeatures: [
      '门前开阔',
      '客厅宽敞',
    ],
    confidence: 90,
    verified: true,
  },
  {
    id: 'case-zuo-bei-chao-nan',
    title: '坐北朝南',
    category: 'health',
    type: 'auspicious',
    description: '住宅坐北朝南，向阳而居',
    characteristics: [
      '大门朝南',
      '主要窗户朝南',
      '客厅南向',
    ],
    effects: [
      '阳光充足，健康良好',
      '冬暖夏凉，居住舒适',
      '运势平稳',
      '家庭和睦',
    ],
    solutions: [],
    references: [
      {
        entryId: 'hzj-002',
        bookId: 'huangdi-zhaijing',
        quote: '凡阳宅坐北朝南，取其向明，阳气充足，宅运亨通。',
      },
    ],
    relatedRules: ['classical-south-facing'],
    severity: 'mild',
    visualFeatures: [
      '南向住宅',
      '朝南阳台',
    ],
    confidence: 95,
    verified: true,
  },
  {
    id: 'case-hu-xing-fang-zheng',
    title: '户型方正',
    category: 'wealth',
    type: 'auspicious',
    description: '住宅户型方方正正，气场稳定',
    characteristics: [
      '户型呈正方形或长方形',
      '无明显缺角',
      '空间规整',
    ],
    effects: [
      '宅运平稳',
      '家庭和睦',
      '事业稳定',
      '财运顺遂',
    ],
    solutions: [],
    references: [
      {
        entryId: 'yzss-001',
        bookId: 'yangzhai-shishu',
        quote: '凡阳宅贵乎方正。',
      },
    ],
    relatedRules: ['classical-cang-feng'],
    severity: 'mild',
    visualFeatures: [
      '方正户型',
      '无缺角',
    ],
    confidence: 90,
    verified: true,
  },
]

// ============ 工具函数 ============

export function getCaseById(id: string): FengShuiCase | undefined {
  return FENGSHUI_CASES.find(c => c.id === id)
}

export function getCasesByType(type: FengShuiCase['type']): FengShuiCase[] {
  return FENGSHUI_CASES.filter(c => c.type === type)
}

export function getCasesByCategory(category: KnowledgeCategory): FengShuiCase[] {
  return FENGSHUI_CASES.filter(c => c.category === category)
}

export function getCasesBySeverity(severity: FengShuiCase['severity']): FengShuiCase[] {
  return FENGSHUI_CASES.filter(c => c.severity === severity)
}

export function searchCases(keyword: string): FengShuiCase[] {
  const kw = keyword.toLowerCase()
  return FENGSHUI_CASES.filter(c => 
    c.title.toLowerCase().includes(kw) ||
    c.description.toLowerCase().includes(kw) ||
    c.characteristics.some(ch => ch.toLowerCase().includes(kw)) ||
    c.effects.some(e => e.toLowerCase().includes(kw)) ||
    c.relatedRules.some(r => r.toLowerCase().includes(kw))
  )
}

export function matchCasesByFeatures(features: string[]): FengShuiCase[] {
  const scored = FENGSHUI_CASES.map(c => {
    let score = 0
    for (const f of features) {
      if (c.visualFeatures?.some(vf => vf.includes(f))) score += 2
      if (c.characteristics.some(ch => ch.includes(f))) score += 3
    }
    return { case: c, score }
  })
  
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.case)
}
