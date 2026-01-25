export const SUITS = ['♠', '♥', '♣', '♦'];
export const RANKS = ['10', 'J', 'Q', 'K', 'A'];

export class Card {
    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
        this.value = this.getCardValue(rank);
        this.id = Math.random().toString(36).substr(2, 9);
    }

    getCardValue(rank) {
        switch (rank) {
            case 'A': return 25;
            case 'K': return 20;
            case 'Q': return 10;
            case 'J': return -10; // Traitor Card
            case '10': return 0;  // Dud Card
            default: return 0;
        }
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
        // WAR.1: DOUBLE DECK (2x 20 cards = 40 cards total)
        // To ensure game length is similar to original (36 cards)
        for (let i = 0; i < 2; i++) {
            SUITS.forEach(suit => {
                RANKS.forEach(rank => {
                    this.cards.push(new Card(suit, rank));
                });
            });
        }
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
        this.gameHistory = []; // Added based on snippet

        this.initializeGame();
    }

    setDifficulty(level) {
        this.difficulty = parseInt(level);
        const labels = ['RANDOM', 'EASY', 'PRO', 'HARD+'];
        console.log(`AI Difficulty set to: ${this.difficulty} (${labels[this.difficulty]})`);
    }

    initializeGame() {
        const deck = new Deck(); // Use a single deck for the game
        deck.shuffle();
        this.deck = deck.cards; // Store the full shuffled deck

        this.player1Deck = this.deck.slice(0, this.deck.length / 2); // Deal half to player 1
        this.player2Deck = this.deck.slice(this.deck.length / 2); // Deal other half to player 2

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

            // HARD+ INTELLIGENCE (OMNISCIENT COUNTER)
            if (canPeek) {
                // PEAK INTELLIGENCE:
                // 1. Peek at Enemy's current card.
                // 2. Predict Enemy's move (Assume they play Pro/Greedy).
                // 3. Choose the move that maximizes our board state *after* the exchange.

                let enemyCardVal = 6;
                // CPU is usually Player 2. So Enemy is Player 1.
                // In this codebase, CPU is hardcoded as P2 in 'playRound'.
                if (this.player1Deck.length > 0) {
                    enemyCardVal = this.player1Deck[0].value;
                }

                // Predict Enemy Move (Pro Logic: Attacks their 'Second' best lane)
                // Note: Enemy views board from their perspective.
                // Enemy Diff = -1 * Our Diff.
                // Enemy wants to maximize Enemy Diff.
                // Enemy sorts lanes by Enemy Diff. Targets top 2. picks 2nd. (Which is the lower of the top 2).

                // Let's model Enemy Perception:
                let enemyEvals = lanes.map(l => {
                    const d = -(this.lanes[l].score2 - this.lanes[l].score1); // P1 Adv
                    const lost = d < -25;
                    return { lane: l, diff: d, isLost: lost };
                });

                let enemyPlayable = enemyEvals.filter(e => !e.isLost);
                enemyPlayable.sort((a, b) => b.diff - a.diff);

                let predictedEnemyLane = 'center';
                if (enemyPlayable.length > 0) {
                    if (enemyPlayable.length > 1) {
                        predictedEnemyLane = enemyPlayable[1].lane;
                    } else {
                        predictedEnemyLane = enemyPlayable[0].lane;
                    }
                }

                // Now Evaluate Our Best Response
                let bestMove = second.lane;
                let maxMinDiff = -Infinity;

                const candidates = [best.lane, second.lane];
                if (playable.length > 2) candidates.push(playable[2].lane);

                for (const myLane of candidates) {
                    // Simulate Outcome
                    // Copy current scores/diffs
                    // We only care about the diffs of our Top 2 lanes (Best + Second)

                    let diffs = {
                        [best.lane]: best.diff,
                        [second.lane]: second.diff
                    };

                    // Apply My Move
                    if (diffs[myLane] !== undefined) diffs[myLane] += myCardValue;

                    // Apply Enemy Move
                    // Enemy reduces our diff (or increases theirs)
                    if (diffs[predictedEnemyLane] !== undefined) diffs[predictedEnemyLane] -= enemyCardVal;

                    // Calculate Score: min(L1, L2)
                    let vals = Object.values(diffs);
                    let minVal = Math.min(...vals);
                    if (minVal > maxMinDiff) {
                        maxMinDiff = minVal;
                        bestMove = myLane;
                    }
                }
                return bestMove;
            }
            let bestMove = second.lane;
            let maxScore = -Infinity;

            // Candidate lanes to consider for Move 1 (limit to top 3 to be safe, though usually top 2 matter)
            const candidateLanes = [best.lane, second.lane];
            if (playable.length > 2) candidateLanes.push(playable[2].lane);

            for (const move1Lane of candidateLanes) {
                // State after Move 1 (Current Card)
                // We only track the 'diff' change.
                // Note: We don't model enemy move perfectly, assume static for relative comparison.

                // Clone diffs
                let diffs = {
                    [best.lane]: best.diff,
                    [second.lane]: second.diff,
                };
                if (playable.length > 2) diffs[playable[2].lane] = playable[2].diff;

                // Apply Move 1
                diffs[move1Lane] += myCardValue;

                // Now Find Optimal Move 2 (Next Card)
                // We assume we will play NextCard in the lane that maximizes the state *then*.
                let bestScoreForThisBranch = -Infinity;

                // Lookahead: Where would we play the next card?
                for (const move2Lane of candidateLanes) {
                    let branchDiffs = { ...diffs };

                    // Next Card Value logic (JS)
                    let nextVal = 6;
                    if (this.player2Deck.length > 1) {
                        nextVal = this.player2Deck[1].value;
                    }

                    branchDiffs[move2Lane] += nextVal;

                    // Evaluate State: return value of the 2nd best lane.
                    const finalValues = Object.values(branchDiffs).sort((a, b) => b - a);
                    let score = finalValues.length > 1 ? finalValues[1] : finalValues[0];

                    if (score > bestScoreForThisBranch) {
                        bestScoreForThisBranch = score;
                    }
                }

                if (bestScoreForThisBranch > maxScore) {
                    maxScore = bestScoreForThisBranch;
                    bestMove = move1Lane;
                }
            }

            return bestMove;
        }

        // PRO STRATEGY (AND LOW-ROLL HARD+)
        // Always fight for the balance. Play in the 2nd best lane.
        return second.lane;



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
