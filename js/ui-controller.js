
export class UIController {
    constructor() {
        this.elements = {
            p1CardSlot: document.getElementById('p1-card-slot'),
            p2CardSlot: document.getElementById('p2-card-slot'),
            p1Score: document.getElementById('p1-score'),
            p2Score: document.getElementById('p2-score'),
            p1History: document.getElementById('p1-history'), // New
            p2History: document.getElementById('p2-history'), // New
            drawBtn: document.getElementById('draw-btn'),
            simBtn: document.getElementById('sim-btn'),
            resetBtn: document.getElementById('reset-btn'),
            simStats: document.getElementById('sim-stats'),
            messageArea: document.getElementById('message-area'),
            remainingCount: document.getElementById('remaining-count')
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

    updateScores(s1, s2) {
        this.animateValue(this.elements.p1Score, parseInt(this.elements.p1Score.innerText), s1, 500);
        this.animateValue(this.elements.p2Score, parseInt(this.elements.p2Score.innerText), s2, 500);
    }

    addToHistory(card1, card2) {
        // Player 1
        const mini1 = document.createElement('div');
        mini1.className = `mini-card ${card1.color}`;
        mini1.innerHTML = `${card1.rank}<span class="mini-suit">${card1.suit}</span>`;
        this.elements.p1History.appendChild(mini1);

        // Player 2
        const mini2 = document.createElement('div');
        mini2.className = `mini-card ${card2.color}`;
        mini2.innerHTML = `${card2.rank}<span class="mini-suit">${card2.suit}</span>`;
        this.elements.p2History.appendChild(mini2);
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
        // Could be a toast or just text. For now, implicit via game state or minimal feedback.
        // We'll use the 'messageArea' if we want to show "WAR!" or "Player 1 Wins!"
        if (this.elements.messageArea) {
            this.elements.messageArea.textContent = msg;
            this.elements.messageArea.className = `message ${type}`;
        }
    }

    setButtonsEnabled(enabled) {
        this.elements.drawBtn.disabled = !enabled;
        this.elements.simBtn.disabled = !enabled;
        if (!enabled) {
            this.elements.drawBtn.style.opacity = '0.5';
            this.elements.simBtn.style.opacity = '0.5';
        } else {
            this.elements.drawBtn.style.opacity = '1';
            this.elements.simBtn.style.opacity = '1';
        }
    }

    showSimulationResults(results, finalP1, finalP2) {
        this.elements.simStats.style.display = 'block';
        this.elements.simStats.classList.remove('hidden');

        const p1Wins = results.filter(r => r.winner === 'player1').length;
        const p2Wins = results.filter(r => r.winner === 'player2').length;
        const wars = results.filter(r => r.winner === 'tie').length;

        document.getElementById('stat-p1-wins').textContent = p1Wins;
        document.getElementById('stat-p2-wins').textContent = p2Wins;
        document.getElementById('stat-wars').textContent = wars;
        document.getElementById('stat-final-score').textContent = `${finalP1} - ${finalP2}`;
    }

    resetUI() {
        this.elements.p1CardSlot.innerHTML = '';
        this.elements.p2CardSlot.innerHTML = '';
        this.elements.p1Score.textContent = '0';
        this.elements.p2Score.textContent = '0';
        this.elements.p1History.innerHTML = ''; // Clear history
        this.elements.p2History.innerHTML = ''; // Clear history
        this.elements.simStats.style.display = 'none';
        this.setButtonsEnabled(true);
        if (this.elements.remainingCount) this.elements.remainingCount.textContent = '36 Cards';
        if (this.elements.messageArea) this.elements.messageArea.textContent = '';
    }
}
