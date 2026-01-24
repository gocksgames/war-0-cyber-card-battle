// Game History Tracker
const gameHistory = [];
const MAX_HISTORY = 10;

function updateGameHistory(result) {
    // result: 'win', 'loss', or 'draw'
    gameHistory.push(result);

    // Keep only last 10
    if (gameHistory.length > MAX_HISTORY) {
        gameHistory.shift();
    }

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

export { updateGameHistory, renderGameHistory };
