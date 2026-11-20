# Plan de Implementación: Generación del Paquete DMG

**Fecha:** 2026-11-20 17:48
**Autor:** Antigravity Agent

## Objetivo
Compilar la aplicación y empaquetarla en un instalador nativo macOS `.dmg` respetando la regla estricta de nomenclatura:
`Citas-1.0.[año YYYY].[mes MM].[dia DD].[Hora HHMM].dmg` (y `Astro-1.0.[timestamp].dmg`) calculado automáticamente por `scripts/build-dmg.sh`.

## Pasos
1. **Crear script `scripts/build-dmg.sh`**:
   - Construir los binarios nativos Swift y el frontend Vite (`npm run build`).
   - Ejecutar `electron-builder` para empaquetar el DMG.
   - Renombrar y generar el archivo `.dmg` con el timestamp automático exacto.
2. **Actualizar `package.json`**:
   - Agregar/vincular el comando `"build:dmg": "bash scripts/build-dmg.sh"`.
3. **Ejecución y Verificación**:
   - Ejecutar la compilación del DMG.
   - Verificar existencia, tamaño y validez del archivo `.dmg` generado en `release/`.
4. **Registro de Reporte**:
   - Guardar el walkthrough correspondiente en `docs/2026-11-20_17-48_walkthrough.md`.
