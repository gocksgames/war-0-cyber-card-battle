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
        // ADVANCED AI: Win 2 of 3 lanes strategically
        const lanes = ['left', 'center', 'right'];

        // Analyze each lane's state and winnability
        const analysis = lanes.map(lane => {
            const laneData = this.lanes[lane];
            const p2Cards = laneData.history.filter(h => h.player === 'p2').length;
            const p1Cards = laneData.history.filter(h => h.player === 'p1').length;
            const slotsLeft = 2 - p2Cards;
            const diff = laneData.score2 - laneData.score1; // CPU - Player

            // Maximum we could add (2 cards of value 10 each = 20)
            const maxGain = slotsLeft * 10;
            // Realistic gain (average card is ~6)
            const avgGain = slotsLeft * 6;

            const canWin = (diff + maxGain) > 0;
            const likelyWin = (diff + avgGain) > 3;
            const winning = diff > 0;
            const tied = diff === 0;

            return { lane, diff, slotsLeft, canWin, likelyWin, winning, tied };
        });

        // Filter lanes we can play
        const available = analysis.filter(a => a.slotsLeft > 0);
        if (available.length === 0) return 'center';

        // Count current state
        const lanesWon = available.filter(a => a.winning).length;
        const lanesCanWin = available.filter(a => a.canWin).length;

        // STRATEGY 1: Already winning 2+ lanes - defend them
        if (lanesWon >= 2) {
            const winningLanes = available.filter(a => a.winning);
            // Defend the weakest winning lane
            winningLanes.sort((a, b) => a.diff - b.diff);
            return winningLanes[0].lane;
        }

        // STRATEGY 2: Winning 1 lane - secure a second
        if (lanesWon === 1) {
            // Try to win another lane
            const losable = available.filter(a => !a.winning && a.canWin);
            if (losable.length > 0) {
                // Focus on closest lane
                losable.sort((a, b) => b.diff - a.diff); // Least behind
                return losable[0].lane;
            }
            // Defend our winning lane
            const winner = available.find(a => a.winning);
            return winner ? winner.lane : available[0].lane;
        }

        // STRATEGY 3: Not winning any - secure 2 most winnable
        const winnable = available.filter(a => a.canWin);
        if (winnable.length >= 2) {
            // Pick best opportunity (closest to winning)
            winnable.sort((a, b) => b.diff - a.diff);
            return winnable[0].lane;
        } else if (winnable.length === 1) {
            return winnable[0].lane;
        }

        // STRATEGY 4: Damage control - play least bad lane
        available.sort((a, b) => b.diff - a.diff);
        return available[0].lane;
    }

    getEasyCPUMove() {
        const lanes = ['left', 'center', 'right'];

        const okLanes = lanes.filter(l => {
            const diff = this.lanes[l].score2 - this.lanes[l].score1;
            const p2Cards = this.lanes[l].history.filter(h => h.player === 'p2').length;
            return diff > -30 && p2Cards < 2;
        });

        if (okLanes.length > 0) {
            return okLanes[Math.floor(Math.random() * okLanes.length)];
        }

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
