# Integración con DeepSeek Harness OFICIAL (deepseek-ai/deepseek-harness)

Encontraste el proyecto real: https://github.com/deepseek-ai/deepseek-harness (215k stars)

Este proyecto CNC Docs ahora incluye **dos harness**:

### 1. Harness simple (sin dependencias)
`harness/deepseek-harness.js` - CLI Node puro que creamos antes. Funciona sin instalar nada más.
```bash
node harness/deepseek-harness.js create --category hardware --slug nuevo --title "..." --content-file ./tmp.md
```

### 2. Plugin OFICIAL para DeepSeek Harness
`dsh-plugin-cnc-docs/` - Plugin compatible con arquitectura Cordis "everything is a plugin".

#### Cómo usarlo con el harness oficial:

```bash
# Clona el harness oficial
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
pnpm install
pnpm run build

# Inicia con nuestro plugin
# Reemplaza /path/to/CNC-Docs por tu path absoluto
pnpm dsh web --patch /path/to/CNC-Docs/cordis.patch.example.yml
```

Abre http://127.0.0.1:3080

El agente ahora tiene 6 tools nuevas:
- cnc_create_doc
- cnc_edit_doc
- cnc_delete_doc
- cnc_add_category
- cnc_validate
- cnc_list_docs

Con UI de diff cards: ves el diff antes de aplicar, como en la imagen del tool-fs.

#### Flujo completo para tu caso:

1. Dile al agente en la web: "Quiero agregar la categoría PrintNC y FluidNC"
   -> usará cnc_add_category

2. "Crea la guía de ensamblaje mecánico de PrintNC v4"
   -> usará cnc_create_doc con plantilla Starlight + INI/HAL

3. "Valida que todo esté bien para GitHub Pages"
   -> usará cnc_validate

4. Luego el harness hace git commit/push automático si lo configuras.

Este es el proyecto que buscabas: un harness REAL, no un wrapper del modelo.
