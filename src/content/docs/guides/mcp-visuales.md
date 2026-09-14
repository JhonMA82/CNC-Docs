---
title: MCP para visuales (draw.io, KiCad, FreeCAD)
description: "Guía de los servidores MCP que usa CNC Docs para visuales: draw.io para diagramas, KiCad para electrónica y FreeCAD para mecánica, con instalación y uso."
---

Los visuales de CNC Docs (diagramas, esquemas, modelos) se generan con tres servidores MCP, **solo cuando el texto no basta**. Nada decorativo: antes de crear un visual, la pregunta es si el lector lo entenderá claramente solo con texto. Esta página deja lista la compatibilidad para usarlos cuando un doc lo requiera.

**Automatización: no tienes que hacer nada de esta página a mano.** Pide al agente que ejecute `cnc_check_visual_env` (diagnóstico de los tres MCP sin instalar nada) y `cnc_setup_visual_env` (instala dependencias, clona los repos, configura el puente FreeCAD y el workbench AICopilot, compila el servidor KiCad e intenta registrarlos en tu cliente MCP). Lo que sigue es el detalle de lo que el plugin hace por ti y cómo verificarlo.

## Qué MCP usar en cada caso

| Visual que necesitas | MCP | Repositorio oficial | Qué entrega |
|---|---|---|---|
| Diagrama conceptual o de arquitectura (flujo CAD→CAM→G-code, PC→Mesa→drivers→motores, homing, diagnóstico) | draw.io | `jgraph/drawio-mcp` | `.drawio` editable + SVG publicado |
| Esquema eléctrico didáctico o electrónica real (PCB, adaptación 24V→lógica, interfaz de sensores) | KiCad | `mixelpixx/KiCAD-MCP-Server` | Proyecto KiCad editable + exportación visual |
| Mecánica y montaje (ballscrew, pórtico, guías, alineación, piezas) | FreeCAD | `blwfish/freecad-mcp` | `.FCStd` editable + SVG o WebP/PNG |

Si el MCP que necesitas no está disponible en la sesión, no improvises una versión inferior: deja un marcador `VISUAL_PENDING` en el doc (ver abajo) y sigue redactando.

## draw.io (diagramas)

Es el más simple: no requiere instalación, se ejecuta con `npx`. Sirve XML, CSV y Mermaid, y abre el resultado en el editor draw.io.

**Requisito verificado:** Node.js instalado. Paquete publicado como `@drawio/mcp` en npm (versión 1.5.0 a fecha de redacción).

**Registro como servidor MCP** (elige según tu cliente):

```json
{
  "mcpServers": {
    "drawio": {
      "command": "npx",
      "args": ["-y", "@drawio/mcp"]
    }
  }
}
```

En Claude Code también vale:

```bash
claude mcp add drawio -- npx -y @drawio/mcp
```

**Herramientas principales:** `open_drawio_xml` (diagramas nativos), `open_drawio_csv` (tablas → diagramas), `open_drawio_mermaid` (Mermaid → draw.io editable), `search_shapes` (biblioteca de ~10.000 formas: eléctrica, P&ID, red, etc.).

**Flujo en CNC Docs:** genera el `.drawio`, consérvalo como fuente editable y publica el SVG en `src/assets/docs/diagrams/` con nombre kebab-case descriptivo (ejemplo existente: `linuxcnc-cadena-control.drawio` + `linuxcnc-cadena-control.svg`).

## KiCad (electrónica)

Para esquemas y PCBs reales que deban conservarse editables. Nunca uses IA generativa para circuitos que deban construirse: el esquema KiCad es la fuente de verdad.

**Requisitos verificados (según el repositorio oficial):** KiCad 9.0 instalado, Node.js, y `PYTHONPATH` apuntando al Python de KiCad. En Linux, ruta típica `/usr/lib/kicad/lib/python3/dist-packages`; en macOS y Windows se usa el Python empaquetado con KiCad (ver `docs/PLATFORM_GUIDE.md` del repo).

**Instalación (resumen oficial):**

```bash
git clone https://github.com/mixelpixx/KiCAD-MCP-Server.git
cd KiCAD-MCP-Server
npm install && npm run build
```

**Registro como servidor MCP (Linux):**

```json
{
  "mcpServers": {
    "kicad": {
      "command": "node",
      "args": ["/ruta/a/KiCAD-MCP-Server/dist/index.js"],
      "env": {
        "PYTHONPATH": "/usr/lib/kicad/lib/python3/dist-packages"
      }
    }
  }
}
```

**Nota de entorno:** en esta máquina el `pcbnew` del sistema falla con el Python 3.14 instalado (incompatibilidad de librerías). Si te ocurre, usa el Python empaquetado con KiCad en lugar del Python del sistema, tal como indica la guía de plataforma del proyecto. Verifica con `python3 -c "import pcbnew; print(pcbnew.GetBuildVersion())"` usando el intérprete correcto antes de registrar el servidor.

**Flujo en CNC Docs:** conserva el proyecto KiCad como fuente editable y publica la exportación visual en `src/assets/docs/schematics/`. Todo esquema verificable (conexiones, pinouts, valores) debe contrastarse con el manual del fabricante antes de publicarse.

## FreeCAD (mecánica)

Para piezas, montajes y vistas técnicas (iso, sección, plano) que acompañen a guías de construcción, alineación y calibración. Lo didáctico no exige exactitud dimensional, pero si hay cotas fabricables deben venir de fuente verificada.

**Requisitos verificados (según `AGENT-INSTALL.md` oficial):** FreeCAD 1.1.x estable para modelado (la generación de toolpaths CAM exige una build semanal de desarrollo reciente), Python 3.10+ en el sistema y paquetes `mcp` + `mcp-events` vía pip. Funciona en Linux, macOS y Windows, con macOS como plataforma más probada.

**Instalación (resumen oficial):**

```bash
git clone -b main https://github.com/blwfish/freecad-mcp.git ~/freecad-mcp
mkdir -p ~/.freecad-mcp
cp ~/freecad-mcp/freecad_mcp_server.py ~/freecad-mcp/mcp_bridge_framing.py ~/.freecad-mcp/
pip3 install "mcp>=2.0.0" "mcp-events>=0.1.0"
```

Además hay que copiar el directorio `AICopilot` del repo a la carpeta `Mod` de FreeCAD (la ruta exacta se obtiene del propio FreeCAD, ver `AGENT-INSTALL.md`) y tener FreeCAD en ejecución con ese workbench cargado.

**Registro como servidor MCP:**

```json
{
  "mcpServers": {
    "freecad": {
      "command": "python3",
      "args": ["/home/tu-usuario/.freecad-mcp/freecad_mcp_server.py"]
    }
  }
}
```

En Claude Code:

```bash
claude mcp add freecad python3 ~/.freecad-mcp/freecad_mcp_server.py
```

**Verificación:** con FreeCAD abierto, llama a `check_freecad_connection()`. Si responde, el puente funciona.

**Flujo en CNC Docs:** conserva el `.FCStd` como fuente editable y publica SVG para diagramas o WebP/PNG para renders en `src/assets/docs/mechanics/`. Para catálogos tipo JLCMC, el flujo preferido es catálogo → modelo CAD propio → FreeCAD → vista propia, registrando siempre la fuente técnica.

## Si el MCP no está disponible: marcador VISUAL_PENDING

No detengas la redacción por un visual que aún no puedes generar. Inserta este marcador con datos suficientes para generarlo después:

```html
<!-- VISUAL_PENDING
type: diagram | schematic | mechanical
tool: drawio | freecad | kicad | excalidraw
purpose: Qué debe mostrar (ej. flujo PC→Mesa→drivers→motores con retorno de encoders).
filename: mesa-motion-control.svg
reference: (solo mecánica/electrónica) modelo CAD o fuente verificada.
-->
```

Para ilustraciones didácticas generadas con IA (nunca para cableado, circuitos, cotas ni seguridad) usa el marcador `IMAGE_PENDING` con `purpose`, `filename`, `placement` y `prompt` autocontenido.

## Hardware aplicable

Esta guía es de herramientas de autoría, no de máquina: aplica a cualquier doc de CNC Docs que necesite un visual. Los ejemplos de contenido siguen usando el hardware de referencia (PrintNC v4 + Mesa 7i96S + Remora NVEM).

## Próximo paso

Cuando un doc necesite un visual, elige el MCP según la tabla de arriba, genera la fuente editable, publica el SVG o WebP en `src/assets/docs/` y referencia la imagen con un `alt` que describa lo que comunica. Si documentas un procedimiento nuevo de generación (exportación, anotación de capturas), amplía esta página en lugar de duplicarla.
