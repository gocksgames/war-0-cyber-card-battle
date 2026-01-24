
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

    updateScores(s1, s2, lane) {
        const els = this.getLaneElements(lane);
        if (els.p1Score) this.animateValue(els.p1Score, parseInt(els.p1Score.innerText), s1, 300);
        if (els.p2Score) this.animateValue(els.p2Score, parseInt(els.p2Score.innerText), s2, 300);

        // Update Difference Badge & Dynamic Borders
        if (els.diffBadge) {
            const diff = s1 - s2;
            els.diffBadge.textContent = diff === 0 ? '0' : (diff > 0 ? `+${diff}` : diff);

            // Remove old classes from Badge
            els.diffBadge.classList.remove('diff-positive', 'diff-negative');
            // Remove old classes from Lane
            if (els.laneContainer) {
                els.laneContainer.classList.remove('winning-lane', 'losing-lane');
            }

            // Add new classes logic
            if (diff > 0) {
                els.diffBadge.classList.add('diff-positive');
                if (els.laneContainer) els.laneContainer.classList.add('winning-lane');
            } else if (diff < 0) {
                els.diffBadge.classList.add('diff-negative');
                if (els.laneContainer) els.laneContainer.classList.add('losing-lane');
            }
        }
    }

    resetCardVisuals() {
        this.lanes.forEach(lane => {
            const els = this.getLaneElements(lane);
            // Don't clear content, maybe? Or do we clear content?
            // "if a card has not been drawn... grey it out".
            // If we clear content, we can't grey it out (it's empty).
            // So we should KEEP the old card if it wasn't updated?
            // "move the drawn card to be closer... if a card has not been drawn... grey it out."
            // This implies the card STAYS there but is greyed out.
            // So we don't clear innerHTML.
            if (els.p1Slot) els.p1Slot.classList.remove('inactive');
            if (els.p2Slot) els.p2Slot.classList.remove('inactive');
        });
    }

    addToHistory(card, player, lane) {
        // player: 'p1' or 'p2'
        const els = this.getLaneElements(lane);

        const mini = document.createElement('div');
        mini.className = `mini-card ${card.color}`;
        mini.innerHTML = `${card.rank}<span class="mini-suit">${card.suit}</span>`;

        const targetContainer = player === 'p1' ? els.p1History : els.p2History;

        if (targetContainer) {
            // "move that below the player card and above theCPU card"
            // For P2 (Top), 'appendChild' adds to bottom (closest to center).
            // For P1 (Bottom), 'prepend'? No, 'appendChild' adds to bottom (furthest from center).
            // Request: "History box... move that below the player card and above the CPU card" -> CENTER area.
            // But we split them.
            // Let's just append for now.
            targetContainer.appendChild(mini);
        }
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

    showSidebarResults(results) {
        const sidebar = document.getElementById('sidebar-results');
        if (!sidebar) return;

        // Count triumphs
        let p1Wins = 0;
        let p2Wins = 0;
        let p1Total = 0;
        let p2Total = 0;

        // We need final scores, not just history.
        // But main.js passes results array. 
        // We can access game state ideally, but let's just use what we have or pass game state.

        sidebar.innerHTML = `<h3>MISSION REPORT</h3>`;
        // ... Logic in main.js will call specific updates or we just put simple text here.
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

        if (this.elements.remainingCount) this.elements.remainingCount.textContent = '36 Cards';
        if (this.elements.messageArea) this.elements.messageArea.textContent = '';
    }
}
