---
title: Introducción al proyecto
description: Por qué existe CNC Docs y cómo está organizado
---

## Objetivo

**CNC Docs** es la base de conocimiento que me hubiera gustado tener cuando empecé con la PrintNC v4. 

LinuxCNC tiene una documentación excelente en inglés, pero dispersa, técnica y sin un camino claro de 0 a 100. Aquí lo reescribimos todo en español natural, con mentalidad de taller.

### Principios

- **Práctico primero:** cada concepto viene con un ejemplo real que puedes cargar.
- **PrintNC primero, pero universal:** todos los ejemplos están probados en PrintNC v4 con Mesa 7i96S, pero con notas para adaptar a Router, Plasma, Láser y 5 ejes.
- **Hardware moderno:** Mesa (FPGA por Ethernet) y Remora (microcontroladores baratos con Ethernet/WiFi) como protagonistas. Nada de puerto paralelo salvo mención histórica.
- **Listo para IA:** Todo el contenido sigue el schema de Starlight para que un harness (DeepSeek) pueda editarlo sin romper el build.

### Estructura

```
linuxcnc/basico      -> 0 a tu primer movimiento
linuxcnc/intermedio  -> máquina usable y fiable
linuxcnc/avanzado    -> máquina profesional y custom
hardware/            -> Mesa, Remora, PrintNC
cam/                 -> FreeCAD Path + Fusion 360
glosario/            -> multilingüe
```

Cada página tiene al final `Hardware aplicable` y `Para tu PrintNC`.
