import type { Country, City, County } from './types';

function county(name: string, longitude: number, latitude: number, timezone: string, timezoneOffsetMin: number): County {
  return { name, longitude, latitude, timezone, timezoneOffsetMin };
}

function city(
  name: string,
  longitude: number,
  latitude: number,
  timezone: string,
  timezoneOffsetMin: number,
  counties?: County[],
): City {
  const c: County[] = counties && counties.length > 0
    ? counties
    : [county('市辖区', longitude, latitude, timezone, timezoneOffsetMin)];
  const primary = c[0];
  return {
    name,
    longitude: primary.longitude,
    latitude: primary.latitude,
    timezone,
    timezoneOffsetMin,
    counties: c,
  };
}

function country(
  code: string,
  name: string,
  defaultTimezone: string,
  defaultTimezoneOffsetMin: number,
  majorCities: City[],
): Country {
  return {
    code,
    name,
    defaultTimezone,
    defaultTimezoneOffsetMin,
    majorCities,
  };
}

const US_EAST_TZ = 'America/New_York';
const US_EAST_OFF = -300;
const US_CENTRAL_TZ = 'America/Chicago';
const US_CENTRAL_OFF = -360;
const US_MOUNTAIN_TZ = 'America/Denver';
const US_MOUNTAIN_OFF = -420;
const US_PACIFIC_TZ = 'America/Los_Angeles';
const US_PACIFIC_OFF = -480;

const usCities: City[] = [
  city('纽约', -74.006, 40.7128, US_EAST_TZ, US_EAST_OFF, [
    county('曼哈顿区', -73.997, 40.750, US_EAST_TZ, US_EAST_OFF),
    county('布鲁克林区', -73.944, 40.678, US_EAST_TZ, US_EAST_OFF),
  ]),
  city('洛杉矶', -118.2437, 34.0522, US_PACIFIC_TZ, US_PACIFIC_OFF, [
    county('洛杉矶市区', -118.2437, 34.0522, US_PACIFIC_TZ, US_PACIFIC_OFF),
  ]),
  city('旧金山', -122.4194, 37.7749, US_PACIFIC_TZ, US_PACIFIC_OFF, [
    county('旧金山市中心', -122.4194, 37.7749, US_PACIFIC_TZ, US_PACIFIC_OFF),
  ]),
  city('芝加哥', -87.6298, 41.8781, US_CENTRAL_TZ, US_CENTRAL_OFF, [
    county('芝加哥市区', -87.6298, 41.8781, US_CENTRAL_TZ, US_CENTRAL_OFF),
  ]),
  city('休斯顿', -95.3698, 29.7604, US_CENTRAL_TZ, US_CENTRAL_OFF, [
    county('休斯顿市区', -95.3698, 29.7604, US_CENTRAL_TZ, US_CENTRAL_OFF),
  ]),
  city('西雅图', -122.3321, 47.6062, US_PACIFIC_TZ, US_PACIFIC_OFF, [
    county('西雅图市区', -122.3321, 47.6062, US_PACIFIC_TZ, US_PACIFIC_OFF),
  ]),
  city('波士顿', -71.0589, 42.3601, US_EAST_TZ, US_EAST_OFF, [
    county('波士顿市区', -71.0589, 42.3601, US_EAST_TZ, US_EAST_OFF),
  ]),
  city('华盛顿特区', -77.0369, 38.9072, US_EAST_TZ, US_EAST_OFF, [
    county('华盛顿哥伦比亚特区', -77.0369, 38.9072, US_EAST_TZ, US_EAST_OFF),
  ]),
  city('达拉斯', -96.7970, 32.7767, US_CENTRAL_TZ, US_CENTRAL_OFF, [
    county('达拉斯市区', -96.7970, 32.7767, US_CENTRAL_TZ, US_CENTRAL_OFF),
  ]),
  city('迈阿密', -80.1918, 25.7617, US_EAST_TZ, US_EAST_OFF, [
    county('迈阿密市区', -80.1918, 25.7617, US_EAST_TZ, US_EAST_OFF),
  ]),
];

const CA_TZ = 'America/Toronto';
const CA_OFF = -300;
const CA_VAN_TZ = 'America/Vancouver';
const CA_VAN_OFF = -480;
const CA_MON_TZ = 'America/Montreal';
const CA_MON_OFF = -300;
const CA_CAL_TZ = 'America/Calgary';
const CA_CAL_OFF = -420;

const canadaCities: City[] = [
  city('多伦多', -79.3832, 43.6532, CA_TZ, CA_OFF, [
    county('多伦多市区', -79.3832, 43.6532, CA_TZ, CA_OFF),
  ]),
  city('温哥华', -123.1207, 49.2827, CA_VAN_TZ, CA_VAN_OFF, [
    county('温哥华市区', -123.1207, 49.2827, CA_VAN_TZ, CA_VAN_OFF),
  ]),
  city('蒙特利尔', -73.5673, 45.5017, CA_MON_TZ, CA_MON_OFF, [
    county('蒙特利尔市区', -73.5673, 45.5017, CA_MON_TZ, CA_MON_OFF),
  ]),
  city('卡尔加里', -114.0719, 51.0447, CA_CAL_TZ, CA_CAL_OFF, [
    county('卡尔加里市区', -114.0719, 51.0447, CA_CAL_TZ, CA_CAL_OFF),
  ]),
];

const GB_TZ = 'Europe/London';
const GB_OFF = 0;

const ukCities: City[] = [
  city('伦敦', -0.1276, 51.5074, GB_TZ, GB_OFF, [
    county('威斯敏斯特', -0.1357, 51.5074, GB_TZ, GB_OFF),
    county('伦敦市', -0.0888, 51.5155, GB_TZ, GB_OFF),
  ]),
  city('曼彻斯特', -2.2426, 53.4808, GB_TZ, GB_OFF, [
    county('曼彻斯特市区', -2.2426, 53.4808, GB_TZ, GB_OFF),
  ]),
  city('伯明翰', -1.8904, 52.4862, GB_TZ, GB_OFF, [
    county('伯明翰市区', -1.8904, 52.4862, GB_TZ, GB_OFF),
  ]),
  city('爱丁堡', -3.1883, 55.9533, GB_TZ, GB_OFF, [
    county('爱丁堡市区', -3.1883, 55.9533, GB_TZ, GB_OFF),
  ]),
];

const FR_TZ = 'Europe/Paris';
const FR_OFF = 60;

const franceCities: City[] = [
  city('巴黎', 2.3522, 48.8566, FR_TZ, FR_OFF, [
    county('巴黎第一区', 2.3412, 48.8566, FR_TZ, FR_OFF),
    county('巴黎第八区', 2.3125, 48.8750, FR_TZ, FR_OFF),
  ]),
  city('马赛', 5.3698, 43.2965, FR_TZ, FR_OFF, [
    county('马赛市区', 5.3698, 43.2965, FR_TZ, FR_OFF),
  ]),
  city('里昂', 4.8357, 45.7640, FR_TZ, FR_OFF, [
    county('里昂市区', 4.8357, 45.7640, FR_TZ, FR_OFF),
  ]),
];

const DE_TZ = 'Europe/Berlin';
const DE_OFF = 60;

const germanyCities: City[] = [
  city('柏林', 13.4050, 52.5200, DE_TZ, DE_OFF, [
    county('米特区', 13.4050, 52.5200, DE_TZ, DE_OFF),
  ]),
  city('慕尼黑', 11.5820, 48.1351, DE_TZ, DE_OFF, [
    county('慕尼黑市区', 11.5820, 48.1351, DE_TZ, DE_OFF),
  ]),
  city('汉堡', 9.9937, 53.5511, DE_TZ, DE_OFF, [
    county('汉堡市区', 9.9937, 53.5511, DE_TZ, DE_OFF),
  ]),
  city('法兰克福', 8.6821, 50.1109, DE_TZ, DE_OFF, [
    county('法兰克福市区', 8.6821, 50.1109, DE_TZ, DE_OFF),
  ]),
];

const IT_TZ = 'Europe/Rome';
const IT_OFF = 60;

const italyCities: City[] = [
  city('罗马', 12.4964, 41.9028, IT_TZ, IT_OFF, [
    county('罗马市区', 12.4964, 41.9028, IT_TZ, IT_OFF),
  ]),
  city('米兰', 9.1900, 45.4642, IT_TZ, IT_OFF, [
    county('米兰市区', 9.1900, 45.4642, IT_TZ, IT_OFF),
  ]),
  city('威尼斯', 12.3155, 45.4408, IT_TZ, IT_OFF, [
    county('威尼斯主岛', 12.3155, 45.4408, IT_TZ, IT_OFF),
  ]),
];

const ES_TZ = 'Europe/Madrid';
const ES_OFF = 60;

const spainCities: City[] = [
  city('马德里', -3.7038, 40.4168, ES_TZ, ES_OFF, [
    county('马德里市区', -3.7038, 40.4168, ES_TZ, ES_OFF),
  ]),
  city('巴塞罗那', 2.1734, 41.3851, ES_TZ, ES_OFF, [
    county('巴塞罗那市区', 2.1734, 41.3851, ES_TZ, ES_OFF),
  ]),
];

const RU_MOS_TZ = 'Europe/Moscow';
const RU_MOS_OFF = 180;
const RU_VLA_TZ = 'Asia/Vladivostok';
const RU_VLA_OFF = 600;

const russiaCities: City[] = [
  city('莫斯科', 37.6173, 55.7558, RU_MOS_TZ, RU_MOS_OFF, [
    county('特维尔区', 37.6173, 55.7558, RU_MOS_TZ, RU_MOS_OFF),
  ]),
  city('圣彼得堡', 30.3351, 59.9343, RU_MOS_TZ, RU_MOS_OFF, [
    county('海军部区', 30.3050, 59.9343, RU_MOS_TZ, RU_MOS_OFF),
  ]),
  city('符拉迪沃斯托克（海参崴）', 131.8823, 43.1155, RU_VLA_TZ, RU_VLA_OFF, [
    county('海参崴市区', 131.8823, 43.1155, RU_VLA_TZ, RU_VLA_OFF),
  ]),
];

const JP_TZ = 'Asia/Tokyo';
const JP_OFF = 540;

const japanCities: City[] = [
  city('东京', 139.6917, 35.6895, JP_TZ, JP_OFF, [
    county('新宿区', 139.6917, 35.6895, JP_TZ, JP_OFF),
    county('千代田区', 139.7531, 35.6841, JP_TZ, JP_OFF),
  ]),
  city('大阪', 135.5023, 34.6937, JP_TZ, JP_OFF, [
    county('大阪市区', 135.5023, 34.6937, JP_TZ, JP_OFF),
  ]),
  city('京都', 135.7683, 35.0116, JP_TZ, JP_OFF, [
    county('京都市中心', 135.7683, 35.0116, JP_TZ, JP_OFF),
  ]),
  city('名古屋', 136.9066, 35.1815, JP_TZ, JP_OFF, [
    county('名古屋市区', 136.9066, 35.1815, JP_TZ, JP_OFF),
  ]),
  city('札幌', 141.3544, 43.0621, JP_TZ, JP_OFF, [
    county('札幌市区', 141.3544, 43.0621, JP_TZ, JP_OFF),
  ]),
  city('福冈', 130.4017, 33.5904, JP_TZ, JP_OFF, [
    county('福冈市区', 130.4017, 33.5904, JP_TZ, JP_OFF),
  ]),
];

const KR_TZ = 'Asia/Seoul';
const KR_OFF = 540;

const koreaCities: City[] = [
  city('首尔', 126.9780, 37.5665, KR_TZ, KR_OFF, [
    county('中区', 126.9975, 37.5641, KR_TZ, KR_OFF),
    county('江南区', 127.0286, 37.4980, KR_TZ, KR_OFF),
  ]),
  city('釜山', 129.0756, 35.1796, KR_TZ, KR_OFF, [
    county('釜山海云台区', 129.1604, 35.1566, KR_TZ, KR_OFF),
  ]),
  city('仁川', 126.7052, 37.4563, KR_TZ, KR_OFF, [
    county('仁川市区', 126.7052, 37.4563, KR_TZ, KR_OFF),
  ]),
];

const KP_TZ = 'Asia/Pyongyang';
const KP_OFF = 540;

const dprkCities: City[] = [
  city('平壤', 125.7625, 39.0392, KP_TZ, KP_OFF, [
    county('平壤市区', 125.7625, 39.0392, KP_TZ, KP_OFF),
  ]),
];

const VN_HAN_TZ = 'Asia/Bangkok';
const VN_HAN_OFF = 420;

const vietnamCities: City[] = [
  city('河内', 105.8542, 21.0278, VN_HAN_TZ, VN_HAN_OFF, [
    county('河内还剑区', 105.8542, 21.0278, VN_HAN_TZ, VN_HAN_OFF),
  ]),
  city('胡志明市', 106.6297, 10.8231, VN_HAN_TZ, VN_HAN_OFF, [
    county('胡志明市第一郡', 106.7040, 10.7759, VN_HAN_TZ, VN_HAN_OFF),
  ]),
];

const TH_TZ = 'Asia/Bangkok';
const TH_OFF = 420;

const thailandCities: City[] = [
  city('曼谷', 100.5018, 13.7563, TH_TZ, TH_OFF, [
    county('曼谷拍那空县', 100.4927, 13.7539, TH_TZ, TH_OFF),
  ]),
  city('清迈', 98.9842, 18.7883, TH_TZ, TH_OFF, [
    county('清迈市区', 98.9842, 18.7883, TH_TZ, TH_OFF),
  ]),
  city('普吉', 98.3923, 7.8804, TH_TZ, TH_OFF, [
    county('普吉镇', 98.3923, 7.8804, TH_TZ, TH_OFF),
  ]),
];

const SG_TZ = 'Asia/Singapore';
const SG_OFF = 480;

const singaporeCities: City[] = [
  city('新加坡', 103.8198, 1.3521, SG_TZ, SG_OFF, [
    county('新加坡中区', 103.8473, 1.2834, SG_TZ, SG_OFF),
  ]),
];

const MY_TZ = 'Asia/Kuala_Lumpur';
const MY_OFF = 480;

const malaysiaCities: City[] = [
  city('吉隆坡', 101.6869, 3.1390, MY_TZ, MY_OFF, [
    county('吉隆坡市中心', 101.6965, 3.1412, MY_TZ, MY_OFF),
  ]),
  city('槟城', 100.3298, 5.4164, MY_TZ, MY_OFF, [
    county('槟城乔治市', 100.3298, 5.4164, MY_TZ, MY_OFF),
  ]),
  city('新山', 103.8198, 1.4927, MY_TZ, MY_OFF, [
    county('新山市区', 103.8198, 1.4927, MY_TZ, MY_OFF),
  ]),
];

const ID_TZ = 'Asia/Jakarta';
const ID_OFF = 420;
const ID_BALI_TZ = 'Asia/Makassar';
const ID_BALI_OFF = 480;

const indonesiaCities: City[] = [
  city('雅加达', 106.8456, -6.2088, ID_TZ, ID_OFF, [
    county('雅加达市中心', 106.8456, -6.2088, ID_TZ, ID_OFF),
  ]),
  city('巴厘岛登巴萨', 115.2126, -8.6705, ID_BALI_TZ, ID_BALI_OFF, [
    county('登巴萨市区', 115.2126, -8.6705, ID_BALI_TZ, ID_BALI_OFF),
  ]),
];

const PH_TZ = 'Asia/Manila';
const PH_OFF = 480;

const philippinesCities: City[] = [
  city('马尼拉', 120.9842, 14.5995, PH_TZ, PH_OFF, [
    county('马尼拉市区', 120.9842, 14.5995, PH_TZ, PH_OFF),
  ]),
];

const IN_DEL_TZ = 'Asia/Kolkata';
const IN_DEL_OFF = 330;

const indiaCities: City[] = [
  city('新德里', 77.2090, 28.6139, IN_DEL_TZ, IN_DEL_OFF, [
    county('新德里康诺特广场', 77.2090, 28.6139, IN_DEL_TZ, IN_DEL_OFF),
  ]),
  city('孟买', 72.8777, 19.0760, IN_DEL_TZ, IN_DEL_OFF, [
    county('孟买班德拉', 72.8292, 19.0636, IN_DEL_TZ, IN_DEL_OFF),
  ]),
  city('加尔各答', 88.3639, 22.5726, IN_DEL_TZ, IN_DEL_OFF, [
    county('加尔各答市区', 88.3639, 22.5726, IN_DEL_TZ, IN_DEL_OFF),
  ]),
  city('班加罗尔', 77.5946, 12.9716, IN_DEL_TZ, IN_DEL_OFF, [
    county('班加罗尔市区', 77.5946, 12.9716, IN_DEL_TZ, IN_DEL_OFF),
  ]),
];

const PK_TZ = 'Asia/Karachi';
const PK_OFF = 300;

const pakistanCities: City[] = [
  city('伊斯兰堡', 73.0479, 33.6844, PK_TZ, PK_OFF, [
    county('伊斯兰堡市区', 73.0479, 33.6844, PK_TZ, PK_OFF),
  ]),
  city('卡拉奇', 67.0011, 24.8607, PK_TZ, PK_OFF, [
    county('卡拉奇市区', 67.0011, 24.8607, PK_TZ, PK_OFF),
  ]),
];

const AU_SYD_TZ = 'Australia/Sydney';
const AU_SYD_OFF = 600;
const AU_PER_TZ = 'Australia/Perth';
const AU_PER_OFF = 480;
const AU_ADE_TZ = 'Australia/Adelaide';
const AU_ADE_OFF = 570;
const AU_BRI_TZ = 'Australia/Brisbane';
const AU_BRI_OFF = 600;
const AU_CAN_TZ = 'Australia/Canberra';
const AU_CAN_OFF = 600;

const australiaCities: City[] = [
  city('悉尼', 151.2093, -33.8688, AU_SYD_TZ, AU_SYD_OFF, [
    county('悉尼中央商务区', 151.2093, -33.8688, AU_SYD_TZ, AU_SYD_OFF),
  ]),
  city('墨尔本', 144.9631, -37.8136, AU_SYD_TZ, AU_SYD_OFF, [
    county('墨尔本市中心', 144.9631, -37.8136, AU_SYD_TZ, AU_SYD_OFF),
  ]),
  city('布里斯班', 153.0251, -27.4698, AU_BRI_TZ, AU_BRI_OFF, [
    county('布里斯班市区', 153.0251, -27.4698, AU_BRI_TZ, AU_BRI_OFF),
  ]),
  city('珀斯', 115.8613, -31.9505, AU_PER_TZ, AU_PER_OFF, [
    county('珀斯市区', 115.8613, -31.9505, AU_PER_TZ, AU_PER_OFF),
  ]),
  city('阿德莱德', 138.6007, -34.9285, AU_ADE_TZ, AU_ADE_OFF, [
    county('阿德莱德市区', 138.6007, -34.9285, AU_ADE_TZ, AU_ADE_OFF),
  ]),
  city('堪培拉', 149.1300, -35.2809, AU_CAN_TZ, AU_CAN_OFF, [
    county('堪培拉市区', 149.1300, -35.2809, AU_CAN_TZ, AU_CAN_OFF),
  ]),
];

const NZ_TZ = 'Pacific/Auckland';
const NZ_OFF = 720;
const NZ_WEL_TZ = 'Pacific/Auckland';
const NZ_WEL_OFF = 720;

const newzealandCities: City[] = [
  city('奥克兰', 174.7633, -36.8485, NZ_TZ, NZ_OFF, [
    county('奥克兰市区', 174.7633, -36.8485, NZ_TZ, NZ_OFF),
  ]),
  city('惠灵顿', 174.7762, -41.2865, NZ_WEL_TZ, NZ_WEL_OFF, [
    county('惠灵顿市区', 174.7762, -41.2865, NZ_WEL_TZ, NZ_WEL_OFF),
  ]),
];

const BR_SAO_TZ = 'America/Sao_Paulo';
const BR_SAO_OFF = -180;
const BR_BRA_TZ = 'America/Sao_Paulo';
const BR_BRA_OFF = -180;

const brazilCities: City[] = [
  city('圣保罗', -46.6333, -23.5505, BR_SAO_TZ, BR_SAO_OFF, [
    county('圣保罗市区', -46.6333, -23.5505, BR_SAO_TZ, BR_SAO_OFF),
  ]),
  city('里约热内卢', -43.1729, -22.9068, BR_SAO_TZ, BR_SAO_OFF, [
    county('里约市区', -43.1729, -22.9068, BR_SAO_TZ, BR_SAO_OFF),
  ]),
  city('巴西利亚', -47.8825, -15.7942, BR_BRA_TZ, BR_BRA_OFF, [
    county('巴西利亚联邦区', -47.8825, -15.7942, BR_BRA_TZ, BR_BRA_OFF),
  ]),
];

const AR_TZ = 'America/Argentina/Buenos_Aires';
const AR_OFF = -180;

const argentinaCities: City[] = [
  city('布宜诺斯艾利斯', -58.3816, -34.6037, AR_TZ, AR_OFF, [
    county('布宜诺斯艾利斯市区', -58.3816, -34.6037, AR_TZ, AR_OFF),
  ]),
];

const MX_TZ = 'America/Mexico_City';
const MX_OFF = -360;

const mexicoCities: City[] = [
  city('墨西哥城', -99.1332, 19.4326, MX_TZ, MX_OFF, [
    county('墨西哥城历史中心', -99.1332, 19.4326, MX_TZ, MX_OFF),
  ]),
  city('瓜达拉哈拉', -103.3496, 20.6597, MX_TZ, MX_OFF, [
    county('瓜达拉哈拉市区', -103.3496, 20.6597, MX_TZ, MX_OFF),
  ]),
];

const ZA_JNB_TZ = 'Africa/Johannesburg';
const ZA_JNB_OFF = 120;
const ZA_CPT_TZ = 'Africa/Johannesburg';
const ZA_CPT_OFF = 120;
const ZA_DBN_TZ = 'Africa/Johannesburg';
const ZA_DBN_OFF = 120;

const southafricaCities: City[] = [
  city('约翰内斯堡', 28.0473, -26.2041, ZA_JNB_TZ, ZA_JNB_OFF, [
    county('约翰内斯堡桑顿', 28.0573, -26.1076, ZA_JNB_TZ, ZA_JNB_OFF),
  ]),
  city('开普敦', 18.4241, -33.9249, ZA_CPT_TZ, ZA_CPT_OFF, [
    county('开普敦市中心', 18.4241, -33.9249, ZA_CPT_TZ, ZA_CPT_OFF),
  ]),
  city('德班', 31.0218, -29.8587, ZA_DBN_TZ, ZA_DBN_OFF, [
    county('德班市区', 31.0218, -29.8587, ZA_DBN_TZ, ZA_DBN_OFF),
  ]),
];

const EG_TZ = 'Africa/Cairo';
const EG_OFF = 120;

const egyptCities: City[] = [
  city('开罗', 31.2357, 30.0444, EG_TZ, EG_OFF, [
    county('开罗解放广场', 31.2357, 30.0444, EG_TZ, EG_OFF),
  ]),
  city('亚历山大', 29.9158, 31.2001, EG_TZ, EG_OFF, [
    county('亚历山大市区', 29.9158, 31.2001, EG_TZ, EG_OFF),
  ]),
];

const AE_TZ = 'Asia/Dubai';
const AE_OFF = 240;

const uaeCities: City[] = [
  city('迪拜', 55.2708, 25.2048, AE_TZ, AE_OFF, [
    county('迪拜市中心', 55.2708, 25.1972, AE_TZ, AE_OFF),
  ]),
  city('阿布扎比', 54.3773, 24.4735, AE_TZ, AE_OFF, [
    county('阿布扎比市区', 54.3773, 24.4735, AE_TZ, AE_OFF),
  ]),
];

const SA_TZ = 'Asia/Riyadh';
const SA_OFF = 180;

const saudiCities: City[] = [
  city('利雅得', 46.6753, 24.7136, SA_TZ, SA_OFF, [
    county('利雅得市区', 46.6753, 24.7136, SA_TZ, SA_OFF),
  ]),
  city('吉达', 39.1925, 21.4858, SA_TZ, SA_OFF, [
    county('吉达市区', 39.1925, 21.4858, SA_TZ, SA_OFF),
  ]),
];

const TR_IST_TZ = 'Europe/Istanbul';
const TR_IST_OFF = 180;
const TR_ANK_TZ = 'Europe/Istanbul';
const TR_ANK_OFF = 180;

const turkeyCities: City[] = [
  city('伊斯坦布尔', 28.9784, 41.0082, TR_IST_TZ, TR_IST_OFF, [
    county('伊斯坦布尔贝伊奥卢', 28.9784, 41.0310, TR_IST_TZ, TR_IST_OFF),
  ]),
  city('安卡拉', 32.8597, 39.9334, TR_ANK_TZ, TR_ANK_OFF, [
    county('安卡拉市区', 32.8597, 39.9334, TR_ANK_TZ, TR_ANK_OFF),
  ]),
];

const NL_TZ = 'Europe/Amsterdam';
const NL_OFF = 60;

const netherlandsCities: City[] = [
  city('阿姆斯特丹', 4.9041, 52.3676, NL_TZ, NL_OFF, [
    county('阿姆斯特丹市中心', 4.9041, 52.3676, NL_TZ, NL_OFF),
  ]),
  city('鹿特丹', 4.4777, 51.9244, NL_TZ, NL_OFF, [
    county('鹿特丹市区', 4.4777, 51.9244, NL_TZ, NL_OFF),
  ]),
];

const CH_ZUR_TZ = 'Europe/Zurich';
const CH_ZUR_OFF = 60;
const CH_GEN_TZ = 'Europe/Zurich';
const CH_GEN_OFF = 60;

const switzerlandCities: City[] = [
  city('苏黎世', 8.5417, 47.3769, CH_ZUR_TZ, CH_ZUR_OFF, [
    county('苏黎世市中心', 8.5417, 47.3769, CH_ZUR_TZ, CH_ZUR_OFF),
  ]),
  city('日内瓦', 6.1432, 46.2044, CH_GEN_TZ, CH_GEN_OFF, [
    county('日内瓦市区', 6.1432, 46.2044, CH_GEN_TZ, CH_GEN_OFF),
  ]),
];

const BE_TZ = 'Europe/Brussels';
const BE_OFF = 60;

const belgiumCities: City[] = [
  city('布鲁塞尔', 4.3517, 50.8503, BE_TZ, BE_OFF, [
    county('布鲁塞尔大广场', 4.3517, 50.8503, BE_TZ, BE_OFF),
  ]),
];

const SE_TZ = 'Europe/Stockholm';
const SE_OFF = 60;

const swedenCities: City[] = [
  city('斯德哥尔摩', 18.0686, 59.3293, SE_TZ, SE_OFF, [
    county('斯德哥尔摩老城区', 18.0714, 59.3270, SE_TZ, SE_OFF),
  ]),
];

const NO_TZ = 'Europe/Oslo';
const NO_OFF = 60;

const norwayCities: City[] = [
  city('奥斯陆', 10.7522, 59.9139, NO_TZ, NO_OFF, [
    county('奥斯陆市区', 10.7522, 59.9139, NO_TZ, NO_OFF),
  ]),
];

const DK_TZ = 'Europe/Copenhagen';
const DK_OFF = 60;

const denmarkCities: City[] = [
  city('哥本哈根', 12.5683, 55.6761, DK_TZ, DK_OFF, [
    county('哥本哈根市中心', 12.5683, 55.6761, DK_TZ, DK_OFF),
  ]),
];

const FI_TZ = 'Europe/Helsinki';
const FI_OFF = 120;

const finlandCities: City[] = [
  city('赫尔辛基', 24.9384, 60.1699, FI_TZ, FI_OFF, [
    county('赫尔辛基市区', 24.9384, 60.1699, FI_TZ, FI_OFF),
  ]),
];

const PL_TZ = 'Europe/Warsaw';
const PL_OFF = 60;

const polandCities: City[] = [
  city('华沙', 21.0122, 52.2297, PL_TZ, PL_OFF, [
    county('华沙老城区', 21.0122, 52.2297, PL_TZ, PL_OFF),
  ]),
];

const GR_TZ = 'Europe/Athens';
const GR_OFF = 120;

const greeceCities: City[] = [
  city('雅典', 23.7275, 37.9838, GR_TZ, GR_OFF, [
    county('雅典卫城', 23.7245, 37.9715, GR_TZ, GR_OFF),
  ]),
];

export const GLOBAL_COUNTRIES: Country[] = [
  country('US', '美国', US_EAST_TZ, US_EAST_OFF, usCities),
  country('CA', '加拿大', CA_TZ, CA_OFF, canadaCities),
  country('GB', '英国', GB_TZ, GB_OFF, ukCities),
  country('FR', '法国', FR_TZ, FR_OFF, franceCities),
  country('DE', '德国', DE_TZ, DE_OFF, germanyCities),
  country('IT', '意大利', IT_TZ, IT_OFF, italyCities),
  country('ES', '西班牙', ES_TZ, ES_OFF, spainCities),
  country('RU', '俄罗斯', RU_MOS_TZ, RU_MOS_OFF, russiaCities),
  country('JP', '日本', JP_TZ, JP_OFF, japanCities),
  country('KR', '韩国', KR_TZ, KR_OFF, koreaCities),
  country('KP', '朝鲜', KP_TZ, KP_OFF, dprkCities),
  country('VN', '越南', VN_HAN_TZ, VN_HAN_OFF, vietnamCities),
  country('TH', '泰国', TH_TZ, TH_OFF, thailandCities),
  country('SG', '新加坡', SG_TZ, SG_OFF, singaporeCities),
  country('MY', '马来西亚', MY_TZ, MY_OFF, malaysiaCities),
  country('ID', '印度尼西亚', ID_TZ, ID_OFF, indonesiaCities),
  country('PH', '菲律宾', PH_TZ, PH_OFF, philippinesCities),
  country('IN', '印度', IN_DEL_TZ, IN_DEL_OFF, indiaCities),
  country('PK', '巴基斯坦', PK_TZ, PK_OFF, pakistanCities),
  country('AU', '澳大利亚', AU_SYD_TZ, AU_SYD_OFF, australiaCities),
  country('NZ', '新西兰', NZ_TZ, NZ_OFF, newzealandCities),
  country('BR', '巴西', BR_SAO_TZ, BR_SAO_OFF, brazilCities),
  country('AR', '阿根廷', AR_TZ, AR_OFF, argentinaCities),
  country('MX', '墨西哥', MX_TZ, MX_OFF, mexicoCities),
  country('ZA', '南非', ZA_JNB_TZ, ZA_JNB_OFF, southafricaCities),
  country('EG', '埃及', EG_TZ, EG_OFF, egyptCities),
  country('AE', '阿联酋', AE_TZ, AE_OFF, uaeCities),
  country('SA', '沙特阿拉伯', SA_TZ, SA_OFF, saudiCities),
  country('TR', '土耳其', TR_IST_TZ, TR_IST_OFF, turkeyCities),
  country('NL', '荷兰', NL_TZ, NL_OFF, netherlandsCities),
  country('CH', '瑞士', CH_ZUR_TZ, CH_ZUR_OFF, switzerlandCities),
  country('BE', '比利时', BE_TZ, BE_OFF, belgiumCities),
  country('SE', '瑞典', SE_TZ, SE_OFF, swedenCities),
  country('NO', '挪威', NO_TZ, NO_OFF, norwayCities),
  country('DK', '丹麦', DK_TZ, DK_OFF, denmarkCities),
  country('FI', '芬兰', FI_TZ, FI_OFF, finlandCities),
  country('PL', '波兰', PL_TZ, PL_OFF, polandCities),
  country('GR', '希腊', GR_TZ, GR_OFF, greeceCities),
];
