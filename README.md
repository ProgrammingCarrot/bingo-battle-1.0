# 街景尋寶 8-Bit 雙人賓果 (Street Bingo 8-Bit)

[![Vue 3](https://img.shields.io/badge/Vue-3.x-42b883.svg?style=flat-square&logo=vue.js)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFA611.svg?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![GitHub Pages](https://img.shields.io/badge/Deployed-GitHub%20Pages-222222.svg?style=flat-square&logo=github)](https://programmingcarrot.github.io/bingo-battle-1.0/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

一款支援雙人即時線上對戰、8-Bit 復古街機像素風格的「路上尋寶賓果遊戲」。邊散步邊觀察生活周遭的小物，率先連成 3 條線取得勝利！

---

## 🌐 線上直接遊玩

- 🎮 **正式對戰模式**：[https://programmingcarrot.github.io/bingo-battle-1.0/](https://programmingcarrot.github.io/bingo-battle-1.0/)  
  *(純淨無除錯按鈕，支援雙人開房、輸入 6 碼房號連線對戰、Google 登入保存戰績)*
- 🧪 **開發測試模式**：[https://programmingcarrot.github.io/bingo-battle-1.0/#/test](https://programmingcarrot.github.io/bingo-battle-1.0/#/test)  
  *(啟用免連線的「⚡ 本機雙人模擬試玩」與對戰中「🤖 模擬對手打勾」除錯工具列)*

---

## 🕹️ 遊戲玩法與特色

### 1. 8-Bit 像素懷舊美術與音效
- **像素視覺系統**：經典復古 NES 街機按鈕、狀態標籤與彈窗。
- **12 款像素角色頭像**：包含柴犬、三花貓、名偵探、外送騎士、蒸氣機器人、像素少年等。
- **晶片音效合成器**：使用 Web Audio API 即時合成 8-bit 晶片音效（按鈕點擊音、尋寶打勾音、連線達成音、勝利金幣歡呼音），無需額外載入龐大音效檔。

### 2. 生活尋寶題庫與交換卡片出題機制
- **隨機指定裁判**：進入房間後，系統隨機選出一名玩家決定賓果盤大小（**4×4**、**5×5** 或 **6×6**）。
- **豐富街景詞庫**：內建 60+ 項街道日常觀察物（交通工具、穿搭特徵、路標設施、店鋪特色、流浪動物等），可隨機抽取或自行輸入自訂題目。
- **卡片交換機制**：雙方各自填滿出題卡並按下 Ready 後，系統會**將彼此的卡片互換**！玩家必須在現實生活中尋找「對方所出的觀察物」。

### 3. 即時對戰 HUD 與 3 線勝利判定
- **即時進度同步**：即時顯示雙方的當前完成連線數、已標記格數與即時血量進度條。
- **3 條線獲勝 (BINGO)**：無論橫線、直線、對角斜線，率先達成 3 條連線者即奪得本場勝利，並伴隨慶祝紙花特效。

### 4. 彈性身分認證與歷史戰績
- **Google 帳號登入**：點擊一鍵登入，自動同步雲端歷史戰績（勝負結果、獲勝者、耗時秒數、對戰時間）。
- **無感匿名訪客**：進入網頁即自動建立安全的匿名 Token，免登入即可開房與加入房間。

---

## 🛠️ 技術棧 (Tech Stack)

| 領域 | 技術 / 工具 |
| :--- | :--- |
| **前端框架** | [Vue 3](https://vuejs.org/) (Composition API + `<script setup>`) |
| **構建工具** | [Vite 6](https://vitejs.dev/) |
| **狀態管理** | [Pinia](https://pinia.vuejs.org/) |
| **路由管理** | [Vue Router 4](https://router.vuejs.org/) (Hash Mode `createWebHashHistory`) |
| **後端資料庫** | [Google Cloud Firestore](https://firebase.google.com/docs/firestore) (即時同步 `onSnapshot`) |
| **身分驗證** | [Firebase Authentication](https://firebase.google.com/docs/auth) (Google 登入 + 匿名登入) |
| **音效系統** | Web Audio API (動態 8-Bit 晶片音樂合成) |
| **特效函式庫** | [canvas-confetti](https://www.npmjs.com/package/canvas-confetti) |
| **自動化部署** | GitHub Actions 配合 GitHub Pages |

---

## 📁 專案檔案結構

```text
Project/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages 自動建構部署工作流程
├── src/
│   ├── App.vue                 # 根元件與主題佈局
│   ├── main.js                 # 應用入口 (Vue, Pinia, Router)
│   ├── router/
│   │   └── index.js            # 路由定義 (含 / 與 /test)
│   ├── components/             # 8-Bit 像素元件
│   │   ├── PixelAvatar.vue     # 像素角色頭像渲染器
│   │   ├── ResultModal.vue     # 勝負結算彈窗與紙花特效
│   │   └── HistoryModal.vue    # 個人戰績面板
│   ├── views/                  # 頁面視圖
│   │   ├── HomeView.vue        # 首頁 (角色設定、開房、加房、測試入口)
│   │   ├── LobbyView.vue       # 等候大廳 (隨機選人、格數挑選)
│   │   ├── FillCardView.vue    # 出題填卡 (詞庫選取、隨機填滿、換卡)
│   │   └── GameBoardView.vue   # 尋寶對戰主棋盤 (即時 HUD、打勾、3線判定)
│   ├── composables/            # 業務邏輯與音效
│   │   ├── useBingoLogic.js    # 連線判定與盤面生成演算法
│   │   ├── useSound.js         # 8-Bit 晶片合成音效
│   │   └── useStreetItems.js   # 60+ 街景尋寶詞庫
│   ├── stores/                 # Pinia 全域狀態
│   │   ├── authStore.js        # 登入、匿名身分與使用者資料
│   │   └── gameStore.js        # 房間狀態、Firestore 即時同步、對戰邏輯
│   ├── services/
│   │   └── firebase.js         # Firebase App, Auth, Firestore 初始化
│   └── assets/
│       ├── avatars/            # 12 款 8-Bit SVG 像素角色
│       └── styles/
│           └── pixel.css       # 8-Bit NES 像素設計系統與按鈕動畫
├── firebase.json               # Firebase 部署配置
├── firestore.rules             # Firestore 安全性存取規則
├── firestore.indexes.json      # 複合查詢索引設定
├── index.html                  # Vite 入口 HTML
├── vite.config.js              # Vite 建構設定 (base: /bingo-battle-1.0/)
├── package.json
├── .env.example                # 環境變數範本
├── .gitignore                  # Git 忽略清單 (資安保護)
└── README.md
```

---

## 🚀 本地開發與安裝指南

### 1. 環境要求
- **Node.js**：`>= 18.0.0`
- **npm**：`>= 9.0.0`

### 2. 安裝依賴套件
```bash
npm install
```

### 3. 配置環境變數
1. 複製環境變數範本檔：
   ```bash
   cp .env.example .env
   ```
2. 開啟 `.env` 並填入您的 Firebase 專案設定：
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
   VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
   ```

### 4. 啟動本機開發伺服器
```bash
npm run dev
```
- 正式版首頁：`http://localhost:5173/`
- 本機除錯模式：`http://localhost:5173/#/test`

### 5. 生產環境打包與本機預覽
```bash
npm run build
npm run preview
```

---

## 🔒 後端與 Firebase 設定

### 1. 啟用 Authentication 登入提供者
在 [Firebase Console](https://console.firebase.google.com/) 的 **Authentication** → **Sign-in method** 中：
- 啟用 **「匿名 (Anonymous)」** 登入。
- 啟用 **「Google」** 登入。
- 前往 **Settings** → **Authorized domains**，新增 GitHub Pages 網域（例如：`programmingcarrot.github.io`）。

### 2. 發布 Firestore 安全性規則
在 **Firestore Database** → **Rules (規則)** 中套用專案內的 [`firestore.rules`](./firestore.rules)：
```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }

    // 房間：允許玩家讀寫；允許房間參與者 (房主/玩家) 刪除已結束或離開的房間
    match /rooms/{roomId} {
      allow read: if isAuthenticated();
      allow create, update: if isAuthenticated();
      allow delete: if isAuthenticated() && (
        resource.data.player1.uid == request.auth.uid ||
        (resource.data.player2 != null && resource.data.player2.uid == request.auth.uid)
      );
    }

    // 戰績：僅允許玩家本人讀取與新增自己的歷史戰績，禁止覆寫或刪除
    match /users/{userId}/history/{gameId} {
      allow read, create: if isAuthenticated() && request.auth.uid == userId;
      allow update, delete: if false;
    }

    // 預設拒絕其餘未定義路徑
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 3. 設定房間 TTL 自動清理 (12 小時過期)
為了防止未正常退出的殭屍房間佔用資料庫容量，可在 Firebase Console 啟用 TTL（免費背景自動刪除）：
1. 前往 **Firestore Database** → **TTL (Time-to-live)** 標籤頁（或 **Indexes / 索引** → **TTL**）。
2. 點擊 **「Create Policy (建立政策)」**。
3. 集合群組（Collection group）填入：`rooms`。
4. 時間戳記欄位（Timestamp field）填入：`expireAt`。
5. 點擊建立。Firestore 將會在房間建立 12 小時後自動清理過期文件。

---

## 🚢 部署至 GitHub Pages

本專案已配置 [GitHub Actions 自動化工作流程](./.github/workflows/deploy.yml)。

1. **設定 GitHub 倉庫**：
   - 前往 GitHub 倉庫的 **Settings** → **Pages**。
   - 在 **Build and deployment** 下方的 **Source** 選擇 **`GitHub Actions`**。
2. **推送更新**：
   - 每次將變更推送到 `main` 分支時，GitHub Actions 會自動執行依賴安裝、生產建構並發布至 GitHub Pages。

---

## ❓ 常見問題排除 (FAQ)

### Q1：手機開啟時提示「找不到房間」或「連線遭拒」？
- 請確認 Firebase Console 中的「匿名登入 (Anonymous)」已經啟用。
- 請確認 Firebase Console 中的「授權網域 (Authorized domains)」已加入 `programmingcarrot.github.io`。

### Q2：一般訪客不想看到任何模擬測試按鈕？
- 直接使用預設網址 `https://<USERNAME>.github.io/<REPO_NAME>/`，所有除錯與測試工具均預設隱藏。
- 僅在網址結尾加上 `#/test` 時才會呼叫測試控制台。

### Q3：重新整理網頁會 404 嗎？
- 本專案採用 Vue Router **Hash Mode (`createWebHashHistory`)**，所有路由帶有 `/#/`，在靜態 GitHub Pages 伺服器上重新整理 100% 不會發生 404。

---

## 📄 開源授權

本專案基於 [MIT License](LICENSE) 條款開源發布。
