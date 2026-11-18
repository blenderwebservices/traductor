# Universal Neural Engine y Text-to-Speech en Astro

Este documento explica cómo funciona el **Motor Neuronal Universal** (*Universal Neural Engine*) de **Astro** sin requerir una API Key, su origen e historia, sus alcances y limitaciones, así como la arquitectura de síntesis de voz (**Text-to-Speech**) integrada en la aplicación.

---

## 1. ¿Cómo funciona la IA sin una API Key?

Por defecto, Astro utiliza el proveedor `'local'` (mostrado en la interfaz como **Motor Neuronal Universal** en [`src/components/SettingsModal.tsx`](file:///Users/franciscogomezbarragan/Herd/traductor/src/components/SettingsModal.tsx#L48) y configurado en [`src/services/storageService.ts`](file:///Users/franciscogomezbarragan/Herd/traductor/src/services/storageService.ts#L6-L17)). Toda la orquestación vive en `AIService` dentro de [`src/services/aiService.ts`](file:///Users/franciscogomezbarragan/Herd/traductor/src/services/aiService.ts).

Cuando no se ha configurado una API Key de **Gemini** ni de **OpenAI**, `translateStream()` delega la petición a `translateWithUniversalEngine()` siguiendo este flujo:

### 1.1. Detección rápida en cliente (`detectLanguageFast`)
Antes de realizar ninguna petición de red, Astro ejecuta una heurística local basada en expresiones regulares para identificar español (`es`), inglés (`en`), francés (`fr`), alemán (`de`) o portugués (`pt`) a partir de caracteres específicos (`áéíóúüñ¿¡`, `çàâ...`, `äöüß`, etc.) y palabras frecuentes.
- Si el idioma origen está en `auto` y se detecta español (`es`), el idioma destino cambia automáticamente a inglés (`en`); en cualquier otro caso, apunta a español (`es`), salvo que el usuario haya fijado manualmente el idioma destino (`isTargetPinned`).

### 1.2. Modo Corrección (*Proofreading Mode*)
Si el idioma detectado coincide con el idioma destino (`detected === resolvedTarget`), el motor no consume red: ejecuta reglas locales de corrección ortográfica y de puntuación (por ejemplo, reemplazar `"q"` por `"que"` o añadir signos `¿`/`¡` en español; capitalizar `"I"` o añadir punto final en inglés) y devuelve una breve explicación de la corrección.

### 1.3. Traducción Neuronal sin API Key (`client=gtx`)
Para traducir entre idiomas distintos, Astro realiza una petición HTTP `GET` al endpoint público de Google Translate:

```text
https://translate.googleapis.com/translate_a/single?client=gtx&sl=<origen>&tl=<destino>&dt=t&dt=bd&dt=rm&q=<texto>
```

De la respuesta JSON se extraen tres piezas clave:
- **`data[0]`**: Segmentos traducidos, que se concatenan para formar el texto final.
- **`data[2]`**: Idioma real detectado en el servidor, que actualiza el indicador de idioma en la interfaz si difiere de la heurística inicial.
- **`data[1]`**: Sinónimos y categorías gramaticales (usados cuando la entrada es una sola palabra).

### 1.4. Modo Diccionario enriquecido (`api.dictionaryapi.dev`)
Si la entrada es una sola palabra (sin espacios ni saltos de línea y menor a 35 caracteres), Astro activa el **Modo Diccionario**:
1. Consulta la **Free Dictionary API** (`https://api.dictionaryapi.dev/api/v2/entries/en/<palabra>`) con un timeout de `2000 ms` para obtener transcripción fonética, categoría gramatical, definición y ejemplo de uso.
2. Si la consulta falla o expira, construye la tarjeta de diccionario usando los sinónimos devueltos en `data[1]` por Google o la traducción directa.

### 1.5. Resiliencia offline (`localFallbackTranslate`) y streaming simulado
- **Fallback local**: Si la petición de red falla (sin conexión o timeout), `localFallbackTranslate()` busca la palabra en un diccionario embebido de términos comunes (`hello`, `world`, `walkthrough`, `translator`, etc.) o devuelve el texto original para evitar errores en pantalla.
- **Ajuste de tono y streaming visual**: Aplica transformaciones ligeras de tono (por ejemplo, prefijo formal en español) y simula una respuesta en streaming mediante `streamString()`, emitiendo palabra por palabra cada `14 ms` para ofrecer una experiencia fluida similar a la de un LLM.

---

## 2. Historia y procedencia del motor

### ¿De dónde proviene?
El Motor Neuronal Universal combina tres fuentes:
1. **Google Neural Machine Translation (GNMT) vía `client=gtx`**: El parámetro `client=gtx` proviene históricamente del cliente web ligero y la extensión oficial de Google Translate para Chrome (*Google Translate Extension*). A diferencia de la API comercial de Google Cloud Translation (que exige proyecto en GCP, facturación y API Key), el endpoint `translate_a/single?client=gtx` expone el motor neuronal de traducción de Google para consultas puntuales sin autenticación.
2. **Free Dictionary API (`dictionaryapi.dev`)**: Proyecto abierto y gratuito mantenido por la comunidad, sin necesidad de registro ni API Key, utilizado para enriquecer palabras individuales con fonética y definiciones.
3. **Heurísticas propias de Astro**: Detección rápida en cliente, reglas locales de corrección y diccionario offline mínimo.

### Evolución dentro de Astro
Originalmente, la aplicación definía `'local'` como proveedor por defecto para funcionar sin configuración previa. Posteriormente (documentado en [`docs/2026-11-17_15-47_walkthrough.md`](file:///Users/franciscogomezbarragan/Herd/traductor/docs/2026-11-17_15-47_walkthrough.md)), se evolucionó ese modo hacia el **Universal Neural Engine**, conectándolo al endpoint `client=gtx` y a la Free Dictionary API para ofrecer traducciones neuronales reales y definiciones desde el primer uso, dejando **Gemini** y **OpenAI** como proveedores opcionales para usuarios que ingresen su propia API Key.

---

## 3. Alcances y limitaciones

### Alcances
- **Cero fricción (*Zero-config*)**: Funciona inmediatamente al abrir la app sin crear cuentas ni gestionar credenciales.
- **Soporte multilingüe**: Cubre todos los idiomas configurados en `LANGUAGES` (`es`, `en`, `fr`, `de`, `it`, `pt`, `zh`, `ja`, `ru`) más autodetección.
- **Baja latencia**: Detección instantánea en cliente y traducción directa sin prompts extensos.
- **Modo Diccionario**: Entrega fonética, categoría gramatical, acepciones y ejemplos para palabras sueltas.
- **Verificación de estado**: `AIService.testConnection()` incluye una sonda contra `client=gtx` para reportar latencia o estado offline en Ajustes.

### Limitaciones
- **No es un modelo generativo (LLM)**: A diferencia de Gemini u OpenAI, el motor universal no reescribe texto con comprensión profunda de contexto. Los ajustes de **tono** (`formal`, `concise`, etc.) son reglas simples sobre el texto ya traducido.
- **Proofreading básico**: Cuando origen y destino coinciden, solo aplica reglas heurísticas predefinidas (tildes/signos básicos o capitalización de `"I"`), no una revisión gramatical avanzada.
- **Dependencia de endpoint público no oficial**: `translate.googleapis.com/translate_a/single?client=gtx` no ofrece SLA ni garantía de disponibilidad; un volumen elevado de peticiones desde una misma IP puede sufrir *rate limiting*.
- **Diccionario centrado en inglés**: La llamada a `api.dictionaryapi.dev` consulta el endpoint `/en/`, por lo que la fonética y definiciones detalladas aplican principalmente a palabras en inglés.
- **Modo offline mínimo**: Sin conexión a internet, `localFallbackTranslate()` solo traduce un puñado de palabras comunes predefinidas.

---

## 4. Funcionamiento de Text-to-Speech (TTS) dentro de la app

La síntesis de voz en Astro está implementada con una arquitectura híbrida que prioriza el motor nativo de **macOS** cuando corre en Electron y usa la **Web Speech API** como respaldo en navegador.

### 4.1. Disparador en la interfaz ([`src/components/TranslatorModal.tsx`](file:///Users/franciscogomezbarragan/Herd/traductor/src/components/TranslatorModal.tsx#L204-L214))
Cuando el usuario pulsa el botón de reproducir audio en el resultado de la traducción, se ejecuta `handleSpeak(text, lang)`:
1. Si existe `window.electronAPI` (entorno de escritorio Electron), invoca `window.electronAPI.speakText(text, lang)`.
2. Si no existe (por ejemplo, ejecutando la UI web fuera de Electron), recurre a `'speechSynthesis' in window`, creando un `SpeechSynthesisUtterance(text)` con `utterance.lang = lang` y llamando a `window.speechSynthesis.speak(utterance)`.

*(Nota: En [`src/services/storageService.ts`](file:///Users/franciscogomezbarragan/Herd/traductor/src/services/storageService.ts#L16) existe la preferencia `autoSpeak` inicializada en `false`, mientras que la reproducción activa en `TranslatorModal.tsx` se dispara bajo demanda al pulsar el botón de altavoz).*

### 4.2. Puente IPC ([`electron/preload.js`](file:///Users/franciscogomezbarragan/Herd/traductor/electron/preload.js#L15-L17))
El script de precarga expone de forma segura dos métodos al renderer mediante `contextBridge`:
- `speakText(text, lang)` → envía el evento IPC `'speak-text'`.
- `stopSpeaking()` → envía el evento IPC `'stop-speaking'`.

### 4.3. Síntesis nativa en macOS ([`electron/main.js`](file:///Users/franciscogomezbarragan/Herd/traductor/electron/main.js#L246-L270))
El proceso principal recibe `'speak-text'` y ejecuta `speakText(text, lang)`:
1. **Selección de voz por idioma**: Mapea el código de idioma a una voz del sistema de macOS:
   - `es` → `Jorge`
   - `fr` → `Thomas`
   - `de` → `Anna`
   - `it` → `Alice`
   - `pt` → `Luciana`
   - Por defecto (`en` u otros) → `Samantha`
2. **Ejecución del comando `say`**: Escapa las comillas dobles del texto y lanza el binario nativo `say` de macOS vía `child_process.exec`:
   ```bash
   say -v "<voz>" "<texto>" || say "<texto>"
   ```
   El operador `|| say "<texto>"` actúa como respaldo automático en caso de que la voz asignada no esté descargada en el Mac del usuario.
3. **Detención**: Al recibir `'stop-speaking'`, `stopSpeaking()` ejecuta `killall say` para interrumpir cualquier locución en curso.
