# CNC Docs — Documentación CNC en español

Documentación en español, 100% original y práctica, sobre **CNC y fabricación digital en general**: cualquier máquina (router, fresadora, plasma, láser, torno, 4/5 ejes, conversiones, DIY), cualquier control (LinuxCNC, GRBL/grblHAL, FluidNC, embebidos, Mesa, Remora, EtherCAT), mecánica, eléctrica, CAD/CAM y ecosistema abierto (FreeCAD, KiCad, etc.).

Construida con [Starlight Astro](https://starlight.astro.build) y optimizada para GitHub Pages.

Hardware de referencia por defecto (no es un límite): PrintNC v4 + Mesa 7i96S + Remora NVEM. Cuando un doc trata otro hardware o plataforma, documenta ese con sus valores reales.

## 🚀 Inicio rápido

```bash
npm install
npm run dev
# abre http://localhost:4321/CNC-Docs/
```

## 📁 Estructura

```
src/content/docs/
  guides/              -> introducción, cómo contribuir, MCP para visuales
  linuxcnc/basico      -> 0 a primer movimiento
  linuxcnc/intermedio  -> máquina usable y fiable
  linuxcnc/avanzado    -> máquina profesional y custom
  hardware/            -> controladoras, drivers, máquinas de referencia
  cam/                 -> FreeCAD + Fusion 360
  glosario/            -> multilingüe
  roadmap/             -> grblHAL, FluidNC y futuros
src/assets/docs/
  diagrams/            -> fuentes .drawio + SVG publicados
  schematics/          -> proyectos KiCad + exportaciones
  mechanics/           -> .FCStd + SVG/WebP
dsh-plugin-cnc-docs/   -> plugin del harness (8 tools) + su README y CHANGELOG
harness/               -> CLI simple alternativo (deepseek-harness.js)
```

## 🤖 Plugin del harness (vía DSH)

El agente gestiona los docs con el plugin `dsh-plugin-cnc-docs` (ver su [README](dsh-plugin-cnc-docs/README.md)): crear/editar/borrar docs y categorías, validar frontmatter, diagnosticar el entorno y **automatizar el setup de los MCP visuales** (draw.io, FreeCAD, KiCad) sin pasos manuales:

> "Lista los docs actuales de linuxcnc/basico"
> "Crea un doc en mecanica/alineacion sobre el squaring del pórtico"
> "Deja listo el entorno visual"
> "Valida los docs"

## 🌐 Deploy GitHub Pages

1. Repo debe llamarse `CNC-Docs`
2. Settings -> Pages -> Source: GitHub Actions
3. Push a main -> auto deploy

`astro.config.mjs` ya tiene `site: https://jhonma82.github.io` y `base: /CNC-Docs/`.

## 🗺️ Roadmap

- [x] LinuxCNC base (Mesa + Remora)
- [x] Guía de MCP para visuales (draw.io, KiCad, FreeCAD)
- [ ] Ensamblaje mecánico (referencia PrintNC v4, aplicable a otros routers)
- [ ] grblHAL
- [ ] FluidNC
- [ ] Glosario multilingüe completo

Nuevas categorías son bienvenidas aunque no aparezcan aquí: routers, plasma, láser, torno, 4/5 ejes, eléctrica, CAD/CAM.

## 🔖 Versionado

- Una sola versión para todo el proyecto, en `dsh-plugin-cnc-docs/package.json` (actual: **1.1.0**).
- Historial en [CHANGELOG.md](CHANGELOG.md) (repo) + detalle del plugin en [dsh-plugin-cnc-docs/CHANGELOG.md](dsh-plugin-cnc-docs/CHANGELOG.md).
- Cada release lleva un tag anotado `vX.Y.Z`.
- **Cada cambio se commitea**: un cambio = un commit lógico. Nada sin commitear.

## Licencia MIT
