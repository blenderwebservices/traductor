# Plan de Implementación: Astro - App de Traductor Universal IA (React Native + macOS)

**Fecha:** 2026-11-17 14:10  
**Basado en:** `/docs/definicion.md`  
**Nombre del Proyecto:** Astro Traductor Universal IA  

---

## 1. Resumen Ejecutivo y Objetivos

Desarrollar una aplicación de escritorio modal de alta velocidad (estilo Spotlight / Raycast) basada en **React Native** (utilizando componentes declarativos nativos de React Native con soporte multiplataforma mediante `react-native-web` empaquetado en un runtime nativo para macOS). La aplicación responde instantáneamente a atajos globales del sistema operativo, captura automáticamente el texto seleccionado o del portapapeles, detecta idiomas con IA, realiza traducción en streaming y permite el reemplazo en línea del texto en segundo plano.

---

## 2. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                      Astro Traductor                        │
├─────────────────────────────────────────────────────────────┤
│  Capa de UI (React Native):                                 │
│  - App.tsx (Contenedor principal con tema dinámico)          │
│  - Modal Raycast / Spotlight minimalista y translúcido       │
│  - Componentes React Native (View, Text, TextInput, etc.)   │
│  - Input de origen y visualizador de traducción en streaming│
│  - Selectores de idioma (Detección Auto, Intercambio, Fijar)│
│  - Modos de tono (Formal, Informal, Técnico, Resumido)      │
│  - Modo Diccionario Extendido (Definición + Ejemplos)       │
│  - Modo Proofreading (Mejora y corrección gramatical)       │
│  - Panel de Historial y Favoritos                           │
│  - Panel de Configuración (API Keys, Atajos, Accesibilidad) │
├─────────────────────────────────────────────────────────────┤
│  Capa de Servicios y Lógica IA:                             │
│  - TranslationEngine (Streaming token por token)             │
│  - Proveedores: Gemini API, OpenAI, Anthropic y Simulador   │
│    Local IA Inteligente (listo sin necesidad de API key)    │
│  - Detector de idioma inteligente (Auto -> ES; si ES -> EN) │
│  - StorageService (Persistencia de historial y ajustes)      │
├─────────────────────────────────────────────────────────────┤
│  Capa Nativa macOS (Desktop Bridge & Native Helpers):       │
│  - NSPanel / Floating frameless window (<200ms render)      │
│  - Atajo global Cmd + Alt + D (globalShortcut)              │
│  - Hook global Cmd + Cmd (Swift event tap listener)         │
│  - Captura activa de selección (AppleScript / AXUIElement)  │
│  - Reemplazo en línea (Auto-Replace Cmd+Enter hacia app)    │
│  - OCR de captura de pantalla con Apple Vision Framework     │
│  - Text-to-Speech nativo (macOS 'say' / Web Speech)         │
│  - Comportamiento efímero (Cerrar al desenfocar o con Esc)   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Desglose de Fases de Implementación

### Fase 1: Estructura del Proyecto y Dependencias
- Inicializar `package.json` con dependencias: `react`, `react-dom`, `react-native-web`, `electron`, `lucide-react` (iconografía minimalista), `@types/react`, etc.
- Configurar empaquetador ligero y scripts de desarrollo (`npm run dev`, `npm run build`, `npm run app:start`).

### Fase 2: Módulos Nativos de macOS en Swift
- `native/cmd-tap-listener.swift`: Monitor global de eventos (`NSEvent.addGlobalMonitorForEvents`) para detectar la doble pulsación rápida de la tecla Command (`Cmd + Cmd`) en menos de 350ms y emitir señal al proceso principal.
- `native/ocr-helper.swift`: Utilidad que toma captura de pantalla o lee imagen del portapapeles y ejecuta `VNRecognizeTextRequest` con el framework nativo Apple Vision para extraer texto en alta precisión sin dependencias externas.
- `native/accessibility-helper.swift`: Verificador de permisos de accesibilidad (`AXIsProcessTrusted`).

### Fase 3: Integración de Desktop Bridge (Electron Host)
- Ventana translúcida estilo Raycast / Spotlight con esquinas redondeadas, fondo vibrante/blur, sin barra de título ni bordes.
- Registro de atajos globales (`Cmd + Alt + D`).
- Lógica de captura automática de texto (lee selección activa de la app en foco o portapapeles al activarse).
- Lógica de reemplazo en línea (`Cmd + Enter`): Oculta el modal, reenfoca la aplicación previa y simula pegado (`Cmd + V`).
- Invocación de OCR interactivo (`screencapture -i`).
- Comportamiento efímero: Ocultar automáticamente al perder foco (`blur`) o al presionar `Esc`.

### Fase 4: Componentes de UI en React Native
- **`TranslatorModal.tsx`**: Interfaz principal Spotlight/Raycast.
- **`LanguageBar.tsx`**: Barra de idiomas con autodetección, selector de destino, swap rápido y estado fijado.
- **`ToneSelector.tsx`**: Selector de tonos (Formal, Informal, Técnico, Resumido).
- **`StreamingResult.tsx`**: Renderizador de salida con soporte de streaming token por token, copia rápida y reproducción TTS.
- **`DictionaryView.tsx`**: Vista de modo diccionario extendido cuando la entrada es una sola palabra.
- **`ProofreadingView.tsx`**: Modo de corrección ortográfica y de estilo cuando el idioma de origen y destino coinciden.
- **`HistoryFavorites.tsx`**: Registro y búsqueda de traducciones pasadas y marcadas como favoritas.
- **`SettingsModal.tsx`**: Configuración de proveedor IA (Gemini, OpenAI, Anthropic, Local), idiomas predeterminados y comprobación de permisos.

### Fase 5: Motor de IA y Detección Inteligente
- Servicio universal de IA con soporte de Streaming.
- Adaptador para Google Gemini API, OpenAI API y Motor Local Inteligente integrado (funciona inmediatamente sin API Key para pruebas y desarrollo).
- Detección de idioma y regla de negocio: si el texto es Español, el destino conmuta automáticamente a Inglés; si es cualquier otro idioma, el destino predeterminado es Español.

### Fase 6: Pruebas, Verificación y Documentación
- Compilación de los helpers de Swift nativos.
- Verificación del inicio y renderizado en <200ms.
- Pruebas de captura de portapapeles y traducción en streaming.
- Generación de informe Walkthrough en `docs/YYYY-MM-DD_HH-mm_walkthrough.md`.
