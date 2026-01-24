#!/usr/bin/env python3
"""
War.0 Game Simulation - 100 rounds vs AI
Tests win rates between random play and AI strategy
"""

import random
from collections import defaultdict

class GameSimulator:
    def __init__(self):
        self.deck = [2, 3, 4, 5, 6, 7, 8, 9, 10] * 4  # 36 cards total
        
    def create_deck(self):
        """Create and shuffle a deck"""
        deck = self.deck.copy()
        random.shuffle(deck)
        return deck
    
    def simulate_game(self):
        """Simulate one complete game"""
        # Create decks
        p1_deck = self.create_deck()
        p2_deck = self.create_deck()
        
        # Initialize lanes
        lanes = {
            'left': {'p1': [], 'p2': []},
            'center': {'p1': [], 'p2': []},
            'right': {'p1': [], 'p2': []}
        }
        
        # Play 6 rounds (2 cards each = 12 total)
        for round_num in range(6):
            # Player 1: Random strategy
            p1_lane = random.choice(['left', 'center', 'right'])
            p1_card = random.choice(p1_deck)
            p1_deck.remove(p1_card)
            lanes[p1_lane]['p1'].append(p1_card)
            
            # Player 2: AI strategy (greedy - play highest card in weakest lane)
            if p2_deck:
                # Find weakest lane
                lane_strength = {}
                for lane_name in ['left', 'center', 'right']:
                    p2_sum = sum(lanes[lane_name]['p2'])
                    p1_sum = sum(lanes[lane_name]['p1'])
                    lane_strength[lane_name] = p2_sum - p1_sum
                
                weakest_lane = min(lane_strength, key=lane_strength.get)
                p2_card = max(p2_deck)  # Play highest card
                p2_deck.remove(p2_card)
                lanes[weakest_lane]['p2'].append(p2_card)
        
        # Determine winner
        p1_lanes_won = 0
        p2_lanes_won = 0
        
        for lane_name in ['left', 'center', 'right']:
            p1_score = sum(lanes[lane_name]['p1'])
            p2_score = sum(lanes[lane_name]['p2'])
            
            if p1_score > p2_score:
                p1_lanes_won += 1
            elif p2_score > p1_score:
                p2_lanes_won += 1
        
        if p1_lanes_won > p2_lanes_won:
            return 'player'
        elif p2_lanes_won > p1_lanes_won:
            return 'cpu'
        else:
            return 'draw'

def main():
    print("🎮 War.0 - Win Rate Simulation")
    print("=" * 50)
    print("Running 100 games: Random vs AI\n")
    
    simulator = GameSimulator()
    results = defaultdict(int)
    
    for i in range(100):
        result = simulator.simulate_game()
        results[result] += 1
        
        if (i + 1) % 10 == 0:
            print(f"Completed {i + 1}/100 games...")
    
    print("\n" + "=" * 50)
    print("📊 RESULTS (100 Games)")
    print("=" * 50)
    print(f"🎮 Player (Random) Wins:  {results['player']:2d} ({results['player']}%)")
    print(f"🤖 CPU (AI) Wins:         {results['cpu']:2d} ({results['cpu']}%)")
    print(f"🤝 Draws:                 {results['draw']:2d} ({results['draw']}%)")
    print("=" * 50)
    
    if results['cpu'] > results['player']:
        advantage = results['cpu'] - results['player']
        print(f"\n✓ AI has {advantage}% advantage over random play")
    elif results['player'] > results['cpu']:
        advantage = results['player'] - results['cpu']
        print(f"\n⚠ Random play has {advantage}% advantage (unexpected!)")
    else:
        print("\n⚖️  Perfectly balanced")
    
    print("\n")

if __name__ == "__main__":
    main()
