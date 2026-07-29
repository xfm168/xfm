import type { Country, Province, City, County } from './types';

const TZ = 'Asia/Shanghai';
const OFFSET = 480;

function county(name: string, longitude: number, latitude: number): County {
  return { name, longitude, latitude, timezone: TZ, timezoneOffsetMin: OFFSET };
}

function city(
  name: string,
  longitude: number,
  latitude: number,
  counties: County[],
): City {
  const primaryCounty = counties[0];
  return {
    name,
    longitude: primaryCounty.longitude,
    latitude: primaryCounty.latitude,
    timezone: TZ,
    timezoneOffsetMin: OFFSET,
    counties,
  };
}

function province(
  name: string,
  longitude: number,
  latitude: number,
  cities: City[],
): Province {
  const primaryCity = cities[0];
  return {
    name,
    longitude: primaryCity.longitude,
    latitude: primaryCity.latitude,
    timezone: TZ,
    timezoneOffsetMin: OFFSET,
    cities,
  };
}

const beijingCounties: County[] = [
  county('东城区', 116.407, 39.904),
  county('海淀区', 116.310, 39.959),
  county('朝阳区', 116.455, 39.921),
  county('西城区', 116.366, 39.915),
  county('丰台区', 116.286, 39.858),
  county('石景山区', 116.222, 39.906),
  county('通州区', 116.656, 39.908),
  county('昌平区', 116.231, 40.220),
  county('大兴区', 116.341, 39.727),
];

const tianjinCounties: County[] = [
  county('和平区', 117.201, 39.114),
  county('南开区', 117.145, 39.139),
  county('河东区', 117.251, 39.128),
];

const shanghaiCounties: County[] = [
  county('黄浦区', 121.473, 31.230),
  county('浦东新区', 121.544, 31.221),
  county('徐汇区', 121.436, 31.188),
  county('长宁区', 121.425, 31.220),
  county('静安区', 121.459, 31.232),
  county('普陀区', 121.397, 31.251),
  county('虹口区', 121.492, 31.266),
  county('杨浦区', 121.526, 31.298),
  county('闵行区', 121.381, 31.112),
  county('宝山区', 121.490, 31.391),
];

const chongqingCounties: County[] = [
  county('渝中区', 106.551, 29.563),
  county('江北区', 106.574, 29.606),
  county('沙坪坝区', 106.455, 29.551),
];

const hebeiCities: City[] = [
  city('石家庄市', 114.514, 38.042, [county('长安区', 114.514, 38.042), county('桥西区', 114.465, 38.043)]),
  city('唐山市', 118.180, 39.630, [county('路北区', 118.180, 39.630), county('路南区', 118.165, 39.615)]),
  city('保定市', 115.464, 38.873, [county('竞秀区', 115.464, 38.873)]),
  city('邯郸市', 114.539, 36.627, [county('丛台区', 114.539, 36.627)]),
  city('秦皇岛市', 119.600, 39.935, [county('海港区', 119.600, 39.935)]),
];

const shanxiCities: City[] = [
  city('太原市', 112.549, 37.857, [county('小店区', 112.549, 37.857), county('迎泽区', 112.550, 37.870)]),
  city('大同市', 113.295, 40.077, [county('平城区', 113.295, 40.077)]),
  city('运城市', 111.004, 35.023, [county('盐湖区', 111.004, 35.023)]),
];

const liaoningCities: City[] = [
  city('沈阳市', 123.431, 41.805, [county('和平区', 123.431, 41.805), county('沈河区', 123.450, 41.789)]),
  city('大连市', 121.615, 38.914, [county('中山区', 121.615, 38.914), county('沙河口区', 121.585, 38.905)]),
  city('鞍山市', 122.995, 41.108, [county('铁东区', 122.995, 41.108)]),
];

const jilinCities: City[] = [
  city('长春市', 125.324, 43.886, [county('朝阳区', 125.324, 43.886), county('南关区', 125.342, 43.868)]),
  city('吉林市', 126.553, 43.844, [county('船营区', 126.553, 43.844)]),
  city('延边州延吉市', 129.512, 42.893, [county('延吉市', 129.512, 42.893)]),
];

const heilongjiangCities: City[] = [
  city('哈尔滨市', 126.642, 45.756, [county('道里区', 126.642, 45.756), county('南岗区', 126.680, 45.740)]),
  city('齐齐哈尔市', 123.955, 47.343, [county('建华区', 123.955, 47.343)]),
  city('大庆市', 125.105, 46.585, [county('萨尔图区', 125.105, 46.585)]),
  city('牡丹江市', 129.619, 44.555, [county('东安区', 129.619, 44.555)]),
];

const jiangsuCities: City[] = [
  city('南京市', 118.796, 32.060, [county('玄武区', 118.796, 32.060), county('鼓楼区', 118.778, 32.086)]),
  city('苏州市', 120.585, 31.299, [county('姑苏区', 120.585, 31.299), county('工业园区', 120.708, 31.322)]),
  city('无锡市', 120.312, 31.491, [county('梁溪区', 120.312, 31.491)]),
  city('常州市', 119.974, 31.778, [county('天宁区', 119.974, 31.778)]),
  city('徐州市', 117.284, 34.204, [county('云龙区', 117.284, 34.204)]),
  city('南通市', 120.865, 31.996, [county('崇川区', 120.865, 31.996)]),
];

const zhejiangCities: City[] = [
  city('杭州市', 120.153, 30.287, [county('上城区', 120.153, 30.287), county('西湖区', 120.130, 30.259)]),
  city('宁波市', 121.550, 29.874, [county('海曙区', 121.550, 29.874), county('鄞州区', 121.549, 29.817)]),
  city('温州市', 120.699, 27.994, [county('鹿城区', 120.699, 27.994)]),
  city('嘉兴市', 120.755, 30.746, [county('南湖区', 120.755, 30.746)]),
  city('绍兴市', 120.580, 30.030, [county('越城区', 120.580, 30.030)]),
  city('金华市', 119.647, 29.078, [county('婺城区', 119.647, 29.078)]),
];

const anhuiCities: City[] = [
  city('合肥市', 117.282, 31.866, [county('蜀山区', 117.282, 31.866), county('包河区', 117.290, 31.820)]),
  city('芜湖市', 118.433, 31.353, [county('镜湖区', 118.433, 31.353)]),
  city('蚌埠市', 117.389, 32.917, [county('蚌山区', 117.389, 32.917)]),
];

const fujianCities: City[] = [
  city('福州市', 119.296, 26.074, [county('鼓楼区', 119.296, 26.074), county('台江区', 119.300, 26.055)]),
  city('厦门市', 118.089, 24.479, [county('思明区', 118.089, 24.479), county('湖里区', 118.101, 24.519)]),
  city('泉州市', 118.676, 24.874, [county('鲤城区', 118.676, 24.874)]),
];

const jiangxiCities: City[] = [
  city('南昌市', 115.892, 28.676, [county('东湖区', 115.892, 28.676), county('西湖区', 115.875, 28.652)]),
  city('赣州市', 114.940, 25.831, [county('章贡区', 114.940, 25.831)]),
  city('九江市', 116.000, 29.705, [county('浔阳区', 116.000, 29.705)]),
];

const shandongCities: City[] = [
  city('济南市', 117.000, 36.651, [county('历下区', 117.000, 36.651), county('市中区', 117.009, 36.633)]),
  city('青岛市', 120.382, 36.067, [county('市南区', 120.382, 36.067), county('崂山区', 120.426, 36.102)]),
  city('烟台市', 121.448, 37.464, [county('芝罘区', 121.448, 37.464)]),
  city('潍坊市', 119.161, 36.707, [county('奎文区', 119.161, 36.707)]),
  city('济宁市', 116.587, 35.415, [county('任城区', 116.587, 35.415)]),
];

const henanCities: City[] = [
  city('郑州市', 113.625, 34.746, [county('金水区', 113.625, 34.746), county('二七区', 113.635, 34.718)]),
  city('洛阳市', 112.454, 34.619, [county('西工区', 112.454, 34.619), county('涧西区', 112.380, 34.633)]),
  city('开封市', 114.307, 34.797, [county('龙亭区', 114.307, 34.797)]),
  city('南阳市', 112.528, 33.000, [county('卧龙区', 112.528, 33.000)]),
];

const hubeiCities: City[] = [
  city('武汉市', 114.305, 30.593, [county('武昌区', 114.305, 30.593), county('江汉区', 114.271, 30.601), county('洪山区', 114.344, 30.500)]),
  city('宜昌市', 111.286, 30.692, [county('西陵区', 111.286, 30.692)]),
  city('襄阳市', 112.144, 32.042, [county('襄城区', 112.144, 32.042)]),
];

const hunanCities: City[] = [
  city('长沙市', 112.982, 28.194, [county('岳麓区', 112.982, 28.194), county('芙蓉区', 112.978, 28.203), county('天心区', 112.980, 28.144)]),
  city('岳阳市', 113.128, 29.356, [county('岳阳楼区', 113.128, 29.356)]),
  city('衡阳市', 112.573, 26.893, [county('雁峰区', 112.573, 26.893)]),
];

const guangdongCities: City[] = [
  city('广州市', 113.264, 23.129, [county('越秀区', 113.264, 23.129), county('天河区', 113.361, 23.124), county('海珠区', 113.317, 23.084)]),
  city('深圳市', 114.085, 22.547, [county('福田区', 114.085, 22.547), county('南山区', 113.930, 22.533), county('罗湖区', 114.131, 22.548)]),
  city('珠海市', 113.553, 22.224, [county('香洲区', 113.553, 22.224)]),
  city('佛山市', 113.122, 23.021, [county('禅城区', 113.122, 23.021)]),
  city('东莞市', 113.751, 23.020, [county('南城街道', 113.751, 23.020)]),
  city('中山市', 113.392, 22.517, [county('石岐街道', 113.392, 22.517)]),
  city('惠州市', 114.416, 23.111, [county('惠城区', 114.416, 23.111)]),
  city('汕头市', 116.681, 23.354, [county('金平区', 116.681, 23.354)]),
  city('江门市', 113.081, 22.578, [county('蓬江区', 113.081, 22.578)]),
  city('湛江市', 110.359, 21.270, [county('赤坎区', 110.359, 21.270)]),
];

const guangxiCities: City[] = [
  city('南宁市', 108.320, 22.824, [county('青秀区', 108.320, 22.824), county('西乡塘区', 108.281, 22.850)]),
  city('桂林市', 110.299, 25.274, [county('象山区', 110.299, 25.274), county('七星区', 110.310, 25.265)]),
  city('柳州市', 109.415, 24.327, [county('城中区', 109.415, 24.327)]),
];

const hainanCities: City[] = [
  city('海口市', 110.331, 20.031, [county('龙华区', 110.331, 20.031), county('美兰区', 110.371, 20.028)]),
  city('三亚市', 109.511, 18.247, [county('吉阳区', 109.511, 18.247), county('天涯区', 109.479, 18.210)]),
  city('三沙市', 112.339, 16.837, [county('永兴岛', 112.339, 16.837)]),
];

const sichuanCities: City[] = [
  city('成都市', 104.066, 30.572, [county('锦江区', 104.080, 30.655), county('武侯区', 104.043, 30.640), county('青羊区', 104.066, 30.672)]),
  city('绵阳市', 104.679, 31.468, [county('涪城区', 104.679, 31.468)]),
  city('德阳市', 104.398, 31.127, [county('旌阳区', 104.398, 31.127)]),
  city('宜宾市', 104.630, 28.760, [county('翠屏区', 104.630, 28.760)]),
];

const guizhouCities: City[] = [
  city('贵阳市', 106.713, 26.578, [county('观山湖区', 106.630, 26.650), county('南明区', 106.713, 26.578)]),
  city('遵义市', 106.907, 27.725, [county('红花岗区', 106.907, 27.725)]),
  city('六盘水市', 104.831, 26.593, [county('钟山区', 104.831, 26.593)]),
];

const yunnanCities: City[] = [
  city('昆明市', 102.712, 25.040, [county('五华区', 102.712, 25.040), county('盘龙区', 102.797, 25.046), county('西山区', 102.675, 25.017)]),
  city('大理市', 100.233, 25.606, [county('下关镇', 100.233, 25.606)]),
  city('丽江市', 100.232, 26.855, [county('古城区', 100.232, 26.855)]),
  city('西双版纳景洪市', 100.801, 22.002, [county('景洪市', 100.801, 22.002)]),
];

const xizangCities: City[] = [
  city('拉萨市', 91.132, 29.660, [county('城关区', 91.132, 29.660), county('堆龙德庆区', 91.090, 29.651)]),
  city('日喀则市', 88.880, 29.268, [county('桑珠孜区', 88.880, 29.268)]),
  city('林芝市', 94.362, 29.654, [county('巴宜区', 94.362, 29.654)]),
];

const shaanxiCities: City[] = [
  city('西安市', 108.939, 34.341, [county('雁塔区', 108.939, 34.222), county('碑林区', 108.948, 34.250), county('未央区', 108.940, 34.281)]),
  city('咸阳市', 108.709, 34.329, [county('秦都区', 108.709, 34.329)]),
  city('宝鸡市', 107.237, 34.360, [county('渭滨区', 107.237, 34.360)]),
];

const gansuCities: City[] = [
  city('兰州市', 103.834, 36.061, [county('城关区', 103.834, 36.061), county('七里河区', 103.792, 36.081)]),
  city('天水市', 105.720, 34.580, [county('秦州区', 105.720, 34.580)]),
  city('酒泉市敦煌市', 94.662, 40.142, [county('敦煌市', 94.662, 40.142)]),
];

const qinghaiCities: City[] = [
  city('西宁市', 101.778, 36.617, [county('城西区', 101.778, 36.617), county('城东区', 101.801, 36.621)]),
  city('海东市', 102.103, 36.502, [county('乐都区', 102.103, 36.502)]),
  city('玉树市', 97.009, 33.004, [county('结古街道', 97.009, 33.004)]),
];

const ningxiaCities: City[] = [
  city('银川市', 106.232, 38.487, [county('兴庆区', 106.232, 38.487), county('金凤区', 106.228, 38.472)]),
  city('石嘴山市', 106.386, 39.019, [county('大武口区', 106.386, 39.019)]),
  city('吴忠市', 106.201, 37.986, [county('利通区', 106.201, 37.986)]),
];

const xinjiangCities: City[] = [
  city('乌鲁木齐市', 87.617, 43.825, [county('天山区', 87.617, 43.825), county('沙依巴克区', 87.600, 43.789)]),
  city('喀什市', 75.990, 39.470, [county('喀什市', 75.990, 39.470)]),
  city('伊犁伊宁市', 81.326, 43.923, [county('伊宁市', 81.326, 43.923)]),
  city('克拉玛依市', 84.879, 45.589, [county('克拉玛依区', 84.879, 45.589)]),
];

const neimengguCities: City[] = [
  city('呼和浩特市', 111.751, 40.841, [county('新城区', 111.751, 40.841), county('回民区', 111.650, 40.819)]),
  city('包头市', 109.839, 40.658, [county('昆都仑区', 109.839, 40.658)]),
  city('鄂尔多斯市', 109.781, 39.609, [county('东胜区', 109.781, 39.609)]),
  city('赤峰市', 118.885, 42.258, [county('红山区', 118.885, 42.258)]),
  city('通辽市', 122.254, 43.618, [county('科尔沁区', 122.254, 43.618)]),
];

const taiwanCities: City[] = [
  city('台北市', 121.565, 25.033, [county('中正区', 121.524, 25.032), county('信义区', 121.575, 25.033), county('大安区', 121.538, 25.026)]),
  city('高雄市', 120.301, 22.627, [county('苓雅区', 120.301, 22.627)]),
  city('台中市', 120.674, 24.148, [county('西屯区', 120.644, 24.162)]),
];

const xianggangCities: City[] = [
  city('香港岛', 114.169, 22.319, [county('中西区', 114.156, 22.281), county('湾仔区', 114.172, 22.279), county('东区', 114.223, 22.281)]),
  city('九龙', 114.183, 22.322, [county('油尖旺区', 114.172, 22.315), county('深水埗区', 114.162, 22.331)]),
  city('新界', 114.146, 22.373, [county('沙田区', 114.190, 22.382), county('荃湾区', 114.114, 22.373)]),
];

const aomenCities: City[] = [
  city('澳门', 113.549, 22.199, [county('澳门半岛', 113.549, 22.199), county('氹仔', 113.565, 22.151), county('路环', 113.572, 22.116)]),
];

const provinces: Province[] = [
  province('北京市', 116.407, 39.904, [
    city('北京市', 116.407, 39.904, beijingCounties),
  ]),
  province('天津市', 117.201, 39.114, [
    city('天津市', 117.201, 39.114, tianjinCounties),
  ]),
  province('上海市', 121.473, 31.230, [
    city('上海市', 121.473, 31.230, shanghaiCounties),
  ]),
  province('重庆市', 106.551, 29.563, [
    city('重庆市', 106.551, 29.563, chongqingCounties),
  ]),
  province('河北省', 114.514, 38.042, hebeiCities),
  province('山西省', 112.549, 37.857, shanxiCities),
  province('辽宁省', 123.431, 41.805, liaoningCities),
  province('吉林省', 125.324, 43.886, jilinCities),
  province('黑龙江省', 126.642, 45.756, heilongjiangCities),
  province('江苏省', 118.796, 32.060, jiangsuCities),
  province('浙江省', 120.153, 30.287, zhejiangCities),
  province('安徽省', 117.282, 31.866, anhuiCities),
  province('福建省', 119.296, 26.074, fujianCities),
  province('江西省', 115.892, 28.676, jiangxiCities),
  province('山东省', 117.000, 36.651, shandongCities),
  province('河南省', 113.625, 34.746, henanCities),
  province('湖北省', 114.305, 30.593, hubeiCities),
  province('湖南省', 112.982, 28.194, hunanCities),
  province('广东省', 113.264, 23.129, guangdongCities),
  province('广西壮族自治区', 108.320, 22.824, guangxiCities),
  province('海南省', 110.331, 20.031, hainanCities),
  province('四川省', 104.066, 30.572, sichuanCities),
  province('贵州省', 106.713, 26.578, guizhouCities),
  province('云南省', 102.712, 25.040, yunnanCities),
  province('西藏自治区', 91.132, 29.660, xizangCities),
  province('陕西省', 108.939, 34.341, shaanxiCities),
  province('甘肃省', 103.834, 36.061, gansuCities),
  province('青海省', 101.778, 36.617, qinghaiCities),
  province('宁夏回族自治区', 106.232, 38.487, ningxiaCities),
  province('新疆维吾尔自治区', 87.617, 43.825, xinjiangCities),
  province('内蒙古自治区', 111.751, 40.841, neimengguCities),
  province('台湾省', 121.565, 25.033, taiwanCities),
  province('香港特别行政区', 114.169, 22.319, xianggangCities),
  province('澳门特别行政区', 113.549, 22.199, aomenCities),
];

export const CHINA_COUNTRY: Country = {
  code: 'CN',
  name: '中国',
  defaultTimezone: TZ,
  defaultTimezoneOffsetMin: OFFSET,
  majorCities: [
    city('北京市', 116.407, 39.904, beijingCounties),
    city('上海市', 121.473, 31.230, shanghaiCounties),
    city('广州市', 113.264, 23.129, guangdongCities[0].counties),
    city('深圳市', 114.085, 22.547, guangdongCities[1].counties),
  ],
  provinces,
};
