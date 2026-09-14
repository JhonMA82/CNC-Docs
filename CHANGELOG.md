# Changelog — CNC Docs

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).
Una sola versión para todo el proyecto (ver `dsh-plugin-cnc-docs/package.json`);
cada release lleva un tag anotado `vX.Y.Z`.
Detalle del plugin: [dsh-plugin-cnc-docs/CHANGELOG.md](dsh-plugin-cnc-docs/CHANGELOG.md).

## [1.1.0] - 2026-09-14

### Cambiado
- Alcance del proyecto generalizado a todo CNC y fabricación digital
  (README raíz, prompt del plugin y guía editorial): el hardware de
  referencia (PrintNC v4 + Mesa 7i96S + Remora) queda como valor por
  defecto, no como límite.

### Añadido
- Guía `guides/mcp-visuales`: compatibilidad con los MCP de draw.io,
  KiCad y FreeCAD para visuales bajo demanda (instalación, registro,
  verificación y convención `VISUAL_PENDING`).
- Plugin v1.1.0: `cnc_check_visual_env` (diagnóstico) y
  `cnc_setup_visual_env` (instalación, configuración, registro y
  verificación automáticos); README del plugin documentado.

## Anteriores

Trabajo previo a este changelog, ver `git log` (temario LinuxCNC 01–18,
docs de hardware, CAM, glosario, diagrama de cadena de control).
