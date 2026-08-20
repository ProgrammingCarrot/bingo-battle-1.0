<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { useAuthStore } from '@/stores/authStore'
import { useSound } from '@/composables/useSound'
import PixelAvatar from '@/components/PixelAvatar.vue'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()
const authStore = useAuthStore()
const { playClick, playBeep } = useSound()

const roomId = computed(() => route.params.roomId || gameStore.roomId)
const copySuccess = ref(false)

const isTestMode = computed(() => {
  return gameStore.isTestMode ||
         gameStore.isLocalMode || 
         route.path.includes('/test') || 
         window.location.hash.includes('/test') || 
         window.location.hash.includes('test=') ||
         route.query?.test === 'true' || 
         route.query?.test === '1' ||
         route.meta?.isTestMode
})

// 監聽房間狀態變更，若進入 FILLING 則前往填寫頁面
watch(() => gameStore.roomStatus, (newStatus) => {
  if (newStatus === 'FILLING' || newStatus === 'PLAYING') {
    router.push({ path: `/fill/${roomId.value}`, query: route.query })
  }
})

function copyRoomCode() {
  playClick()
  navigator.clipboard.writeText(roomId.value)
  copySuccess.value = true
  setTimeout(() => {
    copySuccess.value = false
  }, 2000)
}

function handleSelectSize(size) {
  playClick()
  playBeep()
  gameStore.selectGridSize(size)
  router.push({ path: `/fill/${roomId.value}`, query: route.query })
}

async function handleSimulateOpponentJoin() {
  playClick()
  playBeep()
  await gameStore.simulateOpponentJoin()
}

async function handleLeaveRoom() {
  playClick()
  await gameStore.leaveRoom()
  router.push('/')
}
</script>

<template>
  <div class="lobby-container">
    <!-- Header -->
    <div class="lobby-header">
      <button class="pixel-btn pixel-btn-secondary back-btn" @click="handleLeaveRoom">
        ← 離開
      </button>
      <div class="room-code-badge pixel-box pixel-box-gold" @click="copyRoomCode">
        <span class="badge-label">房號：</span>
        <span class="badge-code">{{ roomId }}</span>
        <span class="copy-hint">{{ copySuccess ? '✓ 已複製' : '📋 點擊複製' }}</span>
      </div>
    </div>

    <!-- Players Versus Stage -->
    <div class="versus-stage pixel-box">
      <div class="stage-title">👥 對戰玩家名冊</div>

      <div class="players-row">
        <!-- Player 1 -->
        <div class="player-slot active">
          <div class="slot-badge">房主 (P1)</div>
          <PixelAvatar :avatar-id="gameStore.player1?.avatar || authStore.avatarId" :size="64" />
          <span class="slot-name">{{ gameStore.player1?.name || authStore.nickname }}</span>
          <span class="status-tag tag-ready">已就緒</span>
        </div>

        <div class="vs-divider">
          <span class="vs-text anim-pulse">VS</span>
        </div>

        <!-- Player 2 -->
        <div class="player-slot" :class="{ active: Boolean(gameStore.player2) }">
          <div class="slot-badge">挑戰者 (P2)</div>
          <template v-if="gameStore.player2">
            <PixelAvatar :avatar-id="gameStore.player2.avatar" :size="64" />
            <span class="slot-name">{{ gameStore.player2.name }}</span>
            <span class="status-tag tag-ready">已加入</span>
          </template>
          <template v-else>
            <div class="empty-avatar">?</div>
            <span class="slot-name dim">等待玩家加入...</span>
            <span class="status-tag tag-waiting anim-pulse">WAITING</span>
          </template>
        </div>
      </div>
    </div>

    <!-- Stage 2: Select Grid Size Decision -->
    <div class="size-selection-card pixel-box">
      <!-- Waiting for 2nd player -->
      <div v-if="!gameStore.player2" class="waiting-box">
        <h3 class="box-title anim-pulse">⏳ 正在等待第二位玩家進入房間...</h3>
        <p class="box-desc">請將房號 <strong>{{ roomId }}</strong> 分享給好友，雙方進入後將由系統隨機指派一人決定賓果格數！</p>
        
        <!-- Test Mode Helper -->
        <div v-if="isTestMode" class="test-lobby-helper">
          <button class="pixel-btn pixel-btn-secondary test-join-btn" @click="handleSimulateOpponentJoin">
            🧪 測試模式：模擬對手 (AI) 立即加入房間
          </button>
        </div>
      </div>

      <!-- Turn to choose size -->
      <div v-else-if="gameStore.isMyTurnToChooseSize" class="choose-box">
        <div class="choose-header">
          <span class="pixel-tag pixel-tag-gold">🎲 系統抽中了您！</span>
          <h3 class="choose-title">請選擇本局賓果卡格數：</h3>
        </div>

        <div class="size-buttons-grid">
          <button class="pixel-btn pixel-btn-gold size-btn" @click="handleSelectSize(4)">
            <span class="size-num">4 × 4</span>
            <span class="size-desc">16 格 (快速節奏)</span>
          </button>

          <button class="pixel-btn pixel-btn-blue size-btn" @click="handleSelectSize(5)">
            <span class="size-num">5 × 5</span>
            <span class="size-desc">25 格 (經典標準)</span>
          </button>

          <button class="pixel-btn pixel-btn-green size-btn" @click="handleSelectSize(6)">
            <span class="size-num">6 × 6</span>
            <span class="size-desc">36 格 (深度尋寶)</span>
          </button>
        </div>
      </div>

      <!-- Waiting for opponent to choose size -->
      <div v-else class="waiting-opponent-box">
        <span class="pixel-tag pixel-tag-blue">🎲 系統抽中 {{ gameStore.chooserPlayerName }}</span>
        <h3 class="box-title anim-pulse">等待對方選擇賓果格數 (4x4、5x5 或 6x6)...</h3>
        <p class="box-desc">格數選定後將立即開放填寫街景賓果卡！</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lobby-container {
  max-width: 680px;
  margin: 0 auto;
  padding: 16px 16px 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.lobby-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-btn {
  font-size: 12px;
}

.room-code-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  cursor: pointer;
}

.badge-label {
  font-size: 12px;
  color: var(--pixel-text-dim);
}

.badge-code {
  font-family: var(--font-pixel-en);
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  letter-spacing: 2px;
}

.copy-hint {
  font-size: 11px;
  color: var(--pixel-gold);
}

.versus-stage {
  padding: 16px;
}

.stage-title {
  font-size: 14px;
  color: var(--pixel-gold);
  border-bottom: 2px solid #000;
  padding-bottom: 8px;
  margin-bottom: 16px;
}

.players-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 12px;
}

.player-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: var(--pixel-bg-card-alt);
  border: 3px solid #000;
  padding: 14px 20px;
  min-width: 140px;
}

.player-slot.active {
  border-color: var(--pixel-blue);
}

.slot-badge {
  font-size: 11px;
  color: var(--pixel-text-dim);
}

.slot-name {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
}

.slot-name.dim {
  color: var(--pixel-text-dim);
  font-size: 12px;
}

.empty-avatar {
  width: 64px;
  height: 64px;
  background: #11131c;
  border: 3px dashed #3a3f58;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--pixel-text-dim);
}

.status-tag {
  font-size: 11px;
  padding: 2px 6px;
  border: 2px solid #000;
}

.tag-ready {
  background: var(--pixel-green);
  color: #fff;
}

.tag-waiting {
  background: #3b4259;
  color: #a0aec0;
}

.vs-divider {
  display: flex;
  align-items: center;
  justify-content: center;
}

.vs-text {
  font-family: var(--font-pixel-en);
  font-size: 20px;
  color: var(--pixel-red);
  text-shadow: 2px 2px #000;
}

.size-selection-card {
  padding: 20px;
  text-align: center;
}

.box-title {
  font-size: 16px;
  color: #fff;
  margin: 12px 0 8px;
}

.box-desc {
  font-size: 13px;
  color: var(--pixel-text-dim);
}

.test-lobby-helper {
  margin-top: 14px;
}

.test-join-btn {
  font-size: 12px;
  color: #e0aaff;
  border-color: #7b2cbf;
}

.choose-header {
  margin-bottom: 16px;
}

.choose-title {
  font-size: 17px;
  color: #fff;
  margin-top: 8px;
}

.size-buttons-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

@media (max-width: 500px) {
  .size-buttons-grid {
    grid-template-columns: 1fr;
  }
}

.size-btn {
  display: flex;
  flex-direction: column;
  padding: 14px 10px;
}

.size-num {
  font-family: var(--font-pixel-en);
  font-size: 18px;
  margin-bottom: 4px;
}

.size-desc {
  font-size: 12px;
  opacity: 0.9;
}
</style>
