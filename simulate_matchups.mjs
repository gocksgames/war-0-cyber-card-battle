
import { GameState } from './js/game-engine.js';

// --- AI LOGIC ADAPTER (Mirror of game-engine.js for Player 1) ---
// We need to implement P1 logic because game-engine only has P2 logic built-in.
// P1 logic is identical but sees 'score1' as 'my score' and 'score2' as 'enemy score'.

function getP1Move(game, difficulty) {
    const lanes = ['left', 'center', 'right'];

    // RANDOM
    if (difficulty === 0) {
        return lanes[Math.floor(Math.random() * lanes.length)];
    }

    // EASY
    if (difficulty === 1) {
        // Avoid full lanes (>=2 cards) or diff < -30
        const okLanes = lanes.filter(l => {
            const laneData = game.lanes[l];
            // Perspective Flip: P1 wants score1 > score2. 
            // Diff for P1 is (score1 - score2). 
            // The original code uses (score2 - score1) for P2.
            const p1Diff = laneData.score1 - laneData.score2;
            const p1Cards = laneData.history.filter(h => h.player === 'p1').length;
            return p1Diff > -30 && p1Cards < 2;
        });
        if (okLanes.length > 0) return okLanes[Math.floor(Math.random() * okLanes.length)];

        const withSpace = lanes.filter(l => {
            const p1Cards = game.lanes[l].history.filter(h => h.player === 'p1').length;
            return p1Cards < 2;
        });
        if (withSpace.length > 0) return withSpace[Math.floor(Math.random() * withSpace.length)];
        return lanes[Math.floor(Math.random() * lanes.length)];
    }

    // ELITE (PRO / HARD+)
    const canPeek = (difficulty === 3);

    // 1. Evaluate Lane States (Perspective Flip)
    const evaluations = lanes.map(lane => {
        const l = game.lanes[lane];
        const diff = l.score1 - l.score2; // P1 Advantage
        const p1Cards = l.history.filter(h => h.player === 'p1').length;
        const p2Cards = l.history.filter(h => h.player === 'p2').length;

        // Status
        const isLost = diff < -25;
        const isSecure = diff > 25;

        return { lane, diff, p1Cards, p2Cards, isLost, isSecure };
    });

    // 2. Filter out "Lost" lanes
    let playable = evaluations.filter(e => !e.isLost);
    if (playable.length === 0) {
        evaluations.sort((a, b) => b.diff - a.diff);
        return evaluations[0].lane;
    }

    // 3. Sort by Advantage (Best first)
    playable.sort((a, b) => b.diff - a.diff);

    // 4. Select Target Strategy
    const targetLanes = playable.slice(0, 2);

    // 5. PEEKING LOGIC
    let isHighCard = false;
    if (canPeek) {
        // P1 Deck Peek
        const myCardValue = game.player1Deck.length > 0 ? game.player1Deck[0].value : 5;
        isHighCard = myCardValue >= 7;
    }

    if (targetLanes.length === 0) return 'center';

    if (targetLanes.length > 1) {
        const best = targetLanes[0];
        const second = targetLanes[1];

        // Priority: If secondary is exposed (0 cards), grab it!
        // (Checking 'p2Cards' which is the OPPONENT count in that lane for us?)
        // In original code: `if (second.p1Cards === 0)`. 'p1Cards' was 'my cards'.
        // So here we check 'p1Cards' (our cards).
        if (second.p1Cards === 0) return second.lane;

        // Priority: If best is secure, focus on second
        if (best.isSecure) return second.lane;

        // Priority: Peek High Card
        if (canPeek && isHighCard) return second.lane;

        // Priority: Balance
        return second.lane;
    } else {
        return targetLanes[0].lane;
    }
}

// --- SIMULATION RUNNER ---

function simulateMatch(p1Diff, p2Diff, iterations) {
    let p1Wins = 0;
    let p2Wins = 0;
    let draws = 0;

    for (let i = 0; i < iterations; i++) {
        const game = new GameState();
        game.setDifficulty(p2Diff); // Set Engine's P2 Logic

        while (!game.isGameOver) {
            // P1 Decision
            const p1Lane = getP1Move(game, p1Diff);

            // P2 Decision is handled INSIDE playRound automatically based on setDifficulty
            // BUT game-engine.js `playRound` decides cpuLane internally.
            // We just call `playRound(p1Lane)`.
            game.playRound(p1Lane);
        }

        // Tally
        let p1Score = 0;
        let p2Score = 0;
        ['left', 'center', 'right'].forEach(l => {
            if (game.lanes[l].score1 > game.lanes[l].score2) p1Score++;
            else if (game.lanes[l].score2 > game.lanes[l].score1) p2Score++;
        });

        if (p1Score > p2Score) p1Wins++;
        else if (p2Score > p1Score) p2Wins++;
        else draws++;
    }

    return { p1Wins, p2Wins, draws };
}

// --- EXECUTION ---

const LEVELS = ['RANDOM', 'EASY', 'PRO', 'HARD+'];
const ITERATIONS = 1000;

console.log(`\n🤖 WAR.0 AI MATCHUP SIMULATION (${ITERATIONS} games per matchup)\n`);
console.log('P1 (Rows) vs P2 (Cols) Win Rates (for P1)');
console.log('------------------------------------------------');

// Header
process.stdout.write('P1 \\ P2'.padEnd(12));
LEVELS.forEach(l => process.stdout.write(l.padEnd(10)));
console.log('\n' + '-'.repeat(60));

// Rows
for (let p1 = 0; p1 < 4; p1++) {
    process.stdout.write(LEVELS[p1].padEnd(12));

    for (let p2 = 0; p2 < 4; p2++) {
        const result = simulateMatch(p1, p2, ITERATIONS);
        const winRate = ((result.p1Wins / ITERATIONS) * 100).toFixed(1) + '%';
        process.stdout.write(winRate.padEnd(10));
    }
    console.log('');
}
console.log('------------------------------------------------\n');
