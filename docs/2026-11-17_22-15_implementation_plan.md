# Plan de Implementación: Generación del Instalador macOS (.dmg) de Astro

**Fecha:** 2026-11-17 22:15  
**Autor:** Antigravity Agent  

## Contexto y Diagnóstico
1. **Proyecto:** Aplicación Astro Traductor IA (Electron + React / Vite + binarios nativos Swift en macOS).
2. **Entorno de ejecución:** Node.js y npm están provistos a través del entorno Laravel Herd (`/Users/roger/Library/Application Support/Herd/config/nvm/versions/node/v22.22.2/bin`).
3. **Herramientas de empaquetado:** `electron-builder` está instalado localmente en `devDependencies` y el comando `npm run dist:dmg` está configurado en `package.json` para:
   - Compilar los binarios nativos Swift (`ocr-helper` y `cmd-tap-listener`) a `bin/`.
   - Compilar el frontend web con Vite a `dist/`.
   - Empaquetar el bundle de Electron y generar la imagen de disco macOS (`.dmg`) en la carpeta `release/`.

## Pasos de Ejecución
1. **Compilación de Binarios Nativos Swift y UI Vite:**
   - Asegurar que `bin/ocr-helper` y `bin/cmd-tap-listener` estén compilados con optimización `-O`.
   - Ejecutar `npm run build:ui` para generar `dist/`.
2. **Construcción y Empaquetado DMG:**
   - Ejecutar `electron-builder --mac dmg` asegurando que las rutas de recursos adicionales (`bin/`) se incluyan.
   - Si no hay certificado Apple Developer configurado en el sistema, electron-builder generará un binario con firma ad-hoc local para desarrollo.
3. **Verificación del Entregable:**
   - Comprobar que en la carpeta `release/` se haya creado exitosamente el archivo `.dmg` (por ejemplo `Astro-1.0.0.dmg` o `Astro-1.0.0-arm64.dmg` / universal).
   - Verificar integridad, tamaño del archivo y estructura interna del `.dmg`.
4. **Documentación:**
   - Generar el reporte de entrega Walkthrough en `docs/2026-11-17_22-15_walkthrough.md`.

