export const SUITS = ['♠', '♥', '♣', '♦'];
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10'];

export class Card {
    constructor(suit, rank, value) {
        this.suit = suit;
        this.rank = rank;
        this.value = value;
    }

    get color() {
        return (this.suit === '♥' || this.suit === '♦') ? 'red' : 'black';
    }
}

export class Deck {
    constructor() {
        this.cards = [];
        this.reset();
    }

    reset() {
        this.cards = [];
        SUITS.forEach(suit => {
            RANKS.forEach((rank, index) => {
                this.cards.push(new Card(suit, rank, index + 2));
            });
        });
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }
}

export class GameState {
    constructor() {
        this.deck = [];
        this.player1Deck = [];
        this.player2Deck = [];

        this.lanes = {
            'left': { score1: 0, score2: 0, history: [] },
            'center': { score1: 0, score2: 0, history: [] },
            'right': { score1: 0, score2: 0, history: [] }
        };

        this.isGameOver = false;
        this.difficulty = 2;

        this.initializeGame();
    }

    setDifficulty(level) {
        this.difficulty = level;
        console.log("AI Difficulty set to:", this.difficulty);
    }

    initializeGame() {
        const deck1 = new Deck();
        deck1.shuffle();
        this.player1Deck = deck1.cards;

        const deck2 = new Deck();
        deck2.shuffle();
        this.player2Deck = deck2.cards;

        this.lanes = {
            'left': { score1: 0, score2: 0, history: [] },
            'center': { score1: 0, score2: 0, history: [] },
            'right': { score1: 0, score2: 0, history: [] }
        };
        this.isGameOver = false;
    }

    playRound(playerLane) {
        if (this.player1Deck.length === 0 || this.player2Deck.length === 0) {
            this.isGameOver = true;
            return null;
        }

        if (!['left', 'center', 'right'].includes(playerLane)) {
            console.error("Invalid lane:", playerLane);
            return null;
        }

        let cpuLane = 'center';

        if (this.difficulty === 2) {
            cpuLane = this.getStrategicCPUMove();
        } else if (this.difficulty === 1) {
            cpuLane = this.getEasyCPUMove();
        } else {
            const lanes = ['left', 'center', 'right'];
            cpuLane = lanes[Math.floor(Math.random() * lanes.length)];
        }

        const card1 = this.player1Deck.shift();
        const card2 = this.player2Deck.shift();

        const pLaneData = this.lanes[playerLane];
        pLaneData.score1 += card1.value;

        const cLaneData = this.lanes[cpuLane];
        cLaneData.score2 += card2.value;

        pLaneData.history.push({ player: 'p1', card: card1 });
        cLaneData.history.push({ player: 'p2', card: card2 });

        const roundResult = {
            playerMove: { lane: playerLane, card: card1, score: pLaneData.score1 },
            cpuMove: { lane: cpuLane, card: card2, score: cLaneData.score2 },
            cardsRemaining: this.player1Deck.length
        };

        if (this.player1Deck.length === 0) {
            this.isGameOver = true;
        }

        return roundResult;
    }

    getStrategicCPUMove() {
        // ELITE AI: Win 2 of 3 - capitalize on exposed lanes, abandon losers
        const lanes = ['left', 'center', 'right'];

        const analysis = lanes.map(lane => {
            const laneData = this.lanes[lane];
            const p2Cards = laneData.history.filter(h => h.player === 'p2').length;
            const p1Cards = laneData.history.filter(h => h.player === 'p1').length;
            const slotsLeft = 2 - p2Cards;
            const diff = laneData.score2 - laneData.score1;

            const p1SlotsLeft = 2 - p1Cards;
            const p1MaxThreat = p1SlotsLeft * 10;
            const maxWeCanAdd = slotsLeft * 10;
            const canWin = (diff + maxWeCanAdd - p1MaxThreat) > 0;

            const winning = diff > 0;
            const exposed = p1Cards === 0;
            const playerCommitted = p1Cards === 2;

            let priority = 0;

            if (slotsLeft === 0) {
                priority = -9999;
            } else if (exposed && slotsLeft > 0) {
                priority = 1000; // HIGHEST - free lane!
            } else if (winning && diff > 15) {
                priority = 10; // Already won big - stop
            } else if (playerCommitted && diff < -10) {
                priority = 5; // Player all-in and ahead - ABANDON
            } else if (!canWin) {
                priority = 1; // Impossible - ABANDON
            } else if (winning && diff > 5) {
                priority = 50 + diff; // Defend
            } else if (diff > -10 && diff <= 5) {
                priority = 200 - Math.abs(diff) * 10; // Contested - high priority
            } else if (canWin && diff > -20) {
                priority = 100 + diff; // Winnable
            } else {
                priority = 20;
            }

            return { lane, diff, slotsLeft, p1Cards, p2Cards, canWin, winning, exposed, playerCommitted, priority };
        });

        const available = analysis.filter(a => a.slotsLeft > 0);
        if (available.length === 0) return 'center';

        const lanesWinning = available.filter(a => a.winning).length;
        const exposedLanes = available.filter(a => a.exposed);

        // PRIORITY 1: Take exposed lanes
        if (exposedLanes.length > 0 && lanesWinning < 2) {
            return exposedLanes[0].lane;
        }

        // PRIORITY 2: Defend if winning 2+
        if (lanesWinning >= 2) {
            const winners = available.filter(a => a.winning);
            winners.sort((a, b) => a.diff - b.diff);
            return winners[0].lane;
        }

        // PRIORITY 3: Highest priority
        available.sort((a, b) => b.priority - a.priority);
        return available[0].lane;
    }

    getEasyCPUMove() {
        const lanes = ['left', 'center', 'right'];
        const okLanes = lanes.filter(l => {
            const diff = this.lanes[l].score2 - this.lanes[l].score1;
            const p2Cards = this.lanes[l].history.filter(h => h.player === 'p2').length;
            return diff > -30 && p2Cards < 2;
        });

        if (okLanes.length > 0) return okLanes[Math.floor(Math.random() * okLanes.length)];

        const withSpace = lanes.filter(l => {
            const p2Cards = this.lanes[l].history.filter(h => h.player === 'p2').length;
            return p2Cards < 2;
        });

        if (withSpace.length > 0) return withSpace[Math.floor(Math.random() * withSpace.length)];
        return lanes[Math.floor(Math.random() * lanes.length)];
    }

    simulateRestOfGame() {
        const results = [];
        const lanes = ['left', 'center', 'right'];

        while (!this.isGameOver) {
            const randomPLane = lanes[Math.floor(Math.random() * lanes.length)];
            results.push(this.playRound(randomPLane));
        }
        return results;
    }
}
