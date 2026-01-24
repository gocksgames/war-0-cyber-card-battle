
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

            // Updated: playRound returns complex object
            const result = game.playRound(lane);

            if (result) {
                // Clear ALL slots visuals first (to show fresh state)
                ui.resetCardVisuals();

                // 1. Handle Player Move
                const pMove = result.playerMove;
                const pEl = ui.getLaneElements(pMove.lane);
                ui.renderCard(pMove.card, pEl.p1Slot);
                ui.addToHistory(pMove.card, 'p1', pMove.lane);
                // Score p1
                if (pEl.p1Score) ui.animateValue(pEl.p1Score, parseInt(pEl.p1Score.innerText), pMove.score, 300);

                // 2. Handle CPU Move
                const cMove = result.cpuMove;
                const cEl = ui.getLaneElements(cMove.lane);
                ui.renderCard(cMove.card, cEl.p2Slot);
                ui.addToHistory(cMove.card, 'p2', cMove.lane);
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

    const sidebar = document.getElementById('sidebar-results');
    if (sidebar) {
        sidebar.innerHTML = `
            <h3>BATTLE REPORT</h3>
            <div class="result-line">
                <span>LEFT</span>
                <span class="${game.lanes.left.score1 > game.lanes.left.score2 ? 'res-win' : (game.lanes.left.score1 < game.lanes.left.score2 ? 'res-loss' : 'res-draw')}">
                    ${game.lanes.left.score1}:${game.lanes.left.score2}
                </span>
            </div>
            <div class="result-line">
                <span>CENTRAL</span>
                <span class="${game.lanes.center.score1 > game.lanes.center.score2 ? 'res-win' : (game.lanes.center.score1 < game.lanes.center.score2 ? 'res-loss' : 'res-draw')}">
                    ${game.lanes.center.score1}:${game.lanes.center.score2}
                </span>
            </div>
            <div class="result-line">
                <span>RIGHT</span>
                <span class="${game.lanes.right.score1 > game.lanes.right.score2 ? 'res-win' : (game.lanes.right.score1 < game.lanes.right.score2 ? 'res-loss' : 'res-draw')}">
                    ${game.lanes.right.score1}:${game.lanes.right.score2}
                </span>
            </div>
            <div class="divider"></div>
            <div class="result-line" style="font-size: 1.1rem; color: ${p1Wins > p2Wins ? '#4ade80' : (p2Wins > p1Wins ? '#f87171' : 'white')}">
                <span>RESULT</span>
                <span>${p1Wins > p2Wins ? 'VICTORY' : (p2Wins > p1Wins ? 'DEFEAT' : 'STALEMATE')}</span>
            </div>
        `;
    }
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
