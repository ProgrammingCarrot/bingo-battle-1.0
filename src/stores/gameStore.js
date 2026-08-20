import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, isFirebaseConfigured, saveGameRecord } from '@/services/firebase'
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot 
} from 'firebase/firestore'
import { useBingoLogic } from '@/composables/useBingoLogic'
import { getRandomStreetItems } from '@/composables/useStreetItems'
import { useAuthStore } from './authStore'

export const useGameStore = defineStore('game', () => {
  const authStore = useAuthStore()
  const { createBoard, evaluateBoard, countMarkedCells } = useBingoLogic()

  // 房間與遊戲核心狀態
  const roomId = ref('')
  const isHost = ref(false)
  const isLocalMode = ref(false) // 是否為本機模擬對戰
  const isTestMode = ref(false)  // 全局測試模式開關
  const roomStatus = ref('IDLE') // IDLE, WAITING, CHOOSING_SIZE, FILLING, PLAYING, FINISHED
  
  const gridSize = ref(5) // 4, 5, 6
  const sizeChooserId = ref('') // 決定格數的玩家 ID
  
  // 玩家 1 (Host) 與 玩家 2 (Guest)
  const player1 = ref(null)
  const player2 = ref(null)

  // 填寫階段的草稿卡片 (自己填寫給對手的題目)
  const myDraftItems = ref([])
  
  // 實際對戰時自己的卡片 (由對手填寫、自己尋寶標記)
  const myBoard = ref([])
  
  // 對手即時進度
  const opponentProgress = ref({
    lineCount: 0,
    markedCount: 0,
    isWin: false
  })

  // 遊戲計時與結果
  const gameStartTime = ref(null)
  const gameEndTime = ref(null)
  const winnerInfo = ref(null)
  const gameDurationSec = ref(0)
  
  let unsubscribeRoom = null
  let timerInterval = null

  // 當前登入者身分判斷
  const myPlayerRole = computed(() => {
    if (isLocalMode.value) return 'player1'
    const myUid = authStore.user?.uid
    if (player1.value?.uid === myUid) return 'player1'
    if (player2.value?.uid === myUid) return 'player2'
    return 'player1'
  })

  const isMyTurnToChooseSize = computed(() => {
    if (isLocalMode.value) return true
    const myUid = authStore.user?.uid
    return sizeChooserId.value === myUid || sizeChooserId.value === player1.value?.uid
  })

  const chooserPlayerName = computed(() => {
    if (sizeChooserId.value === player1.value?.uid) return player1.value?.name || '玩家 1'
    if (sizeChooserId.value === player2.value?.uid) return player2.value?.name || '玩家 2'
    return '您'
  })

  // 連線即時判定
  const myEvaluation = computed(() => {
    if (!myBoard.value || myBoard.value.length === 0) {
      return { lineCount: 0, winningLines: [] }
    }
    return evaluateBoard(myBoard.value, gridSize.value)
  })

  // 快速啟動本機單人模擬試玩 (AI 對戰)
  const startQuickSoloTest = async () => {
    resetRoom()
    isTestMode.value = true
    isLocalMode.value = true
    const code = 'SOLO' + Math.random().toString(36).substring(2, 6).toUpperCase()
    roomId.value = code
    isHost.value = true

    const myUid = authStore.user?.uid || 'player_me'
    player1.value = {
      uid: myUid,
      name: authStore.nickname || '探險家 (我)',
      avatar: authStore.avatarId || 'shiba',
      ready: false,
      draftItems: [],
      marks: [],
      lineCount: 0,
      markedCount: 0
    }

    player2.value = {
      uid: 'mock_ai_p2',
      name: '像素小智 (AI)',
      avatar: 'calico_cat',
      ready: false,
      draftItems: [],
      marks: [],
      lineCount: 0,
      markedCount: 0
    }

    sizeChooserId.value = myUid
    gridSize.value = 5
    roomStatus.value = 'CHOOSING_SIZE'
    return code
  }

  // 1. 建立房間
  const createRoom = async (forceLocal = false) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    roomId.value = code
    isHost.value = true
    if (forceLocal) {
      isLocalMode.value = true
    } else {
      isLocalMode.value = !isFirebaseConfigured || !db
    }

    // 確保有認證身分 (若尚未登入則自動取得匿名 UID)
    const currentUser = await authStore.ensureAuth()

    const p1Data = {
      uid: currentUser?.uid || authStore.user?.uid || 'host_user',
      name: authStore.nickname,
      avatar: authStore.avatarId,
      ready: false,
      draftItems: [],
      marks: [],
      lineCount: 0,
      markedCount: 0
    }

    player1.value = p1Data
    player2.value = null
    roomStatus.value = 'WAITING'

    if (!isLocalMode.value) {
      try {
        const roomRef = doc(db, 'rooms', code)
        const expireMs = Date.now() + 12 * 60 * 60 * 1000 // 12 小時後過期
        await setDoc(roomRef, {
          roomId: code,
          status: 'WAITING',
          createdAt: Date.now(),
          expireAt: new Date(expireMs), // Firestore TTL 索引欄位
          expireAtMs: expireMs,
          player1: p1Data,
          player2: null,
          gridSize: 5,
          sizeChooserId: '',
          winner: null
        })
        listenToRoom(code)
      } catch (err) {
        console.error('Firestore createRoom error:', err)
        if (err.code === 'permission-denied') {
          throw new Error('無法建立房間：Firebase 權限遭拒，請確認已在 Firebase Console 啟用匿名登入並發布 Firestore 規則！')
        }
        throw new Error(`建立房間失敗: ${err.message || err}`)
      }
    }

    return code
  }

  // 2. 加入房間
  const joinRoom = async (code, forceLocal = false) => {
    const targetCode = code.trim().toUpperCase()
    roomId.value = targetCode
    isHost.value = false
    if (forceLocal || isLocalMode.value) {
      isLocalMode.value = true
    } else {
      isLocalMode.value = !isFirebaseConfigured || !db
    }

    // 確保有認證身分 (若尚未登入則自動取得匿名 UID)
    const currentUser = await authStore.ensureAuth()

    const p2Data = {
      uid: currentUser?.uid || authStore.user?.uid || 'guest_user',
      name: authStore.nickname,
      avatar: authStore.avatarId,
      ready: false,
      draftItems: [],
      marks: [],
      lineCount: 0,
      markedCount: 0
    }

    if (!isLocalMode.value) {
      try {
        const roomRef = doc(db, 'rooms', targetCode)
        const snap = await getDoc(roomRef)
        if (!snap.exists()) {
          throw new Error('找不到該房間，請確認 6 碼房號是否正確！')
        }
        const data = snap.data()
        
        // 檢查房間是否已過期 (TTL 12 小時)
        if (data.expireAtMs && Date.now() > data.expireAtMs) {
          throw new Error('該房間已逾時過期 (超過 12 小時)，無法加入！')
        }

        if (data.player2 && data.player2.uid !== p2Data.uid) {
          throw new Error('該房間人數已滿，無法加入！')
        }

        // 隨機選一位決定格數
        const randomChooser = Math.random() < 0.5 ? data.player1.uid : p2Data.uid

        await updateDoc(roomRef, {
          player2: p2Data,
          status: 'CHOOSING_SIZE',
          sizeChooserId: randomChooser
        })

        listenToRoom(targetCode)
      } catch (err) {
        console.error('Firestore joinRoom error:', err)
        if (err.code === 'permission-denied') {
          throw new Error('無法加入房間：Firebase 權限遭拒，請確認已在 Firebase Console 啟用匿名登入並發布 Firestore 規則！')
        }
        throw err
      }
    } else {
      // 本機模擬：直接模擬加入
      player2.value = p2Data
      sizeChooserId.value = Math.random() < 0.5 ? player1.value.uid : p2Data.uid
      roomStatus.value = 'CHOOSING_SIZE'
    }
  }

  // 3. 房內隨機挑選一人選擇格數
  const selectGridSize = async (size) => {
    gridSize.value = size
    roomStatus.value = 'FILLING'

    if (!isLocalMode.value && roomId.value) {
      const roomRef = doc(db, 'rooms', roomId.value)
      await updateDoc(roomRef, {
        gridSize: size,
        status: 'FILLING'
      })
    }
  }

  // 4. 提交自己填寫的卡片 (Ready)
  const submitDraftCard = async (items) => {
    myDraftItems.value = items
    const role = myPlayerRole.value
    if (!role) return

    if (!isLocalMode.value && roomId.value) {
      const roomRef = doc(db, 'rooms', roomId.value)
      const updatePayload = {}
      updatePayload[`${role}.draftItems`] = items
      updatePayload[`${role}.ready`] = true
      
      await updateDoc(roomRef, updatePayload)
      
      // 檢查是否雙方皆 ready，若是則轉為 PLAYING
      const snap = await getDoc(roomRef)
      const data = snap.data()
      if (data.player1?.ready && data.player2?.ready && data.status !== 'PLAYING') {
        await updateDoc(roomRef, {
          status: 'PLAYING',
          gameStartTime: Date.now()
        })
      }
    } else {
      // 本機模擬
      if (role === 'player1') {
        player1.value.draftItems = items
        player1.value.ready = true
      } else {
        player2.value.draftItems = items
        player2.value.ready = true
      }
      
      // 模擬對方也填好
      if (isLocalMode.value) {
        if (!player2.value) {
          player2.value = {
            uid: 'mock_ai_p2',
            name: '像素小智',
            avatar: 'calico_cat',
            ready: true,
            draftItems: getRandomStreetItems(gridSize.value * gridSize.value),
            marks: [],
            lineCount: 0,
            markedCount: 0
          }
        } else {
          player2.value.ready = true
          player2.value.draftItems = player2.value.draftItems?.length === gridSize.value * gridSize.value 
            ? player2.value.draftItems 
            : getRandomStreetItems(gridSize.value * gridSize.value)
        }
        
        startLocalPlaying()
      }
    }
  }

  // 測試專用：模擬對手加入房間
  const simulateOpponentJoin = async () => {
    const mockP2 = {
      uid: 'mock_p2_' + Math.random().toString(36).substring(2, 6),
      name: '像素小智 (AI)',
      avatar: 'calico_cat',
      ready: false,
      draftItems: [],
      marks: [],
      lineCount: 0,
      markedCount: 0
    }
    
    player2.value = mockP2
    sizeChooserId.value = player1.value?.uid || authStore.user?.uid || 'host_user'
    roomStatus.value = 'CHOOSING_SIZE'

    if (!isLocalMode.value && roomId.value && db) {
      try {
        const roomRef = doc(db, 'rooms', roomId.value)
        await updateDoc(roomRef, {
          player2: mockP2,
          status: 'CHOOSING_SIZE',
          sizeChooserId: sizeChooserId.value
        })
      } catch (err) {
        console.warn('simulateOpponentJoin firestore update warning:', err)
      }
    }
  }

  // 測試專用：模擬對手填寫完畢並立即開戰
  const simulateOpponentReadyAndPlay = async () => {
    const total = gridSize.value * gridSize.value
    const p2Items = getRandomStreetItems(total)
    
    // 若自己尚未填好，也自動填滿
    if (!myDraftItems.value || myDraftItems.value.length !== total) {
      myDraftItems.value = getRandomStreetItems(total)
    }

    if (!player2.value) {
      player2.value = {
        uid: 'mock_ai_p2',
        name: '像素小智 (AI)',
        avatar: 'calico_cat',
        ready: true,
        draftItems: p2Items,
        marks: [],
        lineCount: 0,
        markedCount: 0
      }
    } else {
      player2.value.ready = true
      player2.value.draftItems = p2Items
    }

    if (player1.value) {
      player1.value.ready = true
      if (!player1.value.draftItems || player1.value.draftItems.length !== total) {
        player1.value.draftItems = myDraftItems.value
      }
    }

    if (!isLocalMode.value && roomId.value && db) {
      try {
        const roomRef = doc(db, 'rooms', roomId.value)
        await updateDoc(roomRef, {
          'player1.draftItems': myDraftItems.value,
          'player1.ready': true,
          'player2': player2.value,
          status: 'PLAYING',
          gameStartTime: Date.now()
        })
      } catch (err) {
        console.warn('simulateOpponentReadyAndPlay firestore warning:', err)
        // 降級為本地模擬直接開始
        startLocalPlaying()
      }
    } else {
      startLocalPlaying()
    }
  }

  // 本機模擬開始對戰 (交換卡片)
  const startLocalPlaying = () => {
    roomStatus.value = 'PLAYING'
    gameStartTime.value = Date.now()
    
    const total = gridSize.value * gridSize.value
    // 交換卡片：P1 拿到 P2 填的題目
    const opponentItems = (player2.value?.draftItems && player2.value.draftItems.length === total)
      ? player2.value.draftItems 
      : getRandomStreetItems(total)
      
    myBoard.value = createBoard(gridSize.value, opponentItems)
    startTimer()
  }

  // 5. 點擊標記格子
  const toggleMarkCell = async (cellIndex) => {
    if (roomStatus.value !== 'PLAYING' || winnerInfo.value) return
    const cell = myBoard.value[cellIndex]
    if (!cell) return

    cell.marked = !cell.marked

    // 重新計算連線
    const evalResult = evaluateBoard(myBoard.value, gridSize.value)
    const markedCount = countMarkedCells(myBoard.value)

    const role = myPlayerRole.value
    const myName = role === 'player1' ? player1.value?.name : player2.value?.name
    const myUid = authStore.user?.uid || 'player_me'

    // 同步進度到伺服器
    if (!isLocalMode.value && roomId.value) {
      const roomRef = doc(db, 'rooms', roomId.value)
      const updatePayload = {}
      updatePayload[`${role}.marks`] = myBoard.value.map(c => c.marked)
      updatePayload[`${role}.lineCount`] = evalResult.lineCount
      updatePayload[`${role}.markedCount`] = markedCount

      if (evalResult.isWin) {
        updatePayload.status = 'FINISHED'
        updatePayload.winner = {
          uid: myUid,
          name: myName,
          avatar: authStore.avatarId,
          role,
          lineCount: evalResult.lineCount,
          time: Date.now()
        }
      }
      await updateDoc(roomRef, updatePayload)
    } else {
      // 本機模式
      if (evalResult.isWin) {
        finishGame({
          uid: myUid,
          name: myName,
          avatar: authStore.avatarId,
          role,
          lineCount: evalResult.lineCount
        })
      }
    }

    return evalResult
  }

  // 6. 監聽 Firestore 房間即時變化
  const listenToRoom = (code) => {
    if (unsubscribeRoom) unsubscribeRoom()
    const roomRef = doc(db, 'rooms', code)

    unsubscribeRoom = onSnapshot(roomRef, (snapshot) => {
      if (!snapshot.exists()) return
      const data = snapshot.data()

      player1.value = data.player1 || null
      player2.value = data.player2 || null
      gridSize.value = data.gridSize || 5
      sizeChooserId.value = data.sizeChooserId || ''
      roomStatus.value = data.status || 'WAITING'

      // 當進入 PLAYING 狀態且尚未初始化 myBoard
      if (data.status === 'PLAYING' && myBoard.value.length === 0) {
        const myRole = myPlayerRole.value
        // 交換卡片：我拿到對手的 draftItems
        const opponentDraft = myRole === 'player1' 
          ? data.player2?.draftItems 
          : data.player1?.draftItems
        
        if (opponentDraft && opponentDraft.length > 0) {
          myBoard.value = createBoard(gridSize.value, opponentDraft)
        }
        gameStartTime.value = data.gameStartTime || Date.now()
        startTimer()
      }

      // 監聽對手進度
      const myRole = myPlayerRole.value
      const oppData = myRole === 'player1' ? data.player2 : data.player1
      if (oppData) {
        opponentProgress.value = {
          lineCount: oppData.lineCount || 0,
          markedCount: oppData.markedCount || 0,
          isWin: (oppData.lineCount || 0) >= 3
        }
      }

      // 遊戲結束
      if (data.status === 'FINISHED' && data.winner) {
        finishGame(data.winner)
      }
    })
  }

  // 計時器
  const startTimer = () => {
    if (timerInterval) clearInterval(timerInterval)
    timerInterval = setInterval(() => {
      if (gameStartTime.value && roomStatus.value === 'PLAYING') {
        gameDurationSec.value = Math.floor((Date.now() - gameStartTime.value) / 1000)
      }
    }, 1000)
  }

  // 結算遊戲並記錄戰績
  const finishGame = async (winner) => {
    if (timerInterval) clearInterval(timerInterval)
    gameEndTime.value = Date.now()
    
    // 確保 winner 包含正確頭像
    const resolvedAvatar = winner?.avatar || 
      (winner?.role === 'player1' || winner?.uid === player1.value?.uid ? (player1.value?.avatar || authStore.avatarId) : (player2.value?.avatar || 'calico_cat'))

    const fullWinner = {
      ...winner,
      avatar: resolvedAvatar
    }

    winnerInfo.value = fullWinner
    roomStatus.value = 'FINISHED'

    const myUid = authStore.user?.uid
    const isWinner = winner?.uid === myUid || (winner?.role === myPlayerRole.value)

    const record = {
      gameId: roomId.value || 'local_' + Date.now(),
      date: new Date().toISOString(),
      gridSize: gridSize.value,
      winnerName: winner?.name || '平手',
      winnerAvatar: resolvedAvatar,
      isWinner,
      durationSeconds: gameDurationSec.value || 1,
      myLineCount: myEvaluation.value.lineCount,
      opponentName: (myPlayerRole.value === 'player1' ? player2.value?.name : player1.value?.name) || '對手'
    }

    // 傳入 authStore.isGoogle，只有 Google 登入者才寫入 Firestore
    await saveGameRecord(myUid, record, authStore.isGoogle)
  }

  // 刪除 Firestore 當前房間 (主動清理)
  const deleteCurrentRoom = async () => {
    if (!isLocalMode.value && roomId.value && db) {
      try {
        const roomRef = doc(db, 'rooms', roomId.value)
        await deleteDoc(roomRef)
      } catch (err) {
        console.warn('Delete room warning or skipped:', err)
      }
    }
  }

  // 主動離開房間（若為房主或指定清理則刪除 Firestore 房間文件）
  const leaveRoom = async (shouldDelete = false) => {
    if (shouldDelete || isHost.value) {
      await deleteCurrentRoom()
    }
    resetRoom()
  }

  // 重設/退出房間狀態
  const resetRoom = () => {
    if (unsubscribeRoom) {
      unsubscribeRoom()
      unsubscribeRoom = null
    }
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    roomId.value = ''
    roomStatus.value = 'IDLE'
    player1.value = null
    player2.value = null
    myDraftItems.value = []
    myBoard.value = []
    winnerInfo.value = null
    gameDurationSec.value = 0
    opponentProgress.value = { lineCount: 0, markedCount: 0, isWin: false }
  }

  return {
    roomId,
    isHost,
    isLocalMode,
    isTestMode,
    roomStatus,
    gridSize,
    sizeChooserId,
    player1,
    player2,
    myDraftItems,
    myBoard,
    opponentProgress,
    gameStartTime,
    gameEndTime,
    winnerInfo,
    gameDurationSec,
    myPlayerRole,
    isMyTurnToChooseSize,
    chooserPlayerName,
    myEvaluation,
    createRoom,
    joinRoom,
    startQuickSoloTest,
    selectGridSize,
    submitDraftCard,
    toggleMarkCell,
    startLocalPlaying,
    simulateOpponentJoin,
    simulateOpponentReadyAndPlay,
    resetRoom,
    leaveRoom,
    deleteCurrentRoom,
    finishGame
  }
})

