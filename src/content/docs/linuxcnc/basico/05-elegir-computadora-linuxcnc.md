---
title: 05. Elegir computadora para LinuxCNC
description: "Qué PC sirve para LinuxCNC con Mesa o Remora: requisitos reales, mini PC vs sobremesa vs SBC, red Ethernet, BIOS y latency test."
---

LinuxCNC no necesita un PC potente. Necesita un **PC puntual**: que ejecute el servo-thread cada 1 ms sin retrasos aunque abras ventanas, muevas el ratón o haya tráfico de red. Eso se llama tiempo real y ya lo viste en el [capítulo 04](./04-como-funciona-linuxcnc).

**Recomendación general (80 % de los casos):** un sobremesa o mini PC i3/i5 cualquiera de los últimos 10 años, con Debian + PREEMPT_RT de la ISO oficial, Ethernet por cable dedicada a la Mesa 7i96S y ahorro de energía desactivado. Con eso una PrintNC v4 con Mesa o Remora funciona sin problemas. Todo lo demás es afinar.

> Si vienes del capítulo 04 solo con una idea en la cabeza: la latencia manda, los GHz no.

## Requisitos reales (sin mito)

Para PrintNC + Mesa 7i96S o Remora NVEM, el PC solo hace tres cosas exigentes:

1. Correr el **servo-thread a 1 ms** con puntualidad (núcleo PREEMPT_RT).
2. Mantener una conexión **Ethernet estable** con la controladora.
3. Mover la **interfaz gráfica** (Axis, Gmoccapy, QtDragon) sin congelarse.

Traducción práctica:

- **CPU:** cualquier i3/i5/i7 de sobremesa o portátil de los últimos 10 años vale. Un Celeron muy justo o un Atom viejo se quedan cortos de margen, no por potencia sino por picos de latencia.
- **RAM:** 4 GB mínimo, 8 GB cómodo. Más no mejora el mecanizado.
- **Disco:** SSD de 120 GB o más. No por velocidad de mecanizado, sino porque un disco mecánico viejo mete pausas aleatorias y hace eterna la instalación.
- **Gráfica:** la integrada de Intel o AMD vale. Evita gráficas dedicadas con drivers propietarios conflictivos si puedes: dan más problemas que beneficio para fresar.
- **Red:** un puerto Ethernet por cable. Si usas Mesa por Ethernet, lo ideal es un **segundo puerto dedicado** solo a la máquina (ver abajo).
- **Sistema:** Debian con PREEMPT_RT instalado **desde la ISO oficial de LinuxCNC**. No tu Ubuntu diario con "algo de tiempo real añadido".

Lo que NO necesitas: gaming, 16 núcleos, GPU potente, WiFi rápido. El WiFi no se usa para motion.

## PC nuevo vs PC usado

| Opción | Conviene si | Ojo con |
|---|---|---|
| **Sobremesa usado de oficina** (típico i5 de empresa) | Quieres lo más barato y fiable. Es la opción favorita de la comunidad: barato, con Ethernet real, fácil de abrir y reparar | Fuente vieja, polvo, disco mecánico (cámbialo por SSD), comprueba latencia antes de montarlo en el taller |
| **Mini PC nuevo** | Tienes poco sitio en el armario eléctrico o quieres equipo nuevo con garantía | Muchos solo traen un Ethernet (a veces USB adaptado) y BIOS muy cerrada con poco que desactivar. Verifica que el Ethernet sea PCIe real |
| **Tu PC de todos los días en dual-boot** | Solo para probar y aprender sin máquina (capítulo 08) | No lo uses para producir: actualizaciones, antivirus, suspensión y WiFi arruinan la puntualidad. La máquina merece un PC dedicado |

Regla simple: para aprender vale cualquiera; para cortar en serio, un **PC dedicado** solo a la máquina.

## Mini PC vs sobremesa vs SBC vs portátil

### Sobremesa (recomendado por defecto)

- **Para quién:** quien monta su primera PrintNC y quiere cero sorpresas.
- **Por qué gana:** Ethernet PCIe de verdad, BIOS completa donde desactivar ahorro de energía, sitio para meter una segunda tarjeta de red Intel barata, buena refrigeración.
- **Limitación:** ocupa sitio. En el taller se llena de polvo: ponlo fuera del chorro de viruta.

### Mini PC

- **Para quién:** armario eléctrico pequeño o máquina que se mueve (plasma, router compacto).
- **Por qué conviene:** consume poco, se atornilla detrás del monitor, hace poco ruido.
- **Limitación:** un solo Ethernet en muchos modelos, fuentes externas justas y BIOS con pocas opciones. Si solo tiene un puerto y usas Mesa por Ethernet, ese puerto queda para la Mesa y te quedas sin internet por cable (usa WiFi solo para internet, nunca para motion). Comprueba que el Ethernet no sea un adaptador USB interno: da más jitter.

### SBC (Raspberry Pi y similares)

- **Para quién:** quien ya tiene una y quiere experimentar con Remora o Mesa por Ethernet en una máquina pequeña.
- **Por qué conviene:** barata, poco consumo, suficiente para servo-thread a 1 ms con imagen PREEMPT_RT adecuada.
- **Limitación:** E/S limitada, arranque desde SD propenso a corrupción en taller (usa SSD USB o eMMC si puedes), menos margen para interfaces pesadas como QtDragon con mucha gráfica. No es la vía más simple para una primera PrintNC: documenta esa en su lugar si la eliges.

### Portátil

- **Para quién:** solo para aprender y simular sin máquina.
- **Por qué no para producir:** el ahorro de energía de portátil es agresivo y difícil de desactivar del todo, la suspensión al cerrar la tapa es un peligro, y el Ethernet suele ser adaptador USB. Úsalo para el capítulo 08, no para cortar.

**Veredicto:** sobremesa usado > mini PC bueno > SBC solo si sabes lo que haces > portátil solo para simular.

## Intel vs AMD

Para LinuxCNC con Mesa o Remora por Ethernet, **ambos valen**. Elige por latencia y por red, no por marca.

- Intel de sobremesa de empresa: apuesta segura porque hay miles de reportes de latencia buena y Ethernet Intel integrada.
- AMD Ryzen moderno: perfectamente válido, a veces con latencia incluso mejor. Solo asegúrate de poder desactivar Cool'n'Quiet / C-states en BIOS (ver abajo).
- Evita decidir por GHz o número de núcleos. Un i3 con buena latencia fresa mejor que un i9 con picos de 500 µs.

## Tarjeta de red: el punto que más fallos causa con Mesa

La Mesa 7i96S habla por Ethernet con el PC en `10.10.10.10`. No es "internet": es un cable directo PC → Mesa con IP fija.

Criterios que cambian la decisión:

1. **Dedicada a la máquina.** Un puerto solo para la Mesa, otro (o WiFi) para internet. Compartir el mismo puerto con internet mete pausas.
2. **PCIe real, no USB.** Los adaptadores USB-Ethernet funcionan para navegar, pero para motion meten jitter. Si tu mini PC solo tiene USB, mejor otro PC.
3. **Intel preferible.** Las Intel cableadas (típicas en sobremesas de empresa) son las más probadas con el driver `hm2_eth`. Otras cableadas PCIe también suelen valer; pruébalo con latency test + máquina moviéndose antes de darlo por bueno.
4. **Cable y IP fija.** Cable apantallado corto, sin switches baratos en medio si puedes evitarlo. IP fija del lado PC en la misma subred que la Mesa (por defecto `10.10.10.x`).

Configuración típica del lado PC (Debian, segunda interfaz dedicada a la Mesa):

```bash
# Comprueba qué interfaces tienes
ip link show
# Comprueba que corres núcleo de tiempo real (debe decir PREEMPT_RT)
uname -a
```

```bash
# Ejemplo para una segunda interfaz llamada eth1 dedicada a la Mesa 7i96S.
# IP del PC 10.10.10.11, la Mesa sigue en su 10.10.10.10 de fábrica.
# En Debian 12 con NetworkManager, desde la GUI o con nmcli:
nmcli con add type ethernet ifname eth1 con-name mesa ip4 10.10.10.11/24
#  type ethernet = conexión cableada, ifname eth1 = el puerto dedicado
#  con-name mesa = nombre para reconocerla, ip4 .../24 = IP fija sin puerta de enlace
```

> El WiFi queda solo para internet y actualizaciones. Nunca para conectar la Mesa o la Remora.

## BIOS/UEFI y ahorro de energía

El 90 % de los "PC que no sirven" se arreglan aquí, sin comprar nada.

Al arrancar, entra en BIOS/UEFI y desactiva o ajusta:

- **C-states / sleep states profundos:** ponlos en `Disabled` o limita a `C1` si no hay opción de desactivar del todo. Son pausas del procesador que rompen la puntualidad.
- **SpeedStep / Cool'n'Quiet / EIST / P-states agresivos:** desactívalos o pon rendimiento constante. El cambio de frecuencia mete picos de latencia.
- **Turbo Boost:** si tu latencia sale mala, prueba desactivándolo. Si sale buena, déjalo.
- **SMT / Hyper-Threading:** normalmente no hace falta tocarlo con Mesa/Remora a 1 ms. Solo prueba a desactivarlo si el latency test sigue malo tras lo anterior.
- **Secure Boot:** desactívalo para instalar Debian sin peleas.
- **Arranque:** orden de arranque primero al SSD, desactiva arranque por red (PXE) si no lo usas.
- **En el sistema:** desactiva suspensión e hibernación. El PC de la máquina nunca duerme.

En Debian con entorno de escritorio, ve a *Energía* y pon *No suspender nunca*, *pantalla siempre encendida durante el trabajo*. Parece un detalle, pero una suspensión a mitad de un corte es un susto serio.

## Latency test: la prueba que decide

El `latency test` mide el peor retraso que tu PC introduce en una tarea de tiempo real. No mide potencia: mide **puntualidad en el peor caso**.

### Cómo correrlo (una vez instalado el capítulo 07)

```bash
# Abre el test de latencia (servo-thread a 1 ms, el que usa tu PrintNC con Mesa/Remora)
latency-test 1ms
#  1ms = periodo del servo-thread. Déjalo corriendo varios minutos.
```

Mientras corre, **maltrata el PC a propósito**: abre ventanas, mueve ventanas con el ratón, abre el navegador, copia archivos por USB, carga la red. Quieres el peor número, no el bonito en reposo.

Fíjate en la columna de **max jitter** (retraso máximo). Orientación práctica, no umbral oficial:

- Decenas de microsegundos de máximo con carga: margen de sobra para servo a 1000 µs (1 ms) con Mesa o Remora.
- Cientos de microsegundos estables: normalmente sigue bien con hardware externo, pero investiga qué lo provoca (red, gráfica, energía).
- Picos cercanos al periodo (cerca de 1000 µs) o que crecen sin parar: ese PC/BIOS/configuración no vale para producir. Cambia ajustes de BIOS antes de cambiar de PC.

> Con puerto paralelo antiguo importaba también el base-thread a 25-50 µs, mucho más exigente. Con Mesa 7i96S o Remora los pulsos los genera el hardware: **solo te importa el servo a 1 ms**. Por eso PCs que "no valían" para paralelo sí valen para Mesa.

Si el número sale malo, no compres otro PC todavía: repite el test tras desactivar ahorro de energía, quitar WiFi USB, probar otro puerto PCIe y arrancar solo con lo necesario. Mide de nuevo. Solo cambia de equipo cuando el peor caso sigue malo.

## Hardware que conviene evitar

- **Adaptadores USB-Ethernet para la Mesa/Remora.** Para internet valen; para motion, no.
- **Switches baratos o PLC de red entre PC y Mesa** si puedes evitarlo. Cable directo es lo más determinista.
- **PC con un solo Ethernet USB interno** (típico en mini PC muy baratos y portátiles).
- **Discos mecánicos viejos como disco de sistema.** Provocan congelamientos aleatorios.
- **Distribuciones con escritorio pesado + efectos + indexadores** sobre el PC de máquina. Debian Xfce de la ISO oficial es suficiente y ligero.
- **WiFi para motion.** Repito porque es el error más común: WiFi solo para internet.

## Lista de compra mínima verificable

Antes de instalar nada, comprueba en la mesa del taller:

- [ ] PC dedicado con SSD, 4-8 GB RAM, Ethernet PCIe por cable.
- [ ] Segundo puerto Ethernet (o tarjeta Intel PCIe barata) si usas Mesa 7i96S.
- [ ] Cable Ethernet apantallado corto PC → Mesa.
- [ ] BIOS con C-states y suspensión desactivados.
- [ ] USB de 8 GB para la ISO oficial (capítulo 07).
- [ ] Latency test con carga dando un máximo estable lejos de 1000 µs.

Si falla algo de la lista, se arregla antes de cablear drivers y finales de carrera. Es mucho más barato que diagnosticar tirones con la máquina ya montada.

## Errores frecuentes

- **Comprar potencia en vez de puntualidad.** Un PC gaming no fresa mejor que un i5 de oficina con buena latencia.
- **Probar latencia en reposo.** El número que importa es con el PC sufriendo, no en vacío.
- **Usar el PC de diario para producir.** Una actualización o una suspensión arruina una pieza.
- **Poner la Mesa en la misma red que internet.** La Mesa quiere su cable y su IP fija, sin router en medio.
- **Dejar el ahorro de energía activado "porque va bien".** Va bien hasta el primer pico en mitad de un acabado.

## Hardware aplicable

- PC de taller con Debian 12 + PREEMPT_RT (ISO oficial de LinuxCNC): sobremesa i3/i5 o mini PC con Ethernet PCIe real.
- PrintNC v4 de referencia (SFU1605, 160 steps/mm, DM556 a 2.8 A) con Mesa 7i96S en `10.10.10.10` o Remora NVEM (STM32F207): ambas liberan al PC de generar pulsos, por eso basta el servo a 1 ms.
- Cable Ethernet dedicado PC → controladora; WiFi solo para internet.

## Próximo paso

- Continuar con [06. Elegir controlador de movimiento](./06-elegir-controlador-movimiento): puerto paralelo, Mesa, Remora y EtherCAT comparados para decidir qué cuelga de este PC.
- Cuando tengas el PC elegido, ve a [07. Instalación de LinuxCNC](./07-instalacion-linuxcnc) y corre tu primer latency test con carga.
