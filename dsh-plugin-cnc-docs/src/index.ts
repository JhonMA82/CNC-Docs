import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFile } from 'node:child_process'
import os from 'node:os'
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

// ── Entorno visual automático (MCP draw.io / FreeCAD / KiCad) ─────────────
// Principio: el usuario no hace nada manual. El plugin diagnostica
// (cnc_check_visual_env), instala y configura (cnc_setup_visual_env),
// intenta registrar en el cliente MCP y verifica el resultado.
const FREECAD_REPO = 'https://github.com/blwfish/freecad-mcp.git'
const KICAD_REPO = 'https://github.com/mixelpixx/KiCAD-MCP-Server.git'
const DRAWIO_PKG = '@drawio/mcp'

interface CmdResult { ok: boolean; code: number; out: string }

function runCmd(cmd: string, args: string[], timeoutMs = 60000, cwd?: string): Promise<CmdResult> {
  return new Promise((resolve) => {
    execFile(
      cmd, args,
      { timeout: timeoutMs, maxBuffer: 2 * 1024 * 1024, cwd, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } },
      (err, stdout, stderr) => {
        const out = `${stdout ?? ''}${stderr ?? ''}`.trim().slice(-1500)
        if (err) resolve({ ok: false, code: (err as { code?: number }).code ?? 1, out: out || String((err as Error).message).slice(0, 500) })
        else resolve({ ok: true, code: 0, out })
      },
    )
  })
}

async function pathExists(p: string): Promise<boolean> {
  try { await fs.access(p); return true } catch { return false }
}

async function whichBin(name: string): Promise<string | null> {
  const r = await runCmd('which', [name], 15000)
  if (!r.ok) return null
  const first = r.out.split('\n')[0]?.trim()
  return first || null
}

async function copyDir(src: string, dest: string): Promise<boolean> {
  try {
    await fs.mkdir(path.dirname(dest), { recursive: true })
    await fs.rm(dest, { recursive: true, force: true })
    await fs.cp(src, dest, { recursive: true })
    return true
  } catch { return false }
}

async function ensureRepo(repo: string, dest: string, log: string[]): Promise<boolean> {
  if (await pathExists(path.join(dest, '.git'))) {
    log.push(`repo ya existe en ${dest}, intentando actualizar (git pull)`)
    const pull = await runCmd('git', ['-C', dest, 'pull', '--ff-only'], 120000)
    log.push(`git pull: ${pull.ok ? 'actualizado' : `no se pudo actualizar (${pull.out.slice(0, 200)}), se sigue con la copia local`}`)
    return true
  }
  if (await pathExists(dest)) {
    log.push(`${dest} existe pero no es un clon git, se reutiliza tal cual`)
    return true
  }
  const clone = await runCmd('git', ['clone', '-b', 'main', '--depth', '1', repo, dest], 300000)
  log.push(`git clone ${repo}: ${clone.ok ? 'OK' : `FALLO: ${clone.out.slice(0, 300)}`}`)
  return clone.ok
}

// ── Checks (solo lectura) ─────────────────────────────────────────────────
async function checkDrawio(): Promise<{ ready: boolean; detail: string }> {
  const node = await runCmd('node', ['--version'])
  if (!node.ok) return { ready: false, detail: 'node no encontrado en PATH: instala Node.js' }
  const view = await runCmd('npm', ['view', DRAWIO_PKG, 'version'], 90000)
  if (!view.ok) return { ready: false, detail: `node ${node.out} pero no se pudo contactar npm (${DRAWIO_PKG}): ${view.out.slice(0, 200)}` }
  return { ready: true, detail: `node ${node.out}; ${DRAWIO_PKG}@${view.out} disponible vía npx, sin instalación` }
}

async function findFreeCADCmd(): Promise<string | null> {
  for (const c of ['FreeCADCmd', 'freecadcmd']) {
    const p = await whichBin(c)
    if (p) return p
  }
  for (const p of ['/usr/bin/FreeCADCmd', '/usr/bin/freecadcmd', '/usr/local/bin/FreeCADCmd']) {
    if (await pathExists(p)) return p
  }
  return null
}

async function freeCADModDir(fccmd: string): Promise<string | null> {
  const r = await runCmd(fccmd, ['-c', 'import FreeCAD, os; print(os.path.join(FreeCAD.getUserAppDataDir(), "Mod"))'], 90000)
  if (!r.ok) return null
  const last = r.out.split('\n').map((l) => l.trim()).filter(Boolean).pop()
  return last || null
}

async function checkFreecad(): Promise<{ ready: boolean; detail: string }> {
  const parts: string[] = []
  let ready = true
  const fccmd = await findFreeCADCmd()
  if (!fccmd) { ready = false; parts.push('FreeCAD no encontrado (instálalo desde freecad.org)'); }
  else {
    const v = await runCmd(fccmd, ['--version'], 90000)
    parts.push(`FreeCAD: ${v.ok ? v.out.split('\n')[0] : 'instalado pero --version falló'}`)
    if (!v.ok) ready = false
  }
  const py = await runCmd('python3', ['--version'])
  const m = py.out.match(/Python (\d+)\.(\d+)/)
  if (!py.ok || !m || Number(m[1]) < 3 || (Number(m[1]) === 3 && Number(m[2]) < 10)) {
    ready = false
    parts.push('Python 3.10+ no encontrado')
  } else parts.push(`Python ${m[0].replace('Python ', '')} OK`)
  for (const pkg of ['mcp', 'mcp-events']) {
    const s = await runCmd('python3', ['-m', 'pip', 'show', pkg], 30000)
    if (!s.ok) { ready = false; parts.push(`paquete pip ${pkg}: FALTA`) }
    else parts.push(`paquete pip ${pkg}: OK`)
  }
  const home = os.homedir()
  const bridge = path.join(home, '.freecad-mcp', 'freecad_mcp_server.py')
  if (await pathExists(bridge)) parts.push('puente MCP (~/.freecad-mcp/): OK')
  else { ready = false; parts.push('puente MCP (~/.freecad-mcp/): FALTA') }
  if (fccmd) {
    const mod = await freeCADModDir(fccmd)
    if (mod && await pathExists(path.join(mod, 'AICopilot'))) parts.push('workbench AICopilot: OK')
    else { ready = false; parts.push('workbench AICopilot: FALTA en FreeCAD') }
  }
  const running = await runCmd('pgrep', ['-f', '[F]reeCAD'], 15000)
  parts.push(running.ok ? 'FreeCAD en ejecución: sí' : 'FreeCAD en ejecución: no (ábrelo para usar el MCP)')
  return { ready, detail: parts.join(' | ') }
}

const KICAD_PYPATH_CANDIDATES = [
  '/usr/lib/kicad/lib/python3/dist-packages',
  '/usr/local/lib/kicad/lib/python3/dist-packages',
  '/opt/kicad/lib/python3/dist-packages',
]

async function findPcbnew(): Promise<{ ok: boolean; how: string }> {
  const probe = 'import pcbnew; print(pcbnew.GetBuildVersion())'
  const sys = await runCmd('python3', ['-c', probe], 60000)
  if (sys.ok) return { ok: true, how: `python3 del sistema importa pcbnew (${sys.out.split('\n')[0].slice(0, 80)})` }
  for (const p of KICAD_PYPATH_CANDIDATES) {
    if (!(await pathExists(p))) continue
    const r = await runCmd('python3', ['-c', `import sys; sys.path.insert(0, ${JSON.stringify(p)}); ${probe}`], 60000)
    if (r.ok) return { ok: true, how: `pcbnew vía PYTHONPATH=${p}` }
  }
  return { ok: false, how: 'pcbnew no importable con python3 (prueba el Python empaquetado con KiCad)' }
}

async function checkKicad(): Promise<{ ready: boolean; detail: string }> {
  const parts: string[] = []
  let ready = true
  const node = await runCmd('node', ['--version'])
  if (!node.ok) { ready = false; parts.push('node no encontrado en PATH') }
  else parts.push(`node ${node.out} OK`)
  const dist = path.join(os.homedir(), 'KiCAD-MCP-Server', 'dist', 'index.js')
  if (await pathExists(dist)) parts.push('servidor KiCAD-MCP compilado (dist/index.js): OK')
  else { ready = false; parts.push('servidor KiCAD-MCP: FALTA (clonar + npm install + build)') }
  const pb = await findPcbnew()
  if (pb.ok) parts.push(pb.how)
  else { ready = false; parts.push(pb.how) }
  return { ready, detail: parts.join(' | ') }
}

// ── Setup (instala y configura) ───────────────────────────────────────────
async function setupDrawio(log: string[]): Promise<{ ready: boolean; entry: Record<string, string | string[]> | null }> {
  const c = await checkDrawio()
  log.push(`[drawio] ${c.detail}`)
  if (!c.ready) return { ready: false, entry: null }
  return { ready: true, entry: { command: 'npx', args: ['-y', DRAWIO_PKG] } }
}

async function setupFreecad(baseDir: string, log: string[]): Promise<{ ready: boolean; entry: Record<string, string | string[]> | null }> {
  if (!await whichBin('git')) { log.push('[freecad] git no encontrado, no se puede clonar'); return { ready: false, entry: null } }
  const pip = await runCmd('python3', ['-m', 'pip', 'install', '--user', 'mcp>=2.0.0', 'mcp-events>=0.1.0'], 300000)
  log.push(`[freecad] pip install mcp/mcp-events: ${pip.ok ? 'OK' : `FALLO: ${pip.out.slice(0, 300)}`}`)
  const repoDir = path.join(baseDir, 'freecad-mcp')
  if (!await ensureRepo(FREECAD_REPO, repoDir, log)) return { ready: false, entry: null }
  const bridgeDir = path.join(os.homedir(), '.freecad-mcp')
  await fs.mkdir(bridgeDir, { recursive: true })
  let bridgeOk = true
  for (const f of ['freecad_mcp_server.py', 'mcp_bridge_framing.py']) {
    try {
      await fs.copyFile(path.join(repoDir, f), path.join(bridgeDir, f))
    } catch { bridgeOk = false; log.push(`[freecad] no se pudo copiar ${f}`) }
  }
  if (bridgeOk) log.push('[freecad] puente copiado a ~/.freecad-mcp/')
  const fccmd = await findFreeCADCmd()
  if (fccmd) {
    const mod = await freeCADModDir(fccmd)
    if (mod) {
      const ok = await copyDir(path.join(repoDir, 'AICopilot'), path.join(mod, 'AICopilot'))
      log.push(`[freecad] workbench AICopilot → ${mod}: ${ok ? 'OK' : 'FALLO'}`)
    } else log.push('[freecad] no se pudo resolver la carpeta Mod de FreeCAD')
  } else log.push('[freecad] FreeCAD no instalado: instala FreeCAD 1.1.x desde freecad.org y reejecuta')
  const c = await checkFreecad()
  log.push(`[freecad] verificación: ${c.detail}`)
  const entry = await pathExists(path.join(bridgeDir, 'freecad_mcp_server.py'))
    ? { command: 'python3', args: [path.join(bridgeDir, 'freecad_mcp_server.py')] }
    : null
  return { ready: c.ready, entry }
}

async function setupKicad(baseDir: string, log: string[]): Promise<{ ready: boolean; entry: Record<string, string | string[] | Record<string, string>> | null }> {
  if (!await whichBin('git')) { log.push('[kicad] git no encontrado, no se puede clonar'); return { ready: false, entry: null } }
  const node = await runCmd('node', ['--version'])
  if (!node.ok) { log.push('[kicad] node no encontrado, instala Node.js y reejecuta'); return { ready: false, entry: null } }
  const repoDir = path.join(baseDir, 'KiCAD-MCP-Server')
  if (!await ensureRepo(KICAD_REPO, repoDir, log)) return { ready: false, entry: null }
  const dist = path.join(repoDir, 'dist', 'index.js')
  if (!await pathExists(dist)) {
    const inst = await runCmd('npm', ['install'], 300000, repoDir)
    log.push(`[kicad] npm install: ${inst.ok ? 'OK' : `FALLO: ${inst.out.slice(0, 300)}`}`)
    if (inst.ok) {
      const build = await runCmd('npm', ['run', 'build'], 300000, repoDir)
      log.push(`[kicad] npm run build: ${build.ok ? 'OK' : `FALLO: ${build.out.slice(0, 300)}`}`)
    }
  } else log.push('[kicad] dist/index.js ya compilado, se reutiliza')
  const pb = await findPcbnew()
  log.push(`[kicad] pcbnew: ${pb.how}`)
  let pythonPath = ''
  const mm = pb.how.match(/PYTHONPATH=(\S+)/)
  if (mm) pythonPath = mm[1]
  const c = await checkKicad()
  log.push(`[kicad] verificación: ${c.detail}`)
  const entry: Record<string, string | string[] | Record<string, string>> = { command: 'node', args: [dist] }
  if (pythonPath) entry.env = { PYTHONPATH: pythonPath }
  return { ready: c.ready, entry: await pathExists(dist) ? entry : null }
}

async function tryRegisterClient(name: string, entry: Record<string, unknown>, log: string[]): Promise<void> {
  const claude = await whichBin('claude')
  if (!claude) {
    log.push(`[registro] CLI 'claude' no disponible: registra '${name}' a mano con el JSON de clientConfigJson`)
    return
  }
  const args = ['mcp', 'add', '--scope', 'user', name]
  const env = entry.env as Record<string, string> | undefined
  if (env) for (const [k, v] of Object.entries(env)) args.push('--env', `${k}=${v}`)
  args.push('--', String(entry.command), ...((entry.args as string[]) ?? []))
  let r = await runCmd('claude', args, 60000)
  if (!r.ok) {
    // Reintento sin --scope (CLI antiguos)
    const retry = ['mcp', 'add', name]
    if (env) for (const [k, v] of Object.entries(env)) retry.push('--env', `${k}=${v}`)
    retry.push('--', String(entry.command), ...((entry.args as string[]) ?? []))
    r = await runCmd('claude', retry, 60000)
  }
  log.push(`[registro] claude mcp add ${name}: ${r.ok ? 'OK' : `FALLO (${r.out.slice(0, 200)}), usa clientConfigJson a mano`}`)
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

  // Tool 7: Diagnosticar entorno visual (solo lectura, sin instalar nada)
  ctx.tools.register(defineTool({
    name: 'cnc_check_visual_env',
    description: 'Diagnostica si los MCP visuales (draw.io, FreeCAD, KiCad) están listos: versiones, paquetes, puente, workbench y servidor compilado. Solo lee, no instala.',
    parameters: {
      targets: { type: 'array', items: { type: 'string' }, description: 'Opcional: subconjunto entre drawio, freecad, kicad. Por defecto los tres.' },
    },
    output: {
      schema: {
        type: 'object', additionalProperties: false,
        properties: {
          ready: { type: 'boolean' },
          summary: { type: 'string' },
          drawioReady: { type: 'boolean' }, drawioDetail: { type: 'string' },
          freecadReady: { type: 'boolean' }, freecadDetail: { type: 'string' },
          kicadReady: { type: 'boolean' }, kicadDetail: { type: 'string' },
        },
      },
      render: (_args, value) => [{ type: 'text', text: value.summary }],
    },
    async execute(args) {
      const t = args as { targets?: string[] }
      const want = (n: string) => !t.targets || t.targets.length === 0 || t.targets.includes(n)
      const d = want('drawio') ? await checkDrawio() : { ready: true, detail: 'no solicitado' }
      const f = want('freecad') ? await checkFreecad() : { ready: true, detail: 'no solicitado' }
      const k = want('kicad') ? await checkKicad() : { ready: true, detail: 'no solicitado' }
      const ready = d.ready && f.ready && k.ready
      const summary = `Entorno visual: ${ready ? 'LISTO' : 'INCOMPLETO'} | draw.io ${d.ready ? '✅' : '❌'} | FreeCAD ${f.ready ? '✅' : '❌'} | KiCad ${k.ready ? '✅' : '❌'}${ready ? '' : ' → ejecuta cnc_setup_visual_env'}`
      return {
        ready, summary,
        drawioReady: d.ready, drawioDetail: d.detail,
        freecadReady: f.ready, freecadDetail: f.detail,
        kicadReady: k.ready, kicadDetail: k.detail,
      }
    },
    presentCall: () => ({
      card: 'generic',
      title: 'Diagnóstico entorno visual',
      content: [{ type: 'text', text: 'Comprueba draw.io, FreeCAD y KiCad sin instalar nada.' }],
      locations: []
    }),
  }))

  // Tool 8: Instalar y configurar entorno visual automáticamente
  ctx.tools.register(defineTool({
    name: 'cnc_setup_visual_env',
    description: 'Instala y configura automáticamente los MCP visuales (draw.io, FreeCAD, KiCad): dependencias pip/npm, clones git, puente FreeCAD, workbench AICopilot, build KiCad y registro en el cliente MCP. El usuario no hace nada manual. Puede tardar varios minutos.',
    parameters: {
      targets: { type: 'array', items: { type: 'string' }, description: 'Opcional: subconjunto entre drawio, freecad, kicad. Por defecto los tres.' },
      baseDir: { type: 'string', description: 'Opcional: directorio base para clonar repos. Por defecto el home del usuario.' },
      register: { type: 'boolean', description: 'Opcional: intenta registrar en el cliente MCP (claude CLI). Por defecto true.' },
    },
    output: {
      schema: {
        type: 'object', additionalProperties: false,
        properties: {
          ok: { type: 'boolean' },
          summary: { type: 'string' },
          log: { type: 'string' },
          clientConfigJson: { type: 'string' },
        },
      },
      render: (_args, value) => [{ type: 'text', text: value.summary }],
    },
    async execute(args) {
      const t = args as { targets?: string[]; baseDir?: string; register?: boolean }
      const want = (n: string) => !t.targets || t.targets.length === 0 || t.targets.includes(n)
      const base = t.baseDir || os.homedir()
      const log: string[] = [`baseDir: ${base}`]
      const servers: Record<string, unknown> = {}
      let ok = true
      if (want('drawio')) {
        const r = await setupDrawio(log)
        if (r.ready && r.entry) servers.drawio = r.entry
        else ok = false
      }
      if (want('freecad')) {
        const r = await setupFreecad(base, log)
        if (r.ready && r.entry) servers.freecad = r.entry
        else ok = false
      }
      if (want('kicad')) {
        const r = await setupKicad(base, log)
        if (r.entry) servers.kicad = r.entry
        if (!r.ready) ok = false
      }
      const clientConfigJson = JSON.stringify({ mcpServers: servers }, null, 2)
      if (t.register !== false) {
        for (const [name, entry] of Object.entries(servers)) {
          await tryRegisterClient(name, entry as Record<string, unknown>, log)
        }
      }
      const names = Object.keys(servers)
      const summary = ok
        ? `Entorno visual LISTO (${names.join(', ')}). Servidores configurados y registro intentado; abre FreeCAD para usar el MCP de mecánica.`
        : `Entorno visual INCOMPLETO. Revisa el log; reejecuta cnc_setup_visual_env tras resolver lo indicado.`
      return { ok, summary, log: log.join('\n').slice(-4000), clientConfigJson }
    },
    presentCall: (args) => ({
      card: 'generic',
      title: 'Setup automático entorno visual',
      content: [{ type: 'text', text: `Instala y configura: ${(args as { targets?: string[] }).targets?.join(', ') || 'drawio, freecad, kicad'}` }],
      locations: []
    }),
  }))

  ctx.systemPrompt.section({
    name: 'cnc-docs-context',
    order: 500,
    text: `
Eres el gestor de CNC Docs, una documentación Starlight Astro en español sobre CNC y fabricación digital en general: cualquier máquina (router, fresadora, plasma, láser, torno, 4/5 ejes, conversiones, DIY), cualquier control (LinuxCNC, GRBL/grblHAL, FluidNC, embebidos, Mesa, Remora, EtherCAT), mecánica, eléctrica, CAD/CAM y ecosistema abierto (FreeCAD, KiCad, etc.).

Hardware de referencia por defecto (no es un límite): PrintNC v4 con Mesa 7i96S (IP 10.10.10.10) y Remora NVEM (STM32F207). Cuando el doc trate de otro hardware o plataforma, documenta ese en su lugar con sus valores reales. Si la petición no especifica plataforma ni máquina y no puedes averiguarlo inspeccionando el repo, pregunta al usuario antes de redactar.
Tienes herramientas cnc_create_doc, cnc_edit_doc, cnc_delete_doc, cnc_add_category, cnc_validate, cnc_list_docs.

Reglas para generar contenido:
- Español técnico directo, sin traducción literal; conserva en inglés los términos CNC que confundan traducidos (home, joint, feed rate, backlash…), explicados la primera vez
- Siempre frontmatter válido Starlight
- Configuración lista para copiar/pegar en el formato nativo de la plataforma del doc, comentada línea por línea (si es LinuxCNC: INI/HAL; en otras plataformas: su formato propio, igual de comentado y verificable)
- Valores concretos del hardware tratado (para la referencia PrintNC: 160 steps/mm, DM556 2.8A, SFU1605). Nunca inventes parámetros, pines, comandos ni valores: omite o marca lo que no puedas verificar en fuentes oficiales
- Diagramas: prefiere draw.io MCP (SVG editable); si MCP no disponible, usa mermaid y deja VISUAL_PENDING para la versión definitiva
- Añade sección "Hardware aplicable" y "Próximo paso"
- Entorno visual automático (el usuario no hace nada manual): ante cualquier necesidad de diagramas, electrónica o mecánica, primero cnc_check_visual_env y si falta algo cnc_setup_visual_env (instala dependencias, clona, configura y registra solo); verifica al final y reporta qué quedó listo
- MCP visuales (detalle en guides/mcp-visuales; úsalos solo cuando el texto no baste):
  draw.io → jgraph/drawio-mcp → npx -y @drawio/mcp (sin instalación; tools: open_drawio_xml/csv/mermaid, search_shapes).
  KiCad → mixelpixx/KiCAD-MCP-Server → requiere KiCad 9.0 + PYTHONPATH al Python de KiCad; nunca IA para circuitos construibles.
  FreeCAD → blwfish/freecad-mcp → requiere FreeCAD 1.1.x (weekly dev para CAM) + workbench AICopilot en ejecución; verificar con check_freecad_connection.
  Fuentes editables (.drawio, proyecto KiCad, .FCStd) + publicado SVG/WebP en src/assets/docs/{diagrams,schematics,mechanics}. Si el MCP no está disponible en la sesión, deja VISUAL_PENDING y sigue redactando.
`
  })

  ctx.systemPrompt.section({
    name: 'cnc-docs-visual',
    order: 501,
    text: `
Estrategia visual CNC Docs: usa imágenes/diagramas/esquemas solo cuando ayuden a comprender un concepto, procedimiento, conexión, movimiento, arquitectura o problema. Nada decorativo. Antes de crear un visual pregúntate: "¿El lector lo entenderá claramente solo con texto?" Si sí, no generes visual. Si un visual reduce significativamente la complejidad, créalo o deja preparada su generación.

Prioridad de representación (usa lo más simple que resuelva): 1. texto 2. lista/tabla 3. diagrama 4. esquema técnico 5. captura real 6. fotografía/modelo técnico 7. ilustración generada con IA. No conviertas información sencilla en imagen innecesaria.

Visual Decision Router (evalúa cada sección mientras redactas):
- Diagrama conceptual/arquitectura (flujo CAD→CAM→G-code→controlador, control→interfaz→hardware→máquina —ej. LinuxCNC→HAL→Mesa, FluidNC→drivers—, PC→controladora→drivers→motores, EtherCAT, estados de homing, árbol diagnóstico, flujo señales, secuencia funcionamiento): draw.io vía MCP (editable + SVG). Alternativa simple tipo pizarrón: Excalidraw vía MCP.
- Esquema eléctrico didáctico (fuente-driver-motor, sensores, E-stop, VFD/spindle, Arc OK, contactores, relés, interlocks): draw.io vía MCP con símbolos eléctricos. Explica conexiones pero no lo presentes como plano de ingeniería listo para construir salvo que pase validación técnica.
- Electrónica real (optoaislado, adaptación 24V→lógica, interfaz sensores, PCB, auxiliares): KiCad vía MCP (conserva esquema/PCB editable + exportación visual). Nunca uses IA para circuitos que deban construirse.
- Mecánica y montaje (ballscrew, motor+acople+soporte, guías, rack & pinion, pórtico, sensores, alineación, disposición, piezas): FreeCAD vía MCP (modelo editable, iso, sección, plano técnico, SVG, WebP/PNG). Didáctico no exige exactitud dimensional; si hay cotas fabricables deben venir de fuente verificada.
- Interfaz software (ej. LinuxCNC/QtPlasmaC/QtDragon, FreeCAD CAM, HAL Show, PnCconf, configuradores de grblHAL/FluidNC, diagnóstico): capturas reales + solo anotaciones útiles (flechas, números, recuadros, resaltados). No reconstruyas interfaces con IA. Evita texto largo incrustado.
- Componente físico (guía, ballscrew, sensor, motor, VFD, driver, placa, herramienta): prioridad 1. doc/CAD oficial fabricante 2. foto con licencia compatible 3. catálogo técnico 4. modelo propio 5. ilustración generada. Prefiere crear vista propia desde CAD antes que copiar foto comercial.
- Catálogos tipo JLCMC: úsalos para identificar, dimensiones, nomenclatura, variantes, dibujos y CAD 2D/3D como referencia para ilustraciones propias. Flujo preferido: catálogo → modelo CAD → FreeCAD → vista propia → docs. Sin scraping masivo ni reutilización de imágenes comerciales sin licencia clara. Registra siempre la fuente técnica.

Generación con IA: solo contenido didáctico/conceptual (backlash, flexión estructural, evacuación viruta, operación CNC, situación trabajo, comparativa máquinas, fenómeno difícil de fotografiar). PROHIBIDO para: pinouts, cableado, esquemas eléctricos, circuitos, tolerancias, dimensiones, posiciones exactas, interfaces reales, seguridad, geometría fabricable.
Si puedes generar: 1. prompt técnico específico 2. genera 3. verifica que explique bien 4. evita texto pequeño 5. nombre descriptivo 6. inserta 7. alt descriptivo. No aceptes imagen incorrecta por bonita.
Si NO puedes generar: no detengas la doc, inserta marcador IMAGE_PENDING con purpose, filename, placement y prompt autocontenido. Ejemplo:
<!-- IMAGE_PENDING
purpose: Explicar backlash en eje CNC.
filename: backlash-explicado.webp
placement: Después de la explicación inicial de backlash.
prompt: Ilustración técnica educativa de eje CNC con ballscrew, dos estados y movimiento perdido al invertir dirección. Vista lateral limpia, estilo didáctico, fondo neutro, sin texto decorativo, sin dimensiones inventadas.
-->

Si el visual requiere MCP no disponible en la sesión: no improvises versión inferior, deja VISUAL_PENDING específico:
<!-- VISUAL_PENDING
type: diagram | schematic | mechanical
tool: drawio | freecad | kicad | excalidraw
purpose: Qué debe mostrar (ej. cadena controladora→drivers→motores con retorno de encoders).
filename: cadena-control-motores.svg
reference: (solo mecánica/electrónica) modelo CAD o fuente verificada.
-->

Estados de trabajo (regla interna, no metadata obligatoria): VISUAL_REQUIRED (falta y es necesario), VISUAL_CREATED (integrado), VISUAL_VERIFIED (contrastado con fuente técnica).
Verificación técnica obligatoria para todo visual verificable (electricidad, electrónica, seguridad, pinouts, conexiones, dimensiones, tolerancias, hardware, mecanismos, movimientos, secuencias). Si es solo conceptual y hay riesgo de confusión, indica "representación simplificada".

Fuente editable y publicación: conserva .drawio, Excalidraw, .FCStd, proyecto KiCad, SVG fuente. Publica SVG para diagramas, WebP/PNG para renders/fotos. No dependas solo de raster si necesitará correcciones.
Archivos: respeta estructura existente del proyecto; si no hay convención usa src/assets/docs/{diagrams,schematics,mechanics,screenshots,photos,illustrations} sin subdirectorios excesivos; si el proyecto pone assets junto al tema, consérvalo. Nombres kebab-case minúsculas descriptivos (ej. mesa-step-dir-feedback.svg, ballscrew-fixed-floating-support.webp, qtplasmac-thc-panel.webp). Nada de image1.png.
Accesibilidad: toda imagen con alt útil que describa lo que comunica (ej. "Flujo de señales desde el controlador hacia los drivers y motores, con retorno de encoders"), no genéricos tipo "Imagen del esquema" ni duplicar todo el texto circundante. Minimiza texto incrustado: etiquetas cortas, números, nombres técnicos, flechas; explicaciones largas en Markdown.
Consistencia: diagramas limpios, pocos elementos, jerarquía clara, color solo con significado, símbolos y flechas consistentes. No infografías decorativas.
Diagnóstico con múltiples causas: considera árbol de diagnóstico en texto y, si mejora lectura y hay draw.io MCP, conviértelo a SVG editable.
No fuerces cuota de imágenes: unas páginas necesitan cero, otras varias. Normalmente NO necesitan imagen: sintaxis comando, tabla códigos, definición corta, parámetro simple. Normalmente SÍ aportan: movimientos, coordenadas, backlash, cableado, flujo señales, arquitectura, mecánica, montaje, diagnóstico, interfaces.
Regla final: el visual existe para que el lector entienda más rápido, cometa menos errores, identifique componentes, comprenda conexiones, visualice movimientos, diagnostique y ejecute con más seguridad. Si no mejora alguno de esos puntos, no lo crees.
`
  })

  console.log('[cnc-docs-manager] Plugin cargado - 8 tools registradas')
}
