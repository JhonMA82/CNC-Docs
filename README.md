# CNC Docs - PrintNC v4 + LinuxCNC + Mesa + Remora

Documentación en español, 100% original y práctica, construida con [Starlight Astro](https://starlight.astro.build) y optimizada para GitHub Pages.

## 🚀 Inicio rápido

```bash
npm install
npm run dev
# abre http://localhost:4321/CNC-Docs/
```

## 📁 Estructura

```
src/content/docs/
  linuxcnc/basico      -> 0 a primer movimiento
  linuxcnc/intermedio  -> máquina fiable
  linuxcnc/avanzado    -> 5 ejes, comp, GladeVCP
  hardware/            -> Mesa 7i96S, Remora, PrintNC v4
  cam/                 -> FreeCAD + Fusion 360
  glosario/
  harness/             -> docs del harness
harness/
  deepseek-harness.js  -> CLI para DeepSeek
  prompts/system-prompt.md -> prompt maestro
  templates/
```

## 🤖 Harness DeepSeek

Permite a DeepSeek (o tú) crear/editar/borrar docs sin romper Starlight:

```bash
# Crear categoría nueva (ej. grblHAL)
node harness/deepseek-harness.js add-category --id grblhal --label "grblHAL" --dir grblhal

# Crear doc con IA
DEEPSEEK_API_KEY=sk-... node harness/deepseek-harness.js deepseek --prompt "Crea doc sobre tuning de PID en PrintNC con servos JMC" --out-file ./tmp.md

# Validar
node harness/deepseek-harness.js create --category linuxcnc/intermedio --slug pid-tuning-jmc --title "PID Tuning JMC" --description "Guía" --content-file ./tmp.md

node harness/deepseek-harness.js validate

# Publicar
node harness/deepseek-harness.js publish --message "feat: agrega pid tuning JMC"
```

Ver `src/content/docs/harness/` para más.

## 🌐 Deploy GitHub Pages

1. Repo debe llamarse `CNC-Docs`
2. Settings -> Pages -> Source: GitHub Actions
3. Push a main -> auto deploy

`astro.config.mjs` ya tiene `site: https://jhonma82.github.io` y `base: /CNC-Docs/`.

## 🗺️ Roadmap

- [x] LinuxCNC base (Mesa + Remora)
- [ ] PrintNC v4 ensamblaje mecánico
- [ ] grblHAL
- [ ] FluidNC
- [ ] Glosario multilingüe completo

## Licencia MIT
