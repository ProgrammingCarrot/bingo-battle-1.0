import { defineStore } from 'pinia'
import { ref } from 'vue'
import { 
  auth, 
  loginWithGoogle, 
  loginAsGuest, 
  logoutUser, 
  isFirebaseConfigured 
} from '@/services/firebase'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isAnonymous = ref(true)
  const isGoogle = ref(false)
  const nickname = ref(localStorage.getItem('street_bingo_nickname') || '探險者 1 號')
  const avatarId = ref(localStorage.getItem('street_bingo_avatar') || 'shiba')
  const isLoading = ref(false)
  const authError = ref('')

  let authReadyResolve = null
  const authReadyPromise = new Promise(resolve => {
    authReadyResolve = resolve
  })

  // 載入時檢查認證狀態
  const initAuth = async () => {
    if (isFirebaseConfigured && auth) {
      onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          user.value = fbUser
          isAnonymous.value = fbUser.isAnonymous
          isGoogle.value = !fbUser.isAnonymous && fbUser.providerData.some(p => p.providerId === 'google.com')
          if (fbUser.displayName && !localStorage.getItem('street_bingo_nickname')) {
            nickname.value = fbUser.displayName
          }
          if (authReadyResolve) authReadyResolve(fbUser)
        } else {
          // 未登入時嘗試自動匿名登入
          try {
            const guest = await signInAnonymously(auth)
            user.value = guest.user
            isAnonymous.value = true
            isGoogle.value = false
            if (authReadyResolve) authReadyResolve(guest.user)
          } catch (e) {
            console.warn('Auto anonymous signin error:', e)
            if (authReadyResolve) authReadyResolve(null)
          }
        }
      })
    } else {
      // 離線預設模式
      if (!user.value) {
        user.value = {
          uid: localStorage.getItem('street_bingo_local_uid') || 'local_' + Math.random().toString(36).substring(2, 9),
          isAnonymous: true
        }
        localStorage.setItem('street_bingo_local_uid', user.value.uid)
      }
      if (authReadyResolve) authReadyResolve(user.value)
    }
  }

  // 確保在執行 Firestore 操作前已完成認證
  const ensureAuth = async () => {
    // 1. 等待初始化判定
    await Promise.race([
      authReadyPromise,
      new Promise(r => setTimeout(r, 1500)) // 最多等 1.5 秒
    ])

    if (user.value && user.value.uid) return user.value
    if (isFirebaseConfigured && auth) {
      if (auth.currentUser) {
        user.value = auth.currentUser
        return auth.currentUser
      }
      try {
        const guest = await signInAnonymously(auth)
        user.value = guest.user
        isAnonymous.value = true
        isGoogle.value = false
        return guest.user
      } catch (e) {
        console.error('ensureAuth detailed error:', e)
        let msg = 'Firebase 認證失敗：'
        if (e.code === 'auth/operation-not-allowed' || e.code === 'auth/admin-restricted-operation') {
          msg += '匿名登入尚未在 Firebase Console 啟用！請前往 Authentication > Sign-in method 啟用「匿名」登入。'
        } else if (e.code === 'auth/unauthorized-domain') {
          msg += '當前網域尚未授權！請前往 Firebase Console > Authentication > Settings > Authorized domains 新增網域。'
        } else if (e.code === 'auth/network-request-failed') {
          msg += '網路連線逾時，請檢查手機網路。'
        } else {
          msg += (e.message || e.code || '請檢查 Firebase 設定')
        }
        authError.value = msg
        throw new Error(msg)
      }
    }
    return user.value
  }

  const setNickname = (name) => {
    nickname.value = name || '探險者'
    localStorage.setItem('street_bingo_nickname', nickname.value)
  }

  const setAvatar = (id) => {
    avatarId.value = id
    localStorage.setItem('street_bingo_avatar', id)
  }

  const signInGoogle = async () => {
    isLoading.value = true
    authError.value = ''
    try {
      const fbUser = await loginWithGoogle()
      user.value = fbUser
      isAnonymous.value = false
      isGoogle.value = true
      if (fbUser.displayName) {
        setNickname(fbUser.displayName)
      }
      return true
    } catch (err) {
      console.error('Google sign in error:', err)
      authError.value = err.message || 'Google 登入失敗'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const signInGuest = async () => {
    isLoading.value = true
    authError.value = ''
    try {
      const guestUser = await loginAsGuest()
      user.value = guestUser
      isAnonymous.value = true
      isGoogle.value = false
      return true
    } catch (err) {
      console.error('Guest sign in error:', err)
      authError.value = err.message || '訪客登入失敗'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const signOut = async () => {
    await logoutUser()
    user.value = null
    isAnonymous.value = true
    isGoogle.value = false
    initAuth()
  }

  return {
    user,
    isAnonymous,
    isGoogle,
    nickname,
    avatarId,
    isLoading,
    authError,
    initAuth,
    ensureAuth,
    setNickname,
    setAvatar,
    signInGoogle,
    signInGuest,
    signOut
  }
})
