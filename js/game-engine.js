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
        this.deck = new Deck(); // Helper only now
        this.player1Deck = [];
        this.player2Deck = [];

        // Lane Data
        this.lanes = {
            left: { p1: [], p2: [], score1: 0, score2: 0, history: [] },
            center: { p1: [], p2: [], score1: 0, score2: 0, history: [] },
            right: { p1: [], p2: [], score1: 0, score2: 0, history: [] }
        };

        this.isGameOver = false;
    }

    startNewGame() {
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
            left: { score1: 0, score2: 0, history: [] },
            center: { score1: 0, score2: 0, history: [] },
            right: { score1: 0, score2: 0, history: [] }
        };

        this.isGameOver = false;
    }

    playRound(laneName) {
        if (this.player1Deck.length === 0 || this.player2Deck.length === 0) {
            this.isGameOver = true;
            return null;
        }

        if (!['left', 'center', 'right'].includes(laneName)) {
            console.error("Invalid lane:", laneName);
            return null;
        }

        const card1 = this.player1Deck.shift();
        const card2 = this.player2Deck.shift();

        const lane = this.lanes[laneName];

        // Score Update (Accumulator)
        lane.score1 += card1.value;
        lane.score2 += card2.value;

        // Determine Winner of this hand (for fun/animation, though score is what matters)
        let winner = null;
        if (card1.value > card2.value) winner = 'player1';
        else if (card2.value > card1.value) winner = 'player2';
        else winner = 'tie';

        const roundResult = {
            card1,
            card2,
            winner,
            lane: laneName,
            score1: lane.score1,
            score2: lane.score2,
            cardsRemaining: this.player1Deck.length
        };

        lane.history.push(roundResult);

        if (this.player1Deck.length === 0) {
            this.isGameOver = true;
        }

        return roundResult;
    }

    simulateRestOfGame() {
        const results = [];
        const lanes = ['left', 'center', 'right'];

        while (!this.isGameOver) {
            // Pick a random lane for simulation
            const randomLane = lanes[Math.floor(Math.random() * lanes.length)];
            results.push(this.playRound(randomLane));
        }
        return results;
    }
}
