Not currently handled:                                                                                    
                                                        
┌────────────────────┬────────────────────────────────────────────────────────────────────────────────┐   
│      Missing       │                                     Notes                                      │ 
├────────────────────┼────────────────────────────────────────────────────────────────────────────────┤   
│ Wind               │ No wind effect on plants or dust direction — dust particles move in fixed      │ 
│                    │ linear paths regardless                                                        │   
├────────────────────┼────────────────────────────────────────────────────────────────────────────────┤   
│ Temperature visual │ No color shift or visual indicator for heat/cold stress on the environment     │
├────────────────────┼────────────────────────────────────────────────────────────────────────────────┤   
│ Specific stress    │ All stress types (drought, overwatering, salinity, etc.) render the same —     │
│ type visuals       │ just the health color change + warning dot. No wilting, yellowing, browning    │   
│                    │ differentiation                                                                │   
├────────────────────┼────────────────────────────────────────────────────────────────────────────────┤
│ Light cycle        │ LightCyclePhase from sensors is unused — the LED grow lights are always on,    │   
│ (day/night)        │ sky doesn't shift for night                                                    │   
├────────────────────┼────────────────────────────────────────────────────────────────────────────────┤
│ Water flow         │ Irrigation pipe is static dashes — no animation to show active watering        │   
├────────────────────┼────────────────────────────────────────────────────────────────────────────────┤   
│ Sensor readings on │ The two sensor nodes on the dome walls always blink green, regardless of       │
│  gauges            │ actual sensor status                                                           │   
└────────────────────┴────────────────────────────────────────────────────────────────────────────────┘