
import { GameState } from './game-engine.js';
import { UIController } from './ui-controller.js';

const game = new GameState();
const ui = new UIController();

// Init
game.startNewGame();

// Event Listeners
// Event Listeners
['left', 'center', 'right'].forEach(lane => {
    const btn = ui.elements.drawBtns[lane];
    if (btn) {
        btn.addEventListener('click', () => {
            if (game.isGameOver) return;

            const result = game.playRound(lane);
            if (result) {
                const laneEls = ui.getLaneElements(lane);
                ui.renderCard(result.card1, laneEls.p1Slot);
                ui.renderCard(result.card2, laneEls.p2Slot);
                ui.addToHistory(result.card1, result.card2, lane);
                ui.updateScores(result.score1, result.score2, lane);

                if (ui.elements.remainingCount) {
                    ui.elements.remainingCount.textContent = `${result.cardsRemaining} Cards`;
                }
            }

            if (game.isGameOver) {
                endGame();
            }
        });
    }
});

ui.elements.simBtn.addEventListener('click', () => {
    if (game.isGameOver) return;

    ui.setButtonsEnabled(false);

    setTimeout(() => {
        const results = game.simulateRestOfGame();

        // Populate history for ALL simulated rounds
        results.forEach(round => {
            ui.addToHistory(round.card1, round.card2, round.lane);
            ui.updateScores(round.score1, round.score2, round.lane); // Update score live for animation effect? Or just valid final

            // Only render final card visual for the lane that was last played? 
            // Or maybe just show the last played cards in their respective lanes?
            const laneEls = ui.getLaneElements(round.lane);
            ui.renderCard(round.card1, laneEls.p1Slot);
            ui.renderCard(round.card2, laneEls.p2Slot);
        });

        if (ui.elements.remainingCount) ui.elements.remainingCount.textContent = `0 Cards`;

        endGame();
    }, 50);
});

ui.elements.resetBtn.addEventListener('click', () => {
    game.startNewGame();
    ui.resetUI();
});

function endGame() {
    ui.setButtonsEnabled(false);

    // Determine winner based on "Best of 3 Lanes"
    let p1Wins = 0;
    let p2Wins = 0;

    ['left', 'center', 'right'].forEach(lane => {
        if (game.lanes[lane].score1 > game.lanes[lane].score2) p1Wins++;
        else if (game.lanes[lane].score2 > game.lanes[lane].score1) p2Wins++;
    });

    let msg = '';
    if (p1Wins > p2Wins) msg = `YOU WIN (${p1Wins}-${p2Wins})`;
    else if (p2Wins > p1Wins) msg = `CPU WINS (${p2Wins}-${p1Wins})`;
    else msg = 'DRAW!';

    ui.updateMessage(msg);
}
