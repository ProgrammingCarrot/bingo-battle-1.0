<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { useAuthStore } from '@/stores/authStore'
import { useSound } from '@/composables/useSound'
import PixelAvatar from '@/components/PixelAvatar.vue'
import ResultModal from '@/components/ResultModal.vue'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()
const authStore = useAuthStore()
const { playClick, playMark, playLineMatch } = useSound()

const roomId = computed(() => route.params.roomId || gameStore.roomId)
const size = computed(() => gameStore.gridSize || 5)
const totalCells = computed(() => size.value * size.value)

const isTestMode = computed(() => {
  return gameStore.isLocalMode && (
    route.path.includes('/test') || 
    window.location.hash.includes('/test') || 
    route.query.test === 'true' || 
    route.meta?.isTestMode
  )
})

// 監聽連線數變化，若達成新連線播放連線音效
const prevLineCount = ref(0)
watch(() => gameStore.myEvaluation.lineCount, (newLines) => {
  if (newLines > prevLineCount.value) {
    playLineMatch()
  }
  prevLineCount.value = newLines
})

onMounted(() => {
  // 若未初始化 myBoard 則執行本機或補全
  if (!gameStore.myBoard || gameStore.myBoard.length === 0) {
    if (gameStore.myDraftItems && gameStore.myDraftItems.length > 0) {
      gameStore.startLocalPlaying()
    }
  }
})

// 我的進度百分比
const myProgressPercent = computed(() => {
  const marked = gameStore.myBoard.filter(c => c.marked).length
  return Math.min(100, Math.round((marked / totalCells.value) * 100))
})

// 對手進度百分比
const opponentProgressPercent = computed(() => {
  const marked = gameStore.opponentProgress.markedCount
  return Math.min(100, Math.round((marked / totalCells.value) * 100))
})

// 格式化計時器
const formattedDuration = computed(() => {
  const sec = gameStore.gameDurationSec
  const m = Math.floor(sec / 60).toString().padStart(2, '0')
  const s = (sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

async function handleCellClick(index) {
  playMark()
  await gameStore.toggleMarkCell(index)
}

// 本機模擬對手進度
function handleSimulateOpponentAction() {
  playClick()
  gameStore.opponentProgress.markedCount = Math.min(totalCells.value, gameStore.opponentProgress.markedCount + 1)
  if (gameStore.opponentProgress.markedCount % size.value === 0) {
    gameStore.opponentProgress.lineCount = Math.min(3, gameStore.opponentProgress.lineCount + 1)
  }
  if (gameStore.opponentProgress.lineCount >= 3) {
    const oppRole = gameStore.myPlayerRole === 'player1' ? 'player2' : 'player1'
    const oppPlayer = oppRole === 'player1' ? gameStore.player1 : gameStore.player2
    gameStore.finishGame({
      uid: oppPlayer?.uid || 'opponent_ai',
      name: oppPlayer?.name || '對手',
      avatar: oppPlayer?.avatar || 'calico_cat',
      role: oppRole,
      lineCount: 3
    })
  }
}

function handlePlayAgain() {
  gameStore.resetRoom()
  router.push('/')
}

function handleBackHome() {
  gameStore.resetRoom()
  router.push('/')
}
</script>

<template>
  <div class="game-container">
    <!-- Top Real-time HUD Bar -->
    <header class="game-hud pixel-box">
      <!-- Player 1 (Me) Progress -->
      <div class="hud-player me">
        <div class="player-meta">
          <PixelAvatar :avatar-id="authStore.avatarId" :size="36" />
          <div class="player-info">
            <span class="player-name">{{ authStore.nickname }} (您)</span>
            <div class="lines-badge highlight">
              ★ 連線: <strong>{{ gameStore.myEvaluation.lineCount }} / 3</strong> 條
            </div>
          </div>
        </div>
        <div class="hud-progress-wrapper">
          <div class="pixel-progress-bar">
            <div class="pixel-progress-fill" :style="{ width: `${myProgressPercent}%` }"></div>
          </div>
          <span class="progress-text">{{ gameStore.myBoard.filter(c => c.marked).length }} / {{ totalCells }} 格</span>
        </div>
      </div>

      <!-- Center Timer & VS -->
      <div class="hud-center">
        <div class="timer-badge">
          <span class="timer-icon">⏱</span>
          <span class="timer-value">{{ formattedDuration }}</span>
        </div>
        <span class="goal-hint">先達 3 線獲勝</span>
      </div>

      <!-- Player 2 (Opponent) Progress -->
      <div class="hud-player opponent">
        <div class="player-meta">
          <div class="player-info text-right">
            <span class="player-name">{{ (gameStore.myPlayerRole === 'player1' ? gameStore.player2?.name : gameStore.player1?.name) || '對手' }}</span>
            <div class="lines-badge">
              ★ 連線: <strong>{{ gameStore.opponentProgress.lineCount }} / 3</strong> 條
            </div>
          </div>
          <PixelAvatar :avatar-id="(gameStore.myPlayerRole === 'player1' ? gameStore.player2?.avatar : gameStore.player1?.avatar) || 'calico_cat'" :size="36" />
        </div>
        <div class="hud-progress-wrapper">
          <div class="pixel-progress-bar">
            <div class="pixel-progress-fill opp-fill" :style="{ width: `${opponentProgressPercent}%` }"></div>
          </div>
          <span class="progress-text">{{ gameStore.opponentProgress.markedCount }} / {{ totalCells }} 格</span>
        </div>
      </div>
    </header>

    <!-- Main Bingo Card Screen -->
    <main class="card-stage">
      <div class="stage-header">
        <span class="pixel-tag pixel-tag-green">🔍 街景尋寶中</span>
        <span class="card-origin-hint">題目來源：對手出的考卷</span>
      </div>

      <div 
        class="game-bingo-grid pixel-box" 
        :style="{ gridTemplateColumns: `repeat(${size}, 1fr)` }"
      >
        <div 
          v-for="(cell, idx) in gameStore.myBoard" 
          :key="idx" 
          class="game-cell"
          :class="{ 
            'is-marked': cell.marked,
            'is-winning': gameStore.myEvaluation.winningCellIndices.has(idx)
          }"
          @click="handleCellClick(idx)"
        >
          <!-- Cell Number -->
          <span class="cell-idx">{{ idx + 1 }}</span>

          <!-- Item Text -->
          <span class="item-title">{{ cell.text }}</span>

          <!-- Marked Stamp Overlay -->
          <div v-if="cell.marked" class="marked-stamp anim-bounce">
            <span class="stamp-text">✓ 找到</span>
          </div>
        </div>
      </div>
    </main>

    <!-- Local Mode Dev Bar (Only visible when URL ends with /test) -->
    <div v-if="isTestMode" class="local-dev-bar">
      <div class="test-mode-indicator">
        <span class="pixel-tag pixel-tag-purple">🧪 測試控制台</span>
      </div>
      <button class="pixel-btn pixel-btn-secondary mini-btn" @click="handleSimulateOpponentAction">
        🤖 模擬對手找到 1 項物品
      </button>
    </div>

    <!-- Result Modal (Victory / Defeat) -->
    <ResultModal 
      v-if="gameStore.roomStatus === 'FINISHED'"
      :winner="gameStore.winnerInfo"
      :duration-sec="gameStore.gameDurationSec"
      :my-lines="gameStore.myEvaluation.lineCount"
      :grid-size="size"
      @play-again="handlePlayAgain"
      @back-home="handleBackHome"
    />
  </div>
</template>

<style scoped>
.game-container {
  max-width: 680px;
  margin: 0 auto;
  padding: 12px 12px 30px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.game-hud {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  gap: 8px;
}

.hud-player {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.player-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.opponent .player-meta {
  justify-content: flex-end;
}

.text-right {
  text-align: right;
}

.player-name {
  font-size: 12px;
  font-weight: bold;
  color: #fff;
  display: block;
}

.lines-badge {
  font-family: var(--font-pixel-en);
  font-size: 10px;
  color: var(--pixel-text-dim);
}

.lines-badge.highlight {
  color: var(--pixel-gold);
}

.hud-progress-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.progress-text {
  font-family: var(--font-pixel-en);
  font-size: 9px;
  color: var(--pixel-text-dim);
}

.opp-fill {
  background: repeating-linear-gradient(
    -45deg,
    var(--pixel-red),
    var(--pixel-red) 6px,
    #ffa8a9 6px,
    #ffa8a9 12px
  ) !important;
}

.hud-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 0 8px;
}

.timer-badge {
  font-family: var(--font-pixel-en);
  font-size: 13px;
  background: #000;
  color: var(--pixel-gold);
  border: 2px solid var(--pixel-border);
  padding: 4px 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.goal-hint {
  font-size: 10px;
  color: var(--pixel-gold);
}

.card-stage {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-origin-hint {
  font-size: 12px;
  color: var(--pixel-text-dim);
}

.game-bingo-grid {
  display: grid;
  gap: 6px;
  aspect-ratio: 1 / 1;
  width: 100%;
  padding: 8px;
  background: var(--pixel-bg-card);
}

.game-cell {
  background: #151824;
  border: 3px solid #2d334d;
  box-shadow: inset -2px -2px 0 #000, 2px 2px 0 #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 4px;
  cursor: pointer;
  position: relative;
  transition: all 0.12s ease;
  overflow: hidden;
  text-align: center;
}

.game-cell:hover {
  border-color: var(--pixel-gold);
  transform: translateY(-2px);
}

.game-cell.is-marked {
  background: #1e3a34;
  border-color: var(--pixel-green);
}

.game-cell.is-winning {
  background: #4a3b10;
  border-color: var(--pixel-gold);
  box-shadow: 
    0 0 10px rgba(249, 199, 79, 0.6),
    inset 0 0 8px rgba(249, 199, 79, 0.4);
  animation: pixel-shine 1s infinite alternate;
}

.cell-idx {
  position: absolute;
  top: 2px;
  left: 4px;
  font-family: var(--font-pixel-en);
  font-size: 9px;
  color: var(--pixel-text-dim);
}

.item-title {
  font-size: 12px;
  font-weight: bold;
  color: #fff;
  line-height: 1.3;
  word-break: break-all;
  z-index: 1;
}

.marked-stamp {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-12deg);
  background: rgba(67, 170, 139, 0.9);
  border: 2px solid #fff;
  padding: 2px 6px;
  z-index: 2;
  box-shadow: 2px 2px 0 #000;
}

.stamp-text {
  font-size: 10px;
  font-weight: 900;
  color: #fff;
  white-space: nowrap;
}

.local-dev-bar {
  text-align: center;
  margin-top: 6px;
}

.test-mode-indicator {
  margin-bottom: 4px;
}

.mini-btn {
  font-size: 11px;
  padding: 6px 12px;
}
</style>
