# Initial Strategy Document

This is the default strategy document used on the first simulation run (before any learning has occurred). It's based on KB recommendations and serves as a starting point that gets refined through simulation runs.

The greenhouse supplements packaged food. The goal is to maximize fresh food production to slow packaged food depletion and provide micronutrients that packaged food lacks.

---

## Zone Plans

4 zones, 15 m² each, 60 m² total. Each zone gets a crop plan — the engine fills it and auto-replants after every harvest.

- Zone 1: `{"potato": 1.0}` — pure caloric backbone (7 plantings × 2.0 m² = 14 m²)
- Zone 2: `{"potato": 0.5, "beans_peas": 0.5}` — calories + protein mix
- Zone 3: `{"lettuce": 0.5, "radish": 0.3, "herbs": 0.2}` — micronutrients + diversity + morale
- Zone 4: `{"beans_peas": 0.7, "herbs": 0.3}` — protein focus + morale

This gives roughly 37% potato, 30% beans, 17% lettuce, 10% radish, 6% herbs by area across the greenhouse.

## Environment Settings

- Temperature: 20°C (compromise across all crops, within optimal range for most)
- Artificial light: ON for all zones initially
- Water allocation: 1.0 (default) for all zones

## Resource Management

- Water (10,000L starting): maintain >20% reserve. If below, reduce water allocation on zone 3 first (short-cycle crops recover faster from water gaps).
- Nutrients (5,000 starting): monitor closely. Beans and lettuce are nitrogen-hungry.
- Energy: if deficit occurs, toggle lights off in zone 3 first (short-cycle crops recover faster from light gaps). Shorten photoperiod before cutting zones entirely.

## Crisis Priorities

1. Human safety (temperature extremes)
2. Water preservation (hardest to replace, recycling at 90%)
3. Protect potato zones (caloric backbone, longest cycle to recover from loss)
4. Protect bean zones (protein, moderate cycle)
5. Sacrifice short-cycle crops first (lettuce, radish, herbs) — they recover fastest

## Nutritional Correction via Zone Plan Changes

- Low calorie fraction: shift a zone plan toward more potato allocation
- Low protein fraction: shift a zone plan toward more beans, optimize bean conditions (18-22°C)
- Micronutrient gaps: ensure at least one zone has lettuce and herbs — greenhouse is primary micronutrient source
- Packaged food depleting too fast: prioritize calorie-dense zone plans (potato-heavy) temporarily
