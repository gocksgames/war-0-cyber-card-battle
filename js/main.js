
import { GameState } from './game-engine.js';
import { UIController } from './ui-controller.js';
import { loadGameHistory, clearGameHistory } from './game-history.js';

// Initialize Game and UI
const game = new GameState();
const ui = new UIController();

// Setup Event Listeners (Delegated to UI Controller)
ui.setupEventListeners(game);

// Initial Render
game.initializeGame();
ui.resetUI();
ui.renderReinforcements(game);

// Load History
loadGameHistory();

// Clear History Button
const clearHistoryBtn = document.getElementById('clear-history-btn');
if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('dblclick', () => {
        clearGameHistory();
    });
}
