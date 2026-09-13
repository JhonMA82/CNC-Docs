---
title: Instalación limpia - ISO oficial Debian 12
description: Desde cero, sin sufrir
---

## Opción recomendada 2026

No instales LinuxCNC sobre Ubuntu. Usa la ISO oficial: **LinuxCNC 2.9.4 + Debian 12 Bookworm + PREEMPT_RT**.

Pasos:

1. Descarga ISO de linuxcnc.org/downloads
2. Flashea con BalenaEtcher
3. Instala en PC industrial o mini PC (N100, J4125 mínimo)
4. Primer boot:

```bash
latency-test
# Deja correr 15 min. Si < 50k base thread y < 100k servo thread, vas bien.
```

### Hardware PC para PrintNC

- CPU: Intel N100 o i3 4ta gen+ con Ethernet Intel (no Realtek si puedes evitarlo)
- RAM: 4GB mínimo
- Disco: SSD 120GB
- Ethernet dedicado a Mesa/Remora

:::caution[Evita]
WiFi para control de máquina. Usa cable.
:::

### Estructura de configs

```
/home/tuuser/linuxcnc/configs/
  printnc-mesa/
    printnc.ini
    printnc.hal
    mesa.hal
    spindle.hal
```

Todo tu trabajo vive ahí. Versiona con git.
