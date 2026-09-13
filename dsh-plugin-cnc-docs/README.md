# CNC Docs - Plugin oficial DeepSeek Harness

Plugin compatible con **deepseek-ai/deepseek-harness** (everything-is-a-plugin).

## Instalación en DeepSeek Harness oficial

```bash
# 1. Clona el harness oficial
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
pnpm install
pnpm run build

# 2. Clona CNC Docs dentro o al lado
git clone https://github.com/jhonjmx/CNC-Docs.git ../CNC-Docs

# 3. Instala el plugin de CNC Docs en el harness
# Opción A: desde path local
pnpm dsh plugin add ../CNC-Docs/dsh-plugin-cnc-docs

# Opción B: con patch overlay (recomendado para desarrollo)
# Crea un archivo cordis.patch.yml en tu home
# que apunte al plugin local
```

## cordis.patch.yml ejemplo

Crea `~/.dsh/cordis.patch.yml` o usa overlay:

```yaml
- insert:
    - id: cnc-docs-manager
      name: '/absolute/path/to/CNC-Docs/dsh-plugin-cnc-docs/src/index.ts'
```

Luego inicia:

```bash
pnpm dsh web --patch /absolute/path/to/CNC-Docs/dsh-plugin-cnc-docs/cordis.yml
# Abre http://127.0.0.1:3080
```

## Tools disponibles para el agente

El agente ahora ve:

- `cnc_create_doc` - Crea doc nuevo optimizado Starlight
- `cnc_edit_doc` - Edita doc existente
- `cnc_delete_doc` - Borra doc
- `cnc_add_category` - Crea categoría nueva (printnc, grblhal, fluidnc) y actualiza sidebar
- `cnc_validate` - Valida frontmatter de todos los docs
- `cnc_list_docs` - Lista docs existentes

## Uso con agente

En la Web UI de DeepSeek Harness, dile:

> "Lista los docs actuales de linuxcnc/basico"
> "Crea una categoría nueva llamada PrintNC v4 en printnc"
> "Crea un doc en printnc/ensamblaje sobre el montaje del pórtico con SFU1605"
> "Edita src/content/docs/hardware/mesa.md para agregar wiring del encoder"

El agente usará las tools con diff cards visuales.

## Diferencia con el harness simple

El proyecto también incluye `harness/deepseek-harness.js` que es un CLI simple sin depender de deepseek-harness.
Este plugin `dsh-plugin-cnc-docs` es la integración OFICIAL con el proyecto deepseek-ai/deepseek-harness.
