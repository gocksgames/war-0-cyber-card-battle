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
                // Values: 2=2... 10=10. Index 0 is '2'. So value = index + 2.
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

    // deal method removed as we now use full decks per player
}

export class GameState {
    constructor() {
        this.deck = []; // Helper only now
        this.player1Deck = [];
        this.player2Deck = [];

        // Lanes: Left, Center, Right
        // We track scores per lane.
        this.lanes = {
            'left': { score1: 0, score2: 0, history: [] },
            'center': { score1: 0, score2: 0, history: [] },
            'right': { score1: 0, score2: 0, history: [] }
        };

        this.isGameOver = false;
        this.difficulty = 'random'; // 'random' or 'smart'

        this.initializeGame();
    }

    setDifficulty(mode) {
        this.difficulty = mode;
        console.log("AI Difficulty set to:", this.difficulty);
    }

    initializeGame() {
        // Player 1 gets a full deck (2-10)
        const deck1 = new Deck();
        deck1.shuffle();
        this.player1Deck = deck1.cards;

        // Player 2 gets a full deck (2-10)
        const deck2 = new Deck();
        deck2.shuffle();
        this.player2Deck = deck2.cards;

        // Reset Lanes
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

        // AI Lane Selection based on difficulty
        let cpuLane = 'center';

        if (this.difficulty === 2) {
            // Hard: Greedy strategy
            cpuLane = this.getSmartCPUMove();
        } else if (this.difficulty === 1) {
            // Easy: Simple heuristic
            cpuLane = this.getEasyCPUMove();
        } else {
            // Random
            const lanes = ['left', 'center', 'right'];
            cpuLane = lanes[Math.floor(Math.random() * lanes.length)];
        }

        const card1 = this.player1Deck.shift(); // Player Card
        const card2 = this.player2Deck.shift(); // CPU Card

        // Update Player's Chosen Lane
        const pLaneData = this.lanes[playerLane];
        pLaneData.score1 += card1.value;

        // Update CPU's Chosen Lane
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
        // Hard difficulty: Greedy strategy
        const lanes = ['left', 'center', 'right'];

        // Find weakest lane (where we're behind the most)
        let weakestLane = lanes[0];
        let weakestDiff = Infinity;

        lanes.forEach(lane => {
            const diff = this.lanes[lane].score2 - this.lanes[lane].score1;
            if (diff < weakestDiff) {
                weakestDiff = diff;
                weakestLane = lane;
            }
        });

        return weakestLane;
    }

    getEasyCPUMove() {
        // Easy difficulty: Simple heuristic - avoid obvious losing lanes
        const lanes = ['left', 'center', 'right'];

        // Filter lanes where we aren't massively losing
        const okLanes = lanes.filter(l => {
            const diff = this.lanes[l].score2 - this.lanes[l].score1;
            return diff > -30; // Not losing by more than 30
        });

        if (okLanes.length > 0) {
            return okLanes[Math.floor(Math.random() * okLanes.length)];
        }

        // All lanes are bad, pick random
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
