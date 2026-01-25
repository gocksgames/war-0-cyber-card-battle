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
        // ELITE AI V4.1: FLEXIBLE DYNAMIC EVALUATION + CARD AWARENESS
        // Goal: Win 2 lanes. Re-evaluates every turn. No arbitrary limits.

        const lanes = ['left', 'center', 'right'];

        // 1. Evaluate Lane States
        const evaluations = lanes.map(lane => {
            const l = this.lanes[lane];
            const diff = l.score2 - l.score1; // P2 Advantage
            const p1Cards = l.history.filter(h => h.player === 'p1').length;
            const p2Cards = l.history.filter(h => h.player === 'p2').length;

            // Status
            const isLost = diff < -25;
            const isSecure = diff > 25;

            return {
                lane,
                diff,
                p1Cards,
                p2Cards,
                isLost,
                isSecure
            };
        });

        // 2. Filter out "Lost" lanes (unless everything is lost)
        let playable = evaluations.filter(e => !e.isLost);

        if (playable.length === 0) {
            // All lost? Just play in the least lost one.
            evaluations.sort((a, b) => b.diff - a.diff);
            return evaluations[0].lane;
        }

        // 3. Sort by Advantage (Best first)
        playable.sort((a, b) => b.diff - a.diff);

        // 4. Select Target Strategy: Focus on Top 2
        const targetLanes = playable.slice(0, 2);

        // PEEK at next card to make smarter choice
        const myCardValue = this.player2Deck.length > 0 ? this.player2Deck[0].value : 5;
        const isHighCard = myCardValue >= 7;

        // 5. Choose which of the Target Lanes to play in
        if (targetLanes.length > 1) {
            const best = targetLanes[0];
            const second = targetLanes[1];

            // Priority: If secondary is exposed (0 cards), grab it!
            if (second.p1Cards === 0) return second.lane;

            // Priority: If best is already secure, focus everything on second
            if (best.isSecure) return second.lane;

            // Priority: Use High Cards to FLIP/SECURE the weaker lane
            // If we have a high card, applying it to the lower-advantage lane is usually optimal
            if (isHighCard) return second.lane;

            // Priority: Balance the two. Play in the one with LOWER score advantage.
            return second.lane;

        } else {
            // Only 1 playable lane? Focus on it.
            return targetLanes[0].lane;
        }
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
