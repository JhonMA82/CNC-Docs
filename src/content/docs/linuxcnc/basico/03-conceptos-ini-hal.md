---
title: INI y HAL - Entenderlo de una vez
description: Los dos archivos que definen tu máquina
---

## INI - Tu máquina en números

```ini
[EMC]
MACHINE = PrintNC v4 - Mesa 7i96S
VERSION = 1.0

[DISPLAY]
DISPLAY = axis
CYCLE_TIME = 0.1

[TRAJ]
AXES = 3
COORDINATES = X Y Z
LINEAR_UNITS = mm
MAX_LINEAR_VELOCITY = 150 ; mm/s -> 9000 mm/min

[JOINT_0]
TYPE = LINEAR
MAX_VELOCITY = 150
MAX_ACCELERATION = 1000 ; mm/s^2
STEPGEN_MAXACCEL = 1250 ; 25% más que MAX_ACCEL
SCALE = 160 ; pasos por mm -> 200*8/10 si tornillo 10mm y 1/8 microstep
MIN_LIMIT = -300
MAX_LIMIT = 300
HOME = 0
HOME_OFFSET = 0
HOME_SEARCH_VEL = -20
HOME_LATCH_VEL = -2
HOME_FINAL_VEL = 20
```

**Regla de oro:** `STEPGEN_MAXACCEL` siempre mayor que `MAX_ACCELERATION`.

## HAL - Cables virtuales

```hal
# Cargar driver Mesa - esto lo genera MesaCT, pero debes entenderlo
loadrt hm2_eth board_ip="10.10.10.10" config="num_encoders=0 num_pwmgens=0 num_stepgens=5"

# Conexión típica: señal de habilitación -> pin físico
net x-enable => hm2_7i96s.0.stepgen.00.enable
net x-enable <= joint.0.amp-enable-out

# E-Stop
net estop-loop <= hm2_7i96s.0.inm.00.input-00-not
net estop-loop => iocontrol.0.emc-enable-in
```

Usa `halshow` para ver todo en vivo. Es tu osciloscopio.
