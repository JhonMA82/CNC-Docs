---
title: 02. Anatomía de una CNC
description: Partes de una CNC explicadas para principiantes: ejes, husillos SFU1605, motores NEMA23, drivers DM556, spindle, VFD y E-stop.
---

Una CNC parece complicada hasta que la divides en bloques. Son siempre los mismos seis: estructura, transmisión, motores, herramienta, control y seguridad. Si entiendes qué hace cada uno, ya sabes dónde mirar cuando algo falla y qué pieza elegir para una PrintNC v4.

Por qué importa: cada decisión de compra o cada avería cae en uno de estos bloques. Sin este mapa, acabas cambiando valores al azar o comprando electrónica antes de tener la mecánica clara.

## Ejes: X, Y, Z (y A/B/C)

Los ejes son las direcciones en las que la máquina puede moverse:

- **X:** izquierda-derecha (normalmente el pórtico en una router).
- **Y:** adelante-atrás (normalmente la mesa o el desplazamiento del pórtico).
- **Z:** arriba-abajo (el cabezal con la herramienta).
- **A / B / C:** ejes rotativos alrededor de X / Y / Z. Solo en máquinas 4/5 ejes o con 4º eje añadido.

En una PrintNC v4 típica (área útil 600 x 600 x 300 mm) tienes X e Y moviendo el pórtico y Z subiendo y bajando el husillo. Con esos tres ejes haces el 95 % de los trabajos: corte, fresado, grabado y taladrado.

## Transmisión: cómo el giro se vuelve movimiento recto

El motor gira; la transmisión convierte ese giro en desplazamiento lineal. Las opciones comunes:

| Sistema | Cómo va | Cuándo conviene |
|---|---|---|
| **Husillo de bolas (p. ej. SFU1605)** | Tuerca de bolas sobre husillo rectificado | Precisión y rigidez: la opción de la PrintNC en X/Y/Z |
| **Cremallera-piñón** | Piñón dentado sobre cremallera | Recorridos largos (fresadoras grandes, plasma) donde el husillo flectaría |
| **Correa dentada** | Correa sobre poleas | Máquinas rápidas y ligeras (láser, 3D); menos rigidez para fresar metal |
| **Reductor** | Reduce velocidad, multiplica par | Ejes rotativos o cuando el motor directo se queda corto de fuerza |

SFU1605 significa: diámetro 16 mm, paso 5 mm (avanza 5 mm por vuelta). Es el estándar de la PrintNC v4 con guías lineales de 20 mm (tipo Hiwin): rígido, barato y con *backlash* bajo (menos de 0,02 mm si está bien montado).

## Motores: los músculos

| Motor | Qué es | Cuándo conviene |
|---|---|---|
| **Stepper NEMA23 (3 Nm)** | Mueve por pasos contados, sin saber si los cumplió | La opción estándar de la PrintNC: barato y suficiente con buena transmisión |
| **Closed-loop stepper** | Stepper con encoder que corrige pasos perdidos | Si quieres alarma al perder pasos sin pagar un servo |
| **Servomotor** | Control continuo de posición/velocidad/par | Alta velocidad y precisión sostenida; más caro y complejo de ajustar |

Regla práctica para empezar: NEMA23 de ~3 Nm en X/Y/Z de una PrintNC. Solo sube a closed-loop o servo cuando la mecánica ya está perfecta y el stepper te limita de verdad, no antes.

## Drivers: los que alimentan al motor

El driver traduce los pulsos del controlador en corriente para el motor. Dos ajustes mandan:

- **Corriente:** en la PrintNC de referencia, DM556 a **2.8A** para NEMA23 de 3 Nm. Más corriente no da más fuerza útil: da más calor.
- **Resolución (*steps/mm*):** cuántos pulsos necesita la máquina para mover 1 mm. En la config de referencia de esta documentación se usa **160 steps/mm**. Lo calibrarás con medición real en el capítulo de calibración; por ahora quédate con que es el número que une mecánica y electrónica.

Otros drivers (TB6600 y similares) existen, pero el DM556 es la referencia aquí por fiabilidad y porque aguanta los 2.8A sin forzar.

## Herramienta: spindle y router

La herramienta es lo que arranca material. En router/fresadora hablamos de:

- **Router de mano adaptado:** barato y ruidoso, válido para empezar en madera.
- **Husillo (spindle) 2.2 kW:** el estándar de la PrintNC: más rígido, menos ruido, control de velocidad desde el programa y opción de refrigeración por agua o aire.

Si vas a fresar aluminio de forma habitual, apunta al husillo 2.2 kW desde el principio. El router de mano te limita justo donde la PrintNC brilla.

## VFD: el que manda en el husillo

El VFD (*Variable Frequency Drive*) convierte la corriente de casa (monofásica 220 V) en trifásica de frecuencia variable para el husillo. Variando la frecuencia, varía las RPM.

Lo mínimo que debes saber ahora:

- El VFD alimenta **solo** al husillo, nunca a la electrónica de control.
- Se programa velocidad mínima/máxima y rampas de arranque/parada.
- LinuxCNC puede gobernarlo (marcha/paro + RPM) si se cablea su control; el detalle va en el capítulo de spindle.

## Sensores: los ojos de la máquina

- **Home:** le da a la máquina una referencia repetible desde la cual puede conocer su posición. Uno por eje.
- **Limit:** detectan que un eje llegó al final físico y paran antes del golpe. Pueden compartir hardware con los de home.
- **Probe (sonda):** palpa la pieza para encontrar su cero o medirla. Imprescindible para trabajo preciso.
- **Tool setter:** mide la longitud de cada herramienta para compensar (*tool offset*).
- **Encoder:** confirma cuánto giró realmente un motor (closed-loop y servos).

Sin sensores de home, la máquina no sabe dónde está al arrancar: cada encendido sería una lotería. Por eso el *homing* es lo primero que configurarás.

## Entradas, salidas, relés y contactores

- **Entradas:** leen el mundo (sensores home/limit, sonda, botones, E-stop).
- **Salidas:** actúan sobre el mundo (arrancar husillo, abrir refrigeración, activar un relé).
- **Relé:** interruptor eléctrico pequeño que permite a una salida de pocos miliamperios conmutar una carga mayor.
- **Contactor:** el "relé grande" para potencias serias (husillo, aspiración). Corta fases enteras con seguridad.

Idea clave: el controlador nunca alimenta cargas de potencia directamente. Siempre manda a través de relé o contactor.

## Emergency Stop: lo primero, no lo último

El E-stop no es un botón más: es un circuito que corta la potencia de motores y husillo de forma inmediata e independiente del software.

- Debe ser **NC (normalmente cerrado):** si se corta un cable, la máquina lo nota y se para, en vez de quedarse sin protección sin avisarte.
- Debe cortar **potencia real** (drivers + husillo), no solo avisar al programa.
- Lleva siempre gafas, sujeción firme del material y E-stop al alcance antes de pensar en el primer corte.

## La PrintNC v4, pieza a pieza

| Bloque | Referencia usada en esta documentación |
|---|---|
| Estructura | PrintNC v4, útil 600 x 600 x 300 mm |
| Transmisión | Husillos SFU1605 + guías 20 mm en X/Y/Z |
| Motores | NEMA23 ~3 Nm |
| Drivers | DM556 a 2.8A, referencia 160 steps/mm |
| Herramienta | Husillo 2.2 kW |
| Control | Mesa 7i96S o Remora NVEM (capítulos 11-12) |

## Errores frecuentes

- **Comprar motores grandes para compensar mala mecánica.** Un NEMA34 no arregla un pórtico descuadrado; primero alineación y *backlash*.
- **Mezclar transmisión sin criterio.** Correa en Z de fresadora o husillo largo sin soporte: cada sistema tiene su sitio (ver tabla).
- **Dejar el E-stop para "más adelante".** Es el primer cableado, no el último.
- **Ajustar corriente del driver a ojo hacia arriba.** 2.8A en DM556 para este NEMA23; más es calor, no rigidez.

## Hardware aplicable

- PrintNC v4: SFU1605, guías 20 mm, NEMA23 3 Nm, DM556 a 2.8A, referencia 160 steps/mm, husillo 2.2 kW.

## Próximo paso

- Continuar con [03. Conceptos esenciales de CNC](./03-conceptos-esenciales-cnc): *axis* vs *joint*, cero pieza, *homing*, *feed rate* y *offsets*.
