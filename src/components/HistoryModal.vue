<script setup>
import { ref, onMounted } from 'vue'
import { fetchGameRecords } from '@/services/firebase'
import { useAuthStore } from '@/stores/authStore'
import { useSound } from '@/composables/useSound'

const emit = defineEmits(['close'])
const authStore = useAuthStore()
const { playClick } = useSound()

const records = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const list = await fetchGameRecords(authStore.user?.uid, authStore.isGoogle)
    records.value = list
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})

function formatTime(isoStr) {
  if (!isoStr) return '-'
  const d = new Date(isoStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function formatDuration(sec) {
  if (!sec) return '0秒'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}分${s}秒` : `${s}秒`
}

function handleClose() {
  playClick()
  emit('close')
}
</script>

<template>
  <div class="pixel-modal-backdrop" @click.self="handleClose">
    <div class="pixel-box pixel-box-gold history-modal">
      <div class="modal-header">
        <h2 class="modal-title">🏆 冒險戰績紀錄</h2>
        <button class="pixel-btn pixel-btn-red close-btn" @click="handleClose">✕</button>
      </div>

      <div class="account-badge" v-if="authStore.isGoogle">
        <span class="pixel-tag pixel-tag-green">Google 帳號已連結</span>
        <span class="account-name">{{ authStore.nickname }}</span>
      </div>
      <div class="account-badge" v-else>
        <span class="pixel-tag pixel-tag-purple">訪客本機紀錄</span>
        <span class="account-hint">登入 Google 帳號可永久保存跨裝置戰績！</span>
      </div>

      <div class="records-container">
        <div v-if="loading" class="loading-state">
          <p class="anim-pulse">載入戰績中...</p>
        </div>

        <div v-else-if="records.length === 0" class="empty-state">
          <p>尚無遊戲紀錄</p>
          <p class="sub-text">快去開一局尋寶賓果吧！</p>
        </div>

        <div v-else class="records-list">
          <div 
            v-for="(rec, idx) in records" 
            :key="idx" 
            class="record-card"
            :class="{ 'is-win': rec.isWinner, 'is-loss': !rec.isWinner }"
          >
            <div class="record-badge">
              <span v-if="rec.isWinner" class="badge-win">VICTORY</span>
              <span v-else class="badge-loss">DEFEAT</span>
            </div>

            <div class="record-details">
              <div class="detail-row">
                <span class="label">獲勝者：</span>
                <span class="val highlight">{{ rec.winnerName }}</span>
              </div>
              <div class="detail-row">
                <span class="label">模式：</span>
                <span class="val">{{ rec.gridSize }}×{{ rec.gridSize }} 賓果 (對手: {{ rec.opponentName }})</span>
              </div>
              <div class="detail-row">
                <span class="label">時間：</span>
                <span class="val dim">{{ formatTime(rec.date) }}</span>
                <span class="label ml-2">時長：</span>
                <span class="val">{{ formatDuration(rec.durationSeconds) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="pixel-btn pixel-btn-secondary" @click="handleClose">返回主選單</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-modal {
  width: 100%;
  max-width: 520px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  padding: 18px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 3px solid #000;
  padding-bottom: 12px;
  margin-bottom: 12px;
}

.modal-title {
  font-size: 18px;
  color: var(--pixel-gold);
  text-shadow: 2px 2px #000;
}

.close-btn {
  padding: 4px 10px;
  font-size: 16px;
}

.account-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  background: rgba(0, 0, 0, 0.3);
  padding: 8px 12px;
  border: 2px solid #000;
}

.account-name {
  font-weight: bold;
  color: #fff;
}

.account-hint {
  font-size: 12px;
  color: var(--pixel-text-dim);
}

.records-container {
  flex: 1;
  overflow-y: auto;
  min-height: 200px;
  padding-right: 4px;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 40px 10px;
  color: var(--pixel-text-dim);
}

.empty-state .sub-text {
  font-size: 12px;
  margin-top: 6px;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.record-card {
  border: 3px solid #000;
  padding: 10px 12px;
  background: var(--pixel-bg-card-alt);
  display: flex;
  gap: 12px;
  align-items: center;
}

.record-card.is-win {
  border-left: 6px solid var(--pixel-gold);
}

.record-card.is-loss {
  border-left: 6px solid var(--pixel-red);
}

.record-badge {
  font-family: var(--font-pixel-en);
  font-size: 11px;
  font-weight: bold;
  padding: 4px 6px;
  text-align: center;
}

.badge-win {
  color: var(--pixel-gold);
}

.badge-loss {
  color: var(--pixel-red);
}

.record-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 13px;
}

.detail-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.label {
  color: var(--pixel-text-dim);
  font-size: 12px;
}

.val {
  color: #fff;
}

.val.highlight {
  color: var(--pixel-gold);
  font-weight: bold;
}

.val.dim {
  color: #a0aec0;
  font-size: 12px;
}

.ml-2 {
  margin-left: 8px;
}

.modal-footer {
  margin-top: 14px;
  text-align: right;
}
</style>
