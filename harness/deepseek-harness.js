#!/usr/bin/env node
/**
 * CNC Docs - DeepSeek Harness
 * Edita / crea / borra docs optimizados para Starlight + versiona y publica
 * Diseñado para ser usado por DeepSeek API o humano
 * 
 * Uso:
 *   node harness/deepseek-harness.js create --category linuxcnc/basico --slug nuevo-doc --title "Titulo" --description "Desc" --content-file ./tmp.md
 *   node harness/deepseek-harness.js add-category --id grblhal --label "grblHAL" --dir grblhal
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DOCS_ROOT = path.join(ROOT, 'src/content/docs');
const CONFIG_PATH = path.join(ROOT, 'astro.config.mjs');

function parseArgs() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const opts = {};
  for (let i=1;i<args.length;i++) {
    if (args[i].startsWith('--')) {
      const k = args[i].replace('--','');
      const v = args[i+1] && !args[i+1].startsWith('--') ? args[i+1] : true;
      opts[k] = v;
      if (v!==true) i++;
    }
  }
  return { cmd, opts };
}

function ensureDir(p){ fs.mkdirSync(p, {recursive:true}); }

function slugify(str){
  return str.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}

function validateFrontmatter(content){
  const fm = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) throw new Error('Falta frontmatter --- title/description ---');
  if (!/title:/.test(fm[1])) throw new Error('Falta title en frontmatter');
  if (!/description:/.test(fm[1])) throw new Error('Falta description en frontmatter');
  return true;
}

function createDoc({category, slug, title, description, content, contentFile}){
  if (!category || !slug || !title) throw new Error('create necesita --category --slug --title');
  let body = content || '';
  if (contentFile) body = fs.readFileSync(path.resolve(contentFile), 'utf-8');
  if (!body) body = `# ${title}\n\nContenido pendiente.`;

  const dir = path.join(DOCS_ROOT, category);
  ensureDir(dir);
  const filePath = path.join(dir, `${slug}.md`);
  if (fs.existsSync(filePath)) throw new Error(`Ya existe ${filePath}`);

  const finalContent = `---
title: ${JSON.stringify(title)}
description: ${JSON.stringify(description || 'Doc de CNC Docs')}
---

${body}
`;

  validateFrontmatter(finalContent);
  fs.writeFileSync(filePath, finalContent, 'utf-8');
  console.log(`✅ Creado ${path.relative(ROOT, filePath)}`);
  return filePath;
}

function editDoc({file, prompt, contentFile}){
  if (!file) throw new Error('edit necesita --file');
  const abs = path.resolve(ROOT, file);
  if (!fs.existsSync(abs)) throw new Error(`No existe ${abs}`);
  let newContent = '';
  if (contentFile) newContent = fs.readFileSync(path.resolve(contentFile), 'utf-8');
  else if (prompt) {
    // Si se pasa prompt, asumimos que DeepSeek ya generó el contenido y lo pasa por stdin o file
    // Aquí solo marcamos que debe ser editado manualmente - para DeepSeek harness real, llamarías a la API
    console.log(`ℹ️ Prompt recibido: ${prompt}. Esperando content-file con nuevo contenido...`);
    throw new Error('Para edit, pasa --content-file con el contenido completo nuevo');
  }
  validateFrontmatter(newContent);
  fs.writeFileSync(abs, newContent, 'utf-8');
  console.log(`✅ Editado ${file}`);
}

function deleteDoc({file}){
  if (!file) throw new Error('delete necesita --file');
  const abs = path.resolve(ROOT, file);
  if (!fs.existsSync(abs)) throw new Error(`No existe ${abs}`);
  fs.unlinkSync(abs);
  console.log(`🗑️ Borrado ${file}`);
}

function addCategory({id, label, dir, icon}){
  if (!id || !label || !dir) throw new Error('add-category necesita --id --label --dir');
  const docsDir = path.join(DOCS_ROOT, dir);
  ensureDir(docsDir);
  // Crea index placeholder si no existe
  const indexPath = path.join(docsDir, 'index.md');
  if (!fs.existsSync(indexPath)){
    fs.writeFileSync(indexPath, `---\ntitle: ${label}\ndescription: Categoría ${label} en CNC Docs\n---\n\nBienvenido a ${label}.\n`, 'utf-8');
  }
  // Actualiza astro.config.mjs añadiendo sidebar entry
  let cfg = fs.readFileSync(CONFIG_PATH, 'utf-8');
  if (!cfg.includes(`autogenerate: { directory: '${dir}' }`)){
    // Inserta antes del cierre del sidebar array - simple replace
    const entry = `        {\n          label: '${label}',\n          items: [{ autogenerate: { directory: '${dir}' } }],\n        },`;
    // Busca última categoría roadmap y inserta antes
    cfg = cfg.replace(/(\s+{\s+label: 'Roadmap')/, `${entry}\n$1`);
    fs.writeFileSync(CONFIG_PATH, cfg, 'utf-8');
    console.log(`✅ Categoría ${label} añadida al sidebar (${dir})`);
  } else {
    console.log(`ℹ️ Categoría ${dir} ya existe en sidebar`);
  }
  console.log(`✅ Directorio ${docsDir} listo`);
}

function validateDocs(){
  const files = [];
  function walk(d){
    for (const f of fs.readdirSync(d)){
      const p = path.join(d,f);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) walk(p);
      else if (f.endsWith('.md') || f.endsWith('.mdx')) files.push(p);
    }
  }
  walk(DOCS_ROOT);
  let ok=0, fail=0;
  for (const fp of files){
    try{
      const c = fs.readFileSync(fp,'utf-8');
      validateFrontmatter(c);
      ok++;
    } catch(e){
      console.error(`❌ ${path.relative(ROOT, fp)}: ${e.message}`);
      fail++;
    }
  }
  console.log(`\nValidación: ${ok} OK, ${fail} errores`);
  if (fail>0) process.exit(1);
}

function publish({message}){
  const msg = message || 'docs: update via harness';
  try{
    execSync('git add -A', {cwd: ROOT, stdio:'inherit'});
    execSync(`git commit -m ${JSON.stringify(msg)}`, {cwd: ROOT, stdio:'inherit'});
    execSync('git push', {cwd: ROOT, stdio:'inherit'});
    console.log('🚀 Publicado a GitHub');
  } catch(e){
    console.error('Error en publish, ¿repo git inicializado?', e.message);
  }
}

// DeepSeek integration helper
async function callDeepSeek({prompt, systemPromptFile}){
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('Falta DEEPSEEK_API_KEY en env');
  const systemPrompt = systemPromptFile ? fs.readFileSync(path.resolve(systemPromptFile),'utf-8') : fs.readFileSync(path.join(__dirname,'prompts/system-prompt.md'),'utf-8');
  // Ejemplo de llamada - DeepSeek es compatible OpenAI
  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages:[
        {role:'system', content: systemPrompt},
        {role:'user', content: prompt}
      ],
      temperature: 0.3
    })
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content;
}

async function main(){
  const {cmd, opts} = parseArgs();
  try{
    switch(cmd){
      case 'create': createDoc(opts); break;
      case 'edit': editDoc(opts); break;
      case 'delete': deleteDoc(opts); break;
      case 'add-category': addCategory(opts); break;
      case 'validate': validateDocs(); break;
      case 'publish': publish(opts); break;
      case 'deepseek': {
        const content = await callDeepSeek(opts);
        console.log(content);
        if (opts['out-file']) fs.writeFileSync(path.resolve(opts['out-file']), content, 'utf-8');
        break;
      }
      default:
        console.log(`
CNC Docs Harness - Comandos:
  create --category <dir> --slug <slug> --title <title> [--description <desc>] [--content "..." | --content-file ./file.md]
  edit --file <path> --content-file <new.md>
  delete --file <path>
  add-category --id <id> --label <Label> --dir <dir> [--icon <icon>]
  validate
  publish --message "feat: ..."
  deepseek --prompt "Crea doc sobre..." --out-file ./tmp.md [--system-prompt-file ./prompts/system-prompt.md]

Ejemplos:
  node harness/deepseek-harness.js add-category --id printnc --label "PrintNC" --dir printnc
  node harness/deepseek-harness.js create --category printnc --slug ensamblaje --title "Ensamblaje PrintNC v4" --description "Guía" --content-file ./draft.md
`);
    }
  } catch(e){
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}
main();
