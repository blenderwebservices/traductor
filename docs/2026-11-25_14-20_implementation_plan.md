# Plan de Implementación: Corrección de Cierre al Cliquear Buscador de Voces

**Fecha y Hora:** 2026-11-25 14:20  
**Autor:** Antigravity Agent  

---

## 1. Problema Identificado
En la ventana modal de selección de voces (para origen y destino en `SettingsModal.tsx`), el modal está envuelto en un contenedor `<TouchableOpacity style={styles.voicePickerOverlay} onPress={() => setVoicePickerTarget(null)}>`.
En React Native Web:
- Los inputs nativos (`<TextInput>` / `<input>`) no adquieren el bloqueo del sistema de responderes táctiles para permitir el foco y selección nativa del navegador.
- Al hacer clic con el mouse dentro del input de búsqueda, el evento DOM `click` se propaga hacia arriba por el árbol de componentes hasta llegar a `<TouchableOpacity style={styles.voicePickerOverlay}>`.
- Esto desencadena de forma inmediata el callback `onPress={() => setVoicePickerTarget(null)}`, cerrando el modal inesperadamente.
- Al navegar con `Tab`, no se genera evento de clic del ratón, por lo que el foco entra al input sin disparar el cierre.

---

## 2. Solución Propuesta
1. **Reestructurar el Overlay y Backdrop (Patrón Sibling / Desacoplado):**
   - Reemplazar el contenedor raíz `<TouchableOpacity>` por un `<View style={styles.voicePickerOverlay}>`.
   - Incorporar un `<Pressable style={StyleSheet.absoluteFill} onPress={() => setVoicePickerTarget(null)} />` como elemento hermano (backdrop) detrás de la caja modal.
   - Posicionar la caja `<View style={styles.voicePickerBox}>` con `zIndex: 10` y `position: 'relative'`.
   - De esta manera, cualquier clic dentro de la caja modal o en el buscador `<TextInput>` ocurre en una rama DOM hermana independiente y físicamente jamás alcanza el manejador de clic del backdrop.
2. **Aplicar la misma robustez en el modal principal `SettingsModal`:**
   - Desacoplar el backdrop del diálogo principal para evitar posibles cierres erráticos al cliquear campos de configuración.
3. **Validación:**
   - Ejecutar `npm run build` y verificar que no haya errores de TypeScript ni empaquetado Vite.
   - Documentar la solución y registrar el walkthrough correspondiente.
