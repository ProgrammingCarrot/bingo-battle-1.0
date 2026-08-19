import { initializeApp } from 'firebase/app'
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInAnonymously, 
  signOut as fbSignOut,
  onAuthStateChanged 
} from 'firebase/auth'
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore'

// Firebase Configuration from Vite Env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.apiKey !== 'YOUR_API_KEY'
)

let app = null
let auth = null
let db = null
let googleProvider = null

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
    googleProvider = new GoogleAuthProvider()
  } catch (err) {
    console.warn('[Firebase] Init skipped or error:', err)
  }
}

export { auth, db, googleProvider, deleteDoc }

/**
 * Google 帳號登入
 */
export async function loginWithGoogle() {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('未設定 Firebase 環境變數，請切換訪客模式或設定 .env')
  }
  const result = await signInWithPopup(auth, googleProvider)
  return result.user
}

/**
 * 匿名快速登入
 */
export async function loginAsGuest() {
  if (isFirebaseConfigured && auth) {
    const result = await signInAnonymously(auth)
    return result.user
  } else {
    // 離線模擬訪客
    const guestId = 'guest_' + Math.random().toString(36).substring(2, 9)
    return {
      uid: guestId,
      isAnonymous: true,
      displayName: '街頭冒險者',
      photoURL: null
    }
  }
}

/**
 * 登出
 */
export async function logoutUser() {
  if (isFirebaseConfigured && auth) {
    await fbSignOut(auth)
  }
}

/**
 * 儲存遊戲歷史戰績
 * @param {string} userId
 * @param {object} record
 * @param {boolean} isGoogleUser - 是否為 Google 帳號登入玩家 (只有 Google 帳號會寫入 Firestore)
 */
export async function saveGameRecord(userId, record, isGoogleUser = false) {
  const localHistoryKey = `street_bingo_history_${userId || 'guest'}`
  try {
    const local = JSON.parse(localStorage.getItem(localHistoryKey) || '[]')
    local.unshift(record)
    localStorage.setItem(localHistoryKey, JSON.stringify(local.slice(0, 50)))
  } catch (e) {
    console.error('Save local history error', e)
  }

  // 僅針對 Google 登入的使用者將戰績同步至 Firestore，避免匿名者產生孤兒資料
  if (isFirebaseConfigured && db && userId && isGoogleUser && !userId.startsWith('guest_')) {
    try {
      const historyCol = collection(db, 'users', userId, 'history')
      await addDoc(historyCol, {
        ...record,
        createdAt: serverTimestamp()
      })
    } catch (err) {
      console.warn('Firebase save record warning:', err)
    }
  }
}

/**
 * 讀取遊戲歷史戰績
 * @param {string} userId
 * @param {boolean} isGoogleUser - 是否為 Google 帳號登入玩家
 */
export async function fetchGameRecords(userId, isGoogleUser = false) {
  const localHistoryKey = `street_bingo_history_${userId || 'guest'}`
  const localList = JSON.parse(localStorage.getItem(localHistoryKey) || '[]')

  // 若為 Google 登入，嘗試從 Firestore 撈取雲端戰績；若非 Google 登入則直接回傳 localList 節省讀取
  if (isFirebaseConfigured && db && userId && isGoogleUser && !userId.startsWith('guest_')) {
    try {
      const historyCol = collection(db, 'users', userId, 'history')
      const q = query(historyCol, orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      const remoteList = []
      snap.forEach(docSnap => {
        remoteList.push({ id: docSnap.id, ...docSnap.data() })
      })
      if (remoteList.length > 0) return remoteList
    } catch (err) {
      console.warn('Fetch remote history warning, fallback to local', err)
    }
  }

  return localList
}

