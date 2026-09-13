---
title: CLI del Harness
description: Comandos disponibles
---

```bash
# Crear
node harness/deepseek-harness.js create --category hardware --slug mesa-7i92 --title "Mesa 7i92" --description "Alternativa" --content-file ./tmp.md

# Editar (DeepSeek reescribe)
node harness/deepseek-harness.js edit --file src/content/docs/linuxcnc/basico/02-instalacion.md --prompt "Agrega sección de Debian 13"

# Borrar
node harness/deepseek-harness.js delete --file src/content/docs/roadmap/grblhal.md

# Añadir categoría
node harness/deepseek-harness.js add-category --id printnc --label "PrintNC" --dir printnc --icon wrench

# Validar todo
node harness/deepseek-harness.js validate

# Publicar (commit + push)
node harness/deepseek-harness.js publish --message "feat: agrega doc mesa 7i92 via DeepSeek"
```
