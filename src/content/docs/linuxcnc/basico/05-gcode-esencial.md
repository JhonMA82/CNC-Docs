---
title: G-code esencial para taller
description: Lo que realmente usas
---

No necesitas memorizar 200 códigos. Con 15 haces el 95%.

```gcode
G21 G40 G49 G54 G80 G90 G94 ; linea de seguridad
G0 X0 Y0 Z20 ; rápido a inicio
M3 S12000 ; husillo CW
G1 Z-2 F300 ; penetra
G1 X100 F1500 ; corte
G0 Z20
M5 ; para husillo
M30 ; fin
```

### Sistemas de coordenadas

- `G53` máquina
- `G54-G59.3` piezas. Usa G54 siempre.
- `G92` evítalo, usa `G10 L20`

### Para Router/Plasma/Láser

- Router: `M3 Sxxx` + `G1 F`
- Plasma: `M3` + THC via `motion.digital-out`
- Láser: `M67 E3 Qxxx` para PWM
