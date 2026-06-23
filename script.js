const SIZE = 16;
const MAX_MISTAKES = 3;
const MINE_MARK = "";

const MINE_MAP = [
  "..X..........X..",
  "................",
  ".....X....XX....",
  "...X..X..X..X...",
  "..X...X..X...X..",
  ".......XX.......",
  ".X..............",
  "....XX.XX.XX....",
  "...X........X...",
  "X......X.......X",
  "........X.......",
  "...X.....X..X...",
  "........X.......",
  "................",
  ".......XXX......",
  "................"
];

const boardEl = document.getElementById("board");
const messageEl = document.getElementById("message");
const resetButton = document.getElementById("resetButton");
const mineTotalEl = document.getElementById("mineTotal");
const mineRemainingEl = document.getElementById("mineRemaining");
const lifeDisplayEl = document.getElementById("lifeDisplay");

let board = [];
let gameOver = false;
let mistakes = 0;

function createBoard() {
  gameOver = false;
  mistakes = 0;
  messageEl.textContent = "マスをクリックして開始！";
  boardEl.innerHTML = "";

  board = Array.from({ length: SIZE }, (_, row) =>
    Array.from({ length: SIZE }, (_, col) => ({
      row,
      col,
      isMine: MINE_MAP[row][col] === "X",
      isOpen: false,
      isFlagged: false,
      isMistakeMine: false,
      count: 0,
      element: null,
    }))
  );

  updateMineDisplays();
  updateLifeDisplay();

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      board[row][col].count = countMinesAround(row, col);

      const cell = document.createElement("button");
      cell.className = "cell";
      cell.type = "button";
      cell.setAttribute("aria-label", `${row + 1}行 ${col + 1}列`);

      cell.addEventListener("click", () => openCell(row, col));
      cell.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        toggleFlag(row, col);
      });

      board[row][col].element = cell;
      boardEl.appendChild(cell);
    }
  }
}

function countTotalMines() {
  return board.flat().filter((cell) => cell.isMine).length;
}

function countFlags() {
  return board.flat().filter((cell) => cell.isFlagged).length;
}

function updateMineDisplays() {
  const total = countTotalMines();
  const remaining = total - countFlags();
  mineTotalEl.textContent = String(total);
  mineRemainingEl.textContent = String(remaining);
}

function updateLifeDisplay() {
  const broken = "💔".repeat(mistakes);
  const hearts = "💓".repeat(Math.max(MAX_MISTAKES - mistakes, 0));
  lifeDisplayEl.textContent = broken + hearts;
}

function isInside(row, col) {
  return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
}

function getNeighbors(row, col) {
  const neighbors = [];

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (isInside(nr, nc)) neighbors.push(board[nr][nc]);
    }
  }

  return neighbors;
}

function countMinesAround(row, col) {
  return getNeighbors(row, col).filter((cell) => cell.isMine).length;
}

function openCell(row, col) {
  if (gameOver) return;

  const cell = board[row][col];
  if (cell.isOpen || cell.isFlagged) return;

  if (cell.isMine) {
    handleMineClick(cell);
    return;
  }

  cell.isOpen = true;
  renderCell(cell);

  if (cell.count === 0) {
    for (const neighbor of getNeighbors(row, col)) {
      if (!neighbor.isOpen && !neighbor.isFlagged && !neighbor.isMine) {
        openCell(neighbor.row, neighbor.col);
      }
    }
  }

  checkWin();
}

function handleMineClick(cell) {
  cell.isOpen = true;
  cell.isMistakeMine = true;
  mistakes += 1;
  updateLifeDisplay();
  renderCell(cell);

  if (mistakes < MAX_MISTAKES) {
    messageEl.textContent = "ミス！";
    return;
  }

  gameOver = true;
  cell.element.classList.add("exploded");
  messageEl.textContent = "ゲームオーバー！";
  revealAllMines();
}

function toggleFlag(row, col) {
  if (gameOver) return;

  const cell = board[row][col];
  if (cell.isOpen) return;

  cell.isFlagged = !cell.isFlagged;
  renderCell(cell);
  updateMineDisplays();
}

function renderCell(cell) {
  const el = cell.element;
  const wasExploded = el.classList.contains("exploded");

  el.className = "cell";
  el.textContent = "";

  if (wasExploded) el.classList.add("exploded");

  if (cell.isFlagged && !cell.isOpen) {
    el.classList.add("flag");
    el.textContent = "🚩";
    return;
  }

  if (!cell.isOpen) return;

  el.classList.add("open");

  if (cell.isMine) {
    if (cell.isMistakeMine && !gameOver) {
      el.classList.add("mistake");
      el.textContent = "💥";
      return;
    }

    el.classList.add("mine");
    el.textContent = MINE_MARK;
    return;
  }

  if (cell.count > 0) {
    el.classList.add(`n${cell.count}`);
    el.textContent = cell.count;
  }
}

function revealAllMines() {
  for (const row of board) {
    for (const cell of row) {
      if (cell.isMine) {
        cell.isOpen = true;
        renderCell(cell);
      }
    }
  }
}

function checkWin() {
  const allSafeCellsOpened = board
    .flat()
    .every((cell) => cell.isMine || cell.isOpen);

  if (allSafeCellsOpened) {
    gameOver = true;
    messageEl.textContent = "クリア！";
    revealAllMines();
  }
}

resetButton.addEventListener("click", createBoard);
createBoard();
