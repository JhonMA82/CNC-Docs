---
title: HAL intermedio - halshow, halscope y lógica
description: Debugging como profesional
---

HAL no es magia. Son pines, señales y componentes.

### Herramientas

- `halshow`: ver árbol
- `halscope`: osciloscopio
- `halmeter`: multímetro de una señal

### Ejemplo: Lógica de habilitación PrintNC

```hal
# Componente AND para habilitación de drivers solo si no hay e-stop y está habilitado
loadrt and2 count=1
addf and2.0 servo-thread

net machine-on <= halui.machine.is-on
net all-homed <= halui.joint.0.is-homed AND joint.1 AND joint.2
# Solo habilita si máquina ON
net machine-on => and2.0.in0
net estop-ok => and2.0.in1
net drivers-enable <= and2.0.out
net drivers-enable => hm2_7i96s.0.stepgen.00.enable
net drivers-enable => hm2_7i96s.0.stepgen.01.enable
net drivers-enable => hm2_7i96s.0.stepgen.02.enable
```

### Para 5 ejes

Usa `mux` y `or2` para gestionar cambios de kinematics.
