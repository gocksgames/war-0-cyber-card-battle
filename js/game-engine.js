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
        this.difficulty = 2; // 0=Random, 1=Easy, 2=Pro, 3=Hard+

        this.initializeGame();
    }

    setDifficulty(level) {
        this.difficulty = parseInt(level);
        const labels = ['RANDOM', 'EASY', 'PRO', 'HARD+'];
        console.log(`AI Difficulty set to: ${this.difficulty} (${labels[this.difficulty]})`);
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

        // Difficulty Logic Update
        if (this.difficulty === 3) {
            // HARD+: Elite AI (Peek Enabled)
            cpuLane = this.getStrategicCPUMove(true);
        } else if (this.difficulty === 2) {
            // PRO: Elite AI (No Peek)
            cpuLane = this.getStrategicCPUMove(false);
        } else if (this.difficulty === 1) {
            // EASY: Avoids loss
            cpuLane = this.getEasyCPUMove();
        } else {
            // RANDOM: Pure Chaos
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

    getStrategicCPUMove(canPeek) {
        // ELITE AI V4.3: DYNAMIC EVALUATION + EFFICIENCY LOGIC
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

        // 5. PEEKING LOGIC
        let myCardValue = 6; // Average for Pro
        if (canPeek) {
            myCardValue = this.player2Deck.length > 0 ? this.player2Deck[0].value : 5;
        }

        // 6. Execution Limit Check (Safety)
        if (targetLanes.length === 0) return 'center';

        if (targetLanes.length > 1) {
            const best = targetLanes[0];
            const second = targetLanes[1];

            // Priority: If secondary is exposed (0 cards), grab it!
            if (second.p1Cards === 0) return second.lane;

            // Priority: If best is already secure (>25), focus everything on second
            if (best.isSecure) return second.lane;

            // HARD+ INTELLIGENCE (EFFICIENCY LOGIC)
            if (canPeek) {
                // 1. RESCUE THE LEADER
                // If even our "Best" lane is losing (<0), we MUST focus power there.
                // Pro creates a fatal error here by balancing the "Second" lane (which is losing worse).
                if (best.diff < 0) {
                    return best.lane;
                }

                // 2. SWEEP STRATEGY
                // If Top 2 are already winning (>0), try to sweep the 3rd.
                if (second.diff > 0 && playable.length > 2) {
                    const third = playable[2];
                    if (third.diff + myCardValue > 0) return third.lane;
                }

                // 3. HIGH CARD SNIPE
                if (myCardValue >= 8) return second.lane;
            }

            // PRO STRATEGY (AND LOW-ROLL HARD+)
            // Always fight for the balance. Play in the 2nd best lane.
            return second.lane;

        } else {
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
