<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { useAuthStore } from '@/stores/authStore'
import { useSound } from '@/composables/useSound'
import { STREET_ITEMS_CATEGORIES, getRandomStreetItems } from '@/composables/useStreetItems'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()
const authStore = useAuthStore()
const { playClick, playMark, playBeep } = useSound()

const roomId = computed(() => route.params.roomId || gameStore.roomId)
const size = computed(() => gameStore.gridSize || 5)
const totalCells = computed(() => size.value * size.value)

// 編輯中的項目陣列
const draftItems = ref(Array(totalCells.value).fill(''))
const selectedCellIndex = ref(0)
const customInputText = ref('')
const activeCategoryTab = ref('transport')
const isReady = ref(false)

onMounted(() => {
  // 預設隨機填滿一組作為基礎，讓玩家可直接開始或自訂微調
  handleRandomFill()
})

// 監聽房間狀態變更，若雙方皆 Ready 進入 PLAYING，前往對戰畫面
watch(() => gameStore.roomStatus, (newStatus) => {
  if (newStatus === 'PLAYING') {
    router.push(`/game/${roomId.value}`)
  }
})

const filledCount = computed(() => {
  return draftItems.value.filter(item => item && item.trim().length > 0).length
})

const isAllFilled = computed(() => {
  return filledCount.value === totalCells.value
})

function handleCellClick(index) {
  playClick()
  selectedCellIndex.value = index
  customInputText.value = draftItems.value[index] || ''
}

function handleSelectItem(itemName) {
  playMark()
  draftItems.value[selectedCellIndex.value] = itemName
  // 自動跳到下一個未填寫的格子
  const nextEmpty = draftItems.value.findIndex((val, idx) => idx > selectedCellIndex.value && !val)
  if (nextEmpty !== -1) {
    selectedCellIndex.value = nextEmpty
    customInputText.value = draftItems.value[nextEmpty] || ''
  } else {
    // 循環尋找第一個空的
    const firstEmpty = draftItems.value.findIndex(val => !val)
    if (firstEmpty !== -1) {
      selectedCellIndex.value = firstEmpty
      customInputText.value = draftItems.value[firstEmpty] || ''
    }
  }
}

function handleApplyCustomText() {
  if (!customInputText.value.trim()) return
  playMark()
  draftItems.value[selectedCellIndex.value] = customInputText.value.trim()
  customInputText.value = ''
  // 找下一個空位
  const nextEmpty = draftItems.value.findIndex(val => !val)
  if (nextEmpty !== -1) {
    selectedCellIndex.value = nextEmpty
  }
}

function handleRandomFill() {
  playClick()
  const randoms = getRandomStreetItems(totalCells.value)
  draftItems.value = [...randoms]
}

function handleClearAll() {
  playClick()
  draftItems.value = Array(totalCells.value).fill('')
  selectedCellIndex.value = 0
  customInputText.value = ''
}

const isTestMode = computed(() => {
  return gameStore.isLocalMode || 
         route.path.includes('/test') || 
         window.location.hash.includes('/test') || 
         route.query.test === 'true' || 
         route.meta?.isTestMode
})

async function handleSimulateOpponentReady() {
  playClick()
  playBeep()
  await gameStore.simulateOpponentReadyAndPlay()
  router.push(`/game/${roomId.value}`)
}

async function handleConfirmReady() {
  if (!isAllFilled.value) return
  playClick()
  playBeep()
  isReady.value = true
  await gameStore.submitDraftCard(draftItems.value)
  
  // 若為測試模式或本機模式，自動幫對手就緒並進入遊戲
  if (isTestMode.value || gameStore.isLocalMode) {
    if (gameStore.roomStatus !== 'PLAYING') {
      await gameStore.simulateOpponentReadyAndPlay()
    }
    router.push(`/game/${roomId.value}`)
  } else if (gameStore.roomStatus === 'PLAYING') {
    router.push(`/game/${roomId.value}`)
  }
}
</script>

<template>
  <div class="fill-card-container">
    <!-- Top Header -->
    <header class="fill-header">
      <div class="header-left">
        <span class="pixel-tag pixel-tag-gold">{{ size }} × {{ size }} 模式</span>
        <h2 class="title">出題：填寫街景賓果卡</h2>
      </div>
      <div class="header-right">
        <span class="progress-badge" :class="{ 'is-full': isAllFilled }">
          進度: {{ filledCount }} / {{ totalCells }}
        </span>
      </div>
    </header>

    <p class="rule-hint">
      💡 提示：您填寫的這張卡片將於雙方準備就緒後<strong>交換給對手尋寶</strong>！發揮創意出題考驗對方吧！
    </p>

    <!-- Main Content: Grid + Word Pool -->
    <div class="fill-workspace">
      <!-- Left: Bingo Grid Canvas -->
      <div class="grid-section pixel-box">
        <div class="grid-toolbar">
          <button class="pixel-btn pixel-btn-secondary mini-btn" @click="handleRandomFill">
            🎲 隨機街景填滿
          </button>
          <button class="pixel-btn pixel-btn-secondary mini-btn" @click="handleClearAll">
            🧹 清空
          </button>
        </div>

        <div 
          class="bingo-grid" 
          :style="{ gridTemplateColumns: `repeat(${size}, 1fr)` }"
        >
          <div 
            v-for="(item, idx) in draftItems" 
            :key="idx" 
            class="bingo-cell"
            :class="{ 
              'is-selected': selectedCellIndex === idx,
              'has-content': Boolean(item)
            }"
            @click="handleCellClick(idx)"
          >
            <span class="cell-num">{{ idx + 1 }}</span>
            <span class="cell-text">{{ item || '點擊填寫' }}</span>
          </div>
        </div>
      </div>

      <!-- Right: Item Selection & Custom Input Drawer -->
      <div class="item-drawer pixel-box pixel-box-blue">
        <div class="drawer-header">
          <span class="drawer-title">📌 第 {{ selectedCellIndex + 1 }} 格內容：</span>
          <span class="current-selected-preview">{{ draftItems[selectedCellIndex] || '(目前為空)' }}</span>
        </div>

        <!-- Custom Input -->
        <div class="custom-input-box">
          <input 
            type="text" 
            class="pixel-input custom-input" 
            v-model="customInputText" 
            placeholder="自行輸入街景小物..."
            maxlength="10"
            @keyup.enter="handleApplyCustomText"
          />
          <button class="pixel-btn pixel-btn-green apply-btn" @click="handleApplyCustomText">
            填入
          </button>
        </div>

        <!-- Categories Navigation -->
        <div class="category-tabs">
          <button 
            v-for="cat in STREET_ITEMS_CATEGORIES" 
            :key="cat.id" 
            class="cat-tab"
            :class="{ active: activeCategoryTab === cat.id }"
            @click="activeCategoryTab = cat.id"
          >
            {{ cat.name }}
          </button>
        </div>

        <!-- Items Pool List -->
        <div class="items-list-container">
          <template v-for="cat in STREET_ITEMS_CATEGORIES" :key="cat.id">
            <div v-if="activeCategoryTab === cat.id" class="items-chip-grid">
              <button 
                v-for="itemName in cat.items" 
                :key="itemName" 
                class="item-chip-btn"
                @click="handleSelectItem(itemName)"
              >
                {{ itemName }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Bottom Submit Bar -->
    <div class="bottom-action-bar">
      <!-- Test Mode Quick Helper -->
      <div v-if="isTestMode" class="test-fill-bar">
        <button 
          class="pixel-btn pixel-btn-secondary test-skip-btn" 
          @click="handleSimulateOpponentReady"
        >
          🧪 測試模式：模擬對手填卡完成並立即開戰
        </button>
      </div>

      <button 
        class="pixel-btn pixel-btn-gold ready-submit-btn" 
        :disabled="!isAllFilled || isReady"
        @click="handleConfirmReady"
      >
        <span v-if="isReady" class="anim-pulse">⏳ 已準備完成！等待對手填寫完畢...</span>
        <span v-else-if="!isAllFilled">⚠️ 請先填滿所有 {{ totalCells }} 格 (剩餘 {{ totalCells - filledCount }} 格)</span>
        <span v-else>🚀 準備就緒！交換卡片開始尋寶</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.fill-card-container {
  max-width: 880px;
  margin: 0 auto;
  padding: 16px 16px 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.fill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 20px;
  color: #fff;
  margin-top: 4px;
}

.progress-badge {
  font-family: var(--font-pixel-en);
  font-size: 13px;
  padding: 6px 12px;
  background: var(--pixel-bg-card-alt);
  border: 2px solid #000;
  color: var(--pixel-gold);
}

.progress-badge.is-full {
  background: var(--pixel-green);
  color: #fff;
}

.rule-hint {
  font-size: 13px;
  color: var(--pixel-text-dim);
  background: rgba(0, 0, 0, 0.3);
  padding: 8px 12px;
  border-left: 4px solid var(--pixel-gold);
}

.fill-workspace {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 768px) {
  .fill-workspace {
    grid-template-columns: 1fr;
  }
}

.grid-section {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.grid-toolbar {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.mini-btn {
  font-size: 11px;
  padding: 4px 8px;
}

.bingo-grid {
  display: grid;
  gap: 6px;
  aspect-ratio: 1 / 1;
  width: 100%;
}

.bingo-cell {
  background: var(--pixel-bg-dark);
  border: 2px solid #3a3f58;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px;
  cursor: pointer;
  position: relative;
  transition: all 0.1s ease;
  overflow: hidden;
  text-align: center;
}

.bingo-cell:hover {
  border-color: var(--pixel-gold);
}

.bingo-cell.is-selected {
  border: 3px solid var(--pixel-gold);
  background: #242b45;
  box-shadow: inset 0 0 0 2px var(--pixel-gold);
}

.bingo-cell.has-content {
  background: var(--pixel-bg-card-alt);
}

.cell-num {
  position: absolute;
  top: 2px;
  left: 4px;
  font-family: var(--font-pixel-en);
  font-size: 9px;
  color: var(--pixel-text-dim);
}

.cell-text {
  font-size: 11px;
  font-weight: bold;
  color: #fff;
  line-height: 1.2;
  word-break: break-all;
}

.item-drawer {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #000;
  padding-bottom: 6px;
}

.drawer-title {
  font-size: 13px;
  color: var(--pixel-blue);
  font-weight: bold;
}

.current-selected-preview {
  font-size: 13px;
  color: var(--pixel-gold);
  font-weight: bold;
}

.custom-input-box {
  display: flex;
  gap: 8px;
}

.custom-input {
  font-size: 13px;
  padding: 6px 10px;
}

.apply-btn {
  font-size: 12px;
  padding: 6px 12px;
  white-space: nowrap;
}

.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.cat-tab {
  font-family: var(--font-pixel-zh);
  font-size: 11px;
  padding: 4px 8px;
  background: #1e2233;
  color: var(--pixel-text-dim);
  border: 2px solid #000;
  cursor: pointer;
}

.cat-tab.active {
  background: var(--pixel-blue-dark);
  color: #fff;
  border-color: var(--pixel-gold);
}

.items-list-container {
  flex: 1;
  max-height: 280px;
  overflow-y: auto;
  background: #11131c;
  border: 2px solid #000;
  padding: 8px;
}

.items-chip-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 6px;
}

.item-chip-btn {
  font-family: var(--font-pixel-zh);
  font-size: 11px;
  padding: 6px 4px;
  background: var(--pixel-bg-card-alt);
  color: #fff;
  border: 2px solid #2b3048;
  cursor: pointer;
  text-align: center;
  transition: all 0.1s ease;
}

.item-chip-btn:hover {
  background: var(--pixel-blue-dark);
  border-color: var(--pixel-gold);
}

.bottom-action-bar {
  text-align: center;
}

.test-fill-bar {
  margin-bottom: 10px;
}

.test-skip-btn {
  font-size: 12px;
  width: 100%;
  color: #e0aaff;
  border-color: #7b2cbf;
}

.ready-submit-btn {
  width: 100%;
  padding: 14px;
  font-size: 16px;
}
</style>
