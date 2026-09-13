---
title: 04. Cómo funciona LinuxCNC
description: Arquitectura Interfaz Interprete Motion HAL, archivos INI HAL tool.tbl, tiempo real servo thread base thread y latencia PREEMPT_RT.
---

> Documento esqueleto. Temario cerrado, pendiente de redacción paso a paso.

## Temario

### 4.1 Arquitectura general

- Interfaz → Intérprete G-code → Motion → HAL → Driver → Hardware → Máquina

### 4.2 Componentes principales

- Motion
- HAL
- INI
- GUI
- Drivers
- Realtime

### 4.3 Archivos esenciales

- machine.ini
- machine.hal
- custom.hal
- tool.tbl

### 4.4 Tiempo real explicado de forma sencilla

- Pendiente.

### 4.5 Servo thread

- Pendiente.

### 4.6 Base thread

- Pendiente.

### 4.7 Latencia

- Pendiente.

### 4.8 PREEMPT_RT

- Pendiente.

## Hardware aplicable

- PC con Debian + PREEMPT_RT. Mesa 7i96S y Remora NVEM como ejemplos de driver.

## Próximo paso

- Continuar con [05. Elegir computadora para LinuxCNC](./05-elegir-computadora-linuxcnc).
