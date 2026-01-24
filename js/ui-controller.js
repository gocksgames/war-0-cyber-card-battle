
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

    updateScores(s1, s2, lane) {
        const els = this.getLaneElements(lane);
        if (els.p1Score) this.animateValue(els.p1Score, parseInt(els.p1Score.innerText), s1, 300);
        if (els.p2Score) this.animateValue(els.p2Score, parseInt(els.p2Score.innerText), s2, 300);

        // Update Difference Badge
        if (els.diffBadge) {
            const diff = s1 - s2;
            els.diffBadge.textContent = diff === 0 ? '0' : (diff > 0 ? `+${diff}` : diff);

            // Remove old classes
            els.diffBadge.classList.remove('diff-positive', 'diff-negative');

            // Add new classes logic
            if (diff > 0) {
                els.diffBadge.classList.add('diff-positive');
            } else if (diff < 0) {
                els.diffBadge.classList.add('diff-negative');
            }
        }
    }

    addToHistory(card1, card2, lane) {
        const els = this.getLaneElements(lane);

        // Player 1
        const mini1 = document.createElement('div');
        mini1.className = `mini-card ${card1.color}`;
        mini1.innerHTML = `${card1.rank}<span class="mini-suit">${card1.suit}</span>`;
        if (els.p1History) els.p1History.appendChild(mini1);

        // Player 2
        const mini2 = document.createElement('div');
        mini2.className = `mini-card ${card2.color}`;
        mini2.innerHTML = `${card2.rank}<span class="mini-suit">${card2.suit}</span>`;
        if (els.p2History) els.p2History.appendChild(mini2);
    }

    animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    updateMessage(msg, type = 'info') {
        if (this.elements.messageArea) {
            this.elements.messageArea.textContent = msg;
            this.elements.messageArea.className = `message-area ${type}`;
        }
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

    showSimulationResults(results) {
        // Could do something fancy here, but history grid is enough for now.
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
        });

        this.setButtonsEnabled(true);
        if (this.elements.remainingCount) this.elements.remainingCount.textContent = '36 Cards';
        if (this.elements.messageArea) this.elements.messageArea.textContent = '';
    }
}
