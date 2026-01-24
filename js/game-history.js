// Game History Tracker with localStorage persistence
const STORAGE_KEY = 'war0_game_history';
let gameHistory = [];
const MAX_HISTORY = 10;

// Load history from localStorage on init
function loadGameHistory() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            gameHistory = JSON.parse(stored);
        }
    } catch (e) {
        console.error('Failed to load game history:', e);
        gameHistory = [];
    }
    renderGameHistory();
}

function saveGameHistory() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gameHistory));
    } catch (e) {
        console.error('Failed to save game history:', e);
    }
}

function updateGameHistory(result) {
    // result: 'win', 'loss', or 'draw'
    gameHistory.push(result);

    // Keep only last 10
    if (gameHistory.length > MAX_HISTORY) {
        gameHistory.shift();
    }

    saveGameHistory();
    renderGameHistory();
}

function renderGameHistory() {
    const historyIcons = document.getElementById('game-history-icons');
    const winCount = document.getElementById('win-count');
    const lossCount = document.getElementById('loss-count');

    if (!historyIcons) return;

    // Clear and rebuild icons
    historyIcons.innerHTML = '';

    let wins = 0;
    let losses = 0;

    gameHistory.forEach(result => {
        const icon = document.createElement('div');
        icon.className = `game-result-icon ${result}`;

        if (result === 'win') {
            icon.textContent = 'W';
            wins++;
        } else if (result === 'loss') {
            icon.textContent = 'L';
            losses++;
        } else {
            icon.textContent = 'D';
        }

        historyIcons.appendChild(icon);
    });

    if (winCount) winCount.textContent = wins;
    if (lossCount) lossCount.textContent = losses;
}

export { updateGameHistory, renderGameHistory, loadGameHistory };
