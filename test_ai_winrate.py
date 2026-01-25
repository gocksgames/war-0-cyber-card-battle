
import random
from dataclasses import dataclass
from typing import List, Dict

@dataclass
class Card:
    value: int

@dataclass
class Lane:
    score1: int = 0
    score2: int = 0
    p1_cards: int = 0
    p2_cards: int = 0
    history: List[str] = None # 'p1' or 'p2'

    def __post_init__(self):
        self.history = []

class GameState:
    def __init__(self):
        self.deck1 = self.create_deck()
        self.deck2 = self.create_deck()
        self.lanes = {
            'left': Lane(),
            'center': Lane(),
            'right': Lane()
        }

    def create_deck(self):
        cards = []
        for _ in range(4):
            for val in range(2, 11):
                cards.append(Card(val))
        random.shuffle(cards)
        return cards

    def get_hard_ai_move(self, my_card_value):
        # STRATEGY: FIXED TWO LANES (Left & Center) -- UNLIMITED
        # Random player spreads thin. We concentrate.
        
        target_lanes = ['left', 'center']
        
        l1 = self.lanes[target_lanes[0]]
        l2 = self.lanes[target_lanes[1]]
        
        # Simply balance the two targets. No limits.
        if l1.p2_cards > l2.p2_cards:
            return target_lanes[1]
        else:
            return target_lanes[0]

    def play_game(self):
        while self.deck1 and self.deck2:
            # Player 1 (Random) - Play until 10 cards per lane
            p1_lane_opts = [l for l in ['left', 'center', 'right'] if self.lanes[l].p1_cards < 10]
            if not p1_lane_opts: p1_lane_opts = ['left', 'center', 'right'] 
            p1_move = random.choice(p1_lane_opts) if p1_lane_opts else 'center'

            # Player 2 (AI)
            p2_card_val = self.deck2[0].value
            p2_move = self.get_hard_ai_move(p2_card_val)

            # Execute
            c1 = self.deck1.pop(0)
            c2 = self.deck2.pop(0)
            
            l1 = self.lanes[p1_move]
            l1.score1 += c1.value
            l1.p1_cards += 1
            
            l2 = self.lanes[p2_move]
            l2.score2 += c2.value
            l2.p2_cards += 1

        # Determine Winner
        p1_wins = 0
        p2_wins = 0
        for l in self.lanes.values():
            if l.score1 > l.score2: p1_wins += 1
            if l.score2 > l.score1: p2_wins += 1
            
        return 'p2' if p2_wins > p1_wins else ('p1' if p1_wins > p2_wins else 'draw')

# Run Simulation
wins = 0
total = 1000
for i in range(total):
    game = GameState()
    res = game.play_game()
    if res == 'p2':
        wins += 1

print(f"AI Win Rate vs Random: {wins/total*100:.1f}%")
