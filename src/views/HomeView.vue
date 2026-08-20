<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useGameStore } from '@/stores/gameStore'
import { useSound } from '@/composables/useSound'
import { AVATARS } from '@/assets/avatars'
import PixelAvatar from '@/components/PixelAvatar.vue'
import HistoryModal from '@/components/HistoryModal.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const gameStore = useGameStore()
const { playClick, playBeep, soundEnabled, toggleSound } = useSound()

const isTestMode = computed(() => {
  return gameStore.isTestMode ||
         route.path === '/test' || 
         route.path.endsWith('/test') || 
         route.meta?.isTestMode || 
         route.query?.test === 'true' || 
         route.query?.test === '1' ||
         window.location.hash.includes('/test') ||
         window.location.hash.includes('test=')
})

const inputRoomCode = ref('')
const showAvatarPicker = ref(false)
const showHistory = ref(false)
const errorMessage = ref('')
const isActionLoading = ref(false)

function handleSelectAvatar(id) {
  playClick()
  authStore.setAvatar(id)
  showAvatarPicker.value = false
}

async function handleGoogleLogin() {
  playClick()
  const ok = await authStore.signInGoogle()
  if (!ok && authStore.authError) {
    errorMessage.value = authStore.authError
  }
}

async function handleCreateRoom() {
  playClick()
  errorMessage.value = ''
  isActionLoading.value = true
  try {
    const code = await gameStore.createRoom()
    if (isTestMode.value) {
      gameStore.isTestMode = true
      router.push({ path: `/lobby/${code}`, query: { test: '1' } })
    } else {
      router.push(`/lobby/${code}`)
    }
  } catch (err) {
    errorMessage.value = err.message || '建立房間失敗'
  } finally {
    isActionLoading.value = false
  }
}

async function handleJoinRoom() {
  if (!inputRoomCode.value.trim()) {
    errorMessage.value = '請輸入 6 碼房間代碼！'
    return
  }
  playClick()
  errorMessage.value = ''
  isActionLoading.value = true
  try {
    const code = inputRoomCode.value.trim().toUpperCase()
    await gameStore.joinRoom(code)
    if (isTestMode.value) {
      gameStore.isTestMode = true
      router.push({ path: `/lobby/${code}`, query: { test: '1' } })
    } else {
      router.push(`/lobby/${code}`)
    }
  } catch (err) {
    errorMessage.value = err.message || '加入房間失敗'
  } finally {
    isActionLoading.value = false
  }
}

// 快速本機單人模擬試玩 (AI 對戰)
async function handleQuickSoloTest() {
  playClick()
  const code = await gameStore.startQuickSoloTest()
  router.push({ path: `/lobby/${code}`, query: { test: '1' } })
}
</script>

<template>
  <div class="home-container">
    <!-- Top Bar Controls -->
    <header class="top-nav">
      <div class="app-brand">
        <span class="pixel-tag pixel-tag-blue">8-BIT MULTIPLAYER</span>
      </div>
      <div class="nav-actions">
        <button class="pixel-btn pixel-btn-secondary sound-btn" @click="toggleSound">
          {{ soundEnabled ? '🔊 音效: 開' : '🔇 音效: 關' }}
        </button>
        <button class="pixel-btn pixel-btn-gold" @click="showHistory = true">
          📜 戰績
        </button>
      </div>
    </header>

    <!-- Main Title Banner -->
    <div class="hero-section">
      <div class="pixel-title-box">
        <div class="sub-title anim-bounce">★ STREET BINGO ★</div>
        <h1 class="main-title">街景尋寶賓果</h1>
        <p class="desc">填入路上會看見的生活小物，交換卡片出發尋寶！先連成 3 條線獲勝！</p>
      </div>
    </div>

    <!-- Player Profile Setup Card -->
    <section class="pixel-box player-card">
      <div class="card-header">
        <span class="section-badge">玩家身分</span>
        <div class="auth-status">
          <span v-if="authStore.isGoogle" class="pixel-tag pixel-tag-green">Google 已登入</span>
          <button v-else class="pixel-btn pixel-btn-secondary login-btn" @click="handleGoogleLogin">
            <span class="g-icon">G</span> Google 登入保存戰績
          </button>
        </div>
      </div>

      <div class="profile-editor">
        <div class="avatar-select-area" @click="showAvatarPicker = !showAvatarPicker">
          <PixelAvatar :avatar-id="authStore.avatarId" :size="64" :active="true" />
          <span class="edit-hint">更換頭像 ▾</span>
        </div>

        <div class="name-input-area">
          <label class="input-label">玩家暱稱：</label>
          <input 
            type="text" 
            class="pixel-input" 
            v-model="authStore.nickname" 
            maxlength="12"
            placeholder="請輸入暱稱..."
            @change="authStore.setNickname(authStore.nickname)"
          />
        </div>
      </div>

      <!-- Avatar Picker Drawer -->
      <div v-if="showAvatarPicker" class="avatar-drawer pixel-box">
        <div class="drawer-title">選擇您的 8-Bit 像素角色：</div>
        <div class="avatar-grid">
          <div 
            v-for="item in AVATARS" 
            :key="item.id" 
            class="avatar-item"
            :class="{ selected: item.id === authStore.avatarId }"
            @click="handleSelectAvatar(item.id)"
          >
            <PixelAvatar :avatar-id="item.id" :size="48" />
            <span class="avatar-name">{{ item.name }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Error Alert Message -->
    <div v-if="errorMessage" class="error-banner pixel-box pixel-box-red">
      ⚠️ {{ errorMessage }}
    </div>

    <!-- Matchmaking Actions -->
    <section class="actions-grid">
      <!-- Create Room -->
      <div class="pixel-box action-card">
        <h3 class="action-title">🏰 建立對戰房間</h3>
        <p class="action-desc">產生專屬房間代碼，邀請好友連線對戰！</p>
        <button 
          class="pixel-btn pixel-btn-gold btn-block" 
          :disabled="isActionLoading"
          @click="handleCreateRoom"
        >
          {{ isActionLoading ? '建立中...' : '開立房間' }}
        </button>
      </div>

      <!-- Join Room -->
      <div class="pixel-box action-card">
        <h3 class="action-title">🚪 加入好友房間</h3>
        <p class="action-desc">輸入好友提供的 6 碼房間代碼進入大廳：</p>
        <div class="join-input-group">
          <input 
            type="text" 
            class="pixel-input room-code-input" 
            v-model="inputRoomCode" 
            placeholder="請輸入 6 碼房號..."
            maxlength="6"
          />
          <button 
            class="pixel-btn pixel-btn-green" 
            :disabled="isActionLoading"
            @click="handleJoinRoom"
          >
            加入
          </button>
        </div>
      </div>
    </section>

    <!-- Quick Local Demo (Only visible when URL ends with /test) -->
    <div v-if="isTestMode" class="quick-test-section">
      <div class="test-mode-badge">
        <span class="pixel-tag pixel-tag-purple">🧪 開發測試模式 (/test)</span>
      </div>
      <button class="pixel-btn pixel-btn-secondary quick-btn" @click="handleQuickSoloTest">
        ⚡ 本機雙人模擬試玩 (免連線快速體驗)
      </button>
    </div>

    <!-- History Modal -->
    <HistoryModal v-if="showHistory" @close="showHistory = false" />
  </div>
</template>

<style scoped>
.home-container {
  max-width: 680px;
  margin: 0 auto;
  padding: 16px 16px 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.nav-actions {
  display: flex;
  gap: 8px;
}

.sound-btn {
  font-size: 12px;
  padding: 6px 10px;
}

.hero-section {
  text-align: center;
  margin: 10px 0;
}

.pixel-title-box {
  background: rgba(15, 17, 26, 0.85);
  border: 4px solid var(--pixel-gold);
  box-shadow: 4px 4px 0 #000;
  padding: 18px 12px;
}

.sub-title {
  font-family: var(--font-pixel-en);
  font-size: 13px;
  color: var(--pixel-gold);
  letter-spacing: 2px;
  margin-bottom: 8px;
}

.main-title {
  font-size: 28px;
  font-weight: 900;
  color: #fff;
  text-shadow: 3px 3px 0 #000, -1px -1px 0 #000;
  margin-bottom: 8px;
}

.desc {
  font-size: 13px;
  color: var(--pixel-text-dim);
}

.player-card {
  padding: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #000;
  padding-bottom: 10px;
  margin-bottom: 14px;
}

.section-badge {
  font-family: var(--font-pixel-zh);
  font-weight: bold;
  color: var(--pixel-gold);
  font-size: 14px;
}

.login-btn {
  font-size: 12px;
  padding: 6px 10px;
}

.g-icon {
  font-weight: bold;
  color: var(--pixel-red);
}

.profile-editor {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-select-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  gap: 4px;
}

.edit-hint {
  font-size: 10px;
  color: var(--pixel-blue);
}

.name-input-area {
  flex: 1;
}

.input-label {
  display: block;
  font-size: 12px;
  color: var(--pixel-text-dim);
  margin-bottom: 4px;
}

.avatar-drawer {
  margin-top: 16px;
  padding: 12px;
  background: var(--pixel-bg-card-alt);
}

.drawer-title {
  font-size: 12px;
  color: var(--pixel-gold);
  margin-bottom: 10px;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 10px;
}

.avatar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 4px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.1s ease;
}

.avatar-item:hover, .avatar-item.selected {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--pixel-gold);
}

.avatar-name {
  font-size: 11px;
  margin-top: 4px;
  text-align: center;
}

.error-banner {
  background: rgba(249, 65, 68, 0.2);
  border-color: var(--pixel-red);
  padding: 10px 14px;
  color: #ffb4a2;
  font-size: 13px;
}

.actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 600px) {
  .actions-grid {
    grid-template-columns: 1fr;
  }
}

.action-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.action-title {
  font-size: 15px;
  color: #fff;
  margin-bottom: 6px;
}

.action-desc {
  font-size: 12px;
  color: var(--pixel-text-dim);
  margin-bottom: 14px;
  flex: 1;
}

.btn-block {
  width: 100%;
}

.join-input-group {
  display: flex;
  gap: 8px;
}

.room-code-input {
  text-transform: uppercase;
  font-family: var(--font-pixel-en);
  letter-spacing: 2px;
  text-align: center;
}

.quick-test-section {
  text-align: center;
  margin-top: 10px;
}

.test-mode-badge {
  margin-bottom: 6px;
}

.quick-btn {
  font-size: 12px;
  width: 100%;
}
</style>
