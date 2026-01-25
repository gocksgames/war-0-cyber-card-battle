
import { SUITS, RANKS } from './game-engine.js';

export class UIController {
    constructor() {
        this.lanes = ['left', 'center', 'right'];
        this.elements = {
            drawBtns: {
                left: document.getElementById('draw-btn-left'),
                center: document.getElementById('draw-btn-center'),
                right: document.getElementById('draw-btn-right')
            },
            simBtn: document.getElementById('sim-btn'),
            resetBtn: document.getElementById('reset-btn'),
            simStats: document.getElementById('sim-stats'),
            messageArea: document.getElementById('message-area'),
            remainingCount: document.getElementById('remaining-count')
        };
    }

    setupEventListeners(game) {
        // Difficulty Slider
        const slider = document.getElementById('ai-difficulty');
        const diffText = document.getElementById('ai-difficulty-text');

        if (slider) {
            slider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                game.setDifficulty(val);

                const labels = ['RANDOM', 'EASY', 'PRO', 'HARD+'];
                if (diffText) diffText.textContent = labels[val];
            });
        }

        // Simulation Toggle
        if (this.elements.simBtn) {
            this.elements.simBtn.addEventListener('click', () => {
                const results = game.simulateRestOfGame();
                results.forEach(res => {
                    this.updateScores(res.playerMove.score, 0, res.playerMove.lane, true);
                    this.updateScores(0, res.cpuMove.score, res.cpuMove.lane, true);

                    const pLaneEl = this.getLaneElements(res.playerMove.lane);
                    const cLaneEl = this.getLaneElements(res.cpuMove.lane);

                    this.renderCard(res.playerMove.card, pLaneEl.p1Slot);
                    this.renderCard(res.cpuMove.card, cLaneEl.p2Slot);

                    this.updateLaneHistory(res.playerMove.lane, game.lanes[res.playerMove.lane].history);
                    this.updateLaneHistory(res.cpuMove.lane, game.lanes[res.cpuMove.lane].history);
                });

                this.renderReinforcements(game);
                this.showSidebarResults(game);

                if (this.elements.remainingCount) {
                    this.elements.remainingCount.textContent = '0 Cards';
                }
                this.setButtonsEnabled(false);
            });
        }

        // Reset Button
        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener('click', () => {
                game.initializeGame();
                this.resetUI();
                this.renderReinforcements(game);
            });
        }

        // Draw Buttons
        Object.entries(this.elements.drawBtns).forEach(([lane, btn]) => {
            if (btn) {
                btn.addEventListener('click', () => {
                    if (game.isGameOver) return;

                    const result = game.playRound(lane);
                    if (result) {
                        // Update Player Lane
                        this.updateScores(result.playerMove.score, game.lanes[lane].score2, lane);
                        // Update CPU Lane (could be different)
                        this.updateScores(game.lanes[result.cpuMove.lane].score1, result.cpuMove.score, result.cpuMove.lane);

                        const pLaneEl = this.getLaneElements(lane);
                        const cLaneEl = this.getLaneElements(result.cpuMove.lane);

                        this.renderCard(result.playerMove.card, pLaneEl.p1Slot);
                        this.renderCard(result.cpuMove.card, cLaneEl.p2Slot);

                        // Update History
                        this.updateLaneHistory(lane, game.lanes[lane].history);
                        this.updateLaneHistory(result.cpuMove.lane, game.lanes[result.cpuMove.lane].history);

                        // Remaining Count
                        if (this.elements.remainingCount) {
                            this.elements.remainingCount.textContent = `${result.cardsRemaining} Cards`;
                        }

                        // Reinforcements Update
                        this.renderReinforcements(game);

                        if (game.isGameOver) {
                            this.showSidebarResults(game);
                            this.setButtonsEnabled(false);
                        }
                    }
                });
            }
        });

        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            const key = e.key.toLowerCase();

            // R - Reset
            if (key === 'r') {
                e.preventDefault();
                if (this.elements.resetBtn) this.elements.resetBtn.click();
                return;
            }

            // P - Simulate
            if (key === 'p' && !game.isGameOver) {
                e.preventDefault();
                if (this.elements.simBtn) this.elements.simBtn.click();
                return;
            }

            // A, S, D - Lanes
            if (game.isGameOver) return;

            switch (key) {
                case 'a':
                    if (this.elements.drawBtns.left) this.elements.drawBtns.left.click();
                    break;
                case 's':
                    if (this.elements.drawBtns.center) this.elements.drawBtns.center.click();
                    break;
                case 'd':
                    if (this.elements.drawBtns.right) this.elements.drawBtns.right.click();
                    break;
            }
        });
    }

    getLaneElements(lane) {
        return {
            laneContainer: document.getElementById(`lane-${lane}`),
            p1Slot: document.getElementById(`p1-card-slot-${lane}`),
            p2Slot: document.getElementById(`p2-card-slot-${lane}`),
            p1Score: document.getElementById(`p1-score-${lane}`),
            p2Score: document.getElementById(`p2-score-${lane}`),
            p1History: document.getElementById(`p1-history-${lane}`),
            p2History: document.getElementById(`p2-history-${lane}`),
            diffBadge: document.getElementById(`diff-${lane}`)
        };
    }

    renderCard(card, slotElement) {
        slotElement.innerHTML = '';
        if (!card) return;

        const cardDiv = document.createElement('div');
        cardDiv.className = `card ${card.color}`;

        cardDiv.innerHTML = `
            <div class="card-top">${card.rank}${card.suit}</div>
            <div class="card-center">${card.suit}</div>
            <div class="card-bottom">${card.rank}${card.suit}</div>
        `;

        slotElement.appendChild(cardDiv);
    }

    updateScores(s1, s2, lane) {
        const els = this.getLaneElements(lane);

        if (els.p1Score) els.p1Score.innerText = s1;
        if (els.p2Score) els.p2Score.innerText = s2;

        // Update Difference Badge & Dynamic Borders
        if (els.diffBadge) {
            const diff = s1 - s2;
            const absDiff = Math.abs(diff);
            els.diffBadge.textContent = diff === 0 ? '0' : (diff > 0 ? `+${diff}` : diff);

            els.diffBadge.classList.remove('diff-positive', 'diff-negative', 'diff-low', 'diff-medium', 'diff-high');
            if (els.laneContainer) {
                els.laneContainer.classList.remove('winning-lane', 'losing-lane');
            }

            if (diff > 0) {
                els.diffBadge.classList.add('diff-positive');
                if (els.laneContainer) els.laneContainer.classList.add('winning-lane');
            } else if (diff < 0) {
                els.diffBadge.classList.add('diff-negative');
                if (els.laneContainer) els.laneContainer.classList.add('losing-lane');
            }

            if (absDiff > 0) {
                if (absDiff <= 20) {
                    els.diffBadge.classList.add('diff-low');
                } else if (absDiff <= 50) {
                    els.diffBadge.classList.add('diff-medium');
                } else {
                    els.diffBadge.classList.add('diff-high');
                }
            }
        }
    }

    resetCardVisuals() {
        this.lanes.forEach(lane => {
            const els = this.getLaneElements(lane);
            if (els.p1Slot) els.p1Slot.classList.remove('inactive');
            if (els.p2Slot) els.p2Slot.classList.remove('inactive');
        });
    }

    updateMessage(msg, type = 'info') {
        if (this.elements.messageArea) {
            this.elements.messageArea.textContent = msg;
            this.elements.messageArea.className = `message-area ${type}`;
        }
    }

    showGameResultBanner(resultType, resultText) {
        const banner = document.getElementById('game-result-banner');
        if (!banner) return;

        banner.style.display = 'block';
        banner.className = `game-result-banner ${resultType}`;
        banner.innerHTML = `<div class="banner-text">${resultText}</div>`;
    }

    hideGameResultBanner() {
        const banner = document.getElementById('game-result-banner');
        if (banner) banner.style.display = 'none';
    }

    updateReconStats(p1Total, p2Total, p1Count, p2Count) {
        const threatDelta = document.getElementById('threat-delta');
        const p1StrikeRating = document.getElementById('p1-strike-rating');
        const p2StrikeRating = document.getElementById('p2-strike-rating');
        const p1StrikeDelta = document.getElementById('p1-strike-delta');
        const p2StrikeDelta = document.getElementById('p2-strike-delta');

        if (threatDelta) {
            const delta = p2Total - p1Total;
            threatDelta.textContent = delta === 0 ? '0' : (delta > 0 ? `+${delta}` : delta);

            threatDelta.classList.remove('positive', 'negative');
            if (delta > 0) threatDelta.classList.add('positive');
            else if (delta < 0) threatDelta.classList.add('negative');
        }

        const p1Avg = p1Count > 0 ? (p1Total / p1Count) : 6.0;
        const p2Avg = p2Count > 0 ? (p2Total / p2Count) : 6.0;

        if (p1StrikeRating) p1StrikeRating.textContent = p1Avg.toFixed(1);
        if (p2StrikeRating) p2StrikeRating.textContent = p2Avg.toFixed(1);

        if (p1StrikeDelta) {
            const delta = p1Avg - 6.0;
            p1StrikeDelta.textContent = delta === 0 ? '(+0)' : (delta > 0 ? `(+${delta.toFixed(1)})` : `(${delta.toFixed(1)})`);
        }

        if (p2StrikeDelta) {
            const delta = p2Avg - 6.0;
            p2StrikeDelta.textContent = delta === 0 ? '(+0)' : (delta > 0 ? `(+${delta.toFixed(1)})` : `(${delta.toFixed(1)})`);
        }
    }

    showSidebarResults(game) {
        const summary = document.getElementById('game-result-summary');
        if (!summary) return;

        let p1Wins = 0;
        let p2Wins = 0;

        ['left', 'center', 'right'].forEach(lane => {
            if (game.lanes[lane].score1 > game.lanes[lane].score2) p1Wins++;
            else if (game.lanes[lane].score2 > game.lanes[lane].score1) p2Wins++;
        });

        const resultMsg = document.getElementById('result-message');

        if (p1Wins > p2Wins) {
            summary.className = 'game-result-summary win';
            if (resultMsg) resultMsg.textContent = `YOU WIN (${p1Wins}-${p2Wins})`;
        } else if (p2Wins > p1Wins) {
            summary.className = 'game-result-summary loss';
            if (resultMsg) resultMsg.textContent = `CPU WINS (${p2Wins}-${p1Wins})`;
        } else {
            summary.className = 'game-result-summary draw';
            if (resultMsg) resultMsg.textContent = 'DRAW';
        }

        ['left', 'center', 'right'].forEach(lane => {
            const laneData = game.lanes[lane];
            const outcomeEl = document.getElementById(`${lane}-outcome`);

            if (outcomeEl) {
                if (laneData.score1 > laneData.score2) {
                    outcomeEl.textContent = `WIN (${laneData.score1}-${laneData.score2})`;
                    outcomeEl.className = 'lane-outcome win';
                } else if (laneData.score2 > laneData.score1) {
                    outcomeEl.textContent = `LOSS (${laneData.score1}-${laneData.score2})`;
                    outcomeEl.className = 'lane-outcome loss';
                } else {
                    outcomeEl.textContent = `DRAW (${laneData.score1}-${laneData.score2})`;
                    outcomeEl.className = 'lane-outcome draw';
                }
            }
        });

        summary.style.display = 'block';
    }

    setButtonsEnabled(enabled) {
        Object.values(this.elements.drawBtns).forEach(btn => {
            if (btn) {
                btn.disabled = !enabled;
                btn.style.opacity = enabled ? '1' : '0.5';
            }
        });

        if (this.elements.simBtn) {
            this.elements.simBtn.disabled = !enabled;
            this.elements.simBtn.style.opacity = enabled ? '1' : '0.5';
        }
    }

    resetUI() {
        this.lanes.forEach(lane => {
            const els = this.getLaneElements(lane);
            if (els.p1Slot) els.p1Slot.innerHTML = '';
            if (els.p2Slot) els.p2Slot.innerHTML = '';
            if (els.p1Score) els.p1Score.textContent = '0';
            if (els.p2Score) els.p2Score.textContent = '0';
            if (els.p1History) els.p1History.innerHTML = '';
            if (els.p2History) els.p2History.innerHTML = '';
            if (els.diffBadge) {
                els.diffBadge.textContent = '0';
                els.diffBadge.classList.remove('diff-positive', 'diff-negative');
            }
            if (els.laneContainer) {
                els.laneContainer.classList.remove('winning-lane', 'losing-lane');
            }
        });

        this.setButtonsEnabled(true);
        const sidebar = document.getElementById('sidebar-results');
        if (sidebar) sidebar.innerHTML = '';

        this.hideGameResultBanner();

        if (this.elements.remainingCount) this.elements.remainingCount.textContent = '36 Cards';
        if (this.elements.messageArea) this.elements.messageArea.textContent = '';
    }

    renderCardMatrix(container, cardList, activeIfInList = true) {
        if (!container) return;
        container.innerHTML = '';
        container.className = 'card-matrix';

        const suitOrder = ['♥', '♠', '♦', '♣'];
        const rankOrder = ['10', '9', '8', '7', '6', '5', '4', '3', '2'];

        let totalValue = 0;

        suitOrder.forEach(suit => {
            rankOrder.forEach(rank => {
                const value = parseInt(rank);
                const present = cardList.some(c => c.suit === suit && c.rank === rank);
                const isActive = activeIfInList ? present : !present;

                const slot = document.createElement('div');
                const color = (suit === '♥' || suit === '♦') ? 'red' : 'black';

                slot.className = `matrix-slot ${color} ${isActive ? 'active' : ''}`;
                slot.innerHTML = `${rank}<div class="mini-suit">${suit}</div>`;

                container.appendChild(slot);

                if (present) totalValue += value;
            });
        });

        return totalValue;
    }

    renderReinforcements(game) {
        const p1Grid = document.getElementById('p1-deck-grid');
        const p2Grid = document.getElementById('p2-deck-grid');
        const p1Count = document.getElementById('p1-deck-count');
        const p2Count = document.getElementById('p2-deck-count');
        const p1Sum = document.getElementById('p1-deck-sum');
        const p2Sum = document.getElementById('p2-deck-sum');

        const p1Total = this.renderCardMatrix(p1Grid, game.player1Deck, true);
        if (p1Count) p1Count.textContent = game.player1Deck.length;
        if (p1Sum) p1Sum.textContent = p1Total;

        const p2Total = this.renderCardMatrix(p2Grid, game.player2Deck, true);
        if (p2Count) p2Count.textContent = game.player2Deck.length;
        if (p2Sum) p2Sum.textContent = p2Total;

        this.updateReconStats(p1Total, p2Total, game.player1Deck.length, game.player2Deck.length);
    }

    updateLaneHistory(lane, historyData) {
        const els = this.getLaneElements(lane);
        if (!els.p1History || !els.p2History) return;

        const p1Cards = historyData.filter(h => h.player === 'p1').map(h => h.card);
        const p2Cards = historyData.filter(h => h.player === 'p2').map(h => h.card);

        this.renderCardMatrix(els.p1History, p1Cards, true);
        this.renderCardMatrix(els.p2History, p2Cards, true);
    }
}
