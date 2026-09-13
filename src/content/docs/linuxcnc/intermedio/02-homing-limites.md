---
title: Homing y límites - Que no rompa la máquina
description: Home search, index, y soft limits
---

PrintNC v4 usa switches inductivos. Configuración típica:

```ini
[JOINT_0]
HOME = 0
HOME_OFFSET = -2.5 ; te alejas 2.5mm del switch
HOME_SEARCH_VEL = 25 ; rápido hacia el switch
HOME_LATCH_VEL = -2 ; lento de vuelta para precisión
HOME_FINAL_VEL = 10
HOME_USE_INDEX = NO ; pon YES si usas encoder con Z index
HOME_IGNORE_LIMITS = YES
HOME_SEQUENCE = 2 ; Z primero, luego X Y
```

### Secuencia recomendada PrintNC

- Z = 0 (sube primero para no chocar)
- X Y = 1 o 2 (después)

Soft limits:

```ini
MIN_LIMIT = -600
MAX_LIMIT = 600
# deja 2mm de margen respecto a switch físico
```

En HAL:

```hal
net home-x <= hm2_7i96s.0.inm.00.input-02
net home-x => joint.0.home-sw-in
net min-x <= hm2_7i96s.0.inm.00.input-02-not
net min-x => joint.0.neg-lim-sw-in
```
