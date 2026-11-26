#!/bin/bash
set -e

# Calculate timestamp in format YYYY.MM.DD.HHMM
TIMESTAMP=$(date +"%Y.%m.%d.%H%M")
export BUILD_TIMESTAMP="${TIMESTAMP}"
CITAS_DMG_NAME="Citas-1.0.${TIMESTAMP}.dmg"
ASTRO_DMG_NAME="Astro-1.0.${TIMESTAMP}.dmg"

echo "================================================"
echo "🚀 Iniciando compilación de Astro DMG..."
echo "⏰ Timestamp: ${TIMESTAMP}"
echo "📦 Nombre objetivo: ${CITAS_DMG_NAME}"
echo "================================================"

# 1. Compilar binarios nativos Swift y bundle Vite
echo "🔨 Compilando Swift y UI web..."
npm run build

# 2. Empaquetar con electron-builder
echo "📦 Empaquetando aplicación con electron-builder..."
npx electron-builder --mac dmg

# 3. Localizar el DMG base generado en release
BASE_DMG=$(find release -maxdepth 1 -name "*.dmg" ! -name "Citas-*" ! -name "Astro-1.0.2*" | head -n 1)

if [ -z "$BASE_DMG" ]; then
  BASE_DMG="release/Astro-1.0.0.dmg"
fi

if [ -f "$BASE_DMG" ]; then
  echo "✅ DMG base generado en: $BASE_DMG"
  
  # Copiar con el nombre estricto especificado en AGENTS.md
  cp "$BASE_DMG" "release/${CITAS_DMG_NAME}"
  cp "$BASE_DMG" "release/${ASTRO_DMG_NAME}"
  
  echo "================================================"
  echo "🎉 ¡DMG generado exitosamente!"
  echo "📁 release/${CITAS_DMG_NAME}"
  echo "📁 release/${ASTRO_DMG_NAME}"
  echo "================================================"
else
  echo "❌ Error: No se encontró el DMG generado en release/"
  exit 1
fi
