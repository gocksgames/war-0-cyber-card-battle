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
        this.difficulty = 2; // 0=Random, 1=Easy, 2=Hard

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
            cpuLane = this.getSmartCPUMove();
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

    getSmartCPUMove() {
        // Hard AI: Strategic lane selection focusing on winning lanes
        const lanes = ['left', 'center', 'right'];

        // Analyze each lane
        const analysis = lanes.map(lane => {
            const diff = this.lanes[lane].score2 - this.lanes[lane].score1;
            const p2Cards = this.lanes[lane].history.filter(h => h.player === 'p2').length;
            const cardsLeft = 2 - p2Cards;

            let priority = 0;

            // Can't play here
            if (cardsLeft === 0) {
                priority = -1000;
            }
            // Losing by a lot - try to prevent total loss
            else if (diff < -20) {
                priority = 80;
            }
            // Losing slightly - HIGH priority to catch up
            else if (diff < -5) {
                priority = 100;
            }
            // Close game or tied - try to win
            else if (diff <= 5) {
                priority = 95;
            }
            // Winning - reinforce
            else if (diff <= 15) {
                priority = 70;
            }
            // Winning big - lower priority
            else {
                priority = 30;
            }

            return { lane, priority, diff };
        });

        // Filter available lanes and sort by priority
        const available = analysis.filter(a => a.priority > -1000);

        if (available.length === 0) return 'center';

        available.sort((a, b) => b.priority - a.priority);

        return available[0].lane;
    }

    getEasyCPUMove() {
        // Easy AI: Avoid heavily losing lanes
        const lanes = ['left', 'center', 'right'];

        const okLanes = lanes.filter(l => {
            const diff = this.lanes[l].score2 - this.lanes[l].score1;
            const p2Cards = this.lanes[l].history.filter(h => h.player === 'p2').length;
            return diff > -30 && p2Cards < 2;
        });

        if (okLanes.length > 0) {
            return okLanes[Math.floor(Math.random() * okLanes.length)];
        }

        // Fallback to lanes with space
        const withSpace = lanes.filter(l => {
            const p2Cards = this.lanes[l].history.filter(h => h.player === 'p2').length;
            return p2Cards < 2;
        });

        if (withSpace.length > 0) {
            return withSpace[Math.floor(Math.random() * withSpace.length)];
        }

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
