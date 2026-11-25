# Plan de Implementación: Soporte Multiplataforma y Empaquetado `.exe` (Windows)

**Fecha:** 2026-11-23 02:05  
**Objetivo:** Adaptar `electron/main.js` con soporte para Windows (`process.platform === 'win32'`) y configurar `package.json` para generar ejecutables `.exe` con `electron-builder`.

---

## Cambios Propuestos

1. **[`electron/main.js`](file:///Users/franciscogomezbarragan/Herd/traductor/electron/main.js)**:
   - `captureActiveSelection()` y `autoReplaceText()`: Usar `osascript` en `darwin` y PowerShell (`SendKeys` `^c`/`^v`) en `win32`.
   - `startDoubleCmdListener()`: Ejecutar solo en `darwin`.
   - `triggerScreenOCR()`: Devolver mensaje informativo en plataformas distintas a `darwin`.
   - `speakText()`, `stopSpeaking()` y `getSystemVoices()`: Usar `say` en `darwin` y `System.Speech.Synthesis.SpeechSynthesizer` vía PowerShell en `win32`.
   - `createTray()`: Omitir opción de Permisos de Accesibilidad de macOS en `win32`.

2. **[`package.json`](file:///Users/franciscogomezbarragan/Herd/traductor/package.json)**:
   - Añadir scripts `"dist:win": "npm run build:ui && electron-builder --win nsis"` y `"dist:win-portable": "npm run build:ui && electron-builder --win portable"`.
   - Añadir configuración `"win": { "target": ["nsis", "portable"] }` y `"nsis": { "oneClick": false, "allowToChangeInstallationDirectory": true }`.
   - Mover `extraResources` (`bin`) dentro de `"mac"` para que el empaquetado de Windows no intente incluir binarios de macOS si no existen.

3. **Compilación**:
   - Ejecutar `npm run dist:win` para verificar la generación del `.exe`.
