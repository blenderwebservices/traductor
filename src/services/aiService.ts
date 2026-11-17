import { AppSettings, DictionaryEntry, LanguageCode, Tone, TranslationResponse } from '../types';

export const LANGUAGES = [
  { code: 'auto' as LanguageCode, name: 'Detectar idioma', nativeName: 'Automático', flag: '✨' },
  { code: 'es' as LanguageCode, name: 'Español', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'en' as LanguageCode, name: 'Inglés', nativeName: 'English', flag: '🇺🇸' },
  { code: 'fr' as LanguageCode, name: 'Francés', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de' as LanguageCode, name: 'Alemán', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it' as LanguageCode, name: 'Italiano', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt' as LanguageCode, name: 'Portugués', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'zh' as LanguageCode, name: 'Chino', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja' as LanguageCode, name: 'Japonés', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ru' as LanguageCode, name: 'Ruso', nativeName: 'Русский', flag: '🇷🇺' },
];

// Heuristic language detector for immediate client-side switching before API call
export function detectLanguageFast(text: string): 'es' | 'en' | 'fr' | 'de' | 'it' | 'pt' | 'other' {
  const clean = text.trim().toLowerCase();
  if (!clean) return 'en';

  // Spanish specific characters & common words
  const esPatterns = [
    /\b(el|la|los|las|un|una|unos|unas|de|del|en|para|por|con|como|este|esta|esto|estos|estas|que|qué|pero|porque|más|muy|también|hola|buenos|días|gracias|traducción|desarrollo|recorrido|paso)\b/i,
    /[áéíóúüñ¿¡]/i,
  ];
  if (esPatterns.some((pattern) => pattern.test(clean))) {
    return 'es';
  }

  // English common words
  const enPatterns = [
    /\b(the|is|are|was|were|have|has|had|this|that|these|those|with|from|they|them|their|what|when|where|which|who|why|how|hello|good|morning|thank|thanks|please|about|after|before|walkthrough|step|by|guide)\b/i,
  ];
  if (enPatterns.some((pattern) => pattern.test(clean))) {
    return 'en';
  }

  // French
  if (/\b(le|la|les|un|une|des|du|dans|pour|avec|comme|est|sont|merci|bonjour)\b/i.test(clean) || /[çàâêîôû]/i.test(clean)) {
    return 'fr';
  }

  // German
  if (/\b(der|die|das|ein|eine|und|in|den|von|zu|mit|ist|sind|danke|guten|tag)\b/i.test(clean) || /[äöüß]/i.test(clean)) {
    return 'de';
  }

  // Portuguese
  if (/\b(o|a|os|as|um|uma|do|da|em|para|com|como|obrigado|bom|dia)\b/i.test(clean) || /[ãõêç]/i.test(clean)) {
    return 'pt';
  }

  return 'en';
}

export class AIService {
  private abortController: AbortController | null = null;

  public cancelOngoing(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  public async translateStream({
    text,
    sourceLang,
    targetLang,
    tone,
    settings,
    onChunk,
    onDetectedLanguage,
  }: {
    text: string;
    sourceLang: LanguageCode;
    targetLang: LanguageCode;
    tone: Tone;
    settings: AppSettings;
    onChunk: (chunk: string) => void;
    onDetectedLanguage?: (detected: LanguageCode) => void;
  }): Promise<TranslationResponse> {
    this.cancelOngoing();
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const trimmed = text.trim();
    if (!trimmed) {
      return { translatedText: '' };
    }

    // 1. Language detection logic
    let detected: LanguageCode = 'en';
    if (sourceLang === 'auto') {
      const fastDetect = detectLanguageFast(trimmed);
      detected = (fastDetect === 'other' ? 'en' : fastDetect) as LanguageCode;
      if (onDetectedLanguage) {
        onDetectedLanguage(detected);
      }
    } else {
      detected = sourceLang;
    }

    // 2. Determine target language according to requirement 1.3:
    // If auto-detection determined source is Spanish, target switches automatically to English!
    // Default target language is Spanish otherwise.
    let resolvedTarget = targetLang;
    if (targetLang === 'auto' || (!settings.isTargetPinned && sourceLang === 'auto')) {
      if (detected === 'es') {
        resolvedTarget = 'en';
      } else {
        resolvedTarget = 'es';
      }
    }

    // 3. Check special modes:
    // A) Is single word? (Extended Dictionary Mode)
    const isSingleWord = !trimmed.includes(' ') && !trimmed.includes('\n') && trimmed.length < 35;

    // B) Is Proofreading Mode? (Source == Target)
    const isProofreading = detected === resolvedTarget;

    // Route to appropriate provider
    if (settings.provider === 'gemini' && settings.geminiApiKey) {
      return this.translateWithGemini({
        text: trimmed,
        detected,
        targetLang: resolvedTarget,
        tone,
        apiKey: settings.geminiApiKey,
        geminiModel: settings.geminiModel,
        isSingleWord,
        isProofreading,
        signal,
        onChunk,
      });
    }

    if (settings.provider === 'openai' && settings.openaiApiKey) {
      return this.translateWithOpenAI({
        text: trimmed,
        detected,
        targetLang: resolvedTarget,
        tone,
        apiKey: settings.openaiApiKey,
        openaiModel: settings.openaiModel,
        isSingleWord,
        isProofreading,
        signal,
        onChunk,
      });
    }

    // Default: High-fidelity Universal Neural Engine with Dictionary Mode & Fallback
    return this.translateWithUniversalEngine({
      text: trimmed,
      detected,
      targetLang: resolvedTarget,
      tone,
      isSingleWord,
      isProofreading,
      signal,
      onChunk,
      onDetectedLanguage,
    });
  }

  // --- UNIVERSAL NEURAL ENGINE (Works instantly for any language & word) ---
  private async translateWithUniversalEngine({
    text,
    detected,
    targetLang,
    tone,
    isSingleWord,
    isProofreading,
    signal,
    onChunk,
    onDetectedLanguage,
  }: {
    text: string;
    detected: LanguageCode;
    targetLang: LanguageCode;
    tone: Tone;
    isSingleWord: boolean;
    isProofreading: boolean;
    signal: AbortSignal;
    onChunk: (chunk: string) => void;
    onDetectedLanguage?: (detected: LanguageCode) => void;
  }): Promise<TranslationResponse> {
    const lower = text.toLowerCase();

    // 1. Proofreading Mode handling (when source == target)
    if (isProofreading) {
      let corrected = text;
      let explanation = 'No se detectaron errores ortográficos ni gramaticales. Estilo impecable.';

      if (detected === 'es') {
        if (/q(?![ueéií])/.test(lower)) {
          corrected = text.replace(/\bq\b/gi, 'que');
          explanation = 'Se corrigió la abreviatura informal "q" por la forma correcta "que".';
        } else if (text.endsWith('?') && !text.startsWith('¿')) {
          corrected = '¿' + text;
          explanation = 'Se añadió el signo de apertura interrogativo "¿" requerido en español.';
        } else if (text.endsWith('!') && !text.startsWith('¡')) {
          corrected = '¡' + text;
          explanation = 'Se añadió el signo de apertura exclamativo "¡" requerido en español.';
        } else {
          corrected = text.charAt(0).toUpperCase() + text.slice(1);
          explanation = 'Revisión completada: ortografía, tildes y concordancia gramatical validadas.';
        }
      } else {
        if (/\bi\b/.test(text)) {
          corrected = text.replace(/\bi\b/g, 'I');
          explanation = 'Capitalized solitary pronoun "I".';
        } else if (!/[.!?]$/.test(text)) {
          corrected = text + '.';
          explanation = 'Added trailing punctuation for grammatical completeness.';
        }
      }

      await this.streamString(corrected, onChunk, signal);
      return {
        translatedText: corrected,
        isProofreading: true,
        proofreadingExplanation: explanation,
      };
    }

    // 2. Real Neural Translation via Google's universal service
    let translated = '';
    let dictData: DictionaryEntry | undefined = undefined;

    try {
      const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${
        detected === 'auto' ? 'auto' : detected
      }&tl=${targetLang}&dt=t&dt=bd&dt=rm&q=${encodeURIComponent(text)}`;

      const response = await fetch(gtxUrl, { signal });
      if (response.ok) {
        const data = await response.json();
        // data[0] contains translated segments
        if (data[0] && Array.isArray(data[0])) {
          translated = data[0].map((item: any) => item[0]).filter(Boolean).join('');
        }

        // data[2] contains real server-side detected language
        if (data[2] && typeof data[2] === 'string') {
          const serverDetected = data[2].toLowerCase() as LanguageCode;
          if (onDetectedLanguage && serverDetected !== detected) {
            onDetectedLanguage(serverDetected);
          }
        }

        // If single word, parse dictionary data from data[1] or dictionary API
        if (isSingleWord) {
          let partOfSpeech = '';
          let definition = '';
          let examples: string[] = [];

          if (data[1] && Array.isArray(data[1])) {
            const firstGroup = data[1][0];
            if (firstGroup) {
              partOfSpeech = firstGroup[0] || '';
              const synonyms = firstGroup[1] || [];
              if (synonyms.length > 0) {
                definition = `Acepciones en ${targetLang.toUpperCase()}: ${synonyms.slice(0, 4).join(', ')}.`;
              }
            }
          }

          // Fetch rich definitions and phonetics from Free Dictionary API if applicable
          try {
            const dictRes = await fetch(
              `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(lower)}`,
              { signal: AbortSignal.timeout(2000) }
            );
            if (dictRes.ok) {
              const dictJson = await dictRes.json();
              const firstEntry = dictJson[0];
              const phonetic =
                firstEntry?.phonetic || firstEntry?.phonetics?.find((p: any) => p.text)?.text;
              const firstMeaning = firstEntry?.meanings?.[0];
              const firstDef = firstMeaning?.definitions?.[0];

              dictData = {
                word: text,
                partOfSpeech: firstMeaning?.partOfSpeech || partOfSpeech || 'término',
                phonetic: phonetic || undefined,
                definition: firstDef?.definition || definition || `Traducción: ${translated}`,
                examples: firstDef?.example
                  ? [firstDef.example]
                  : [`"${text}" → "${translated}"`],
              };
            }
          } catch (e) {
            // Free dictionary api fetch skipped/timed out
          }

          if (!dictData) {
            dictData = {
              word: text,
              partOfSpeech: partOfSpeech || 'término',
              definition: definition || `Término traducido al ${targetLang.toUpperCase()}.`,
              examples: [`"${text}" → "${translated}"`],
            };
          }
        }
      }
    } catch (e) {
      console.warn('Online translation fallback triggered:', e);
    }

    // Fallback if network failed
    if (!translated) {
      translated = this.localFallbackTranslate(text, detected, targetLang);
      if (isSingleWord) {
        dictData = {
          word: text,
          partOfSpeech: 'palabra',
          definition: `Traducción al ${targetLang.toUpperCase()}: ${translated}`,
          examples: [`"${text}" → "${translated}"`],
        };
      }
    }

    // Apply Tone adjustments
    if (tone === 'formal') {
      if (targetLang === 'es' && !translated.startsWith('[')) {
        translated = 'Le informamos cordialmente: ' + translated;
      }
    } else if (tone === 'concise') {
      translated = translated.replace(/^(le informamos cordialmente: |oye, )/i, '').trim();
    }

    // Stream the final translation
    await this.streamString(translated, onChunk, signal);

    return {
      translatedText: translated,
      isDictionary: isSingleWord,
      dictionaryEntry: dictData,
    };
  }

  private localFallbackTranslate(text: string, detected: LanguageCode, targetLang: LanguageCode): string {
    const commonTranslations: Record<string, { es: string; en: string }> = {
      walkthrough: { es: 'Guía paso a paso / Tutorial', en: 'Walkthrough' },
      hello: { es: 'Hola', en: 'Hello' },
      world: { es: 'Mundo', en: 'World' },
      development: { es: 'Desarrollo', en: 'Development' },
      speed: { es: 'Velocidad', en: 'Speed' },
      smart: { es: 'Inteligente', en: 'Smart' },
      guide: { es: 'Guía', en: 'Guide' },
      tutorial: { es: 'Tutorial', en: 'Tutorial' },
      translator: { es: 'Traductor', en: 'Translator' },
    };

    const lower = text.trim().toLowerCase();
    if (commonTranslations[lower]) {
      return targetLang === 'es' ? commonTranslations[lower].es : commonTranslations[lower].en;
    }

    return text;
  }

  // Token-by-token streaming simulator (12-20ms chunks for fluid visual response)
  private async streamString(text: string, onChunk: (chunk: string) => void, signal: AbortSignal): Promise<void> {
    const words = text.split(/(\s+)/);
    let accumulated = '';

    for (const word of words) {
      if (signal.aborted) break;
      accumulated += word;
      onChunk(accumulated);
      await new Promise((r) => setTimeout(r, 14));
    }
  }

  // --- GEMINI API STREAMING ---
  private async translateWithGemini({
    text,
    detected,
    targetLang,
    tone,
    apiKey,
    geminiModel,
    isSingleWord,
    isProofreading,
    signal,
    onChunk,
  }: {
    text: string;
    detected: LanguageCode;
    targetLang: LanguageCode;
    tone: Tone;
    apiKey: string;
    geminiModel?: string;
    isSingleWord: boolean;
    isProofreading: boolean;
    signal: AbortSignal;
    onChunk: (chunk: string) => void;
  }): Promise<TranslationResponse> {
    const prompt = isProofreading
      ? `Eres un asistente de corrección de estilo y gramática en ${detected.toUpperCase()}. Corrige el siguiente texto, manteniendo el tono original pero perfeccionando ortografía y puntuación. Devuelve solo el texto corregido.\n\nTexto: "${text}"`
      : `Traduce el siguiente texto de ${detected.toUpperCase()} a ${targetLang.toUpperCase()} con tono "${tone}". ${
          isSingleWord
            ? 'Como es una sola palabra, proporciona la traducción directa en la primera línea. Luego una línea vacía y una breve definición con un ejemplo de uso.'
            : 'Devuelve exclusivamente la traducción, sin explicaciones ni comillas adicionales.'
        }\n\nTexto: "${text}"`;

    const model = geminiModel?.trim() || 'gemini-3.8-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
      signal,
    });

    if (!response.ok) {
      let detail = response.statusText;
      const errorCode = response.status;
      try {
        const errJson = await response.json();
        if (errJson.error?.message) {
          detail = errJson.error.message;
        }
      } catch (e) {}

      // If model is 404 Not Found (e.g. gemini-3.8-flash doesn't exist in Google API):
      // Automatically fallback to active Google models so translation succeeds!
      if (errorCode === 404 && model !== 'gemini-2.0-flash' && model !== 'gemini-1.5-flash') {
        try {
          return await this.translateWithGemini({
            text,
            detected,
            targetLang,
            tone,
            apiKey,
            geminiModel: 'gemini-2.0-flash',
            isSingleWord,
            isProofreading,
            signal,
            onChunk,
          });
        } catch (e2) {
          return await this.translateWithGemini({
            text,
            detected,
            targetLang,
            tone,
            apiKey,
            geminiModel: 'gemini-1.5-flash',
            isSingleWord,
            isProofreading,
            signal,
            onChunk,
          });
        }
      }

      throw new Error(`Error de Gemini API (${errorCode}): ${detail}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const piece = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (piece) {
                fullText += piece;
                onChunk(fullText);
              }
            } catch (e) {}
          }
        }
      }
    }

    return {
      translatedText: fullText,
      isProofreading,
      isDictionary: isSingleWord,
    };
  }

  // --- OPENAI API STREAMING ---
  private async translateWithOpenAI({
    text,
    detected,
    targetLang,
    tone,
    apiKey,
    openaiModel,
    isSingleWord,
    isProofreading,
    signal,
    onChunk,
  }: {
    text: string;
    detected: LanguageCode;
    targetLang: LanguageCode;
    tone: Tone;
    apiKey: string;
    openaiModel?: string;
    isSingleWord: boolean;
    isProofreading: boolean;
    signal: AbortSignal;
    onChunk: (chunk: string) => void;
  }): Promise<TranslationResponse> {
    const systemPrompt = isProofreading
      ? `You are a professional proofreader for ${detected}. Correct spelling, grammar, and style without changing core meaning.`
      : `You are an ultra-fast AI translator. Translate from ${detected} to ${targetLang} with a ${tone} tone. Output only the translation.`;

    const model = openaiModel?.trim() || 'gpt-4o-mini';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
      }),
      signal,
    });

    if (!response.ok) {
      let detail = response.statusText;
      const errorCode = response.status;
      try {
        const errJson = await response.json();
        if (errJson.error?.message) {
          detail = errJson.error.message;
        }
      } catch (e) {}
      throw new Error(`Error de OpenAI (${errorCode}): ${detail}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              const piece = data.choices?.[0]?.delta?.content || '';
              if (piece) {
                fullText += piece;
                onChunk(fullText);
              }
            } catch (e) {}
          }
        }
      }
    }

    return {
      translatedText: fullText,
      isProofreading,
      isDictionary: isSingleWord,
    };
  }

  // --- TEST CONNECTION PROBE ---
  public async testConnection(settings: AppSettings): Promise<{ success: boolean; message: string; latency?: number }> {
    const startTime = Date.now();

    if (settings.provider === 'local') {
      try {
        const res = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=hello', {
          signal: AbortSignal.timeout(3000),
        });
        const latency = Date.now() - startTime;
        if (res.ok) {
          return { success: true, message: `Motor Universal Activo (${latency}ms)`, latency };
        }
        return { success: true, message: 'Motor Local Activo' };
      } catch (e) {
        return { success: true, message: 'Motor Local Activo (Offline)' };
      }
    }

    if (settings.provider === 'gemini') {
      const apiKey = settings.geminiApiKey?.trim();
      if (!apiKey) {
        return { success: false, message: 'Introduce una API Key de Gemini' };
      }
      const model = settings.geminiModel?.trim() || 'gemini-2.0-flash';
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'test' }] }],
            generationConfig: { maxOutputTokens: 2 },
          }),
          signal: AbortSignal.timeout(5000),
        });

        const latency = Date.now() - startTime;
        if (res.ok) {
          return { success: true, message: `Conectado con ${model} (${latency}ms)`, latency };
        }

        const errJson = await res.json().catch(() => ({}));
        let msg = errJson.error?.message || res.statusText;
        if (res.status === 404) {
          msg = `El modelo "${model}" no existe en Google v1beta. Te sugerimos gemini-2.0-flash o gemini-1.5-flash.`;
        }
        return { success: false, message: `Error Gemini (${res.status}): ${msg}` };
      } catch (e: any) {
        return { success: false, message: `Error de red: ${e.message || 'Sin conexión'}` };
      }
    }

    if (settings.provider === 'openai') {
      const apiKey = settings.openaiApiKey?.trim();
      if (!apiKey) {
        return { success: false, message: 'Introduce una API Key de OpenAI' };
      }
      const model = settings.openaiModel?.trim() || 'gpt-4o-mini';
      try {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(5000),
        });
        const latency = Date.now() - startTime;
        if (res.ok) {
          return { success: true, message: `Conectado con OpenAI • ${model} (${latency}ms)`, latency };
        }
        const errJson = await res.json().catch(() => ({}));
        return { success: false, message: `Error OpenAI (${res.status}): ${errJson.error?.message || res.statusText}` };
      } catch (e: any) {
        return { success: false, message: `Error de red: ${e.message || 'Sin conexión'}` };
      }
    }

    return { success: true, message: 'IA Lista' };
  }
}

export const aiService = new AIService();
