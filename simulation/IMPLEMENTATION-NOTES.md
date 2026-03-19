# Implementation Notes — Zone Plan Rounding

> Claude Code: read this alongside SETUP.md. This addresses the crop rounding problem in zone filling.

## The problem

Zone plans use percentage allocations, but crops have fixed footprints. You can't plant half a potato.

Example: Zone 1, 15 m², plan = `{"potato": 0.6, "beans_peas": 0.4}`
- 60% of 15 = 9 m² target for potatoes. Potato = 2.0 m² each → 4 plantings = 8 m² (1 m² short of target)
- 40% of 15 = 6 m² target for beans. Beans = 1.5 m² each → 4 plantings = 6 m² (exact)
- Total: 14 m² used, 1 m² wasted

This mainly hits large-footprint crops (potato 2.0 m², beans 1.5 m²). Small crops (lettuce 0.5 m², radish 0.5 m², herbs 0.3 m²) pack tighter and waste less.

## The solution: two-pass fill

```python
def fill_zone(zone: Zone, day: int, rng: random.Random) -> list[Crop]:
    """Fill empty area according to zone plan. Two-pass to minimize wasted space."""
    if not zone.crop_plan:
        return []
    
    new_crops = []
    
    # Pass 1: fill each type up to its target area (rounds DOWN naturally)
    for crop_type, fraction in zone.crop_plan.items():
        target_area = zone.area_m2 * fraction
        current_area = sum(c.footprint_m2 for c in zone.crops if c.type == crop_type)
        footprint = CROP_FOOTPRINT[crop_type]
        
        while current_area + footprint <= target_area and zone.available_area() >= footprint:
            crop = create_crop(crop_type, zone.id, day, rng)
            zone.crops.append(crop)
            new_crops.append(crop)
            current_area += footprint
    
    # Pass 2: fill remaining space with whichever plan crop has the biggest
    # deficit from its target percentage (greedy, best-effort)
    while zone.available_area() > 0:
        best_type = None
        best_deficit = -1.0
        
        for crop_type, fraction in zone.crop_plan.items():
            footprint = CROP_FOOTPRINT[crop_type]
            if footprint > zone.available_area():
                continue  # doesn't fit
            actual_fraction = sum(c.footprint_m2 for c in zone.crops if c.type == crop_type) / zone.area_m2
            deficit = fraction - actual_fraction
            if deficit > best_deficit:
                best_deficit = deficit
                best_type = crop_type
        
        if best_type is None:
            break  # nothing fits in remaining space
        
        crop = create_crop(best_type, zone.id, day, rng)
        zone.crops.append(crop)
        new_crops.append(crop)
    
    return new_crops
```

## What this produces for common configurations

| Zone plan | Pass 1 result | Pass 2 | Total used | Wasted |
|-----------|--------------|--------|------------|--------|
| 100% potato | 7 × 2.0 = 14 m² | nothing fits (2.0 > 1.0) | 14 m² | 1 m² |
| 100% beans | 10 × 1.5 = 15 m² | — | 15 m² | 0 |
| 100% lettuce | 30 × 0.5 = 15 m² | — | 15 m² | 0 |
| 60% potato / 40% beans | 4 potato (8) + 4 beans (6) = 14 | nothing fits | 14 m² | 1 m² |
| 50% potato / 50% beans | 3 potato (6) + 5 beans (7.5) = 13.5 | +1 bean (1.5) | 15 m² | 0 |
| 50% lettuce / 30% radish / 20% herbs | 15 lettuce (7.5) + 9 radish (4.5) + 10 herbs (3.0) | — | 15 m² | 0 |

Some wasted space with large crops is a physical constraint, not a bug. The agent can optimize by choosing plans that pack well.

## Auto-replant rounding

When auto-replanting after harvest, always replant the same crop type that was just harvested (it fits in the same spot since it has the same footprint). No rounding issue here — the spot is exactly the right size.

The rounding issue only occurs during initial fill or when the zone plan changes. Specifically: when the plan changes, existing crops keep growing to completion. As they harvest out, auto-replant uses the NEW plan's ratios. Over time, the zone converges toward the new plan's allocation, but it takes a full crop cycle to transition.
