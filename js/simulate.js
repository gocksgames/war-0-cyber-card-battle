/**
 * Game simulation script - runs 100 games and tracks win rates
 */

import { GameState } from './game-state.js';
import { AIController } from './ai-controller.js';

function simulateGame() {
    const game = new GameState();
    const ai = new AIController();

    // Play all 6 rounds (2 cards each = 12 total)
    for (let round = 0; round < 6; round++) {
        // Player random deployment
        const p1Lane = ['left', 'center', 'right'][Math.floor(Math.random() * 3)];
        const p1Card = game.player1Deck[Math.floor(Math.random() * game.player1Deck.length)];
        game.deployCard(1, p1Lane, p1Card);

        // AI deployment
        const aiMove = ai.chooseMove(game);
        if (aiMove) {
            game.deployCard(2, aiMove.lane, aiMove.card);
        }
    }

    // Determine winner
    let p1Wins = 0;
    let p2Wins = 0;

    ['left', 'center', 'right'].forEach(lane => {
        if (game.lanes[lane].score1 > game.lanes[lane].score2) p1Wins++;
        else if (game.lanes[lane].score2 > game.lanes[lane].score1) p2Wins++;
    });

    if (p1Wins > p2Wins) return 'player';
    if (p2Wins > p1Wins) return 'cpu';
    return 'draw';
}

// Run 100 simulations
const results = {
    player: 0,
    cpu: 0,
    draw: 0
};

console.log('Starting 100 game simulation...\n');

for (let i = 0; i < 100; i++) {
    const result = simulateGame();
    results[result]++;

    if ((i + 1) % 10 === 0) {
        console.log(`Completed ${i + 1} games...`);
    }
}

console.log('\n=== SIMULATION RESULTS ===');
console.log(`Total Games: 100`);
console.log(`Player Wins: ${results.player} (${results.player}%)`);
console.log(`CPU Wins: ${results.cpu} (${results.cpu}%)`);
console.log(`Draws: ${results.draw} (${results.draw}%)`);
console.log('========================\n');
