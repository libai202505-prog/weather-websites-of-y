// scripts/cities.js
export default [
    // 🟢 VIP 城市 (参与计算 + 发微信 + 存数据)
    // tagId: 原企业微信标签ID (保留备用)
    // topic: PushPlus 群组编码
    { name: '北京', id: '101010100', isVip: true, tagId: '1', topic: 'weather_bj' },
    { name: '慈溪', id: '101210402', isVip: true, tagId: '2', topic: 'weather_cx' },

    // 🔵 普通城市 (只存数据用于网页展示，不发微信)
    { name: '上海', id: '101020100' },
    { name: '广州', id: '101280101' },
    { name: '深圳', id: '101280601' },
    { name: '杭州', id: '101210101' },
    { name: '南京', id: '101190101' },
    { name: '成都', id: '101270101' },
    { name: '武汉', id: '101200101' },
    { name: '西安', id: '101110101' },
    { name: '重庆', id: '101040100' },
    { name: '哈尔滨', id: '101050101' },
    { name: '沈阳', id: '101070101' },
    { name: '昆明', id: '101290101' },
    { name: '厦门', id: '101230201' },
    { name: '漳浦', id: '101230607' },
    { name: '宁波', id: '101210401' },
    { name: '青岛', id: '101120201' },
    { name: '大连', id: '101070201' },
];
