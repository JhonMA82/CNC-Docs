---
title: Primer movimiento - MesaCT y tu PrintNC
description: De la nada a jogear los 3 ejes
---

## Flujo con MesaCT (2026)

MesaCT es el sucesor de Pncconf.

1. `mesact` en terminal
2. Board: 7i96S, IP 10.10.10.10, Firmware: 7i96s_d.bit
3. Configura ejes X Y Z:
   - Drive: Step/Dir
   - Scale: calcula con tu tornillo
   - 160 steps/mm para SFU1605 con 1/8 microstep es típico

Genera config. Te crea `printnc.ini` y `main.hal`.

### Primer arranque

```bash
linuxcnc ~/linuxcnc/configs/printnc-mesa/printnc.ini
```

Si todo bien, quita E-Stop, habilita y joguea 1mm.

**Checklist de falla:**
- No conecta Mesa: ping 10.10.10.10, revisa firewall
- Joint following error: escala mal calculada o accel muy alta
- No se mueve: `amp-enable` no conectado
