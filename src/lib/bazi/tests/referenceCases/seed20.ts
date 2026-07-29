import type { ReferenceCase } from './types'

export const REFERENCE_CASES_SEED: ReferenceCase[] = [
  // seed-001: 1900-01-01 边界（甲子年附近）
  {
    birth: {
      id: 'seed-001',
      source: '寿星万年历(待复核)',
      gender: 'male',
      dateStr: '1900-01-01',
      timeStr: '12:00',
      timezone: 'Asia/Shanghai',
      timezoneOffsetMin: 480,
      longitude: 116.4074,
      latitude: 39.9042,
      useTrueSolarTime: true,
      locationLabel: '中国北京',
    },
    expect: {
      fourPillars: {
        year: { gan: '己', zhi: '亥', ganZhi: '己亥' },
        month: { gan: '丙', zhi: '子', ganZhi: '丙子' },
        day: { gan: '庚', zhi: '寅', ganZhi: '庚寅' },
      },
      leapMonth: false,
    },
    tags: ['边界年份', '1900', '甲子年附近'],
    notes: [
      '1900-01-01 为公历年初边界，接近 1900 庚子年（但 1900 立春前仍属 1899 己亥）',
      '预期值由 calculator 自动生成，需后续与寿星万年历复核',
    ],
  },

  // seed-002: 2100-12-31 边界
  {
    birth: {
      id: 'seed-002',
      source: '寿星万年历(待复核)',
      gender: 'male',
      dateStr: '2100-12-31',
      timeStr: '12:00',
      timezone: 'Asia/Shanghai',
      timezoneOffsetMin: 480,
      longitude: 116.4074,
      latitude: 39.9042,
      useTrueSolarTime: true,
      locationLabel: '中国北京',
    },
    expect: {
      fourPillars: {
        year: { gan: '庚', zhi: '申', ganZhi: '庚申' },
        month: { gan: '戊', zhi: '子', ganZhi: '戊子' },
        day: { gan: '甲', zhi: '辰', ganZhi: '甲辰' },
      },
      leapMonth: false,
    },
    tags: ['边界年份', '2100'],
    notes: [
      '2100-12-31 为公历年尾边界，2101 立春前仍属 2100 庚申',
      '预期值由 calculator 自动生成，需后续与寿星万年历复核',
    ],
  },

  // seed-003: 2024-02-04 立春前（交接日）
  {
    birth: {
      id: 'seed-003',
      source: '问真八字(待复核)',
      gender: 'male',
      dateStr: '2024-02-04',
      timeStr: '00:00',
      timezone: 'Asia/Shanghai',
      timezoneOffsetMin: 480,
      longitude: 116.4074,
      latitude: 39.9042,
      useTrueSolarTime: true,
      locationLabel: '中国北京',
    },
    expect: {
      fourPillars: {
        year: { gan: '癸', zhi: '卯', ganZhi: '癸卯' },
        month: { gan: '甲', zhi: '寅', ganZhi: '甲寅' },
        day: { gan: '戊', zhi: '戌', ganZhi: '戊戌' },
      },
      solarTermName: '立春',
      leapMonth: false,
    },
    tags: ['立春', '节气交接', '癸卯年', '2024'],
    notes: [
      '2024-02-04 00:00 在立春时刻前（2024 立春约 16:26），年柱应为癸卯',
      '预期值由 calculator 自动生成，需后续与问真八字/子平八字Pro复核',
    ],
  },

  // seed-004: 2024-02-04 立春后（交接日）
  {
    birth: {
      id: 'seed-004',
      source: '问真八字(待复核)',
      gender: 'male',
      dateStr: '2024-02-04',
      timeStr: '20:00',
      timezone: 'Asia/Shanghai',
      timezoneOffsetMin: 480,
      longitude: 116.4074,
      latitude: 39.9042,
      useTrueSolarTime: true,
      locationLabel: '中国北京',
    },
    expect: {
      fourPillars: {
        year: { gan: '甲', zhi: '辰', ganZhi: '甲辰' },
        month: { gan: '丙', zhi: '寅', ganZhi: '丙寅' },
        day: { gan: '戊', zhi: '戌', ganZhi: '戊戌' },
      },
      solarTermName: '立春',
      leapMonth: false,
    },
    tags: ['立春', '节气交接', '甲辰年', '2024'],
    notes: [
      '2024-02-04 20:00 在立春时刻后（2024 立春约 16:26），年柱应为甲辰',
      '预期值由 calculator 自动生成，需后续与问真八字复核',
    ],
  },

  // seed-005: 2023-02-04 立春
  {
    birth: {
      id: 'seed-005',
      source: '问真八字(待复核)',
      gender: 'male',
      dateStr: '2023-02-04',
      timeStr: '12:00',
      timezone: 'Asia/Shanghai',
      timezoneOffsetMin: 480,
      longitude: 116.4074,
      latitude: 39.9042,
      useTrueSolarTime: true,
      locationLabel: '中国北京',
    },
    expect: {
      fourPillars: {
        year: { gan: '癸', zhi: '卯', ganZhi: '癸卯' },
        month: { gan: '甲', zhi: '寅', ganZhi: '甲寅' },
        day: { gan: '癸', zhi: '巳', ganZhi: '癸巳' },
      },
      solarTermName: '立春',
      leapMonth: false,
    },
    tags: ['立春', '2023', '癸卯年'],
    notes: ['预期值由 calculator 自动生成，需后续与专业排盘软件复核'],
  },

  // seed-006: 2020-02-04 立春
  {
    birth: {
      id: 'seed-006',
      source: '问真八字(待复核)',
      gender: 'male',
      dateStr: '2020-02-04',
      timeStr: '12:00',
      timezone: 'Asia/Shanghai',
      timezoneOffsetMin: 480,
      longitude: 116.4074,
      latitude: 39.9042,
      useTrueSolarTime: true,
      locationLabel: '中国北京',
    },
    expect: {
      fourPillars: {
        year: { gan: '庚', zhi: '子', ganZhi: '庚子' },
        month: { gan: '戊', zhi: '寅', ganZhi: '戊寅' },
        day: { gan: '丁', zhi: '酉', ganZhi: '丁酉' },
      },
      solarTermName: '立春',
      leapMonth: false,
    },
    tags: ['立春', '2020', '庚子年'],
    notes: ['预期值由 calculator 自动生成，需后续与专业排盘软件复核'],
  },

  // seed-007: 2024-06-21 夏至节气日
  {
    birth: {
      id: 'seed-007',
      source: '寿星万年历(待复核)',
      gender: 'male',
      dateStr: '2024-06-21',
      timeStr: '12:00',
      timezone: 'Asia/Shanghai',
      timezoneOffsetMin: 480,
      longitude: 116.4074,
      latitude: 39.9042,
      useTrueSolarTime: true,
      locationLabel: '中国北京',
    },
    expect: {
      fourPillars: {
        year: { gan: '甲', zhi: '辰', ganZhi: '甲辰' },
        month: { gan: '庚', zhi: '午', ganZhi: '庚午' },
        day: { gan: '甲', zhi: '辰', ganZhi: '甲辰' },
      },
      solarTermName: '夏至',
      leapMonth: false,
    },
    tags: ['夏至', '节气日', '2024'],
    notes: ['2024-06-21 为夏至节气日，solarTermName 应为 夏至', '预期值由 calculator 自动生成'],
  },

  // seed-008: 2024-03-20 春分
  {
    birth: {
      id: 'seed-008',
      source: '寿星万年历(待复核)',
      gender: 'male',
      dateStr: '2024-03-20',
      timeStr: '12:00',
      timezone: 'Asia/Shanghai',
      timezoneOffsetMin: 480,
      longitude: 116.4074,
      latitude: 39.9042,
      useTrueSolarTime: true,
      locationLabel: '中国北京',
    },
    expect: {
      fourPillars: {
        year: { gan: '甲', zhi: '辰', ganZhi: '甲辰' },
        month: { gan: '戊', zhi: '卯', ganZhi: '丁卯' },
        day: { gan: '癸', zhi: '卯', ganZhi: '癸卯' },
      },
      solarTermName: '春分',
      leapMonth: false,
    },
    tags: ['春分', '节气日', '2024'],
    notes: ['2024-03-20 为春分节气日', '预期值由 calculator 自动生成'],
  },

  // seed-009: 2023-04-20 闰二月（农历闰月）
  {
    birth: {
      id: 'seed-009',
      source: '寿星万年历(待复核)',
      gender: 'male',
      dateStr: '2023-04-20',
      timeStr: '12:00',
      timezone: 'Asia/Shanghai',
      timezoneOffsetMin: 480,
      longitude: 116.4074,
      latitude: 39.9042,
      useTrueSolarTime: true,
      locationLabel: '中国北京',
    },
    expect: {
      fourPillars: {
        year: { gan: '癸', zhi: '卯', ganZhi: '癸卯' },
        month: { gan: '丙', zhi: '辰', ganZhi: '丙辰' },
        day: { gan: '癸', zhi: '酉', ganZhi: '癸酉' },
      },
      leapMonth: true,
    },
    tags: ['闰月', '闰二月', '2023', '农历'],
    notes: ['2023-04-20 对应农历闰二月（癸卯年闰二月），lunar.leap 应为 true'],
  },

  // seed-010: 2020-05-23 闰四月
  {
    birth: {
      id: 'seed-010',
      source: '寿星万年历(待复核)',
      gender: 'male',
      dateStr: '2020-05-23',
      timeStr: '12:00',
      timezone: 'Asia/Shanghai',
      timezoneOffsetMin: 480,
      longitude: 116.4074,
      latitude: 39.9042,
      useTrueSolarTime: true,
      locationLabel: '中国北京',
    },
    expect: {
      fourPillars: {
        year: { gan: '庚', zhi: '子', ganZhi: '庚子' },
        month: { gan: '壬', zhi: '午', ganZhi: '壬午' },
        day: { gan: '丙', zhi: '申', ganZhi: '丙申' },
      },
      leapMonth: true,
    },
    tags: ['闰月', '闰四月', '2020', '农历'],
    notes: ['2020-05-23 对应农历闰四月，lunar.leap 应为 true'],
  },

  // seed-011: 2017-07-23 闰六月
  {
    birth: {
      id: 'seed-011',
      source: '寿星万年历(待复核)',
      gender: 'male',
      dateStr: '2017-07-23',
      timeStr: '12:00',
      timezone: 'Asia/Shanghai',
      timezoneOffsetMin: 480,
      longitude: 116.4074,
      latitude: 39.9042,
      useTrueSolarTime: true,
      locationLabel: '中国北京',
    },
    expect: {
      fourPillars: {
        year: { gan: '丁', zhi: '酉', ganZhi: '丁酉' },
        month: { gan: '戊', zhi: '未', ganZhi: '丁未' },
        day: { gan: '辛', zhi: '亥', ganZhi: '辛亥' },
      },
      leapMonth: true,
    },
    tags: ['闰月', '闰六月', '2017', '农历'],
    notes: ['2017-07-23 对应农历闰六月，lunar.leap 应为 true'],
  },

  // seed-012: 子时晚子 23:05（1990-05-15 23:05）
  {
    birth: {
      id: 'seed-012',
      source: '问真八字(待复核)',
      gender: 'male',
      dateStr: '1990-05-15',
      timeStr: '23:05',
      timezone: 'Asia/Shanghai',
      timezoneOffsetMin: 480,
      longitude: 116.4074,
      latitude: 39.9042,
      useTrueSolarTime: true,
      ziHourStrategy: 'late',
      locationLabel: '中国北京',
    },
    expect: {
      fourPillars: {
        year: { gan: '庚', zhi: '午', ganZhi: '庚午' },
        month: { gan: '辛', zhi: '巳', ganZhi: '辛巳' },
        day: { gan: '丙', zhi: '辰', ganZhi: '丙辰' },
      },
      leapMonth: false,
    },
    tags: ['子时', '晚子时', '子时换日', '1990'],
    notes: [
      '1990-05-15 23:05 晚子时（23:00 后），晚子时策略应换日到 5-16',
      '日柱应 = 5-16 日干支（晚子时换日）',
      '预期值由 calculator 自动生成，需后续与专业排盘软件复核',
    ],
  },

  // seed-013: 子时早子 00:05（1990-05-16 00:05）
  {
    birth: {
      id: 'seed-013',
      source: '问真八字(待复核)',
      gender: 'male',
      dateStr: '1990-05-16',
      timeStr: '00:05',
      timezone: 'Asia/Shanghai',
      timezoneOffsetMin: 480,
      longitude: 116.4074,
      latitude: 39.9042,
      useTrueSolarTime: true,
      ziHourStrategy: 'late',
      locationLabel: '中国北京',
    },
    expect: {
      fourPillars: {
        year: { gan: '庚', zhi: '午', ganZhi: '庚午' },
        month: { gan: '辛', zhi: '巳', ganZhi: '辛巳' },
        day: { gan: '丙', zhi: '辰', ganZhi: '丙辰' },
      },
      leapMonth: false,
    },
    tags: ['子时', '早子时', '1990'],
    notes: [
      '1990-05-16 00:05 早子时，两种策略日柱都应 = 5-16 日干支',
      '预期值由 calculator 自动生成',
    ],
  },

  // seed-014: 新疆乌鲁木齐（经度 87.6168）
  {
    birth: {
      id: 'seed-014',
      source: '问真八字(待复核)',
      gender: 'male',
      dateStr: '2024-06-21',
      timeStr: '12:00',
      timezone: 'Asia/Shanghai',
      timezoneOffsetMin: 480,
      longitude: 87.6168,
      latitude: 43.8256,
      useTrueSolarTime: true,
      locationLabel: '新疆乌鲁木齐',
    },
    expect: {
      fourPillars: {
        year: { gan: '甲', zhi: '辰', ganZhi: '甲辰' },
        month: { gan: '庚', zhi: '午', ganZhi: '庚午' },
        day: { gan: '甲', zhi: '辰', ganZhi: '甲辰' },
      },
      solarTermName: '夏至',
      leapMonth: false,
    },
    tags: ['新疆', '乌鲁木齐', '真太阳时', '高经度差'],
    notes: [
      '乌鲁木齐经度 87.6168°，标准经 120°，经度校正 = (87.6168-120)×4 ≈ -129.53 分钟',
      '真太阳时比北京时间晚约 2 小时，12:00 真太阳时约 09:50',
      '预期值由 calculator 自动生成',
    ],
  },

  // seed-015: 西藏拉萨（经度 91.1322）
  {
    birth: {
      id: 'seed-015',
      source: '问真八字(待复核)',
      gender: 'male',
      dateStr: '2024-06-21',
      timeStr: '12:00',
      timezone: 'Asia/Shanghai',
      timezoneOffsetMin: 480,
      longitude: 91.1322,
      latitude: 29.66,
      useTrueSolarTime: true,
      locationLabel: '西藏拉萨',
    },
    expect: {
      fourPillars: {
        year: { gan: '甲', zhi: '辰', ganZhi: '甲辰' },
        month: { gan: '庚', zhi: '午', ganZhi: '庚午' },
        day: { gan: '甲', zhi: '辰', ganZhi: '甲辰' },
      },
      solarTermName: '夏至',
      leapMonth: false,
    },
    tags: ['西藏', '拉萨', '真太阳时', '高经度差'],
    notes: [
      '拉萨经度 91.1322°，经度校正 = (91.1322-120)×4 ≈ -115.47 分钟',
      '预期值由 calculator 自动生成',
    ],
  },

  // seed-016: 日本东京（139.6917，标准经 135°）
  {
    birth: {
      id: 'seed-016',
      source: '子平八字Pro(待复核)',
      gender: 'male',
      dateStr: '2024-06-21',
      timeStr: '12:00',
      timezone: 'Asia/Tokyo',
      timezoneOffsetMin: 540,
      longitude: 139.6917,
      latitude: 35.6895,
      useTrueSolarTime: true,
      locationLabel: '日本东京',
    },
    expect: {
      fourPillars: {
        year: { gan: '甲', zhi: '辰', ganZhi: '甲辰' },
        month: { gan: '庚', zhi: '午', ganZhi: '庚午' },
        day: { gan: '甲', zhi: '辰', ganZhi: '甲辰' },
      },
      solarTermName: '夏至',
      leapMonth: false,
    },
    tags: ['海外', '日本', '东京', 'UTC+9', '真太阳时'],
    notes: [
      '东京时区 UTC+9，标准经度 135°，东京实际经度 139.6917°',
      '经度校正 = (139.6917-135)×4 ≈ +18.77 分钟，真太阳时比钟表时间晚约 18 分钟',
    ],
  },

  // seed-017: 美国纽约（-73.9857，西五区，非夏令）
  {
    birth: {
      id: 'seed-017',
      source: '子平八字Pro(待复核)',
      gender: 'male',
      dateStr: '2024-06-21',
      timeStr: '12:00',
      timezone: 'America/New_York',
      timezoneOffsetMin: -300,
      longitude: -73.9857,
      latitude: 40.7484,
      useTrueSolarTime: true,
      locationLabel: '美国纽约',
    },
    expect: {
      fourPillars: {
        year: { gan: '甲', zhi: '辰', ganZhi: '甲辰' },
        month: { gan: '庚', zhi: '午', ganZhi: '庚午' },
        day: { gan: '甲', zhi: '辰', ganZhi: '甲辰' },
      },
      leapMonth: false,
    },
    tags: ['海外', '美国', '纽约', 'UTC-5', '真太阳时', '西半球'],
    notes: [
      '纽约标准时区 UTC-5（冬令时），标准经度 -75°，实际经度 -73.9857°',
      '经度校正 = (-73.9857 - (-75))×4 ≈ +4.06 分钟',
      '注意：夏令时期间为 UTC-4，此处使用标准时验证',
    ],
  },

  // seed-018: 英国伦敦（0.1278，UTC）
  {
    birth: {
      id: 'seed-018',
      source: '子平八字Pro(待复核)',
      gender: 'male',
      dateStr: '2024-06-21',
      timeStr: '12:00',
      timezone: 'UTC',
      timezoneOffsetMin: 0,
      longitude: 0.1278,
      latitude: 51.5074,
      useTrueSolarTime: true,
      locationLabel: '英国伦敦',
    },
    expect: {
      fourPillars: {
        year: { gan: '甲', zhi: '辰', ganZhi: '甲辰' },
        month: { gan: '庚', zhi: '午', ganZhi: '庚午' },
        day: { gan: '甲', zhi: '辰', ganZhi: '甲辰' },
      },
      leapMonth: false,
    },
    tags: ['海外', '英国', '伦敦', 'UTC+0', '真太阳时'],
    notes: [
      '伦敦时区 UTC（冬令时），标准经度 0°，实际经度 0.1278°',
      '经度校正 = (0.1278-0)×4 ≈ +0.51 分钟，接近 0',
      '注意：夏令时期间为 UTC+1',
    ],
  },

  // seed-019: 2000-02-29 闰年
  {
    birth: {
      id: 'seed-019',
      source: '寿星万年历(待复核)',
      gender: 'male',
      dateStr: '2000-02-29',
      timeStr: '12:00',
      timezone: 'Asia/Shanghai',
      timezoneOffsetMin: 480,
      longitude: 116.4074,
      latitude: 39.9042,
      useTrueSolarTime: true,
      locationLabel: '中国北京',
    },
    expect: {
      fourPillars: {
        year: { gan: '庚', zhi: '辰', ganZhi: '庚辰' },
        month: { gan: '戊', zhi: '寅', ganZhi: '戊寅' },
        day: { gan: '壬', zhi: '午', ganZhi: '壬午' },
      },
      leapMonth: false,
    },
    tags: ['闰年', '2月29日', '2000', '庚辰年'],
    notes: [
      '2000 年是世纪闰年（能被 400 整除），2 月有 29 天',
      '2000-02-29 在立春后，年柱应为庚辰',
    ],
  },

  // seed-020: 1984-02-02 立春换年（1984 甲子年，立春前）
  {
    birth: {
      id: 'seed-020',
      source: '问真八字(待复核)',
      gender: 'male',
      dateStr: '1984-02-02',
      timeStr: '12:00',
      timezone: 'Asia/Shanghai',
      timezoneOffsetMin: 480,
      longitude: 116.4074,
      latitude: 39.9042,
      useTrueSolarTime: true,
      locationLabel: '中国北京',
    },
    expect: {
      fourPillars: {
        year: { gan: '癸', zhi: '亥', ganZhi: '癸亥' },
        month: { gan: '甲', zhi: '寅', ganZhi: '甲寅' },
        day: { gan: '丁', zhi: '酉', ganZhi: '丁酉' },
      },
      leapMonth: false,
    },
    tags: ['立春换年', '1984', '甲子年', '癸亥'],
    notes: [
      '1984-02-02 在立春前（1984 立春约 02-04），年柱仍属上一年癸亥',
      '立春后才进入甲子年，此 seed 用于验证立春前换年边界',
    ],
  },

  // seed-021: 1976-08-08 附近 闰八月罕见
  {
    birth: {
      id: 'seed-021',
      source: '寿星万年历(待复核)',
      gender: 'male',
      dateStr: '1976-09-25',
      timeStr: '12:00',
      timezone: 'Asia/Shanghai',
      timezoneOffsetMin: 480,
      longitude: 116.4074,
      latitude: 39.9042,
      useTrueSolarTime: true,
      locationLabel: '中国北京',
    },
    expect: {
      fourPillars: {
        year: { gan: '丙', zhi: '辰', ganZhi: '丙辰' },
        month: { gan: '丁', zhi: '酉', ganZhi: '丁酉' },
        day: { gan: '庚', zhi: '子', ganZhi: '庚子' },
      },
      leapMonth: true,
    },
    tags: ['闰月', '闰八月', '1976', '罕见闰月', '农历'],
    notes: [
      '1976 年为罕见的闰八月年，1976-09-25 对应农历闰八月初二前后',
      '闰八月非常罕见，上一次 1957 年，下一次 2052 年',
    ],
  },

  // seed-022: 2017-02-03 立春换年
  {
    birth: {
      id: 'seed-022',
      source: '问真八字(待复核)',
      gender: 'male',
      dateStr: '2017-02-03',
      timeStr: '23:00',
      timezone: 'Asia/Shanghai',
      timezoneOffsetMin: 480,
      longitude: 116.4074,
      latitude: 39.9042,
      useTrueSolarTime: true,
      locationLabel: '中国北京',
    },
    expect: {
      fourPillars: {
        year: { gan: '丁', zhi: '酉', ganZhi: '丁酉' },
        month: { gan: '壬', zhi: '寅', ganZhi: '壬寅' },
        day: { gan: '甲', zhi: '子', ganZhi: '甲子' },
      },
      solarTermName: '立春',
      leapMonth: false,
    },
    tags: ['立春', '2017', '丁酉年', '节气交接'],
    notes: ['2017-02-03 23:00 在立春后（2017 立春约 02-03 23:34 附近），年柱应为丁酉'],
  },

  // seed-023: 2020-04-23 闰四月初
  {
    birth: {
      id: 'seed-023',
      source: '寿星万年历(待复核)',
      gender: 'male',
      dateStr: '2020-04-23',
      timeStr: '12:00',
      timezone: 'Asia/Shanghai',
      timezoneOffsetMin: 480,
      longitude: 116.4074,
      latitude: 39.9042,
      useTrueSolarTime: true,
      locationLabel: '中国北京',
    },
    expect: {
      fourPillars: {
        year: { gan: '庚', zhi: '子', ganZhi: '庚子' },
        month: { gan: '庚', zhi: '辰', ganZhi: '庚辰' },
        day: { gan: '丙', zhi: '午', ganZhi: '丙午' },
      },
      leapMonth: true,
    },
    tags: ['闰月', '闰四月', '2020', '农历'],
    notes: [
      '2020-04-23 对应农历闰四月初（庚子年闰四月），lunar.leap 应为 true',
      '此为补充闰月案例，用于覆盖闰四月开头日期',
    ],
  },
]
