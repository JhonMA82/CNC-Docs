# CNC Docs Manager — plugin DSH

Plugin del harness que convierte al agente en **gestor de CNC Docs**: documentación Starlight Astro en español sobre CNC y fabricación digital en general (cualquier máquina, control, mecánica, eléctrica, CAD/CAM y ecosistema abierto).

## Instalación

```bash
# Desarrollo: overlay con patch (recomendado)
dsh --profile web --patch /ruta/a/cnc-docs/cordis.patch.cnc-docs.yml

# Permanente en el perfil web: ver ~/.dsh/profiles/web/cordis.patch.yml
```

El plugin se carga desde `src/index.ts`; tras modificarlo, **reinicia el perfil** para que aplique.

## Herramientas

### Gestión de docs

| Tool | Qué hace |
|---|---|
| `cnc_create_doc` | Crea un doc nuevo con frontmatter Starlight válido; crea la categoría si no existe |
| `cnc_edit_doc` | Reemplaza el contenido completo de un doc existente (valida frontmatter) |
| `cnc_delete_doc` | Borra un doc (usar con cuidado) |
| `cnc_add_category` | Crea categoría (directorio + `index.md`) y la registra en el sidebar de `astro.config.mjs` |
| `cnc_validate` | Valida frontmatter (`title` + `description`) de todos los docs; debe pasar antes de dar por terminado |
| `cnc_list_docs` | Lista los docs existentes (opcionalmente por categoría). Explorar antes de escribir |

### Entorno visual automático (MCP)

El usuario no hace nada manual: el agente diagnostica, instala y verifica.

| Tool | Qué hace |
|---|---|
| `cnc_check_visual_env` | Diagnóstico de solo lectura de los 3 MCP: `drawio` (Node + `@drawio/mcp` en npm), `freecad` (binario, Python 3.10+, pip `mcp`/`mcp-events`, puente en `~/.freecad-mcp/`, workbench AICopilot, en ejecución o no), `kicad` (Node, `dist/index.js` compilado, qué intérprete importa `pcbnew`). Parámetro opcional `targets` |
| `cnc_setup_visual_env` | Instalación y configuración automáticas: dependencias pip/npm, clones git (`--depth 1`, reutiliza si existen), puente FreeCAD, workbench AICopilot en la carpeta Mod real, `npm install + build` del servidor KiCad, verificación final e intento de registro con `claude mcp add`. Devuelve `clientConfigJson` exacto como respaldo. Parámetros: `targets`, `baseDir` (defecto: home), `register` (defecto: true). Puede tardar minutos |

Flujo recomendado del agente: `cnc_check_visual_env` → si falta algo, `cnc_setup_visual_env` (por `targets` si es largo) → reportar qué quedó listo. Lo único fuera del alcance del plugin: instalar las apps base que requieran contraseña (FreeCAD/KiCad/Node) y abrir la GUI de FreeCAD (el MCP de mecánica la exige en ejecución).

## Secciones de prompt que aporta

- `cnc-docs-context`: alcance general CNC, hardware de referencia por defecto (PrintNC v4 + Mesa 7i96S + Remora NVEM, **no es un límite**), reglas de contenido y referencia a `guides/mcp-visuales`.
- `cnc-docs-visual`: estrategia visual (solo si el texto no basta), router de decisión por tipo de visual, formatos `VISUAL_PENDING` / `IMAGE_PENDING`, convenciones de archivos y accesibilidad.

## Uso con el agente

> "Lista los docs actuales de linuxcnc/basico"
> "Crea un doc en mecanica/alineacion sobre el squaring del pórtico"
> "Deja listo el entorno visual" (check + setup automáticos)
> "Valida los docs"

## Versionado y commits

- Versión en `dsh-plugin-cnc-docs/package.json`, historial en `dsh-plugin-cnc-docs/CHANGELOG.md` (formato Keep a Changelog).
- **Cada cambio se commitea**: un cambio = un commit lógico (`feat(plugin): …`, `fix(plugin): …`, `docs: …`). Nada de acumular cambios sin commitear.
