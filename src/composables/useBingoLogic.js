/**
 * 賓果核心邏輯與連線判定 Composable
 */

export function useBingoLogic() {
  /**
   * 初始化賓果卡結構
   * @param {number} size (4, 5, 或 6)
   * @param {string[]} items (長度為 size * size)
   * @returns {Array}
   */
  const createBoard = (size, items = []) => {
    const total = size * size
    const board = []
    for (let i = 0; i < total; i++) {
      const row = Math.floor(i / size)
      const col = i % size
      board.push({
        id: i,
        index: i,
        row,
        col,
        text: items[i] || `項目 ${i + 1}`,
        marked: false,
        isWinningCell: false
      })
    }
    return board
  }

  /**
   * 檢查當前連線數與獲勝線條
   * @param {Array} board 
   * @param {number} size 
   * @returns {{ lineCount: number, lines: Array, winningCellIndices: Set<number>, isWin: boolean }}
   */
  const evaluateBoard = (board, size) => {
    if (!board || board.length !== size * size) {
      return { lineCount: 0, lines: [], winningCellIndices: new Set(), isWin: false }
    }

    const lines = []
    const winningCellIndices = new Set()

    // 1. 檢查所有橫排 (Horizontal)
    for (let r = 0; r < size; r++) {
      const rowIndices = []
      let allMarked = true
      for (let c = 0; c < size; c++) {
        const idx = r * size + c
        rowIndices.push(idx)
        if (!board[idx]?.marked) {
          allMarked = false
        }
      }
      if (allMarked) {
        lines.push({ type: 'row', index: r, indices: rowIndices })
        rowIndices.forEach(idx => winningCellIndices.add(idx))
      }
    }

    // 2. 檢查所有直行 (Vertical)
    for (let c = 0; c < size; c++) {
      const colIndices = []
      let allMarked = true
      for (let r = 0; r < size; r++) {
        const idx = r * size + c
        colIndices.push(idx)
        if (!board[idx]?.marked) {
          allMarked = false
        }
      }
      if (allMarked) {
        lines.push({ type: 'col', index: c, indices: colIndices })
        colIndices.forEach(idx => winningCellIndices.add(idx))
      }
    }

    // 3. 檢查主對角線 (Top-Left to Bottom-Right)
    const mainDiagIndices = []
    let mainDiagAll = true
    for (let i = 0; i < size; i++) {
      const idx = i * size + i
      mainDiagIndices.push(idx)
      if (!board[idx]?.marked) {
        mainDiagAll = false
      }
    }
    if (mainDiagAll) {
      lines.push({ type: 'diag_main', indices: mainDiagIndices })
      mainDiagIndices.forEach(idx => winningCellIndices.add(idx))
    }

    // 4. 檢查副對角線 (Top-Right to Bottom-Left)
    const antiDiagIndices = []
    let antiDiagAll = true
    for (let i = 0; i < size; i++) {
      const idx = i * size + (size - 1 - i)
      antiDiagIndices.push(idx)
      if (!board[idx]?.marked) {
        antiDiagAll = false
      }
    }
    if (antiDiagAll) {
      lines.push({ type: 'diag_anti', indices: antiDiagIndices })
      antiDiagIndices.forEach(idx => winningCellIndices.add(idx))
    }

    const lineCount = lines.length
    const isWin = lineCount >= 3 // 先完成三條線獲勝

    return {
      lineCount,
      lines,
      winningCellIndices,
      isWin
    }
  }

  /**
   * 計算已標記的格子總數
   * @param {Array} board 
   * @returns {number}
   */
  const countMarkedCells = (board) => {
    if (!board) return 0
    return board.filter(cell => cell.marked).length
  }

  return {
    createBoard,
    evaluateBoard,
    countMarkedCells
  }
}
