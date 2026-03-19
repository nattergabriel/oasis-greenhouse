# Initial Strategy Document

Default strategy used on the first simulation run before any learning. Based on KB recommendations.

The greenhouse supplements packaged food. Goal: maximize fresh food production to slow packaged food depletion and provide micronutrients.

---

## Slot Assignments

4 slots in a 2×2 grid, 4 m² each (16 m² total). Each slot gets one crop type — the engine fills it and auto-replants after every harvest.

- Slot 0: **potato** — caloric backbone (2 plantings × 2.0 m² = 4 m²)
- Slot 1: **beans_peas** — protein source (2 plantings × 1.5 m² = 3 m², 1 m² unused)
- Slot 2: **lettuce** — micronutrients (8 plantings × 0.5 m² = 4 m²)
- Slot 3: **herbs** — morale + micronutrient diversity (13 plantings × 0.3 m² = 3.9 m²)

## Environment Settings

- Temperature: 20°C (compromise across all crops)
- Artificial light: ON for all slots
- Water allocation: 1.0 (default) for all slots

## Resource Management

- Water (10,000L): maintain >20% reserve. If low, reduce water on slot 2 first (lettuce recovers fastest).
- Nutrients (5,000): monitor closely. Beans and lettuce are nutrient-hungry.
- Energy: if deficit, toggle lights off on slot 2 first (short-cycle crops recover faster).

## Crisis Priorities

1. Human safety (temperature extremes)
2. Water preservation (hardest to replace, 90% recycling)
3. Protect potato slot (caloric backbone, longest cycle to recover)
4. Protect beans slot (protein source, moderate cycle)
5. Sacrifice short-cycle crops first (lettuce, radish, herbs) — they recover fastest

## Nutritional Corrections

- Low calorie fraction: swap a slot to potato
- Low protein: swap a slot to beans_peas, optimize conditions (18-22°C)
- Micronutrient gaps: ensure at least one slot has lettuce or herbs
- Packaged food depleting fast: prioritize calorie-dense assignments temporarily
