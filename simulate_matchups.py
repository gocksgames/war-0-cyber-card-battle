
import random
import statistics

# --- CONSTANTS ---
SUITS = ['♠', '♥', '♣', '♦']
RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10']

class Card:
    def __init__(self, suit, rank, value):
        self.suit = suit
        self.rank = rank
        self.value = value

class GameState:
    def __init__(self):
        self.deck1 = self.create_deck()
        self.deck2 = self.create_deck()
        self.lanes = {
            'left': {'score1': 0, 'score2': 0, 'p1_cards': 0, 'p2_cards': 0, 'history': []},
            'center': {'score1': 0, 'score2': 0, 'p1_cards': 0, 'p2_cards': 0, 'history': []},
            'right': {'score1': 0, 'score2': 0, 'p1_cards': 0, 'p2_cards': 0, 'history': []}
        }
        self.is_game_over = False

    def create_deck(self):
        cards = []
        for suit in SUITS:
            for i, rank in enumerate(RANKS):
                cards.append(Card(suit, rank, i + 2))
        random.shuffle(cards)
        return cards

    def play_round(self, p1_lane, p2_lane):
        if not self.deck1 or not self.deck2:
            self.is_game_over = True
            return

        c1 = self.deck1.pop(0)
        c2 = self.deck2.pop(0)

        l1 = self.lanes[p1_lane]
        l1['score1'] += c1.value
        l1['p1_cards'] += 1
        l1['history'].append({'player': 'p1', 'val': c1.value})

        l2 = self.lanes[p2_lane]
        l2['score2'] += c2.value
        l2['p2_cards'] += 1
        l2['history'].append({'player': 'p2', 'val': c2.value})

        if not self.deck1:
            self.is_game_over = True

# --- AI LOGIC (Matches JS Logic) ---

def get_ai_move(game, difficulty, is_p1):
    lanes_keys = ['left', 'center', 'right']

    # RANDOM (0)
    if difficulty == 0:
        return random.choice(lanes_keys)

    # EASY (1)
    if difficulty == 1:
        candidates = []
        for l in lanes_keys:
            lane = game.lanes[l]
            diff = (lane['score1'] - lane['score2']) if is_p1 else (lane['score2'] - lane['score1'])
            my_cards = lane['p1_cards'] if is_p1 else lane['p2_cards']
            if diff > -30 and my_cards < 2:
                candidates.append(l)
        if candidates: return random.choice(candidates)
        space_fallback = [l for l in lanes_keys if (game.lanes[l]['p1_cards' if is_p1 else 'p2_cards'] < 2)]
        if space_fallback: return random.choice(space_fallback)
        return random.choice(lanes_keys)

    # PRO (2) / HARD+ (3)
    can_peek = (difficulty == 3)
    
    # 1. Evaluate
    evals = []
    for l in lanes_keys:
        lane = game.lanes[l]
        diff = (lane['score1'] - lane['score2']) if is_p1 else (lane['score2'] - lane['score1'])
        my_cards = lane['p1_cards'] if is_p1 else lane['p2_cards']
        enemy_cards = lane['p2_cards'] if is_p1 else lane['p1_cards']

        is_lost = diff < -25
        is_secure = diff > 25
        
        evals.append({
            'lane': l,
            'diff': diff,
            'my_cards': my_cards,
            'enemy_cards': enemy_cards,
            'is_lost': is_lost,
            'is_secure': is_secure
        })

    # 2. Filter Lost
    playable = [e for e in evals if not e['is_lost']]
    if not playable:
        evals.sort(key=lambda x: x['diff'], reverse=True)
        return evals[0]['lane']

    # 3. Sort by Advantage (Best First)
    playable.sort(key=lambda x: x['diff'], reverse=True)

    # 4. Target Strategy
    targets = playable[:2]
    
    # 5. Peeking
    my_card_value = 6
    if can_peek:
        my_deck = game.deck1 if is_p1 else game.deck2
        if my_deck: my_card_value = my_deck[0].value
        else: my_card_value = 5

    if not targets: return 'center'

    if len(targets) > 1:
        best = targets[0]
        second = targets[1]

        # Priority: If secondary is exposed (0 cards), grab it!
        if second['enemy_cards'] == 0: return second['lane']
        
        # Priority: If best is already secure, focus everything on second
        if best['is_secure']: return second['lane']
        
        # HARD+ INTELLIGENCE (OMNISCIENT COUNTER)
        if can_peek:
            # 1. Peek Enemy Card
            enemy_deck = game.deck2 if is_p1 else game.deck1
            enemy_val = 6
            if enemy_deck: enemy_val = enemy_deck[0].value
            
            # 2. Predict Enemy Move (Pro Logic: Target their 2nd best)
            # Enemy Perspective:
            enemy_evals = []
            for l in lanes_keys:
                lane = game.lanes[l]
                # Enemy diff = Their Score - My Score = - (My Score - Their Score) -> -diff
                # Wait, diff is already calculated as (My - Enemy). So Enemy View is -diff.
                d_my = (lane['score1'] - lane['score2']) if is_p1 else (lane['score2'] - lane['score1'])
                d_enemy = -d_my
                
                # Check if lost for enemy
                # Lost if d_enemy < -25
                is_lost = d_enemy < -25
                enemy_evals.append({'lane': l, 'diff': d_enemy, 'is_lost': is_lost})
            
            e_playable = [e for e in enemy_evals if not e['is_lost']]
            e_playable.sort(key=lambda x: x['diff'], reverse=True)
            
            pred_lane = 'center'
            if e_playable:
                if len(e_playable) > 1:
                    pred_lane = e_playable[1]['lane']
                else:
                    pred_lane = e_playable[0]['lane']
            
            # 3. Find Counter Move
            best_move = second['lane']
            max_min_score = -9999
            
            candidates = [best['lane'], second['lane']]
            if len(playable) > 2: candidates.append(playable[2]['lane'])
            
            # Base Diffs for Me
            base_diffs = { item['lane']: item['diff'] for item in playable } # track all valid lanes
            
            for m in candidates:
                d = base_diffs.copy()
                d[m] += my_card_value # Me
                if pred_lane in d:
                    d[pred_lane] -= enemy_val # Enemy (reduces my diff)
                
                # Score: min of top 2
                vals = sorted(d.values(), reverse=True)
                score = vals[1] if len(vals) > 1 else vals[0]
                
                if score > max_min_score:
                    max_min_score = score
                    best_move = m
                    
            return best_move
        
        # PRO STRATEGY / DEFAULT
        return second['lane']
    
    else:
        return targets[0]['lane']

# --- SIMULATION LOOP ---

def simulate(p1_diff, p2_diff, iterations=1000):
    p1_wins = 0
    p2_wins = 0
    draws = 0

    for _ in range(iterations):
        game = GameState()
        while not game.is_game_over:
            m1 = get_ai_move(game, p1_diff, True)
            m2 = get_ai_move(game, p2_diff, False)
            game.play_round(m1, m2)

        # Result
        s1 = 0
        s2 = 0
        for l in game.lanes.values():
            if l['score1'] > l['score2']: s1 += 1
            elif l['score2'] > l['score1']: s2 += 1
        
        if s1 > s2: p1_wins += 1
        elif s2 > s1: p2_wins += 1
        else: draws += 1

    return p1_wins / iterations

# --- MAIN ---

LEVELS = ['RANDOM', 'EASY', 'PRO', 'HARD+']
print(f"\n🤖 WAR.0 AI MATCHUP SIMULATION (1000 games per matchup)\n")
header_start = "P1 \\ P2"
print(f"{header_start:<12} {'RANDOM':<10} {'EASY':<10} {'PRO':<10} {'HARD+':<10}")
print("-" * 60)

for p1_i, p1_name in enumerate(LEVELS):
    row_str = f"{p1_name:<12}"
    for p2_i, p2_name in enumerate(LEVELS):
        rate = simulate(p1_i, p2_i)
        row_str += f"{rate*100:.1f}%".ljust(11)
    print(row_str)

print("-" * 60 + "\n")
