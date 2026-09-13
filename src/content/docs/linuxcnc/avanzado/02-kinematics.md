---
title: Kinematics - De 3 a 5 ejes
description: trivkins, 5axiskins y custom
---

Por defecto PrintNC usa `trivkins` (1 joint = 1 axis).

Para 5 ejes (ej. cabeza BC):

```ini
[KINS]
KINEMATICS = 5axiskins
JOINTS = 5

[TRAJ]
COORDINATES = X Y Z B C
```

### Kinematics custom para PrintNC con 4to eje rotativo

Crea tu `.c` con `kins` y compílalo. LinuxCNC soporta kinematics en HAL con `genhexkins` para Stewart, etc.

Tip: empieza con `XYZBC` y usa `switchkins` para cambiar entre modo router y 5 ejes.
