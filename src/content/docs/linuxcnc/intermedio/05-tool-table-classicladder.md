---
title: Tabla de herramientas y PLC con ClassicLadder
description: ATC y lógica de taller
---

### Tool Table

`tool.tbl`:

```
T1 P1 Z-10.2 D6 ; fresa 6mm
T2 P2 Z-25.0 D3 ; grabado
```

En INI:

```ini
[EMCIO]
TOOL_TABLE = tool.tbl
```

### ClassicLadder - para lógica de enclavamientos

Ejemplo: no arrancar husillo si puertas abiertas.

Ladder:

```
|--[ ] puerta_cerrada --[ ] estop_ok --( ) spindle_permit --|
```

En HAL:

```hal
loadrt classicladder_rt
addf classicladder.0.refresh servo-thread
net door-closed <= hm2_7i96s.0.inm.00.input-08
net door-closed => classicladder.0.in-00
net spindle-permit <= classicladder.0.out-00
net spindle-permit => spindle.0.inhibit-not
```
