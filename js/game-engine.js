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
        this.score1 = 0;
        this.score2 = 0;
        this.history = [];
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

        this.score1 = 0;
        this.score2 = 0;
        this.history = [];
        this.isGameOver = false;
    }

    playRound() {
        if (this.player1Deck.length === 0 || this.player2Deck.length === 0) {
            this.isGameOver = true;
            return null;
        }

        const card1 = this.player1Deck.shift();
        const card2 = this.player2Deck.shift();

        // NEW RULE: Score is the accumulator of the value of cards played by the player.
        // Independent of who "wins" the hand.
        this.score1 += card1.value;
        this.score2 += card2.value;

        let winner = null;
        if (card1.value > card2.value) {
            winner = 'player1';
        } else if (card2.value > card1.value) {
            winner = 'player2';
        } else {
            winner = 'tie';
        }

        const roundResult = {
            card1,
            card2,
            winner,
            score1: this.score1,
            score2: this.score2,
            cardsRemaining: this.player1Deck.length
        };

        this.history.push(roundResult);

        if (this.player1Deck.length === 0) {
            this.isGameOver = true;
        }

        return roundResult;
    }

    simulateRestOfGame() {
        const results = [];
        while (!this.isGameOver) {
            results.push(this.playRound());
        }
        return results;
    }
}
