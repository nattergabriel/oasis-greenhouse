"""Simulation orchestrator: create initial state, run tick loop.

Wires together environment, events, crops, slots, resources, and feeding
into the day loop defined in SIMULATION-SPEC.md.
"""

from __future__ import annotations

import copy
import logging
import random as random_module
from typing import Any

from . import config
from .crops import (
    apply_stress,
    detect_stress,
    grow_crop,
    harvest_crop,
    is_dead,
    is_harvestable,
)
from .environment import update_environment
from .events import apply_events, roll_events, update_active_events
from .feeding import feed_crew
from .models import (
    ActiveEvent,
    DailyNutrition,
    Environment,
    FoodItem,
    FoodSupply,
    GreenhouseState,
    Metrics,
    ResourcePool,
    StoredFood,
    Slot,
    dict_to_state,
    state_to_dict,
)
from .resources import consume_resources, recycle_resources
from .slots import auto_replant, fill_slot

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Initial state
# ---------------------------------------------------------------------------

def create_initial_state(
    seed: int = 42,
    crop_assignments: dict[int, str] | None = None,
) -> GreenhouseState:
    """Create the day-0 greenhouse state.

    Greenhouse is a 4×4 grid of 2×2m slots. If crop_assignments are provided,
    slots are filled with the assigned crop types.

    Args:
        seed: RNG seed for deterministic simulation.
        crop_assignments: Optional {slot_id: crop_type} assignments.

    Returns:
        Initial GreenhouseState ready for tick simulation.
    """
    slots = []
    slot_id = 0
    for row in range(config.GREENHOUSE_ROWS):
        for col in range(config.GREENHOUSE_COLS):
            slots.append(Slot(id=slot_id, row=row, col=col, area_m2=config.SLOT_AREA_M2))
            slot_id += 1

    state = GreenhouseState(
        day=0,
        environment=Environment(),
        slots=slots,
        resources=ResourcePool(),
        food_supply=FoodSupply(),
        stored_food=StoredFood(),
        active_events=[],
        daily_nutrition=DailyNutrition(),
        metrics=Metrics(),
        next_crop_id=1,
        seed=seed,
    )

    # Apply crop assignments and initial fill
    if crop_assignments:
        for slot in state.slots:
            crop_type = crop_assignments.get(slot.id)
            if crop_type and crop_type in config.CROPS:
                slot.crop_type = crop_type
                _, state.next_crop_id = fill_slot(
                    slot, day=0, next_crop_id_counter=state.next_crop_id,
                )

    return state


# ---------------------------------------------------------------------------
# Water availability
# ---------------------------------------------------------------------------

def compute_water_availability(
    resources: ResourcePool,
    all_crops: list,
    crew_size: int = config.CREW_SIZE,
) -> float:
    """Compute global water availability factor (0.0-1.0).

    Compares available water to total demand for this sol.
    Gradual degradation: as water runs low, all crops get proportionally less.

    Args:
        resources: Current resource pool.
        all_crops: All active crops.
        crew_size: Number of crew members.

    Returns:
        Factor between 0.0 and 1.0.
    """
    crop_water = sum(
        config.CROPS[c.type].water_per_sol_l
        for c in all_crops
        if c.type in config.CROPS
    )
    crew_water = crew_size * config.WATER_PER_PERSON_PER_DAY_L
    total_demand = crop_water + crew_water

    if total_demand <= 0.0:
        return 1.0

    return min(1.0, resources.water / total_demand)


# ---------------------------------------------------------------------------
# Action application
# ---------------------------------------------------------------------------

def apply_actions(
    actions: list[dict[str, Any]],
    state: GreenhouseState,
    warnings: list[str],
) -> None:
    """Apply agent actions to the state. Invalid actions are skipped with warnings.

    Args:
        actions: List of action dicts from the agent.
        state: Greenhouse state to mutate.
        warnings: List to append warning messages to.
    """
    for action in actions:
        action_type = action.get("action", "")
        try:
            _apply_single_action(action_type, action, state, warnings)
        except Exception as e:
            warnings.append(f"Action '{action_type}' failed: {e}")


def _apply_single_action(
    action_type: str,
    action: dict[str, Any],
    state: GreenhouseState,
    warnings: list[str],
) -> None:
    """Apply a single agent action."""
    if action_type == "set_crop":
        _action_set_crop(action, state, warnings)
    elif action_type == "plant":
        _action_plant(action, state, warnings)
    elif action_type == "harvest":
        _action_harvest(action, state, warnings)
    elif action_type == "remove":
        _action_remove(action, state, warnings)
    elif action_type == "water_adjust":
        _action_water_adjust(action, state, warnings)
    elif action_type == "light_toggle":
        _action_light_toggle(action, state, warnings)
    elif action_type == "set_temperature":
        _action_set_temperature(action, state, warnings)
    else:
        warnings.append(f"Unknown action type: '{action_type}'")


def _find_slot(state: GreenhouseState, slot_id: int) -> Slot | None:
    for s in state.slots:
        if s.id == slot_id:
            return s
    return None


def _action_plant(action: dict, state: GreenhouseState, warnings: list[str]) -> None:
    crop_type = action.get("crop_type", "")
    slot_id = action.get("slot_id")
    slot = _find_slot(state, slot_id) if slot_id is not None else None
    if slot is None:
        warnings.append(f"plant: slot {slot_id} not found")
        return
    if not slot.can_plant(crop_type):
        warnings.append(f"plant: no space for '{crop_type}' in slot {slot_id}")
        return
    from .slots import create_crop
    crop_id = f"crop_{slot_id}_{state.next_crop_id}"
    crop = create_crop(crop_type, slot_id, state.day, crop_id)
    if crop is None:
        warnings.append(f"plant: unknown crop type '{crop_type}'")
        return
    slot.crops.append(crop)
    state.next_crop_id += 1


def _action_harvest(action: dict, state: GreenhouseState, warnings: list[str]) -> None:
    crop_id = action.get("crop_id", "")
    for slot in state.slots:
        for crop in slot.crops:
            if crop.id == crop_id:
                if not is_harvestable(crop):
                    warnings.append(f"harvest: crop {crop_id} not ready")
                    return
                food = harvest_crop(crop)
                _add_food_to_supply(state.food_supply, crop.type, food)
                state.metrics.total_harvested_kg += food.kg
                slot.crops.remove(crop)
                return
    warnings.append(f"harvest: crop {crop_id} not found")


def _action_remove(action: dict, state: GreenhouseState, warnings: list[str]) -> None:
    crop_id = action.get("crop_id", "")
    for slot in state.slots:
        for crop in slot.crops:
            if crop.id == crop_id:
                slot.crops.remove(crop)
                return
    warnings.append(f"remove: crop {crop_id} not found")


def _action_water_adjust(action: dict, state: GreenhouseState, warnings: list[str]) -> None:
    slot_id = action.get("slot_id")
    multiplier = action.get("multiplier", 1.0)
    slot = _find_slot(state, slot_id) if slot_id is not None else None
    if slot is None:
        warnings.append(f"water_adjust: slot {slot_id} not found")
        return
    slot.water_allocation = max(0.0, min(1.5, float(multiplier)))


def _action_light_toggle(action: dict, state: GreenhouseState, warnings: list[str]) -> None:
    slot_id = action.get("slot_id")
    on = action.get("on", True)
    slot = _find_slot(state, slot_id) if slot_id is not None else None
    if slot is None:
        warnings.append(f"light_toggle: slot {slot_id} not found")
        return
    slot.artificial_light = bool(on)


def _action_set_temperature(action: dict, state: GreenhouseState, warnings: list[str]) -> None:
    target = action.get("target_temp")
    if target is None:
        warnings.append("set_temperature: missing target_temp")
        return
    state.environment.target_temp = float(target)


def _action_set_crop(action: dict, state: GreenhouseState, warnings: list[str]) -> None:
    slot_id = action.get("slot_id")
    crop_type = action.get("crop_type", "")
    slot = _find_slot(state, slot_id) if slot_id is not None else None
    if slot is None:
        warnings.append(f"set_crop: slot {slot_id} not found")
        return
    if crop_type and crop_type not in config.CROPS:
        warnings.append(f"set_crop: unknown crop type '{crop_type}'")
        return
    # Clear existing crops and assign new type
    slot.crops.clear()
    slot.crop_type = crop_type or None
    if slot.crop_type:
        _, state.next_crop_id = fill_slot(
            slot, state.day, state.next_crop_id,
        )


# ---------------------------------------------------------------------------
# Food supply helper
# ---------------------------------------------------------------------------

def _add_food_to_supply(supply: FoodSupply, crop_type: str, food: FoodItem) -> None:
    """Add harvested food to the stockpile."""
    if crop_type not in supply.items:
        supply.items[crop_type] = FoodItem()
    item = supply.items[crop_type]
    item.kg += food.kg
    item.kcal += food.kcal
    item.protein_g += food.protein_g


# ---------------------------------------------------------------------------
# Inject event
# ---------------------------------------------------------------------------

def inject_event(
    state: GreenhouseState,
    event_type: str,
    duration_sols: int | None = None,
    rng: random_module.Random | None = None,
) -> ActiveEvent | None:
    """Manually inject a crisis event into the simulation.

    Args:
        state: Current greenhouse state.
        event_type: Must be a key in config.EVENTS.
        duration_sols: Override default duration. If None, uses random within range.
        rng: RNG for duration/parameter randomization.

    Returns:
        The created ActiveEvent, or None if event_type is unknown or already active.
    """
    event_cfg = config.EVENTS.get(event_type)
    if event_cfg is None:
        logger.warning("inject_event: unknown event type '%s'", event_type)
        return None

    # Don't allow duplicate active events of the same type
    if any(e.type == event_type for e in state.active_events):
        logger.warning("inject_event: '%s' already active", event_type)
        return None

    if rng is None:
        rng = random_module.Random(state.seed + state.day)

    if duration_sols is None:
        duration_sols = rng.randint(event_cfg.duration_min_sols, event_cfg.duration_max_sols)

    event = ActiveEvent(
        type=event_type,
        started_day=state.day,
        duration_sols=duration_sols,
        remaining_sols=duration_sols,
    )

    if event_type == "water_recycling_degradation":
        event.degraded_recycling = rng.uniform(
            config.DEGRADED_WATER_RECYCLING_MIN,
            config.DEGRADED_WATER_RECYCLING_MAX,
        )
    elif event_type == "temperature_control_failure":
        direction = rng.choice([-1, 1])
        event.temp_drift_c = direction * config.TEMP_FAILURE_DRIFT_C

    state.active_events.append(event)
    return event


# ---------------------------------------------------------------------------
# Early stop checks
# ---------------------------------------------------------------------------

def _check_threshold_breaches(state: GreenhouseState) -> dict[str, Any] | None:
    """Check for threshold breaches that should stop the simulation.

    Returns stop_reason dict if a breach is found, None otherwise.
    """
    # Crop health below threshold
    for slot in state.slots:
        for crop in slot.crops:
            if crop.health < config.EARLY_STOP_CROP_HEALTH_THRESHOLD:
                return {
                    "type": "threshold_breach",
                    "trigger": "crop_health_low",
                    "detail": f"Crop {crop.id} ({crop.type}) health at {crop.health:.1f} "
                              f"(threshold: {config.EARLY_STOP_CROP_HEALTH_THRESHOLD})",
                    "crop_id": crop.id,
                    "crop_type": crop.type,
                    "health": crop.health,
                }

    # Water below threshold
    if state.resources.water < config.EARLY_STOP_WATER_THRESHOLD_L:
        return {
            "type": "threshold_breach",
            "trigger": "water_low",
            "detail": f"Water at {state.resources.water:.0f}L "
                      f"(threshold: {config.EARLY_STOP_WATER_THRESHOLD_L:.0f}L)",
            "water_remaining": state.resources.water,
        }

    # Energy deficit streak
    if state.consecutive_energy_deficit_days >= config.EARLY_STOP_ENERGY_DEFICIT_STREAK:
        return {
            "type": "threshold_breach",
            "trigger": "energy_deficit_streak",
            "detail": f"Energy deficit for {state.consecutive_energy_deficit_days} "
                      f"consecutive days (threshold: {config.EARLY_STOP_ENERGY_DEFICIT_STREAK})",
            "streak": state.consecutive_energy_deficit_days,
        }

    return None


# ---------------------------------------------------------------------------
# Tick loop
# ---------------------------------------------------------------------------

def simulate_tick(
    state_dict: dict[str, Any],
    days: int = 1,
    actions: list[dict[str, Any]] | None = None,
    inject_events: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Run the simulation for N days.

    Deserializes state, deep-copies, runs the day loop, serializes back.
    Stateless between calls.

    Args:
        state_dict: Serialized GreenhouseState.
        days: Number of days to simulate (1-450).
        actions: Agent actions to apply on the FIRST day.
        inject_events: Events to inject on the FIRST day.

    Returns:
        Dict with keys: state, daily_logs, days_simulated, stopped_early, stop_reason.
    """
    state = dict_to_state(state_dict)
    state = copy.deepcopy(state)

    rng = random_module.Random(state.seed)
    # Advance RNG to current day to maintain determinism across calls
    for _ in range(state.day):
        rng.random()

    daily_logs: list[dict[str, Any]] = []
    stopped_early = False
    stop_reason: dict[str, Any] | None = None
    days_simulated = 0

    for tick in range(days):
        state.day += 1
        day = state.day
        day_log: dict[str, Any] = {"day": day, "harvests": [], "deaths": [],
                                     "events_started": [], "events_ended": [],
                                     "warnings": []}
        warnings = day_log["warnings"]

        # -- 0. Apply agent actions (first tick only) --
        if tick == 0:
            if actions:
                apply_actions(actions, state, warnings)
            if inject_events:
                for ie in inject_events:
                    evt = inject_event(
                        state,
                        event_type=ie.get("event_type", ""),
                        duration_sols=ie.get("duration_sols"),
                        rng=rng,
                    )
                    if evt:
                        day_log["events_started"].append(evt.type)

        # -- 1. Roll random events --
        new_events = roll_events(day, state.active_events, rng)
        for evt in new_events:
            state.active_events.append(evt)
            day_log["events_started"].append(evt.type)

        # -- EARLY STOP: new random event fires → return to orchestrator --
        if new_events and tick > 0:
            # Complete this day's log before stopping
            day_log["calorie_gh_fraction"] = state.daily_nutrition.calorie_gh_fraction
            day_log["protein_gh_fraction"] = state.daily_nutrition.protein_gh_fraction
            day_log["micronutrient_count"] = state.daily_nutrition.micronutrient_count
            day_log["water_remaining"] = state.resources.water
            day_log["stored_food_remaining"] = state.stored_food.remaining_calories
            day_log["active_events"] = [e.type for e in state.active_events]
            day_log["crop_count"] = sum(len(s.crops) for s in state.slots)
            daily_logs.append(day_log)
            days_simulated += 1
            stopped_early = True
            stop_reason = {
                "type": "event_fired",
                "trigger": "random_event",
                "events": [e.type for e in new_events],
                "detail": f"New event(s) fired: {[e.type for e in new_events]}",
            }
            break

        # -- 2. Apply event effects --
        apply_events(state.active_events, state.environment, state.resources)

        # -- 3. Update environment (seasonal, energy budget) --
        update_environment(state.environment, day, state.slots)

        # -- 4. Track energy deficit streak --
        if state.environment.energy_deficit > 0:
            state.consecutive_energy_deficit_days += 1
        else:
            state.consecutive_energy_deficit_days = 0

        # -- 5. Compute global water availability --
        all_crops = [c for s in state.slots for c in s.crops]
        state.resources.water_availability = compute_water_availability(
            state.resources, all_crops,
        )

        # -- 6. Grow crops + detect/apply stress --
        for slot in state.slots:
            for crop in slot.crops:
                grow_crop(crop, state.environment, state.resources, slot)
                crop.active_stress = detect_stress(
                    crop, state.environment, state.resources, slot,
                )
                apply_stress(crop)

        # -- 7. Remove dead crops + auto-replant --
        for slot in state.slots:
            dead = [c for c in slot.crops if is_dead(c)]
            for crop in dead:
                slot.crops.remove(crop)
                state.metrics.crops_lost += 1
                day_log["deaths"].append({"id": crop.id, "type": crop.type,
                                          "stress": crop.active_stress})
                new_crop, state.next_crop_id = auto_replant(
                    slot, crop.type, day, state.next_crop_id,
                )

        # -- 8. Resources: consume + recycle --
        all_crops = [c for s in state.slots for c in s.crops]
        consume_resources(state.resources, all_crops)
        recycle_resources(state.resources, all_crops)

        # -- 9. Auto-harvest + auto-replant --
        for slot in state.slots:
            harvestable = [c for c in slot.crops if is_harvestable(c)]
            for crop in harvestable:
                food = harvest_crop(crop)
                _add_food_to_supply(state.food_supply, crop.type, food)
                state.metrics.total_harvested_kg += food.kg
                slot.crops.remove(crop)
                day_log["harvests"].append({
                    "id": crop.id, "type": crop.type,
                    "kg": food.kg, "kcal": food.kcal,
                })
                new_crop, state.next_crop_id = auto_replant(
                    slot, crop.type, day, state.next_crop_id,
                )

        # -- 10. Fill any unfilled slots --
        for slot in state.slots:
            if slot.crop_type and slot.available_area() > 0:
                _, state.next_crop_id = fill_slot(
                    slot, day, state.next_crop_id,
                )

        # -- 11. Feed crew --
        daily_nutrition = feed_crew(state.food_supply, state.stored_food)
        state.daily_nutrition = daily_nutrition

        # -- 12. Update metrics --
        state.metrics.days_simulated = day
        state.metrics.update_averages(daily_nutrition)

        # -- 13. Expire events --
        still_active = update_active_events(state.active_events)
        ended = [e.type for e in state.active_events if e not in still_active]
        day_log["events_ended"] = ended
        state.active_events = still_active

        # -- 14. Day log summary --
        day_log["calorie_gh_fraction"] = daily_nutrition.calorie_gh_fraction
        day_log["protein_gh_fraction"] = daily_nutrition.protein_gh_fraction
        day_log["micronutrient_count"] = daily_nutrition.micronutrient_count
        day_log["water_remaining"] = state.resources.water
        day_log["stored_food_remaining"] = state.stored_food.remaining_calories
        day_log["active_events"] = [e.type for e in state.active_events]
        day_log["crop_count"] = sum(len(s.crops) for s in state.slots)

        daily_logs.append(day_log)
        days_simulated += 1

        # -- 15. Early stop: threshold breaches --
        threshold_breach = _check_threshold_breaches(state)
        if threshold_breach:
            stopped_early = True
            stop_reason = threshold_breach
            break

        # Starvation check (both sources exhausted)
        if state.stored_food.remaining_calories <= 0 and state.food_supply.total_kcal() <= 0:
            stopped_early = True
            stop_reason = {
                "type": "threshold_breach",
                "trigger": "starvation",
                "detail": "Both stored food and greenhouse food exhausted",
            }
            break

    return {
        "state": state_to_dict(state),
        "daily_logs": daily_logs,
        "days_simulated": days_simulated,
        "stopped_early": stopped_early,
        "stop_reason": stop_reason,
    }
