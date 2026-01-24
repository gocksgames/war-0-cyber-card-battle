
import { GameState } from './game-engine.js';
import { UIController } from './ui-controller.js';
import { updateGameHistory, renderGameHistory, loadGameHistory } from './game-history.js';

const game = new GameState();
const ui = new UIController();

// Init
game.initializeGame();
ui.resetUI();
ui.renderReinforcements(game);
loadGameHistory(); // Load saved game history

// Event Listeners
// Event Listeners
['left', 'center', 'right'].forEach(lane => {
    const btn = ui.elements.drawBtns[lane];
    if (btn) {
        btn.addEventListener('click', () => {
            if (game.isGameOver) return;

            // Updated: playRound returns complex object
            const result = game.playRound(lane);

            if (result) {
                // Clear ALL slots visuals first (to show fresh state)
                ui.resetCardVisuals();

                // 1. Handle Player Move
                const pMove = result.playerMove;
                const pEl = ui.getLaneElements(pMove.lane);
                ui.renderCard(pMove.card, pEl.p1Slot);
                ui.updateLaneHistory(pMove.lane, game.lanes[pMove.lane].history);

                // Score p1
                if (pEl.p1Score) ui.animateValue(pEl.p1Score, parseInt(pEl.p1Score.innerText), pMove.score, 300);

                // 2. Handle CPU Move
                const cMove = result.cpuMove;
                const cEl = ui.getLaneElements(cMove.lane);
                ui.renderCard(cMove.card, cEl.p2Slot);
                // History update already done via full lane update above (it contains both p1 and p2 moves now?)
                // Actually pMove.lane and cMove.lane might be different!
                if (pMove.lane !== cMove.lane) {
                    ui.updateLaneHistory(cMove.lane, game.lanes[cMove.lane].history);
                } else {
                    // If same lane, we already updated it.
                }
                // Score p2
                if (cEl.p2Score) ui.animateValue(cEl.p2Score, parseInt(cEl.p2Score.innerText), cMove.score, 300);

                // 3. Update State Classes (Inactive/Active)
                ['left', 'center', 'right'].forEach(l => {
                    const el = ui.getLaneElements(l);

                    // Player Slot Active?
                    if (l !== pMove.lane) {
                        el.p1Slot.classList.add('inactive');
                    } else {
                        el.p1Slot.classList.remove('inactive');
                    }

                    // CPU Slot Active?
                    if (l !== cMove.lane) {
                        el.p2Slot.classList.add('inactive');
                    } else {
                        el.p2Slot.classList.remove('inactive');
                    }

                    // Update Diff Badge for ALL lanes (scores might have changed)
                    // We need to fetch current scores from game state strictly, 
                    // or trust the DOM/Animation? 
                    // Better: use game state. But result only returns active lanes scores.
                    // Actually, we can just re-check diff for everyone based on Game Engine data?
                    // But 'result' doesn't have all lanes data.
                    // Access game.lanes direct?
                    const globalLane = game.lanes[l];
                    const diff = globalLane.score1 - globalLane.score2;

                    if (el.diffBadge) {
                        el.diffBadge.textContent = diff === 0 ? '0' : (diff > 0 ? `+${diff}` : diff);
                        el.diffBadge.classList.remove('diff-positive', 'diff-negative');
                        if (el.laneContainer) el.laneContainer.classList.remove('winning-lane', 'losing-lane');

                        if (diff > 0) {
                            el.diffBadge.classList.add('diff-positive');
                            if (el.laneContainer) el.laneContainer.classList.add('winning-lane');
                        } else if (diff < 0) {
                            el.diffBadge.classList.add('diff-negative');
                            if (el.laneContainer) el.laneContainer.classList.add('losing-lane');
                        }
                    }
                });

                if (ui.elements.remainingCount) {
                    ui.elements.remainingCount.textContent = `${result.cardsRemaining} Cards`;
                }

                ui.renderReinforcements(game);
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
        // Note: We don't update scores per round to avoid animation race conditions

        // Mass update all lanes histories and scores at end of sim
        ['left', 'center', 'right'].forEach(lane => {
            ui.updateLaneHistory(lane, game.lanes[lane].history);
            ui.updateScores(game.lanes[lane].score1, game.lanes[lane].score2, lane, true); // Immediate update
        });

        if (ui.elements.remainingCount) ui.elements.remainingCount.textContent = `0 Cards`;

        ui.renderReinforcements(game); // Final State
        endGame();
    }, 50);
});

ui.elements.resetBtn.addEventListener('click', () => {
    game.initializeGame();
    ui.resetUI();
    ui.renderReinforcements(game);
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

    // Render Sidebar Report
    ui.showSidebarResults(game);
}

// AI Toggle
const aiToggle = document.getElementById('ai-toggle');
const aiStatus = document.getElementById('ai-status');

if (aiToggle) {
    // Sync initial state
    const initialSmart = aiToggle.checked;
    game.setDifficulty(initialSmart ? 'smart' : 'random');
    if (aiStatus) aiStatus.textContent = initialSmart ? 'SMART' : 'RANDOM';

    aiToggle.addEventListener('change', (e) => {
        const isSmart = e.target.checked;
        game.setDifficulty(isSmart ? 'smart' : 'random');
        if (aiStatus) {
            aiStatus.textContent = isSmart ? 'SMART' : 'RANDOM';
            // Debug log
            console.log('AI Toggle Changed:', isSmart, aiStatus.textContent);
        }
    });
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    if (game.isGameOver) return;

    switch (e.key.toLowerCase()) {
        case 'a':
            document.getElementById('draw-btn-left').click();
            break;
        case 's':
            document.getElementById('draw-btn-center').click();
            break;
        case 'd':
            document.getElementById('draw-btn-right').click();
            break;
    }
});
