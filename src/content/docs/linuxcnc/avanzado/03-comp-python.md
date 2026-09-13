---
title: Crear componentes - comp y Python
description: Extiende LinuxCNC sin tocar C++
---

### comp - generador HAL en C

Archivo `my_plasma.comp`:

```
component my_plasma "filtro THC";
pin in float arc-voltage;
pin in bit arc-ok;
pin out float offset;
function _;
license "GPL";
;;
#include <math.h>
FUNCTION(_) {
  if (!arc_ok) { offset = 0; return; }
  offset = (arc_voltage - 120) * 0.1;
}
```

Compila: `comp --install my_plasma.comp`

### Python - userspace

```python
import hal
h = hal.component("printnc-probe")
h.newpin("probe-in", hal.HAL_BIT, hal.HAL_IN)
h.newpin("result", hal.HAL_FLOAT, hal.HAL_OUT)
h.ready()
while True:
  if h['probe-in']:
    h['result'] = 1
```

En HAL: `loadusr -W python3 probe.py`
