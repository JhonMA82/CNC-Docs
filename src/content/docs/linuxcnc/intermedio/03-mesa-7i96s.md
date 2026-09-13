---
title: Mesa 7i96S a fondo - Wiring real
description: Ejemplo completo para PrintNC
---

Mesa 7i96S: FPGA por Ethernet, 5 stepgens, 11 entradas aisladas, 6 salidas, 1 encoder, RS485.

### Cableado base PrintNC

- TB3: Step/Dir X Y Z (0-2)
- Inputs 0-3: E-Stop, Home X Y Z
- SSR 0: Husillo enable
- RS485: VFD Huanyang

### mesa.hal comentado línea por línea

```hal
# Cargar driver Ethernet - IP por defecto 10.10.10.10
loadrt hm2_eth board_ip="10.10.10.10" config="num_encoders=1 num_stepgens=5 sserial_port_0=0xxx"

# Threads - lee/escibe cada 1ms
addf hm2_7i96s.0.read servo-thread
addf hm2_7i96s.0.write servo-thread

# Stepgen: velocidad y posición desde joint
setp hm2_7i96s.0.stepgen.00.dirsetup 100
setp hm2_7i96s.0.stepgen.00.dirhold 100
setp hm2_7i96s.0.stepgen.00.steplen 1000
setp hm2_7i96s.0.stepgen.00.stepspace 1000
# 1000ns = 1us, suficiente para DM556/DM860

net x-pos-cmd <= joint.0.motor-pos-cmd
net x-pos-cmd => hm2_7i96s.0.stepgen.00.position-cmd
net x-pos-fb <= hm2_7i96s.0.stepgen.00.position-fb
net x-pos-fb => joint.0.motor-pos-fb

# Encoder de husillo para roscado rígido
net spindle-index <= hm2_7i96s.0.encoder.00.index-enable
net spindle-pos <= hm2_7i96s.0.encoder.00.position
net spindle-pos => spindle.0.revs
net spindle-index => spindle.0.index-enable
```

Descarga el firmware desde mesaflash: `mesaflash --device 7i96s --addr 10.10.10.10 --write 7i96s_d.bit`
