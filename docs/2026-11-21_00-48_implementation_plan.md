# Plan de Implementación: Mejoras CRO en Astro

**Fecha:** 2026-11-21 00:48  
**Objetivo:** Implementar las mejoras detectadas en la auditoría CRO para maximizar la activación en el primer arranque, eliminar fricciones silenciosas (Accesibilidad, OCR, TTS), separar claramente el pin de idioma del pin de ventana y mejorar la conversión hacia proveedores LLM (Gemini / OpenAI).

---

## Cambios Propuestos

### 1. Arranque Visible y Onboarding de Primer Uso
- **[`electron/main.js`](file:///Users/franciscogomezbarragan/Herd/traductor/electron/main.js)**: Mostrar la ventana principal al iniciar la app (`showModal('')` en `app.whenReady()`) para evitar que el usuario crea que la aplicación no abrió.
- **[`src/types/index.ts`](file:///Users/franciscogomezbarragan/Herd/traductor/src/types/index.ts)** y **[`src/services/storageService.ts`](file:///Users/franciscogomezbarragan/Herd/traductor/src/services/storageService.ts)**: Agregar `hasCompletedOnboarding?: boolean` a `AppSettings`.
- **[`src/components/TranslatorModal.tsx`](file:///Users/franciscogomezbarragan/Herd/traductor/src/components/TranslatorModal.tsx)**: Mostrar tarjeta de bienvenida compacta con los 3 atajos clave (`Cmd+Cmd`, `Cmd+Enter`, `Cmd+Alt+O`) en el primer uso.

### 2. Banner Inline de Permisos de Accesibilidad
- **[`src/components/TranslatorModal.tsx`](file:///Users/franciscogomezbarragan/Herd/traductor/src/components/TranslatorModal.tsx)**: Verificar `checkAccessibility()` al montar y al cerrar ajustes. Si falta permiso, mostrar un banner visible con botón directo `"Activar permisos"` (`openAccessibilityPreferences()`).

### 3. Toggles Separados: Fijar Idioma Destino vs. Fijar Ventana
- **[`src/components/LanguageBar.tsx`](file:///Users/franciscogomezbarragan/Herd/traductor/src/components/LanguageBar.tsx)**:
  - Agregar botón toggle dedicado para fijar el idioma destino (`isTargetPinned` / `onToggleTargetPin`) junto al selector de idioma destino (`🔒` / `🔓`).
  - Mantener el botón toggle de fijar ventana (`isWindowPinned` / `onToggleWindowPin`, `📌` / `📍`) para impedir que la ventana desaparezca al hacer clic fuera.
- **[`src/components/TranslatorModal.tsx`](file:///Users/franciscogomezbarragan/Herd/traductor/src/components/TranslatorModal.tsx)**: Conectar ambos handlers de forma independiente y persistir en `storageService`.

### 4. Alineación de `TonePicker` y Conversión a API Keys
- **[`src/components/TonePicker.tsx`](file:///Users/franciscogomezbarragan/Herd/traductor/src/components/TonePicker.tsx)**: Etiquetar con `IA` los tonos avanzados (`Informal`, `Técnico`) cuando se usa el Motor Universal sin API Key, y mostrar un aviso contextual con CTA directo a Ajustes cuando se seleccionen.
- **[`src/components/SettingsModal.tsx`](file:///Users/franciscogomezbarragan/Herd/traductor/src/components/SettingsModal.tsx)**: Añadir enlaces directos a Google AI Studio y OpenAI Platform para obtener la API Key, aclarando que se guarda localmente.

### 5. Feedback de OCR, Toggle TTS (`Escuchar`/`Detener`) y Estado Offline
- **[`src/components/TranslatorModal.tsx`](file:///Users/franciscogomezbarragan/Herd/traductor/src/components/TranslatorModal.tsx)**:
  - Mostrar mensaje de error temporal cuando `triggerScreenOCR()` falle o no detecte texto.
  - Convertir los botones de voz en toggle `🔊` / `⏹ Detener` invocando `stopSpeaking()`.
- **[`src/types/index.ts`](file:///Users/franciscogomezbarragan/Herd/traductor/src/types/index.ts)** y **[`src/services/aiService.ts`](file:///Users/franciscogomezbarragan/Herd/traductor/src/services/aiService.ts)**: Reportar `isOfflineFallback` en `TranslationResponse` para reflejar el estado real en el badge del footer.

---

## Verificación
- Ejecutar `npx tsc --noEmit` para validar tipos TypeScript.
- Ejecutar `npm run build:ui` para verificar la compilación de Vite.
