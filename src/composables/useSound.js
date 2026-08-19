import { ref } from 'vue'

const soundEnabled = ref(true)
let audioCtx = null

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

/**
 * 8-Bit 像素音效合成器 (Web Audio API)
 */
export function useSound() {
  const toggleSound = () => {
    soundEnabled.value = !soundEnabled.value
  }

  // 1. 8-Bit 按鈕點擊 (Square Wave click)
  const playClick = () => {
    if (!soundEnabled.value) return
    try {
      const ctx = getAudioContext()
      if (!ctx) return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.05)
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.05)
    } catch (e) {
      console.warn('Audio play failed', e)
    }
  }

  // 2. 8-Bit 填寫/標記格子音效 (Pop / Coin style)
  const playMark = () => {
    if (!soundEnabled.value) return
    try {
      const ctx = getAudioContext()
      if (!ctx) return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.06) // A5
      
      gain.gain.setValueAtTime(0.18, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.15)
    } catch (e) {
      console.warn('Audio mark failed', e)
    }
  }

  // 3. 8-Bit 連線達成音效 (Power Up / Line Chime)
  const playLineMatch = () => {
    if (!soundEnabled.value) return
    try {
      const ctx = getAudioContext()
      if (!ctx) return
      const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'square'
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07)
        
        gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.07)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.07 + 0.1)
        
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime + idx * 0.07)
        osc.stop(ctx.currentTime + idx * 0.07 + 0.1)
      })
    } catch (e) {
      console.warn('Audio line match failed', e)
    }
  }

  // 4. 8-Bit 勝利大勝歡呼 (BINGO Fanfare)
  const playWin = () => {
    if (!soundEnabled.value) return
    try {
      const ctx = getAudioContext()
      if (!ctx) return
      const fanfare = [
        { f: 523.25, d: 0.12 }, // C5
        { f: 523.25, d: 0.12 }, // C5
        { f: 523.25, d: 0.12 }, // C5
        { f: 659.25, d: 0.28 }, // E5
        { f: 587.33, d: 0.15 }, // D5
        { f: 659.25, d: 0.15 }, // E5
        { f: 783.99, d: 0.5 }   // G5
      ]
      let timeOffset = 0
      fanfare.forEach((item) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'square'
        osc.frequency.setValueAtTime(item.f, ctx.currentTime + timeOffset)
        
        gain.gain.setValueAtTime(0.18, ctx.currentTime + timeOffset)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + timeOffset + item.d)
        
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime + timeOffset)
        osc.stop(ctx.currentTime + timeOffset + item.d)
        timeOffset += item.d
      })
    } catch (e) {
      console.warn('Audio win failed', e)
    }
  }

  // 5. 8-Bit 倒數/選定音效 (Beep)
  const playBeep = () => {
    if (!soundEnabled.value) return
    try {
      const ctx = getAudioContext()
      if (!ctx) return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(329.63, ctx.currentTime) // E4
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.08)
    } catch (e) {
      console.warn('Audio beep failed', e)
    }
  }

  return {
    soundEnabled,
    toggleSound,
    playClick,
    playMark,
    playLineMatch,
    playWin,
    playBeep
  }
}
