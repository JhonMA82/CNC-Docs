---
title: 03. Conceptos esenciales de CNC
description: Ejes y articulaciones, cero máquina y cero pieza, homing, límites, feed rate, velocidad de husillo, overrides y offsets explicados simple.
---

Este capítulo reúne las palabras que vas a ver en cada pantalla de LinuxCNC y en cada programa. Domínalas una vez y todo lo demás (configurar, calibrar, producir) se vuelve legible.

## Axis vs joint, sin enredo

- **Axis (eje):** la dirección del movimiento en la pieza. X, Y, Z son ejes.
- **Joint (articulación):** cada motor o actuador físico que mueve la máquina.

En una router cartesiana normal (como la PrintNC), cada motor mueve un eje y coinciden uno a uno: joint 0 = X, joint 1 = Y, joint 2 = Z. La distinción solo se vuelve importante en máquinas con cinemáticas raras (brazos, deltas, cabezales basculantes), donde varios motores colaboran para mover un mismo eje. Por ahora: si tu máquina es cartesiana, eje y motor van de la mano.

## Cero máquina y coordenadas de máquina

El **cero máquina** es la referencia fija de la máquina, definida por los sensores de home. Las **coordenadas de máquina** se miden desde ahí y siempre son las mismas: apagas, enciendes, haces home y la máquina vuelve a saber dónde está.

Piensa en el cero máquina como la esquina de tu taller: no se mueve nunca.

## Cero pieza y coordenadas de trabajo

El **cero pieza** lo defines tú sobre el material: normalmente una esquina superior o el centro. Las **coordenadas de trabajo** se miden desde ese punto, así el mismo programa sirve en cualquier posición de la mesa.

Ejemplo: quieres fresar el cuadrado del capítulo 01 en una tabla apoyada en X=100, Y=50 de la máquina. Defines el cero pieza en esa esquina y el programa usa coordenadas cómodas (0 a 20), sin importar dónde esté la tabla.

Los sistemas de coordenadas de trabajo se llaman **G54 a G59** (seis disponibles). G54 es el de todos los días; los demás sirven cuando sujetas varias piezas a la vez, cada una con su cero.

```txt
G54          (usa el cero pieza nº 1)
G0 X0 Y0     (viaje rápido al cero de la pieza)
```

## Homing: lo primero de cada encendido

El **homing** es la rutina que lleva cada eje a su sensor de home y fija el cero máquina. Sin homing, la máquina no sabe dónde está: moverla así es trabajar a ciegas.

Orden de cada sesión:

1. Encender control y quitar E-stop.
2. **Home en todos los ejes** (en LinuxCNC, botón de home por eje o home-all).
3. Montar material y definir el cero pieza (G54).
4. Cargar programa y comprobar alturas seguras.
5. Ejecutar.

Si algo se comporta raro (movimientos descentrados, límites que saltan sin motivo), lo primero que se comprueba es: ¿se hizo home después de encender?

## Límites físicos y soft limits

- **Límites físicos:** interruptores o sensores al final del recorrido que paran el eje antes del golpe. Última red de seguridad.
- **Soft limits:** topes por software. LinuxCNC se niega a mover un eje más allá del recorrido que configuraste, sin necesidad de tocar el sensor físico.

Los soft limits solo funcionan **después** del homing (sin cero máquina no saben dónde están). Regla: home primero, soft limits siempre activos, sensores físicos como respaldo.

## Feed rate: la velocidad de corte

El **feed rate** es la velocidad a la que la herramienta avanza cortando, en mm/min. Se programa con **F**:

```txt
G1 X20 F600   (corta hasta X=20 a 600 mm/min)
G1 Y20        (sigue a 600, el F se mantiene hasta cambiarlo)
```

Demasiado rápido: fresa que sufre, mal acabado, riesgo de rotura. Demasiado lento: la fresa roza en vez de cortar, se calienta y se desafila. El punto justo depende de material, fresa y rigidez; lo afinarás en el capítulo de parámetros de corte. Mientras tanto: ante la duda, más despacio.

Viajes sin cortar usan **G0** (rápido de posicionamiento) y cortes usan **G1** (recta a un feed dado). No se corta nunca en G0.

## Velocidad de husillo

La velocidad del husillo se programa en RPM con **S**, y se arranca/para con **M3/M4/M5**:

```txt
S18000 M3   (husillo a 18000 RPM, giro horario)
G1 X20 F600 (corta)
M5          (para el husillo)
```

M3 es giro horario (lo normal en fresado), M4 antihorario (roscados o casos especiales), M5 parada. Como el feed, la RPM ideal depende del diámetro de herramienta y el material: a más diámetro, menos RPM para la misma velocidad de corte.

## Overrides: el mando en directo

Los **overrides** son los potenciómetros de la pantalla que ajustan en vivo, en porcentaje:

- **Feed override:** 100 % = lo programado; baja al 50 % si el corte suena forzado.
- **Spindle override:** ajusta RPM sobre la marcha.
- **Rapid override:** limita la velocidad de los G0 (útil al probar un programa nuevo).

Son tu red de seguridad en el primer corte: programa nuevo siempre se prueba con rapid bajo y el dedo cerca del feed override.

## Herramientas y offsets

Cada fresa tiene distinta longitud y diámetro. Los **offsets** le dicen al control cuánto compensar:

- **Tool length offset:** compensa el largo de cada herramienta, para que Z=0 sea la punta real esté la fresa que esté. Se mide con **tool setter** o palpando.
- **Tool diameter offset:** compensa el radio en contornos (el CAM suele calcularlo ya).

Sin offsets, cambiar de fresa a mitad de trabajo desplaza todas las profundidades. Con ellos, cambias herramienta, mides, y el programa sigue igual.

## Todo junto en un programa corto

```txt
G21 G90 G54       (mm, absolutas, cero pieza nº 1)
S18000 M3         (husillo a 18000 RPM)
G0 X0 Y0          (viaje al cero de pieza)
G0 Z5             (bajada rápida a altura segura)
G1 Z-1 F100       (entrada en material, despacio)
G1 X20 F600       (corte)
G1 Y20
G1 X0
G1 Y0
G0 Z5             (retrae)
M5                (para husillo)
M2                (fin)
```

Cada línea usa un concepto del capítulo. Si lo lees de corrido sin trabarte, estás listo para lo siguiente.

## Errores frecuentes

- **Mover ejes sin hacer home.** Todo lo que sigue (soft limits, ceros, programa) queda desplazado.
- **Confundir cero máquina con cero pieza.** El primero lo pone la máquina con sensores; el segundo lo pones tú en cada montaje.
- **Cortar en G0.** G0 es para viajar en vacío; el corte siempre en G1 con su F.
- **Olvidar que F y S se mantienen.** Una vez programados, siguen vigentes hasta que los cambies: revisa el inicio de cada programa.
- **Probar programa nuevo al 100 %.** Rapid override bajo y feed a mano la primera vez.

## Hardware aplicable

- PrintNC v4 genérica. Los ejemplos usan recorridos 600 x 600 x 300 mm; los conceptos valen para cualquier tamaño.

## Próximo paso

- Continuar con [04. Cómo funciona LinuxCNC](./04-como-funciona-linuxcnc).
