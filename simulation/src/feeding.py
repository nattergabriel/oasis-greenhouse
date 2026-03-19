"""Crew feeding: greenhouse food first, stored food fills the gap.

Consumes from food_supply stockpile proportionally across all crop types,
then deducts the caloric remainder from stored food. Returns nutrition
fractions for the daily snapshot and metrics.
"""

from __future__ import annotations

from . import config
from .crops import get_micronutrients
from .models import DailyNutrition, FoodSupply, StoredFood


def feed_crew(
    food_supply: FoodSupply,
    stored_food: StoredFood,
    crew_size: int = config.CREW_SIZE,
) -> DailyNutrition:
    """Feed the crew for one sol: greenhouse first, stored food fills gap.

    Consumes ALL available greenhouse food each day (it doesn't spoil but
    the crew eats what's there). Stored food covers any remaining need.

    Args:
        food_supply: Greenhouse food stockpile (mutated — items consumed).
        stored_food: Pre-packaged reserves (mutated — calories deducted).
        crew_size: Number of crew members.

    Returns:
        DailyNutrition with greenhouse fractions and micronutrient coverage.
    """
    daily_need_kcal = crew_size * config.CALORIES_PER_PERSON_PER_DAY
    daily_need_protein_g = crew_size * config.PROTEIN_PER_PERSON_PER_DAY_G

    # Step 1: Consume greenhouse food (all available, up to daily need)
    gh_kcal = 0.0
    gh_protein_g = 0.0
    micronutrients_covered: set[str] = set()

    # Consume proportionally: if stockpile has more than needed, only take what's needed.
    # If stockpile has less, take everything.
    available_kcal = food_supply.total_kcal()

    if available_kcal > 0.0:
        # Fraction of stockpile to consume (cap at 1.0 = take everything)
        consume_fraction = min(1.0, daily_need_kcal / max(available_kcal, 0.001))

        types_consumed: list[str] = []
        for crop_type, item in food_supply.items.items():
            if item.kg <= 0.0:
                continue

            consumed_kg = item.kg * consume_fraction
            consumed_kcal = item.kcal * consume_fraction
            consumed_protein = item.protein_g * consume_fraction

            gh_kcal += consumed_kcal
            gh_protein_g += consumed_protein

            item.kg -= consumed_kg
            item.kcal -= consumed_kcal
            item.protein_g -= consumed_protein

            # Clamp to zero (floating point safety)
            item.kg = max(0.0, item.kg)
            item.kcal = max(0.0, item.kcal)
            item.protein_g = max(0.0, item.protein_g)

            types_consumed.append(crop_type)

        # Micronutrients from consumed crop types
        for crop_type in types_consumed:
            micronutrients_covered.update(get_micronutrients(crop_type))

    # Cap greenhouse contribution at daily need
    gh_kcal = min(gh_kcal, float(daily_need_kcal))
    gh_protein_g = min(gh_protein_g, float(daily_need_protein_g))

    # Step 2: Stored food fills the remainder
    remaining_kcal = float(daily_need_kcal) - gh_kcal
    stored_kcal_consumed = 0.0
    if remaining_kcal > 0.0 and stored_food.remaining_calories > 0.0:
        stored_kcal_consumed = min(remaining_kcal, stored_food.remaining_calories)
        stored_food.remaining_calories -= stored_kcal_consumed
        stored_food.remaining_calories = max(0.0, stored_food.remaining_calories)

    # Step 3: Compute fractions (division-safe)
    calorie_gh_fraction = gh_kcal / max(float(daily_need_kcal), 0.001)
    protein_gh_fraction = gh_protein_g / max(float(daily_need_protein_g), 0.001)

    # Filter to valid micronutrients only
    valid_micronutrients = [
        n for n in sorted(micronutrients_covered)
        if n in config.ALL_MICRONUTRIENTS
    ]

    return DailyNutrition(
        calorie_gh_fraction=calorie_gh_fraction,
        protein_gh_fraction=protein_gh_fraction,
        micronutrients_covered=valid_micronutrients,
        micronutrient_count=len(valid_micronutrients),
        gh_kcal=gh_kcal,
        gh_protein_g=gh_protein_g,
        stored_kcal_consumed=stored_kcal_consumed,
    )
