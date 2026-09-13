---
title: GladeVCP - Paneles custom para tu máquina
description: Botones de cambio de herramienta, macros
---

GladeVCP te deja hacer tu propio Gmoccapy.

1. Diseña en Glade: botón `HAL Button`
2. En INI:

```ini
[DISPLAY]
GLADEVCP = -u handler.py panel.ui
```

3. `handler.py`:

```python
def on_btn_tool_measure_clicked(widget):
    c.mdi("G38.2 Z-50 F100")
```

Ideal para macros de PrintNC: medir herramienta, estacionar, aspiradora.
