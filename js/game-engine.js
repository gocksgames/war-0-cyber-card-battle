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
        this.player1Score = 0;
        this.player2Score = 0;

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
        this.player1Score = 0;
        this.player2Score = 0;
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

        // AI Lane Selection
        let cpuLane = 'center';

        if (this.difficulty === 'smart') {
            cpuLane = this.getSmartCPUMove();
        } else {
            const lanes = ['left', 'center', 'right'];
            cpuLane = lanes[Math.floor(Math.random() * lanes.length)];
        }

        const card1 = this.player1Deck.shift(); // Player Card
        const card2 = this.player2Deck.shift(); // CPU Card

        this.player1Score += card1.value;
        this.player2Score += card2.value;

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
        const lanes = ['left', 'center', 'right'];

        // 1. Analyze Threats
        // Priority: Attack a lane where playing here could flip the lead?
        // Or defend a lane we are barely winning?
        // Simple Heuristic: 
        // - If losing a lane by < 15 points, attack it to try and catch up.
        // - If winning a lane by > 20 points, ignore it (waste of resources), unless it's the only option.
        // - Else random.

        let candidates = [];

        // Filter lanes where we are losing but close
        const recoveryTargets = lanes.filter(l => {
            const diff = this.lanes[l].score2 - this.lanes[l].score1; // CPU - Player
            return diff < 0 && diff > -20; // Losing by less than 20
        });

        if (recoveryTargets.length > 0) {
            return recoveryTargets[Math.floor(Math.random() * recoveryTargets.length)];
        }

        // Filter lanes where we are barely winning (defend lead)
        const defendTargets = lanes.filter(l => {
            const diff = this.lanes[l].score2 - this.lanes[l].score1;
            return diff > 0 && diff < 10; // Leading by less than 10
        });

        if (defendTargets.length > 0) {
            return defendTargets[Math.floor(Math.random() * defendTargets.length)];
        }

        // If mostly tied or way ahead/behind, just random.
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
