# Plan de Implementación: Generación del Paquete DMG

**Fecha:** 2026-11-24 18:25
**Autor:** Antigravity Agent

## Objetivo
Compilar la aplicación y generar el nuevo instalador macOS `.dmg` con las últimas mejoras de recuperación de foco, portapapeles automático y cursor al final, utilizando `scripts/build-dmg.sh` y respetando la regla estricta de nomenclatura: `Citas-1.0.[año].[mes].[dia].[Hora].dmg` (y `Astro-1.0.[timestamp].dmg`).

## Pasos de Ejecución
1. **Ejecutar `scripts/build-dmg.sh`**:
   - Compilación de binarios Swift (`bin/ocr-helper`, `bin/cmd-tap-listener`) y Vite bundle.
   - Empaquetado DMG con `electron-builder`.
   - Copia con timestamp automático `2026.11.24.1825`.
2. **Verificar Archivos Generados en `release/`**:
   - Comprobar existencia y tamaño del `.dmg`.
3. **Registro Documental**:
   - Generar walkthrough en `docs/2026-11-24_18-25_walkthrough.md` y artefacto correspondiente.
