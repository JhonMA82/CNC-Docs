---
title: PrintNC v4 - Config base LinuxCNC
description: De la estructura a tu primer corte
---

PrintNC v4: 600x600x300mm típico, SFU1605, Hiwin 20mm, NEMA23 3Nm.

### INI base PrintNC v4 - 7i96S

```ini
[EMC]
MACHINE = PrintNC v4 - 7i96S - 600x600
[AXIS_X]
MAX_VELOCITY = 150
MAX_ACCELERATION = 800
[AXIS_Y]
MAX_VELOCITY = 150
MAX_ACCELERATION = 800
[AXIS_Z]
MAX_VELOCITY = 80
MAX_ACCELERATION = 600
```

Con Remora baja accel 20% por jitter.

### Checklist mecánico antes de LinuxCNC

- Escuadrado <0.05mm en 300mm
- Backlash SFU1605 <0.02mm
- Drivers DM556 a 2.8A, 16 microsteps

Una vez mecánico OK, pasa a `linuxcnc/basico/04-primer-movimiento`
