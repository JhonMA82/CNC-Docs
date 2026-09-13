---
title: PID y Tuning de servos
description: Cuando pasas de steppers a servos
---

Si usas PrintNC con servos JMC o DMM:

```ini
[JOINT_0]
TYPE = LINEAR
MAX_VELOCITY = 250
MAX_ACCELERATION = 2000
P = 10
I = 0.1
D = 0.05
FF0 = 0
FF1 = 1 ; feedforward velocidad
FF2 = 0.001 ; accel
```

### Método de tuning

1. P=0, I=0, D=0
2. Sube P hasta oscilar, baja 30%
3. Sube D para frenar oscilación
4. I solo para error estático

Usa `halscope` para ver `f-error`.
