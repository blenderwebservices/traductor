# Plan de Implementación: Generación de Paquete DMG

**Fecha y Hora:** 2026-11-26 09:56  
**Autor:** Antigravity Agent  

---

## Objetivo
Compilar la aplicación y empaquetar el instalador `.dmg` para macOS incorporando:
1. **Firma con Requisito Designado (`designated => identifier "com.astro.traductor"`):** Garantiza que macOS preserve los permisos de accesibilidad y eventos de teclado a través de reinstalaciones, actualizaciones y cambios de versión.
2. **Hook de post-empaquetado (`scripts/after-pack.js`):** Firma automática de `Astro.app`, `cmd-tap-listener` y `ocr-helper` antes de empaquetar el DMG.
3. **Marca de Versión y Compilación en los Ajustes:** Sincronizada automáticamente con la fecha y hora de compilación.

---

## Requisitos de Nomenclatura (Regla AGENTS.md)
Formato estricto:
`Citas-1.0.[año YYYY].[mes MM].[dia DD].[Hora HHMM].dmg` y `Astro-1.0.[timestamp].dmg`.

---

## Pasos de Ejecución
1. Configurar entorno con Node.js en PATH.
2. Ejecutar `scripts/build-dmg.sh`.
3. Verificar archivos generados en `release/`.
4. Registrar walkthrough en `docs/2026-11-26_09-56_walkthrough.md` y artefacto.
5. Hacer commit y push al repositorio remoto.
