---
title: 01. Introducción al CNC
description: Qué es una máquina CNC, cómo es el flujo CAD a CAM a G-code y qué tipos de máquinas existen antes de usar LinuxCNC.
---

Una máquina CNC es una máquina-herramienta que se mueve siguiendo instrucciones numéricas. Tú diseñas una pieza en el ordenador, generas una lista de movimientos (G-code) y la máquina los ejecuta con precisión repetible: corta, fresa, graba o suelda siempre igual, sin depender del pulso del operario.

CNC significa *Computer Numerical Control* (control numérico por computadora). "Numérico" porque todo se reduce a números: posiciones, velocidades y estados (encendido/apagado del husillo, por ejemplo).

Por qué importa: es el puente entre el diseño digital y la pieza física. Si vienes del 3D o del diseño, el CNC es el paso que convierte tu archivo en un objeto real de madera, aluminio o acero.

## Cómo funciona, en 5 piezas

Toda CNC, desde una pequeña router hasta una fresadora industrial, tiene lo mismo:

1. **Estructura mecánica:** ejes que se mueven (X, Y, Z y a veces rotativos A/B/C).
2. **Motores y drivers:** convierten pulsos eléctricos en movimiento.
3. **Herramienta:** fresa, láser, antorcha de plasma, cuchilla.
4. **Controlador:** el "cerebro" que interpreta el G-code y genera los movimientos coordinados. Aquí entra LinuxCNC.
5. **Programa (G-code):** la receta con cada movimiento y velocidad.

El flujo de datos siempre es el mismo:

**Diseño CAD** (la geometría) → **CAM** (trayectorias y parámetros) → **G-code** (lista de movimientos) → **Controlador** (p. ej. LinuxCNC) → **Máquina** (ejes + herramienta) → **Pieza real**

Ejemplo mínimo de G-code: un cuadrado de 20 x 20 mm a 600 mm/min, con la herramienta a 1 mm de profundidad:

```gcode
G21          (unidades en milímetros)
G90          (posiciones absolutas: cada X/Y es respecto al cero de pieza)
G1 Z5 F300   (sube a Z=5 seguro, a 300 mm/min)
G0 X0 Y0     (viaje rápido al origen de la pieza)
G1 Z-1 F100  (baja a profundidad de corte, despacio)
G1 X20 F600  (corta el lado 1 a 600 mm/min)
G1 Y20       (lado 2, mantiene el mismo feed)
G1 X0        (lado 3)
G1 Y0        (lado 4, cierra el cuadrado)
G0 Z5        (retrae a altura segura)
M2           (fin del programa)
```

No necesitas memorizarlo ahora. Quédate con la idea: el G-code no es más que "ve a esta posición, a esta velocidad, con la herramienta en este estado".

## Flujo completo de trabajo

1. **Diseño CAD:** dibujas la pieza (2D para corte/plasma/láser, 3D para fresado). Herramientas abiertas: FreeCAD, LibreCAD, Inkscape.
2. **CAM:** defines con qué herramienta, a qué velocidad y en qué orden se corta. Eliges fresa, pasadas, profundidad y `feed rate`.
3. **Generación de G-code:** el CAM (o su postprocesador) escribe el archivo `.ngc` / `.nc`.
4. **Controlador CNC:** LinuxCNC, grblHAL o FluidNC leen el G-code y mueven los ejes de forma coordinada.
5. **Puesta a punto en máquina:** sujetas el material (*workholding*), defines el cero de pieza, compruebas alturas seguras.
6. **Ejecución:** la máquina corta. Tu trabajo es vigilar, ajustar el *feed override* si algo suena mal y parar si hace falta.

Si algo sale mal, el fallo casi siempre está en uno de estos seis puntos, en ese orden: mal cero de pieza, mal *workholding*, mal parámetro de corte, mal G-code, mal controlador, mal mecánico. Memoriza ese orden: te servirá para diagnosticar.

## Tipos de máquinas

| Máquina | Qué hace | Material típico | Ejemplo de trabajo |
|---|---|---|---|
| **Router CNC** | Fresa con husillo rápido | Madera, plástico, aluminio fino | Muebles, carteles, piezas PrintNC |
| **Fresadora / mill** | Fresa con estructura rígida | Aluminio, acero | Piezas mecánicas precisas |
| **Plasma** | Corta con arco de plasma | Chapa de acero | Soportes, bridas, estructuras |
| **Láser** | Corta/graba con haz | Contrachapado, acrílico, chapa fina | Grabado, maquetas, chapa |
| **Torno** | La pieza gira, la herramienta corta | Barras de metal/plástico | Ejes, roscas, casquillos |

La PrintNC v4, nuestra máquina de referencia en esta documentación, es un **router CNC rígido**: sirve sobre todo para madera y aluminio, y es la base de los ejemplos de configuración que verás más adelante.

## Qué hace LinuxCNC (y qué no)

LinuxCNC es el controlador: lee el G-code y genera los pulsos de movimiento en tiempo real.

- **Qué problema resuelve:** coordinar varios ejes con precisión de micras y responder a sensores (`home`, límites, sonda) sin saltarse pasos.
- **Qué controla:** motores (vía Mesa, puerto paralelo o Remora), husillo/VFD, relés, sensores, botones y paradas de emergencia.
- **Qué no hace:** no diseña (eso es CAD) ni genera trayectorias (eso es CAM). Necesita un PC con Linux y una interfaz de movimiento.
- **Cuándo conviene:** cuando quieres una máquina seria, ampliable y sin ataduras: 3-5 ejes, cambio de herramienta, THC de plasma, cinemáticas especiales.
- **Limitación honesta:** exige más aprendizaje inicial que un GRBL enchufar-y-usar. Esta serie básica existe justo para acortar esa curva.

Dónde entra en el flujo: LinuxCNC vive entre el G-code y la máquina. Todo lo anterior (CAD/CAM) es igual uses LinuxCNC, grblHAL o FluidNC.

## Errores frecuentes al empezar

- **Pensar que el controlador compensa un mal diseño.** Si el CAD está mal o el CAM pide pasadas imposibles, ningún controlador lo salva.
- **Confundir CNC con impresora 3D.** La impresora añade material; la CNC arranca material con esfuerzos de corte mucho mayores. El *workholding* y la rigidez mandan.
- **Comprar electrónica antes de definir la máquina.** Primero decide proceso (router/fresadora/plasma) y tamaño; la electrónica se elige después.
- **Saltarse la seguridad.** Una CNC puede romper fresas, lanzar fragmentos y enredar ropa. E-stop funcional y gafas desde el día uno.

## Hardware aplicable

- Ninguno específico en este capítulo. Referencia general: PrintNC v4 como ejemplo de router CNC (veremos sus componentes concretos en el capítulo 02).

## Próximo paso

- Continuar con [02. Anatomía de una CNC](./02-anatomia-cnc): ejes, husillos, motores, drivers, husillo/VFD y sensores, con la PrintNC v4 como ejemplo.
