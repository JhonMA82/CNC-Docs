import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const name = 'cnc-docs-manager'
export const inject = ['tools', 'systemPrompt'] as const

// Utilidades CNC Docs — rutas absolutas a la raíz del proyecto.
// El cwd del agente no siempre es la raíz del proyecto, así que la
// detectamos buscando marcadores (astro.config.mjs + docs) hacia arriba:
// primero desde el cwd y, si falla, desde la ubicación del plugin.
function hasProjectMarkers(dir: string): boolean {
  return (
    existsSync(path.join(dir, 'astro.config.mjs')) &&
    existsSync(path.join(dir, 'src', 'content', 'docs'))
  )
}

function searchUp(start: string): string | null {
  let dir = path.resolve(start)
  while (true) {
    if (hasProjectMarkers(dir)) return dir
    const parent = path.dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

function findProjectRoot(): string {
  return (
    searchUp(process.cwd()) ??
    searchUp(path.dirname(fileURLToPath(import.meta.url))) ??
    process.cwd()
  )
}

const PROJECT_ROOT = findProjectRoot()
const DOCS_ROOT = path.join(PROJECT_ROOT, 'src', 'content', 'docs')
const CONFIG_PATH = path.join(PROJECT_ROOT, 'astro.config.mjs')

// Ruta mostrable, relativa a la raíz del proyecto (estable en cualquier cwd).
function show(p: string): string {
  return path.relative(PROJECT_ROOT, path.isAbsolute(p) ? p : path.join(PROJECT_ROOT, p))
}

function validateFrontmatter(content: string) {
  const fm = content.match(/^---\n([\s\S]*?)\n---/)
  if (!fm) throw new Error('Falta frontmatter Starlight (--- title/description ---)')
  if (!/title:/.test(fm[1])) throw new Error('Falta title en frontmatter')
  if (!/description:/.test(fm[1])) throw new Error('Falta description en frontmatter')
}

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true })
}

export function apply(ctx: Context) {
  // Tool 1: Crear documento
  ctx.tools.register(defineTool({
    name: 'cnc_create_doc',
    description: 'Crea un documento nuevo en CNC Docs (Starlight Astro) optimizado para LinuxCNC / PrintNC / Mesa / Remora. Valida frontmatter y crea la categoría si no existe.',
    parameters: {
      category: { type: 'string', required: true, description: 'Directorio relativo en src/content/docs, ej: linuxcnc/basico, hardware, printnc, grblhal' },
      slug: { type: 'string', required: true, description: 'Nombre archivo sin extensión, kebab-case, ej: mesa-7i92' },
      title: { type: 'string', required: true, description: 'Título del doc' },
      description: { type: 'string', required: true, description: 'Descripción SEO 120-160 chars' },
      content: { type: 'string', required: true, description: 'Contenido markdown COMPLETO con frontmatter. Debe incluir ejemplos INI/HAL comentados si es LinuxCNC' },
    },
    output: {
      schema: { type: 'object', additionalProperties: false, properties: { path: { type: 'string' }, created: { type: 'boolean' } } },
      render: (_args, value) => [{ type: 'text', text: `✅ Creado ${value.path}` }],
    },
    async execute(args) {
      const dir = path.join(DOCS_ROOT, args.category)
      await ensureDir(dir)
      const filePath = path.join(dir, `${args.slug}.md`)
      try {
        await fs.access(filePath)
        throw new Error(`Ya existe ${filePath}. Usa cnc_edit_doc`)
      } catch (err) {
        if (err instanceof Error && err.message.startsWith('Ya existe')) throw err
      }

      let finalContent = args.content
      if (!finalContent.startsWith('---')) {
        finalContent = `---\ntitle: ${JSON.stringify(args.title)}\ndescription: ${JSON.stringify(args.description)}\n---\n\n${finalContent}`
      }
      validateFrontmatter(finalContent)
      await fs.writeFile(filePath, finalContent, 'utf-8')
      return { path: show(filePath), created: true }
    },
    presentCall: (args) => ({
      card: 'diff',
      title: `Crear doc: ${args.category}/${args.slug}`,
      diffs: [{ path: show(path.join(DOCS_ROOT, args.category, `${args.slug}.md`)), oldText: null, newText: args.content.slice(0, 2000) }],
      locations: [{ path: show(path.join(DOCS_ROOT, args.category, `${args.slug}.md`)) }]
    }),
  }))

  // Tool 2: Editar documento
  ctx.tools.register(defineTool({
    name: 'cnc_edit_doc',
    description: 'Edita un documento existente en CNC Docs. Reemplaza contenido completo. Valida frontmatter Starlight.',
    parameters: {
      file: { type: 'string', required: true, description: 'Ruta relativa desde root, ej: src/content/docs/linuxcnc/basico/02-instalacion.md' },
      content: { type: 'string', required: true, description: 'Contenido NUEVO completo con frontmatter' },
    },
    output: {
      schema: { type: 'object', additionalProperties: false, properties: { path: { type: 'string' }, edited: { type: 'boolean' } } },
      render: (_args, value) => [{ type: 'text', text: `✅ Editado ${value.path}` }],
    },
    async execute(args) {
      const abs = path.resolve(PROJECT_ROOT, args.file)
      await fs.access(abs)
      validateFrontmatter(args.content)
      await fs.writeFile(abs, args.content, 'utf-8')
      return { path: show(args.file), edited: true }
    },
    presentCall: (args) => ({
      card: 'diff',
      title: `Editar: ${args.file}`,
      diffs: [{ path: args.file, oldText: null, newText: args.content.slice(0, 2000) }],
      locations: [{ path: args.file }]
    })
  }))

  // Tool 3: Borrar documento
  ctx.tools.register(defineTool({
    name: 'cnc_delete_doc',
    description: 'Borra un documento de CNC Docs. Usar con cuidado.',
    parameters: {
      file: { type: 'string', required: true, description: 'Ruta relativa, ej: src/content/docs/roadmap/grblhal.md' },
    },
    output: {
      schema: { type: 'object', additionalProperties: false, properties: { path: { type: 'string' }, deleted: { type: 'boolean' } } },
      render: (_args, value) => [{ type: 'text', text: `🗑️ Borrado ${value.path}` }],
    },
    async execute(args) {
      const abs = path.resolve(PROJECT_ROOT, args.file)
      await fs.access(abs)
      await fs.unlink(abs)
      return { path: show(args.file), deleted: true }
    }
  }))

  // Tool 4: Añadir categoría
  ctx.tools.register(defineTool({
    name: 'cnc_add_category',
    description: 'Crea una nueva categoría en CNC Docs (ej. printnc, grblhal, fluidnc). Crea el directorio, un index.md y actualiza astro.config.mjs sidebar automáticamente.',
    parameters: {
      id: { type: 'string', required: true, description: 'ID interno, ej: printnc' },
      label: { type: 'string', required: true, description: 'Label visible en sidebar, ej: PrintNC v4' },
      dir: { type: 'string', required: true, description: 'Directorio en src/content/docs, ej: printnc' },
      icon: { type: 'string', description: 'Icono Starlight opcional, ej: wrench, setting' },
    },
    output: {
      schema: { type: 'object', additionalProperties: false, properties: { dir: { type: 'string' }, label: { type: 'string' } } },
      render: (_args, value) => [{ type: 'text', text: `✅ Categoría ${value.label} creada en ${value.dir}` }],
    },
    async execute(args) {
      const docsDir = path.join(DOCS_ROOT, args.dir)
      await ensureDir(docsDir)
      const indexPath = path.join(docsDir, 'index.md')
      try {
        await fs.access(indexPath)
      } catch {
        await fs.writeFile(indexPath, `---\ntitle: ${args.label}\ndescription: Documentación de ${args.label} en CNC Docs\n---\n\nBienvenido a la categoría **${args.label}**.\n`, 'utf-8')
      }
      // Actualizar astro.config.mjs (formato Starlight >= 0.39: autogenerate dentro de items)
      let cfg = await fs.readFile(CONFIG_PATH, 'utf-8')
      if (!cfg.includes(`directory: '${args.dir}'`)) {
        const entry = `        {\n          label: '${args.label}',\n          items: [{ autogenerate: { directory: '${args.dir}' } }],\n        },`
        // Insertar antes de Roadmap
        cfg = cfg.replace(/(\s+{\s+label: 'Roadmap')/, `${entry}\n$1`)
        await fs.writeFile(CONFIG_PATH, cfg, 'utf-8')
      }
      return { dir: args.dir, label: args.label }
    },
    presentCall: (args) => ({
      card: 'generic',
      title: `Nueva categoría: ${args.label}`,
      content: [{ type: 'text', text: `Directorio: ${show(path.join(DOCS_ROOT, args.dir))}` }],
      locations: [{ path: show(path.join(DOCS_ROOT, args.dir, 'index.md')) }]
    })
  }))

  // Tool 5: Validar docs
  ctx.tools.register(defineTool({
    name: 'cnc_validate',
    description: 'Valida que todos los docs en CNC Docs tengan frontmatter válido (title, description) para Starlight. Debe pasar antes de build.',
    parameters: {},
    output: {
      schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'number' }, errors: { type: 'number' } } },
      render: (_args, value) => [{ type: 'text', text: `Validación: ${value.ok} OK, ${value.errors} errores` }],
    },
    async execute() {
      const files: string[] = []
      async function walk(d: string) {
        const entries = await fs.readdir(d, { withFileTypes: true })
        for (const e of entries) {
          const p = path.join(d, e.name)
          if (e.isDirectory()) await walk(p)
          else if (e.name.endsWith('.md') || e.name.endsWith('.mdx')) files.push(p)
        }
      }
      await walk(DOCS_ROOT)
      let ok = 0, errors = 0
      const bad: string[] = []
      for (const fp of files) {
        try {
          const c = await fs.readFile(fp, 'utf-8')
          validateFrontmatter(c)
          ok++
        } catch (err: unknown) {
          errors++
          bad.push(`${show(fp)}: ${err instanceof Error ? err.message : String(err)}`)
        }
      }
      if (errors > 0) throw new Error(`Errores: ${bad.join('\n')}`)
      return { ok, errors }
    }
  }))

  // Tool 6: Listar docs
  ctx.tools.register(defineTool({
    name: 'cnc_list_docs',
    description: 'Lista todos los documentos actuales en CNC Docs por categoría. Útil para que el agente sepa qué existe antes de crear/borrar.',
    parameters: {
      category: { type: 'string', description: 'Filtra por categoría, ej: linuxcnc/basico. Si no se pasa, lista todo.' },
    },
    output: {
      schema: { type: 'object', additionalProperties: false, properties: { docs: { type: 'array', required: true, items: { type: 'string' } } } },
      render: (_args, value) => [{ type: 'text', text: value.docs.join('\n') }],
    },
    async execute(args) {
      const base = args.category ? path.join(DOCS_ROOT, args.category) : DOCS_ROOT
      const docs: string[] = []
      async function walk(d: string) {
        const entries = await fs.readdir(d, { withFileTypes: true })
        for (const e of entries) {
          const p = path.join(d, e.name)
          if (e.isDirectory()) await walk(p)
          else if (e.name.endsWith('.md') || e.name.endsWith('.mdx')) docs.push(show(p))
        }
      }
      await walk(base)
      return { docs }
    }
  }))

  ctx.systemPrompt.section({
    name: 'cnc-docs-context',
    order: 500,
    text: `
Eres el gestor de CNC Docs, una documentación Starlight Astro en español para LinuxCNC, PrintNC v4, Mesa 7i96S, Remora, grblHAL y FluidNC.

Hardware de referencia: PrintNC v4 con Mesa 7i96S (IP 10.10.10.10) y Remora NVEM (STM32F207).
Tienes herramientas cnc_create_doc, cnc_edit_doc, cnc_delete_doc, cnc_add_category, cnc_validate, cnc_list_docs.

Reglas para generar contenido:
- Español técnico directo, sin traducción literal
- Siempre frontmatter válido Starlight
- Si es LinuxCNC: incluye INI/HAL comentado línea por línea listo para copiar/pegar
- Para PrintNC: valores concretos (160 steps/mm, DM556 2.8A, SFU1605)
- Usa mermaid para diagramas HAL
- Añade sección "Hardware aplicable" y "Próximo paso"
`
  })

  console.log('[cnc-docs-manager] Plugin cargado - 6 tools registradas')
}
