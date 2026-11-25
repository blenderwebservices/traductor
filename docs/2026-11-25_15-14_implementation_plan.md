# Plan de Implementación: Compilación de Paquete DMG

**Fecha y Hora:** 2026-11-25 15:14  
**Autor:** Antigravity Agent  

---

## Objetivo
Compilar la aplicación y empaquetar el instalador `.dmg` para macOS incorporando las últimas correcciones en el selector de voces (desacoplamiento de backdrop para evitar cierres al hacer clic en el buscador) y optimización de foco.

---

## Requisitos de Nomenclatura (Regla AGENTS.md)
Formato estricto:
`Citas-1.0.[año YYYY].[mes MM].[dia DD].[Hora HHMM].dmg` y `Astro-1.0.[timestamp].dmg`.

---

## Pasos de Ejecución
1. Configurar entorno con Node.js en PATH.
2. Ejecutar `scripts/build-dmg.sh`:
   - Compilación nativa de Swift (`bin/ocr-helper`, `bin/cmd-tap-listener`).
   - Bundle de producción Vite (`dist/`).
   - Empaquetado `electron-builder` a DMG.
3. Verificar archivos creados en `release/`.
4. Registrar walkthrough en `docs/2026-11-25_15-14_walkthrough.md` y artefacto.
5. Hacer commit y push al repositorio remoto.
