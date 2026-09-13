---
title: Harness DeepSeek - Introducción
description: Cómo funciona el harness para editar docs con IA
---

El harness en `/harness` es un CLI Node que permite a DeepSeek (o cualquier LLM) crear, editar y borrar docs cumpliendo el schema de Starlight.

## Qué hace

- Valida frontmatter `title`, `description`, `sidebar`, `slug`
- Genera slugs optimizados
- Crea categorías automáticamente actualizando `astro.config.mjs`
- Versiona con git
- Publica a GitHub Pages

## Flujo para DeepSeek

DeepSeek recibe un system prompt (ver `harness/prompts/system-prompt.md`) que le obliga a:

1. Pensar en español técnico, directo
2. Usar plantilla Starlight
3. Incluir ejemplos INI/HAL comentados si es de LinuxCNC
4. Añadir `Hardware aplicable` y diagrama Mermaid si aplica

Luego ejecuta:

```bash
node harness/deepseek-harness.js create --category linuxcnc/basico --slug mi-nuevo-doc --title "Mi título" --content "$(cat generado.md)"
```
