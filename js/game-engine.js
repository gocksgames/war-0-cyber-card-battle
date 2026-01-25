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
        // ELITE AI V2: Card-Aware & Strategic
        const lanes = ['left', 'center', 'right'];

        // Peek at our next card
        if (this.player2Deck.length === 0) return 'center';
        const myCard = this.player2Deck[0];
        const myValue = myCard.value;
        const isHighCard = myValue >= 7;

        const analysis = lanes.map(lane => {
            const laneData = this.lanes[lane];
            const p2Cards = laneData.history.filter(h => h.player === 'p2').length;
            const p1Cards = laneData.history.filter(h => h.player === 'p1').length;
            const mySlots = 2 - p2Cards;
            const oppSlots = 2 - p1Cards;

            // Current score diff (CPU - Player)
            const diff = laneData.score2 - laneData.score1;

            // Projected Analysis
            // Max opponent can possibly get (assuming 10s)
            const oppMaxAdd = oppSlots * 10;
            const oppAvgAdd = oppSlots * 6;

            // What I can get (My current card + future max)
            const myFutureAdd = (mySlots - 1) > 0 ? (mySlots - 1) * 10 : 0;
            const myTotalPotential = diff + myValue + myFutureAdd;

            // Status Flags
            const secure = (diff + myValue) > oppMaxAdd; // If I play this, I win regardless of opponent
            const likelyWin = (diff + myValue) > oppAvgAdd;
            const lostCause = (myTotalPotential < -5); // Even with perfect future play, likely lost

            const exposed = (p1Cards === 0);

            return {
                lane, diff, mySlots, oppSlots,
                secure, likelyWin, lostCause, exposed,
                p1Cards
            };
        });

        // Filter valid lanes
        const playable = analysis.filter(a => a.mySlots > 0);
        if (playable.length === 0) return 'center';

        // SCORING
        const scored = playable.map(a => {
            let score = 0;

            if (a.secure) {
                // If already secured without this card, wasting it?
                // Check if diff > oppMaxAdd already
                if (a.diff > (a.oppSlots * 10)) {
                    score = 10; // Redundant move
                } else {
                    score = 100; // Securing move!
                }
            } else if (a.likelyWin) {
                score = 80;
            } else if (a.exposed) {
                // Punish exposed lanes unless we have trash card
                if (isHighCard) score = 70;
                else score = 60;
            } else if (a.lostCause) {
                score = 0; // Abandon
            } else {
                // General contest
                // Prefer closer games
                if (Math.abs(a.diff) < 10) score = 50;
                else score = 30;
            }

            // Adjust based on game-wide strategy (2 of 3)
            // If we are winning 2 lanes, defend them.
            // If we are winning 1, find the 2nd best.
            return { lane: a.lane, score };
        });

        // Sort by score
        scored.sort((a, b) => b.score - a.score);
        return scored[0].lane;
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
