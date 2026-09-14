# Changelog — cnc-docs-manager

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).
Versión en `dsh-plugin-cnc-docs/package.json`.

## [1.1.0] - 2026-09-14

### Añadido
- `cnc_check_visual_env`: diagnóstico de solo lectura de los MCP visuales
  (draw.io, FreeCAD, KiCad) con detalle por objetivo.
- `cnc_setup_visual_env`: instalación y configuración automáticas del entorno
  visual (dependencias pip/npm, clones git, puente FreeCAD, workbench
  AICopilot, build del servidor KiCad, registro en el cliente MCP y
  verificación final). El usuario no hace nada manual.
- README del plugin documentando las 8 tools, secciones de prompt y flujo
  de entorno visual automático.

### Cambiado
- Prompt `cnc-docs-context`: alcance generalizado a todo CNC y fabricación
  digital (antes limitado a LinuxCNC/PrintNC/Mesa/Remora/grblHAL/FluidNC).
  El hardware de referencia queda como valor por defecto, no como límite;
  si la petición no especifica plataforma y no se averigua en el repo,
  el agente pregunta antes de redactar.
- Ejemplos del router visual y de accesibilidad generalizados
  (controladora→drivers→motores) con LinuxCNC/Mesa como ejemplos.
- Referencias concretas a los MCP visuales (repos, comandos y verificación)
  en el prompt, con detalle en `guides/mcp-visuales`.

## [1.0.0] - 2026-09-13

### Añadido
- Plugin inicial con 6 tools: `cnc_create_doc`, `cnc_edit_doc`,
  `cnc_delete_doc`, `cnc_add_category`, `cnc_validate`, `cnc_list_docs`.
- Secciones de prompt `cnc-docs-context` y `cnc-docs-visual`.
