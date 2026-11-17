**DOCUMENTO DE DEFINICIÓN DE REQUERIMIENTOS**
**Producto:** App de Traductor Universal IA (Interfaz Modal)

**1. Requerimientos Funcionales Principales**

* **Activación Global:** La interfaz principal (recuadro modal) se invocará desde cualquier parte del sistema operativo mediante el atajo `Cmd + Alt + D`. Se debe implementar un "hook" de teclado a nivel sistema para soportar la activación mediante la doble pulsación rápida de la tecla `Cmd` (`Cmd + Cmd`), validando los permisos de accesibilidad necesarios.
* **Captura Automática de Texto:** Al momento de la activación, la aplicación debe leer el portapapeles o la selección activa del sistema operativo. Si hay texto seleccionado, se autocompletará en el campo de origen e iniciará la traducción instantáneamente.
* **Lógica de Idiomas Inteligente:**
* Detección automática del idioma de origen mediante IA.
* Idioma de destino predeterminado: Español.
* Condicional: Si la detección automática determina que el texto de origen es Español, el idioma de destino cambia automáticamente a Inglés.

* **Configuración y Ajustes:**
* Botón de ajustes visible y accesible en el modal.
* Capacidad de fijar idiomas de destino diferentes al predeterminado.
* Selectores rápidos para invertir idiomas o elegir manualmente desde/hacia otros idiomas soportados.

**2. Características Deseables Adicionales (Nice-to-Have)**

* **Reemplazo en Línea (Auto-Replace):** Un botón o atajo rápido (ej. `Cmd + Enter`) que reemplace automáticamente el texto original que estaba seleccionado en la aplicación de fondo con el texto traducido.
* **Ajuste de Tono (Contexto IA):** Opciones rápidas (botones o menú desplegable) para pedirle a la IA que la traducción sea "Formal", "Informal", "Técnica" o "Resumida".
* **Modo Diccionario Extendido:** Si la IA detecta que la entrada es una sola palabra, la salida no solo muestra la traducción, sino también una breve definición y un ejemplo de uso (similar al comportamiento de este bot).
* **Reconocimiento de Texto en Pantalla (OCR):** Un atajo secundario que permita hacer una selección de área en la pantalla (como una captura), extraer el texto de imágenes/PDFs no seleccionables y mostrar su traducción en el modal.
* **Síntesis de Voz (Text-to-Speech):** Botones de reproducción de audio para escuchar la pronunciación correcta tanto del texto de origen como de la traducción.
* **Historial y Favoritos:** Un registro local de las últimas traducciones realizadas durante la sesión o palabras marcadas como favoritas para estudio.
* **Mejora de Redacción (Proofreading):** Si el idioma de origen y destino es el mismo (ej. Español a Español), la IA actúa como corrector ortográfico, gramatical y de estilo.

**3. Requerimientos No Funcionales (Técnicos y Diseño)**

* **Baja Latencia:** El modal debe renderizarse en pantalla en menos de 200 milisegundos. Las respuestas de la IA deben mostrarse mediante *streaming* (token por token) para percibir fluidez.
* **Comportamiento de Ventana Efímera:** Al hacer clic fuera del recuadro modal, o al presionar la tecla `Esc`, el modal debe ocultarse inmediatamente sin consumir altos recursos en segundo plano.
* **Adaptabilidad Visual:** Soporte automático para Modo Oscuro y Modo Claro según la configuración global del sistema operativo. UI minimalista, translúcida o estilo "Spotlight" / "Raycast" para no interrumpir el flujo de trabajo.
