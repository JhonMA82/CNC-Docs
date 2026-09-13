---
title: Husillo, Plasma THC y Láser
description: Un solo HAL para 3 procesos
---

### Router - Husillo VFD via RS485/Modbus

Usa componente `hy_vfd` o `mb2hal`.

```hal
loadusr -W mb2hal config=mb2hal.ini
net spindle-cmd <= spindle.0.speed-out
net spindle-cmd => mb2hal.00.cmd
net spindle-on <= spindle.0.on
net spindle-on => mb2hal.00.enable
```

### Plasma - THC con componente thc

```hal
loadrt thcud
addf thcud.0 servo-thread
net arc-ok <= hm2_7i96s.0.inm.00.input-05
net arc-ok => thcud.0.arc-ok
net thc-up <= hm2_7i96s.0.inm.00.input-06
net thc-down <= hm2_7i96s.0.inm.00.input-07
# THC controla Z via offset
net thc-offset <= thcud.0.offset
net thc-offset => axis.z.eoffset
```

### Láser - PWM

```hal
net laser-power <= motion.analog-out-03
net laser-power => hm2_7i96s.0.pwmgen.00.value
# M67 E3 Q0-1 controla analog-out-03
```

En G-code láser: `M67 E3 Q0.5` = 50% power
