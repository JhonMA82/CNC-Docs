---
title: Remora - La alternativa barata y potente
description: STM32, ESP32 y RP2040 como tarjetas de control por Ethernet/WiFi para LinuxCNC
---

Remora es un firmware que convierte placas baratas (NVEM, EC500, SKR, etc) en tarjetas de movimiento para LinuxCNC por Ethernet o SPI.

### Arquitectura

LinuxCNC (PC) <-Ethernet/UDP-> Placa STM32 (Remora firmware) -> Drivers paso a paso

Ventajas:
- 30-60 USD vs 150-200 USD Mesa
- WiFi con ESP32
- Ideal para PrintNC si tu presupuesto es ajustado

### Placas soportadas 2026

- NVEM v2 (STM32F207) - la clásica
- EC500 (STM32F407)
- MKS SGen L (LPC1768)
- ESP32 (experimental WiFi)

### Instalación

1. Flashea firmware desde https://github.com/scottalford75/Remora
   - NVEM: `Remora-NVEM-STM32-1.0.0.bin` con ST-Link
2. Componente LinuxCNC:

```hal
loadrt Remora-eth-3.0 config="board=NVEM"
# o SPI si usas Raspberry
```

3. Copia config ejemplo `remora-nvem-basic` a tu `linuxcnc/configs/`

:::caution
Remora aún no tiene el mismo determinismo que Mesa a > 50kHz step rate. Para PrintNC a 160 steps/mm y 9000 mm/min = 24kHz, va perfecto.
:::

### PrintNC + Remora

Usa 3 stepgens + 1 PWM para husillo. Cableado idéntico a Mesa, solo cambia el HAL.
