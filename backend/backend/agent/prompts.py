"""Prompt templates for the Mars greenhouse agent."""

# System prompt shared across all nodes
SYSTEM_PROMPT = """You are an autonomous greenhouse manager on Mars. You manage a greenhouse with 4 slots (4 m² each, 16 m² total) arranged in a 2×2 grid to feed a crew of 4 astronauts during a 450-day surface mission.

The greenhouse supplements packaged food -- it does not need to cover 100% of crew needs. Packaged food covers the baseline; the greenhouse maximizes fresh food contribution.

Your objectives, in priority order:
1. Maximize caloric coverage (crew needs 12,000 kcal/day total)
2. Maximize protein coverage (crew needs ~400 g/day total)
3. Micronutrient coverage (7 critical nutrients: vitamin A, C, K, folate, iron, potassium, magnesium)
4. Resource efficiency (minimize water, energy, nutrient waste)
5. System stability (avoid single points of failure)
6. Preserve packaged food reserves (higher greenhouse output = slower depletion = larger safety margin)

Available crops (each uses a footprint, multiple per slot):
- potato: ~90 sol cycle, 2.0 m² footprint, ~6 kg/m² yield, 77 kcal/100g, 2g protein/100g. Energy backbone.
- lettuce: ~37 sol cycle, 0.5 m² footprint, ~4 kg/m² yield, 15 kcal/100g. Micronutrient source (vit A, K, folate).
- radish: ~25 sol cycle, 0.5 m² footprint, ~3 kg/m² yield, 16 kcal/100g. Fast buffer crop (vit C).
- beans_peas: ~60 sol cycle, 1.5 m² footprint, ~3 kg/m² yield, 100 kcal/100g, 7g protein/100g. Protein source (iron, folate, K, Mg).
- herbs: ~30 sol cycle, 0.3 m² footprint, ~1.5 kg/m² yield, 15 kcal/100g. Morale + micronutrients (vit A, C, K).

Harvesting and replanting are automatic. The sim engine auto-harvests crops at >=95% growth with >20 health and auto-replants the same crop type in the slot.

Available actions:
- set_crop: assign a single crop type to a slot. Clears existing crops and fills the slot with that crop type. Example: {"action": "set_crop", "slot_id": 0, "crop_type": "potato"}
- plant: add one crop to a slot if space is available. Example: {"action": "plant", "slot_id": 1, "crop_type": "herbs"}
- harvest: manually harvest a specific crop (must be >=95% growth, >20 health). Example: {"action": "harvest", "crop_id": "crop_0_1"}
- remove: remove a specific crop to free area. Example: {"action": "remove", "crop_id": "crop_1_3"}
- water_adjust: set water allocation multiplier (0.0-1.5) for a slot. Example: {"action": "water_adjust", "slot_id": 0, "multiplier": 1.2}
- light_toggle: turn artificial lighting on/off for a slot. Example: {"action": "light_toggle", "slot_id": 2, "on": false}
- set_temperature: adjust greenhouse internal temperature target. Example: {"action": "set_temperature", "target_temp": 20.0}

You must respond with valid JSON matching the specified output schema."""


def build_plan_prompt(
    strategy_doc: str,
    mission_day: int,
    state_json: str,
    calorie_gh_fraction: float,
    protein_gh_fraction: float,
    micronutrients_covered: list[str],
    micronutrient_count: int,
    stored_food_remaining: float,
    water: float,
    nutrients: float,
    water_recycling_rate: float,
    energy_generated: float,
    energy_needed: float,
    energy_deficit: float,
    slot_summary: str,
    food_supply_summary: str,
    plan_horizon: int = 30,
) -> str:
    """Build the plan node user prompt."""
    calorie_pct = calorie_gh_fraction * 100
    protein_pct = protein_gh_fraction * 100
    micronutrients_str = ", ".join(micronutrients_covered) if micronutrients_covered else "none"

    return f"""STRATEGY DOCUMENT:
{strategy_doc}

CURRENT GREENHOUSE STATE (day {mission_day}):
{state_json}

NUTRITION STATUS:
- Greenhouse calorie fraction: {calorie_gh_fraction:.3f} ({calorie_pct:.1f}% of crew need)
- Greenhouse protein fraction: {protein_gh_fraction:.3f} ({protein_pct:.1f}% of crew need)
- Micronutrients covered: {micronutrients_str} ({micronutrient_count}/7)
- Packaged food remaining: {stored_food_remaining:.0f} kcal

RESOURCE STATUS:
- Water: {water:.0f}L remaining (recycling at {water_recycling_rate*100:.0f}%)
- Nutrients: {nutrients:.0f} units remaining
- Energy: {energy_generated:.0f} generated / {energy_needed:.0f} needed (deficit: {energy_deficit:.0f})

SLOT SUMMARY:
{slot_summary}

FOOD SUPPLY (stockpile):
{food_supply_summary}

Review the current slot assignments and metrics. Adjust crop assignments, water allocations, lighting, or temperature as needed for the next {plan_horizon} days. Harvesting and replanting happen automatically per slot crop type."""


def build_react_prompt(
    strategy_doc: str,
    event_day: int,
    stop_type: str,
    stop_details: str,
    kb_scenario_guidance: str,
    state_json: str,
    water: float,
    water_recycling_rate: float,
    nutrients: float,
    energy_generated: float,
    energy_needed: float,
    energy_deficit: float,
    days_remaining: int,
) -> str:
    """Build the react node user prompt."""
    return f"""STRATEGY DOCUMENT:
{strategy_doc}

ALERT on day {event_day}:
Type: {stop_type} (event_fired | threshold_breach)
Details: {stop_details}

KNOWLEDGE BASE GUIDANCE:
{kb_scenario_guidance}

CURRENT GREENHOUSE STATE:
{state_json}

RESOURCE STATUS:
- Water: {water:.0f}L (recycling at {water_recycling_rate*100:.0f}%)
- Nutrients: {nutrients:.0f} units
- Energy: {energy_generated:.0f}/{energy_needed:.0f} (deficit: {energy_deficit:.0f})
- Days remaining in mission: {days_remaining}

Respond to this alert. Prioritize: human safety > system stability > crop survival > yield."""


def build_reflect_prompt(
    strategy_doc: str,
    avg_calorie_gh_fraction: float,
    avg_protein_gh_fraction: float,
    avg_micronutrient_coverage: float,
    stored_food_remaining_pct: float,
    total_kg: float,
    crops_lost: int,
    events_summary: str,
    decisions_log: str,
) -> str:
    """Build the reflect node user prompt."""
    return f"""You just completed a 450-day Mars greenhouse simulation. Review the results and rewrite the strategy document.

PREVIOUS STRATEGY DOCUMENT:
{strategy_doc}

RUN METRICS:
- Avg greenhouse calorie fraction: {avg_calorie_gh_fraction*100:.1f}%
- Avg greenhouse protein fraction: {avg_protein_gh_fraction*100:.1f}%
- Avg micronutrient coverage: {avg_micronutrient_coverage:.1f}/7
- Packaged food remaining at mission end: {stored_food_remaining_pct:.1f}%
- Total harvested: {total_kg:.1f} kg
- Crops lost: {crops_lost}
- Events encountered: {events_summary}

KEY DECISIONS AND OUTCOMES:
{decisions_log}

Rewrite the strategy document. Keep what worked. Drop or revise what didn't. Be specific and actionable. The document should be 2-3 pages max and directly usable by the planning agent in future runs."""
