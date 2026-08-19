<script setup>
import { computed, onMounted } from 'vue'
import confetti from 'canvas-confetti'
import { useAuthStore } from '@/stores/authStore'
import { useGameStore } from '@/stores/gameStore'
import { useSound } from '@/composables/useSound'
import PixelAvatar from './PixelAvatar.vue'

const props = defineProps({
  winner: {
    type: Object,
    default: null
  },
  durationSec: {
    type: Number,
    default: 0
  },
  myLines: {
    type: Number,
    default: 0
  },
  gridSize: {
    type: Number,
    default: 5
  }
})

const emit = defineEmits(['playAgain', 'backHome'])

const authStore = useAuthStore()
const gameStore = useGameStore()
const { playWin, playClick } = useSound()

const isWinner = computed(() => {
  if (props.winner?.uid && authStore.user?.uid) {
    return props.winner.uid === authStore.user.uid
  }
  if (props.winner?.role && gameStore.myPlayerRole) {
    return props.winner.role === gameStore.myPlayerRole
  }
  return false
})

const winnerAvatar = computed(() => {
  if (props.winner?.avatar) return props.winner.avatar
  if (props.winner?.role === 'player1') return gameStore.player1?.avatar || authStore.avatarId
  if (props.winner?.role === 'player2') return gameStore.player2?.avatar || 'calico_cat'
  return 'shiba'
})

onMounted(() => {
  if (isWinner.value) {
    playWin()
    // 8-Bit 像素狂歡彩帶
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f9c74f', '#f94144', '#43aa8b', '#4cc9f0', '#9d4edd']
    })
  }
})

function formatDuration(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}分 ${s}秒` : `${s}秒`
}

function handlePlayAgain() {
  playClick()
  emit('playAgain')
}

function handleBackHome() {
  playClick()
  emit('backHome')
}
</script>

<template>
  <div class="pixel-modal-backdrop">
    <div 
      class="pixel-box result-card" 
      :class="isWinner ? 'pixel-box-gold win-theme' : 'pixel-box lose-theme'"
    >
      <div class="result-banner">
        <h1 v-if="isWinner" class="title-win anim-shine">★ BINGO VICTORY ★</h1>
        <h1 v-else class="title-loss">GAME OVER</h1>
        <p class="subtitle">{{ isWinner ? '恭喜您率先達成三條連線！' : '對手已率先完成三條連線！' }}</p>
      </div>

      <div class="winner-profile">
        <PixelAvatar :avatar-id="winnerAvatar" :size="64" />
        <div class="winner-text">
          <span class="winner-label">🏆 獲勝玩家</span>
          <span class="winner-name">{{ winner?.name || '神祕探險者' }}</span>
        </div>
      </div>

      <div class="stats-panel">
        <div class="stat-item">
          <span class="stat-label">遊戲模式</span>
          <span class="stat-val">{{ gridSize }} × {{ gridSize }} 街道尋寶</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">尋寶時長</span>
          <span class="stat-val">{{ formatDuration(durationSec) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">您完成的連線</span>
          <span class="stat-val highlight">{{ myLines }} / 3 條</span>
        </div>
      </div>

      <div class="actions">
        <button class="pixel-btn pixel-btn-gold" @click="handlePlayAgain">
          🔄 再玩一局
        </button>
        <button class="pixel-btn pixel-btn-secondary" @click="handleBackHome">
          🏠 返回主選單
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.result-card {
  width: 100%;
  max-width: 440px;
  padding: 24px;
  text-align: center;
}

.result-banner {
  margin-bottom: 20px;
}

.title-win {
  font-family: var(--font-pixel-en);
  font-size: 20px;
  color: var(--pixel-gold);
  text-shadow: 3px 3px #000;
  margin-bottom: 6px;
}

.title-loss {
  font-family: var(--font-pixel-en);
  font-size: 22px;
  color: var(--pixel-red);
  text-shadow: 3px 3px #000;
  margin-bottom: 6px;
}

.subtitle {
  font-size: 14px;
  color: var(--pixel-text-dim);
}

.winner-profile {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: rgba(0, 0, 0, 0.4);
  border: 3px solid #000;
  padding: 12px;
  margin-bottom: 20px;
}

.winner-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.winner-label {
  font-size: 12px;
  color: var(--pixel-gold);
}

.winner-name {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
}

.stats-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--pixel-bg-card-alt);
  border: 2px solid #000;
  padding: 14px;
  margin-bottom: 24px;
  text-align: left;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.stat-label {
  color: var(--pixel-text-dim);
}

.stat-val {
  color: #fff;
  font-weight: bold;
}

.stat-val.highlight {
  color: var(--pixel-gold);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
