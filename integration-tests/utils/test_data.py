"""Test data builders for integration tests."""

from typing import Dict, List, Any, Optional


def build_init_request(
    seed: int = 42,
    crop_assignments: Optional[Dict[int, str]] = None
) -> Dict[str, Any]:
    """
    Build request payload for POST /simulate/init.

    Args:
        seed: Random seed for deterministic simulation
        crop_assignments: Optional dict mapping slot_id to crop_type

    Returns:
        Request payload dict
    """
    payload = {
        "seed": seed
    }
    if crop_assignments:
        payload["crop_assignments"] = crop_assignments
    return payload


def build_tick_request(
    state: Dict[str, Any],
    days: int = 30,
    actions: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Build request payload for POST /simulate/tick.

    Args:
        state: Current greenhouse state from previous tick or init
        days: Number of days to simulate
        actions: List of agent actions to apply

    Returns:
        Request payload dict
    """
    payload = {
        "state": state,
        "days": days,
        "actions": actions or []
    }
    return payload


def build_inject_event_request(
    state: Dict[str, Any],
    event_type: str,
    severity: str = "medium"
) -> Dict[str, Any]:
    """
    Build request payload for POST /simulate/inject-event.

    Args:
        state: Current greenhouse state
        event_type: Event type (e.g., "water_recycling_degradation")
        severity: Event severity ("low", "medium", "high")

    Returns:
        Request payload dict
    """
    return {
        "state": state,
        "event_type": event_type,
        "severity": severity
    }


def build_set_crop_action(slot_id: int, crop_type: str) -> Dict[str, Any]:
    """
    Build set_crop action.

    Args:
        slot_id: Slot ID (0-15)
        crop_type: Crop type name

    Returns:
        Action dict
    """
    return {
        "type": "set_crop",
        "slot_id": slot_id,
        "crop_type": crop_type
    }


def build_plant_action(slot_id: int) -> Dict[str, Any]:
    """
    Build plant action (adds one crop to slot if space available).

    Args:
        slot_id: Slot ID (0-15)

    Returns:
        Action dict
    """
    return {
        "type": "plant",
        "slot_id": slot_id
    }


def build_remove_action(slot_id: int, crop_id: int) -> Dict[str, Any]:
    """
    Build remove action (removes specific crop from slot).

    Args:
        slot_id: Slot ID (0-15)
        crop_id: Crop ID to remove

    Returns:
        Action dict
    """
    return {
        "type": "remove",
        "slot_id": slot_id,
        "crop_id": crop_id
    }


def build_water_adjust_action(
    slot_id: int,
    multiplier: float
) -> Dict[str, Any]:
    """
    Build water_adjust action.

    Args:
        slot_id: Slot ID (0-15)
        multiplier: Water multiplier (0.0 - 1.5)

    Returns:
        Action dict
    """
    return {
        "type": "water_adjust",
        "slot_id": slot_id,
        "multiplier": multiplier
    }


def build_light_toggle_action(
    slot_id: int,
    enabled: bool
) -> Dict[str, Any]:
    """
    Build light_toggle action.

    Args:
        slot_id: Slot ID (0-15)
        enabled: True to enable artificial lighting, False to disable

    Returns:
        Action dict
    """
    return {
        "type": "light_toggle",
        "slot_id": slot_id,
        "enabled": enabled
    }


def build_set_temperature_action(temperature: float) -> Dict[str, Any]:
    """
    Build set_temperature action (affects whole greenhouse).

    Args:
        temperature: Target temperature in Celsius

    Returns:
        Action dict
    """
    return {
        "type": "set_temperature",
        "temperature": temperature
    }


def build_training_run_request(
    seed: int = 42,
    crop_assignments: Optional[Dict[int, str]] = None,
    inject_events: Optional[List[Dict[str, Any]]] = None,
    max_days: int = 450
) -> Dict[str, Any]:
    """
    Build request payload for POST /api/training/run.

    Args:
        seed: Random seed
        crop_assignments: Initial crop assignments
        inject_events: Events to inject at specific days
        max_days: Maximum simulation days

    Returns:
        Request payload dict
    """
    payload = {
        "seed": seed,
        "max_days": max_days
    }
    if crop_assignments:
        payload["crop_assignments"] = crop_assignments
    if inject_events:
        payload["inject_events"] = inject_events
    return payload


def build_default_crop_assignments() -> Dict[int, str]:
    """
    Build default crop assignments for testing (balanced mix).

    Returns:
        Dict mapping slot_id (0-15) to crop_type
    """
    # Balanced mix: 4 potato, 4 lettuce, 4 beans, 2 radish, 2 herbs
    assignments = {}
    slot = 0

    # Potatoes (high calorie)
    for _ in range(4):
        assignments[slot] = "potato"
        slot += 1

    # Lettuce (fast cycle)
    for _ in range(4):
        assignments[slot] = "lettuce"
        slot += 1

    # Beans (protein)
    for _ in range(4):
        assignments[slot] = "beans"
        slot += 1

    # Radish (very fast)
    for _ in range(2):
        assignments[slot] = "radish"
        slot += 1

    # Herbs (variety)
    for _ in range(2):
        assignments[slot] = "herbs"
        slot += 1

    return assignments


def build_extreme_crop_assignments(crop_type: str) -> Dict[int, str]:
    """
    Build crop assignments with only one crop type (extreme scenario).

    Args:
        crop_type: Crop type to assign to all slots

    Returns:
        Dict mapping all slots to same crop_type
    """
    return {slot_id: crop_type for slot_id in range(16)}


def build_bridge_import_payload(
    simulation_result: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Build request payload for POST /api/bridge/import-result.

    Args:
        simulation_result: Complete simulation result from backend

    Returns:
        Request payload dict
    """
    return {
        "simulation_result": simulation_result
    }
