# 街景尋寶 8-Bit 雙人賓果 (Street Bingo 8-Bit)

一款支援雙人即時連線對戰、8-bit 像素懷舊復古風格的「路上尋寶賓果遊戲」。

---

## 🎮 遊戲玩法特色

1. **8-Bit 像素懷舊風格**：
   - 經典 NES 街機像素 UI 與動態按鈕。
   - 內建 12 款精美 8-bit 像素頭像（柴犬、三花貓、偵探、外送騎士、機器人、滑板少年等）。
   - Web Audio API 8-Bit 復古合成音效（按鈕音、標記音、連線音、BINGO 勝利歡呼）。
2. **街道尋寶自訂卡片與交換機制**：
   - 雙方進入房間後，由系統**隨機挑選一位玩家決定卡格數（4×4、5×5、6×6）**。
   - 內建 60+ 種街道日常觀察詞庫（涵蓋交通、人物穿搭、街道設施、動物、街頭細節），亦可自行輸入自訂題目或隨機填滿。
   - 雙方確認 Ready 後，系統將**互換雙方填寫的卡片**！玩家需在路上尋找對方出的題目。
3. **雙人即時對戰 HUD**：
   - 遊戲過程中可**即時查看雙方進度**（已標記格數、當前完成連線數、即時進度條）。
   - 率先達成 **3 條連線**（橫、直、斜）的玩家即可獲得 BINGO 勝利！
4. **帳號與歷史戰績**：
   - 支援 **Google 帳號登入** 或 **訪客快速遊玩**。
   - Google 登入後可永久保存戰績（包含：勝負結果、獲勝玩家、遊戲時間、遊戲時長、對戰模式等）。
5. **開發與測試模式**：
   - 一般訪客模式：`https://<USERNAME>.github.io/<REPO_NAME>/`（純淨正式對戰介面）。
   - 測試模擬模式：`https://<USERNAME>.github.io/<REPO_NAME>/#/test`（啟用本機雙人模擬試玩與對手模擬打勾測試工具列）。

---

## 🛠️ 技術棧

- **前端框架**：Vue 3 (Composition API + `<script setup>`)
- **構建工具**：Vite
- **狀態管理**：Pinia
- **路由管理**：Vue Router (Hash Mode，支援 `/` 與 `/test` 路由)
- **視覺與特效**：Vanilla CSS 8-Bit Design System + Canvas Confetti
- **音效系統**：Web Audio API 8-Bit 晶片音樂合成器
- **後端與即時同步**：Firebase (Authentication + Cloud Firestore)
- **部署目標**：GitHub Pages (GitHub Actions)
