---
title: Mesa 7i96S / 7i76E - Guía definitiva
description: Wiring, firmware y configs listas para PrintNC
---

## Por qué Mesa

Mesa es FPGA: pasos a 10MHz sin jitter, encoder hardware, Ethernet aislado.

### Modelos 2026 recomendados

- **7i96S:** 5 ejes step/dir, barato, ideal PrintNC 3 ejes + 2 extra
- **7i76E + 7i85S:** 5 ejes + 2 encoders + sserial para servos

### IP y Flasheo

```bash
sudo ip addr add 10.10.10.1/24 dev eth0
ping 10.10.10.10
mesaflash --device 7i96s --addr 10.10.10.10 --readhmid
```

Descarga firmwares de mesa.no-ip.com

### Config completa PrintNC en repo

Mira `/configs/printnc-mesa/` en el repo de ejemplos. Incluye:
- `main.hal` con todos los nets
- `spindle.hal` con Modbus
- `estop.hal` con lógica de seguridad
