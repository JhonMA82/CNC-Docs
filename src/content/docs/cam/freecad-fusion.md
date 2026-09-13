---
title: CAM - FreeCAD y Fusion 360
description: Flujo para Router, Plasma y Láser
---

### FreeCAD Path (100% libre)

1. Modela en Part Design
2. Workbench Path
3. Job -> usa post `linuxcnc` o `grbl` (ambos G-code compatible)
4. Herramientas desde tool.tbl de LinuxCNC

### Fusion 360

Usa post oficial `linuxcnc.cps` (no fanuc).

- Router: `M3 S` + `G1/G2`
- Plasma: usa post `linuxcnc_plasma.cps` con `M3` y `M62 P0` para THC
- Láser: post `linuxcnc_laser` con `M67`

### Tip PrintNC

En Fusion, define tu máquina con límites reales. Así simulas colisiones antes de postprocesar.
