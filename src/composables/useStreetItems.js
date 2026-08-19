/**
 * 街道尋寶詞庫系統 (Street Bingo Items Pool)
 */

export const STREET_ITEMS_CATEGORIES = [
  {
    id: 'transport',
    name: '🚗 交通與道路',
    items: [
      '黃色計程車', '外送機車保溫箱', '三角錐路障', '公車站牌', '紅色消防栓',
      '反光凸透鏡', '腳踏車停靠', '斑馬線上的行人', '重型機車', '警車或巡邏箱',
      '紅綠燈秒數為整數', '雙載機車', '車頂有行李架', '路邊停車收費單', '綠色公車'
    ]
  },
  {
    id: 'people',
    name: '🚶 人物與穿搭',
    items: [
      '戴墨鏡的人', '戴鴨舌帽的人', '牽狗散步的人', '低頭專心滑手機', '慢跑運動的人',
      '穿螢光色衣服', '推嬰兒車的家長', '撐遮陽傘的人', '背超大後背包', '戴全罩安全帽',
      '穿拖鞋散步', '手拿手搖飲料', '戴耳罩式耳機', '穿西裝打領帶', '揹相機拍照的人'
    ]
  },
  {
    id: 'store_facility',
    name: '🏪 商店與街道設施',
    items: [
      '便利超商招牌', '手搖飲料店', '紅色郵筒', '夾娃娃機店', '台電變電箱',
      '自動販賣機', '彩券行黃色招牌', '路邊長椅', '工程施工圍籬', '排隊等紅燈人群',
      '藥妝店門口促銷', '早餐店飄香', '投幣式洗衣店', '大樓管理室警衛', '路標指示牌'
    ]
  },
  {
    id: 'nature_animal',
    name: '🐾 動物與自然',
    items: [
      '路邊悠閒野貓', '斑馬線上的鴿子', '戴安全帽坐機車的狗', '麻雀停在電線桿', '路旁盛開的花',
      '路樹下的落葉堆', '電線桿上的鳥巢', '毛茸茸的寵物犬', '蝴蝶或蜜蜂飛過', '陽光穿透樹葉光斑'
    ]
  },
  {
    id: 'details',
    name: '🔍 街頭小細節',
    items: [
      '特色彩繪人孔蓋', '地上的反光標線', '路面積水倒影', '騎樓下的盆栽', '貼著出租的紅紙',
      '外送員正在取餐', '路邊電動車充電中', '店家門口招財貓', '正在倒車的嗶嗶聲', '街頭廣告招牌亮燈'
    ]
  }
]

// 扁平化全部項目
export const ALL_STREET_ITEMS = STREET_ITEMS_CATEGORIES.flatMap(cat => cat.items)

/**
 * 隨機抽取 N 個不重複項目
 * @param {number} count 
 * @returns {string[]}
 */
export function getRandomStreetItems(count) {
  const shuffled = [...ALL_STREET_ITEMS].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}
