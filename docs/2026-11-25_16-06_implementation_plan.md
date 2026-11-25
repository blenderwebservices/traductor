# Plan de Implementación: Botones de Pegar y Copiar en Cuadros de Origen y Destino

**Fecha y Hora:** 2026-11-25 16:06  
**Autor:** Antigravity Agent  

---

## Objetivo
1. **Botón de Pegar en Cuadro de Origen:**
   - Incorporar un botón en la barra de acciones del cuadro de origen (`📋 Pegar`) para pegar el contenido del portapapeles si existe texto.
   - Al presionarlo, actualizar el texto de origen, traducir inmediatamente, posicionar el cursor al final en modo editable y proveer feedback visual (`✓ ¡Pegado!`).
2. **Botón de Copiar en Cuadro de Origen:**
   - Incorporar un botón dentro de la barra de acciones del cuadro de origen (`📄 Copiar`) para copiar el texto original al portapapeles con feedback visual (`✓ Copiado`).
3. **Botón de Copiar en Cuadro de Destino:**
   - Incorporar un botón de copiar junto al encabezado del cuadro de destino ("Traducción ES") además del botón existente en la barra de acciones inferior, asegurando acceso inmediato al copiado de la traducción.

---

## Archivos a Modificar
- `src/components/TranslatorModal.tsx`:
  - Declarar estados `pasted` y `sourceCopied`.
  - Implementar handlers `handlePasteClipboard` y `handleCopySource`.
  - Agregar botón de pegar y botón de copiar en la barra de acciones de origen (`boxActionRow`).
  - Agregar botón de copiar en el encabezado de destino (`outputHeader`) junto al título del idioma objetivo.

---

## Verificación
- Comprobar tipos TypeScript con `npx tsc --noEmit`.
- Compilar binarios y UI con `npm run build`.
- Registrar reporte de entrega (walkthrough) per reglas de `AGENTS.md`.
