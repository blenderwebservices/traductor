# Plan de Implementación: Selectores de Voz TTS, Ventana Movible y Fijación con Chincheta

**Fecha:** 2026-11-20 17:41
**Autor:** Antigravity Agent

## Objetivos
1. **Selectores de Voz en Ajustes**:
   - Agregar selector de voz para el texto de origen (`sourceVoice`).
   - Agregar selector de voz para el texto traducido / destino (`targetVoice`).
   - Si no se especifica una voz manual (valor `'auto'`), asignar y ajustar automáticamente la mejor voz del sistema según el idioma de origen/detectado y de destino (ej. español -> `Paulina` / `Mónica`; inglés -> `Samantha` / `Daniel`, etc.).
   - Obtener la lista completa de voces reales instaladas en macOS (`say -v ?`) a través de Electron IPC (`get-system-voices`) y exponerlas al renderizador.
   - Permitir probar las voces con un botón 🔊 de preescucha en Ajustes.
2. **Ventana Movible (Arrastrable)**:
   - Configurar regiones de arrastre nativas con `-webkit-app-region: drag` en la barra superior de la ventana (`LanguageBar`) y estilos CSS para Electron.
   - Asegurar que los botones, selectores y campos de entrada tengan `-webkit-app-region: no-drag` para que las pulsaciones y clics sigan funcionando fluidamente.
3. **Chincheta para Fijar Ventana (Pin Window)**:
   - Modificar la chincheta (`📌` / `📍`) para controlar la persistencia de la ventana en pantalla.
   - Cuando la chincheta esté activa: la ventana NO se ocultará al hacer clic afuera (deshabilitar el `hide` en el evento `blur` de Electron).
   - Cuando la chincheta esté inactiva: la ventana se ocultará al desenfocarse (comportamiento efímero estándar estilo Raycast/Spotlight).
   - Persistir el estado de la chincheta en `AppSettings` (`isWindowPinned`).

## Archivos Involucrados
- `electron/main.js`: Soporte para `isWindowPinned`, evento `blur` condicional, IPC `get-system-voices`, IPC `set-window-pinned`, ejecución de `speakText` con parámetro opcional `voice`.
- `electron/preload.js`: Exposición segura en `window.electronAPI` de `getVoices()`, `setWindowPinned(pinned)` y actualización de `speakText(text, lang, voice)`.
- `src/types/index.ts`: Extensión de `AppSettings` con `sourceVoice`, `targetVoice`, `isWindowPinned` y firmas de `Window.electronAPI`.
- `src/services/storageService.ts`: Actualización de `defaultSettings` con valores por defecto para voces y chincheta.
- `src/components/SettingsModal.tsx`: Nueva sección de configuración de voces TTS (origen y destino) con previsualización / prueba de audio.
- `src/components/LanguageBar.tsx`: Región de arrastre (`WebkitAppRegion`), actualización de la chincheta para reflejar el estado de fijación de la ventana.
- `src/components/TranslatorModal.tsx`: Sincronización del pin con Electron, llamada de TTS con las voces configuradas o automáticas.
- `index.html`: Reglas CSS globales para `-webkit-app-region`.
