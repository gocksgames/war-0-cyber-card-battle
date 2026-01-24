
import { SUITS, RANKS } from './game-engine.js';

export class UIController {
    constructor() {
        // Cache elements dynamically or just grab them when needed since structure is repetitive
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

        // Ensure smaller font/layout for smaller cards
        cardDiv.innerHTML = `
            <div class="card-top">${card.rank}${card.suit}</div>
            <div class="card-center">${card.suit}</div>
            <div class="card-bottom">${card.rank}${card.suit}</div>
        `;

        slotElement.appendChild(cardDiv);
    }

    updateScores(s1, s2, lane, immediate = false) {
        const els = this.getLaneElements(lane);

        if (immediate) {
            if (els.p1Score) {
                if (els.p1Score._animId) window.cancelAnimationFrame(els.p1Score._animId);
                els.p1Score.innerText = s1;
            }
            if (els.p2Score) {
                if (els.p2Score._animId) window.cancelAnimationFrame(els.p2Score._animId);
                els.p2Score.innerText = s2;
            }
        } else {
            if (els.p1Score) this.animateValue(els.p1Score, parseInt(els.p1Score.innerText), s1, 300);
            if (els.p2Score) this.animateValue(els.p2Score, parseInt(els.p2Score.innerText), s2, 300);
        }

        // Update Difference Badge & Dynamic Borders
        if (els.diffBadge) {
            const diff = s1 - s2;
            const absDiff = Math.abs(diff);
            els.diffBadge.textContent = diff === 0 ? '0' : (diff > 0 ? `+${diff}` : diff);

            // Remove old classes from Badge
            els.diffBadge.classList.remove('diff-positive', 'diff-negative', 'diff-low', 'diff-medium', 'diff-high');
            // Remove old classes from Lane
            if (els.laneContainer) {
                els.laneContainer.classList.remove('winning-lane', 'losing-lane');
            }

            // Add new classes logic with intensity
            if (diff > 0) {
                els.diffBadge.classList.add('diff-positive');
                if (els.laneContainer) els.laneContainer.classList.add('winning-lane');
            } else if (diff < 0) {
                els.diffBadge.classList.add('diff-negative');
                if (els.laneContainer) els.laneContainer.classList.add('losing-lane');
            }

            // Add intensity class based on absolute difference
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

    // Deprecated addToHistory - replaced by updateLaneHistory, but keeping for safety if needed
    addToHistory(card, player, lane) {
        // Fallback or legacy support
    }

    animateValue(obj, start, end, duration) {
        if (obj._animId) window.cancelAnimationFrame(obj._animId);

        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                obj._animId = window.requestAnimationFrame(step);
            } else {
                obj._animId = null;
            }
        };
        obj._animId = window.requestAnimationFrame(step);
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

        // Threat Delta (CPU - Player difference)
        if (threatDelta) {
            const delta = p2Total - p1Total;
            threatDelta.textContent = delta === 0 ? '0' : (delta > 0 ? `+${delta}` : delta);

            threatDelta.classList.remove('positive', 'negative');
            if (delta > 0) threatDelta.classList.add('positive');
            else if (delta < 0) threatDelta.classList.add('negative');
        }

        // Strike Rating (average card value) for each player
        const p1Avg = p1Count > 0 ? (p1Total / p1Count) : 6.0;
        const p2Avg = p2Count > 0 ? (p2Total / p2Count) : 6.0;

        if (p1StrikeRating) {
            p1StrikeRating.textContent = p1Avg.toFixed(1);
        }

        if (p2StrikeRating) {
            p2StrikeRating.textContent = p2Avg.toFixed(1);
        }

        // Strike Delta (difference from base 6.0)
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
        const sidebar = document.getElementById('sidebar-results');
        if (!sidebar) return;

        // Calculate wins from game state
        let p1Wins = 0;
        let p2Wins = 0;

        ['left', 'center', 'right'].forEach(lane => {
            if (game.lanes[lane].score1 > game.lanes[lane].score2) p1Wins++;
            else if (game.lanes[lane].score2 > game.lanes[lane].score1) p2Wins++;
        });

        // Show banner in left drawer
        if (p1Wins > p2Wins) {
            this.showGameResultBanner('win', 'YOU WIN');
        } else if (p2Wins > p1Wins) {
            this.showGameResultBanner('loss', 'CPU WINS');
        } else {
            this.showGameResultBanner('draw', 'DRAW');
        }

        // Show detailed report in sidebar
        sidebar.innerHTML = `
            <h3>BATTLE REPORT</h3>
            ${['left', 'center', 'right'].map(lane => `
                <div class="result-line">
                    <span>${lane.toUpperCase()}</span>
                    <span class="${game.lanes[lane].score1 > game.lanes[lane].score2 ? 'res-win' : (game.lanes[lane].score1 < game.lanes[lane].score2 ? 'res-loss' : 'res-draw')}">
                        ${game.lanes[lane].score1}:${game.lanes[lane].score2}
                    </span>
                </div>
            `).join('')}
        `;
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

    // Generic Helper for 4x9 Matrix
    renderCardMatrix(container, cardList, activeIfInList = true) {
        if (!container) return;
        container.innerHTML = '';
        container.className = 'card-matrix';

        // Sort Order: Rows = Suits, Cols = Ranks (10..2)
        // Suits: Hearts, Spades, Diamonds, Clubs
        const suitOrder = ['♥', '♠', '♦', '♣'];
        // Ranks: 10 downto 2
        const rankOrder = ['10', '9', '8', '7', '6', '5', '4', '3', '2'];

        let totalValue = 0;

        suitOrder.forEach(suit => {
            rankOrder.forEach(rank => {
                const value = parseInt(rank);

                // Check presence
                const present = cardList.some(c => c.suit === suit && c.rank === rank);
                // For Reinforcements (activeIfInList=true): Present = Active.
                // For History (activeIfInList=true): Present = Active (Played)
                const isActive = activeIfInList ? present : !present;

                const slot = document.createElement('div');
                const color = (suit === '♥' || suit === '♦') ? 'red' : 'black';

                // Opacity handled by basic CSS, but 'active' class toggles full opacity
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

        // Reinforcements: "Available" cards are in the deck list -> Active
        const p1Total = this.renderCardMatrix(p1Grid, game.player1Deck, true);
        if (p1Count) p1Count.textContent = game.player1Deck.length;
        if (p1Sum) p1Sum.textContent = p1Total;

        const p2Total = this.renderCardMatrix(p2Grid, game.player2Deck, true);
        if (p2Count) p2Count.textContent = game.player2Deck.length;
        if (p2Sum) p2Sum.textContent = p2Total;

        // Update recon stats in right drawer (includes strike ratings)
        this.updateReconStats(p1Total, p2Total, game.player1Deck.length, game.player2Deck.length);
    }

    updateLaneHistory(lane, historyData) {
        const els = this.getLaneElements(lane);
        if (!els.p1History || !els.p2History) return;

        const p1Cards = historyData.filter(h => h.player === 'p1').map(h => h.card);
        const p2Cards = historyData.filter(h => h.player === 'p2').map(h => h.card);

        // History: "Played" cards are in the list -> Active
        this.renderCardMatrix(els.p1History, p1Cards, true);
        this.renderCardMatrix(els.p2History, p2Cards, true);
    }
}
