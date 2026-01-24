
import { GameState } from './game-engine.js';
import { UIController } from './ui-controller.js';

const game = new GameState();
const ui = new UIController();

// Init
game.startNewGame();

// Event Listeners
ui.elements.drawBtn.addEventListener('click', () => {
    if (game.isGameOver) return;

    const result = game.playRound();
    if (result) {
        ui.renderCard(result.card1, ui.elements.p1CardSlot);
        ui.renderCard(result.card2, ui.elements.p2CardSlot);
        ui.addToHistory(result.card1, result.card2); // Add to history pile
        ui.updateScores(result.score1, result.score2);

        if (result.winner === 'tie') {
            ui.updateMessage('WAR!', 'warning');
        } else {
            ui.updateMessage('');
        }
    }

    if (game.isGameOver) {
        endGame();
    }
});

ui.elements.simBtn.addEventListener('click', () => {
    if (game.isGameOver) return;

    // Disable controls while simulating (or just do it instantly)
    ui.setButtonsEnabled(false);

    // Slight delay for visual effect
    setTimeout(() => {
        const results = game.simulateRestOfGame();

        // Render last cards
        if (results.length > 0) {
            const lastRound = results[results.length - 1];
            ui.renderCard(lastRound.card1, ui.elements.p1CardSlot);
            ui.renderCard(lastRound.card2, ui.elements.p2CardSlot);
            ui.updateScores(lastRound.score1, lastRound.score2);
            // Update remaining count
            if (ui.elements.remainingCount) ui.elements.remainingCount.textContent = `${lastRound.cardsRemaining} Cards`;
        }

        // Correct stats display for updated logic
        document.getElementById('stat-p1-wins').textContent = game.score1; // Reusing ID but showing Sum
        document.getElementById('stat-p2-wins').textContent = game.score2;
        document.getElementById('stat-final-score').textContent = "TIED";

        ui.showSimulationResults(results, game.score1, game.score2);
        endGame();
    }, 50);
});

ui.elements.resetBtn.addEventListener('click', () => {
    game.startNewGame();
    ui.resetUI();
});

function endGame() {
    ui.setButtonsEnabled(false);
    let msg = '';
    if (game.score1 > game.score2) msg = 'PLAYER 1 WINS!';
    else if (game.score2 > game.score1) msg = 'PLAYER 2 WINS!';
    else msg = 'DRAW!';

    ui.updateMessage(msg);
}
