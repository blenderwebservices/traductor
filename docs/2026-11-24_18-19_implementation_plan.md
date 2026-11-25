# Plan de Implementación: Pegado Automático de Portapapeles y Posición de Cursor al Recuperar Foco

**Fecha:** 2026-11-24 18:19
**Autor:** Antigravity Agent

## Objetivo
Al recuperar el foco en la ventana de Astro (tanto por clic, cambio de ventana o invocación), verificar si existe contenido de texto en el portapapeles del sistema, colocarlo en el cuadro de texto de origen, ejecutar la traducción y asegurar que el cuadro quede en modo editable con el cursor posicionado al final del texto.

## Cambios Propuestos
1. **`electron/main.js`**:
   - Escuchar el evento `'focus'` en `mainWindow` y notificar al proceso de renderizado mediante el canal IPC `'window-focus'`.
2. **`electron/preload.js`**:
   - Exponer el listener `onWindowFocus` dentro de `window.electronAPI`.
3. **`src/types/index.ts`**:
   - Declarar `onWindowFocus` en la interfaz `Window['electronAPI']`.
4. **`src/components/TranslatorModal.tsx`**:
   - Implementar la función `handleFocusAndClipboard()`:
     - Consultar el portapapeles mediante `getClipboardText()`.
     - Validar que sea texto válido y que no sea una copia interna generada por el propio botón "Copiar" / "Reemplazar" de Astro (`lastCopiedByAstroRef`).
     - Si hay texto nuevo/externo en el portapapeles, actualizar el estado `sourceText`, disparar la traducción automática y posicionar el cursor al final.
     - Posicionar el cursor al final de forma imperativa sobre el elemento subyacente (`setSelectionRange(len, len)` y `focus()`).
   - Escuchar tanto el evento IPC `'window-focus'` como el evento nativo del navegador `window.addEventListener('focus', ...)`.
   - Asegurar que `onShowWithText` también posicione el cursor al final.

## Verificación
- Compilar con `npm run build`.
- Verificar tipos con TypeScript.
- Comprobar que al copiar texto en otra aplicación y hacer clic en Astro, el texto se inserte y el cursor se coloque al final listo para seguir escribiendo.
