# Plan de Implementación: Persistencia de Permisos TCC (Bundle ID) y Marca de Versión de Compilación

**Fecha y Hora:** 2026-11-26 09:45  
**Autor:** Antigravity Agent  

---

## 1. Problema Diagnosticado

### A. Permisos de Accesibilidad al Reinstalar / Actualizar
- Al compilar con `electron-builder` sin firma Developer ID o con firma ad-hoc por defecto, macOS genera un Designated Requirement (`csreq`) anclado exclusivamente al `cdhash` del binario (`designated => cdhash H"..."`).
- Cuando el usuario reinstala la app (misma versión, versión anterior o nueva), el `cdhash` cambia o el binario no está firmado, por lo que la base de datos TCC de macOS (`com.apple.TCC`) considera el nuevo binario como desconocido o modificado y revoca/ignora los permisos concedidos previamente a `com.astro.traductor`.
- **Solución:**
  1. Configurar firma ad-hoc con requisito explícito designado al identificador de la app: `-r='designated => identifier "com.astro.traductor"'` tanto en el `.app` como en los binarios auxiliares (`cmd-tap-listener` y `ocr-helper`).
  2. Implementar un hook `afterPack` en `electron-builder` que firme el `.app` empaquetado antes de crear el `.dmg`.
  3. En `electron/main.js`, implementar sondeo reactivo del estado de accesibilidad para detectar inmediatamente cuando el usuario activa el permiso sin necesidad de reiniciar la app.

### B. Marca de Versión con Fecha y Hora de Compilación
- El usuario requiere que en los ajustes se muestre la versión exacta de la app correspondiente a la fecha y hora de compilación.
- **Solución:**
  1. Configurar `vite.config.mts` con `define` para exponer `__APP_BUILD_TIMESTAMP__` y `__APP_BUILD_DATE__` basados en `process.env.BUILD_TIMESTAMP` (generado por `scripts/build-dmg.sh`) o fecha actual.
  2. Mostrar en `SettingsModal.tsx`:
     - Badge de versión en el encabezado (`v1.0.YYYY.MM.DD.HHMM`).
     - Pie de ventana con la marca de compilación (`Astro v1.0 • Compilación: YYYY-MM-DD HH:mm`).
     - Tarjeta de accesibilidad indicando el identificador activo del bundle (`com.astro.traductor`).

---

## 2. Pasos de Ejecución
1. Crear `scripts/after-pack.js` para firma ad-hoc con designated requirement.
2. Actualizar `package.json` (`afterPack` y `build:native`).
3. Modificar `vite.config.mts` y `src/types/index.ts` para inyectar constantes de compilación.
4. Actualizar `electron/main.js` con monitoreo reactivo de accesibilidad.
5. Actualizar `SettingsModal.tsx` con las marcas visuales de versión y bundle ID.
6. Actualizar `scripts/build-dmg.sh` para exportar `BUILD_TIMESTAMP`.
7. Verificar con `npx tsc --noEmit` y `npm run build`.
8. Generar reporte de walkthrough y registrar documentación.
