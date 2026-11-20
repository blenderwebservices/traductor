const { app, BrowserWindow, globalShortcut, ipcMain, clipboard, nativeTheme, systemPreferences, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');

// Suppress internal Chromium EGL/GL driver fallback logs on macOS
app.commandLine.appendSwitch('log-level', '3');
app.commandLine.appendSwitch('disable-logging');

let mainWindow = null;
let tray = null;
let cmdTapProcess = null;
let lastKnownSelection = '';
let isWindowPinned = false;

// Check if accessibility permissions are granted
function isAccessibilityGranted(prompt = false) {
  if (process.platform === 'darwin') {
    return systemPreferences.isTrustedAccessibilityClient(prompt);
  }
  return true;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 680,
    height: 480,
    show: false,
    frame: false,
    transparent: true,
    hasShadow: true,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the built Vite distribution
  const distPath = path.join(__dirname, '../dist/index.html');
  if (fs.existsSync(distPath)) {
    mainWindow.loadFile(distPath);
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  // Hide on blur (Ephemeral window behavior unless pinned with chincheta)
  mainWindow.on('blur', () => {
    if (isWindowPinned) return;
    if (!mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.hide();
    }
  });

  // Notify renderer on system theme change
  nativeTheme.on('updated', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('theme-changed', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
    }
  });
}

// Read current active selection from the frontmost application
async function captureActiveSelection() {
  return new Promise((resolve) => {
    let previousClipboard = '';
    try {
      const prev = clipboard.readText();
      if (typeof prev === 'string') {
        previousClipboard = prev.trim();
      }
    } catch (e) {}

    const script = `
      tell application "System Events"
        set frontApp to name of first application process whose frontmost is true
        if frontApp is not "Electron" and frontApp is not "Astro" then
          keystroke "c" using command down
        end if
      end tell
    `;

    exec(`osascript -e '${script}'`, { timeout: 400 }, () => {
      setTimeout(() => {
        try {
          const raw = clipboard.readText();
          const current = typeof raw === 'string' ? raw.trim() : '';
          if (current.length > 0) {
            resolve(current);
          } else {
            resolve('');
          }
        } catch (err) {
          resolve('');
        }
      }, 70);
    });
  });
}

// Show the modal window with low latency (<200ms)
async function showModal(prefillText = null) {
  if (!mainWindow) return;

  let textToTranslate = prefillText;
  if (textToTranslate === null) {
    try {
      textToTranslate = await captureActiveSelection();
    } catch (e) {
      textToTranslate = '';
    }
  }

  mainWindow.center();
  mainWindow.show();
  mainWindow.focus();

  // Send the captured text to React Native renderer
  mainWindow.webContents.send('show-with-text', {
    text: typeof textToTranslate === 'string' ? textToTranslate : '',
    isDarkMode: nativeTheme.shouldUseDarkColors,
  });
}

function registerGlobalShortcuts() {
  // Primary Shortcut: Cmd + Alt + D
  try {
    const registered = globalShortcut.register('CommandOrControl+Alt+D', async () => {
      await showModal();
    });
    console.log('Shortcut Cmd+Alt+D registered:', registered);
  } catch (err) {
    console.error('Error registering Cmd+Alt+D:', err);
  }

  // Secondary Shortcut for OCR: Cmd + Alt + O
  try {
    globalShortcut.register('CommandOrControl+Alt+O', async () => {
      await triggerScreenOCR();
    });
  } catch (err) {
    console.error('Error registering OCR shortcut:', err);
  }
}

// Helper to locate native binaries in dev and packaged production
function getBinPath(binaryName) {
  if (app.isPackaged) {
    const packagedPath = path.join(process.resourcesPath, 'bin', binaryName);
    if (fs.existsSync(packagedPath)) return packagedPath;
  }
  return path.join(__dirname, '..', 'bin', binaryName);
}

// Start native double-command tap listener in background
function startDoubleCmdListener() {
  const binaryPath = getBinPath('cmd-tap-listener');
  if (!fs.existsSync(binaryPath)) {
    console.warn('Native cmd-tap-listener binary not found at:', binaryPath);
    return;
  }

  try {
    cmdTapProcess = spawn(binaryPath);

    cmdTapProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output.includes('CMD_DOUBLE_TAP')) {
        showModal();
      } else if (output.includes('ACCESSIBILITY_REQUIRED')) {
        console.log('Accessibility permissions requested by listener');
      }
    });

    cmdTapProcess.stderr.on('data', (err) => {
      console.error('cmd-tap-listener error:', err.toString());
    });

    cmdTapProcess.on('close', (code) => {
      console.log('cmd-tap-listener exited with code:', code);
    });
  } catch (e) {
    console.error('Failed to spawn cmd-tap-listener:', e);
  }
}

// OCR Screen Capture implementation
async function triggerScreenOCR() {
  return new Promise((resolve) => {
    const tmpFile = `/tmp/astro_ocr_${Date.now()}.png`;
    const ocrBinary = getBinPath('ocr-helper');

    if (mainWindow && mainWindow.isVisible()) {
      mainWindow.hide();
    }

    exec(`screencapture -i "${tmpFile}"`, (captureError) => {
      if (captureError || !fs.existsSync(tmpFile)) {
        resolve({ success: false, error: 'Captura cancelada' });
        return;
      }

      exec(`"${ocrBinary}" "${tmpFile}"`, (ocrError, stdout) => {
        try { fs.unlinkSync(tmpFile); } catch (e) {}

        if (ocrError) {
          resolve({ success: false, error: ocrError.message });
          return;
        }

        const recognizedText = stdout.trim();
        if (recognizedText) {
          showModal(recognizedText);
          resolve({ success: true, text: recognizedText });
        } else {
          resolve({ success: false, error: 'No se detectó texto en la imagen' });
        }
      });
    });
  });
}

// Auto replace in background application
function autoReplaceText(text) {
  if (!text) return;
  clipboard.writeText(text);

  if (mainWindow) {
    mainWindow.hide();
  }

  setTimeout(() => {
    const pasteScript = `
      tell application "System Events"
        keystroke "v" using command down
      end tell
    `;
    exec(`osascript -e '${pasteScript}'`, (err) => {
      if (err) console.error('Error pasting replacement text:', err);
    });
  }, 90);
}

// Native Text-to-Speech
function speakText(text, lang = 'es', voice = null) {
  if (!text) return;
  let chosenVoice = voice && voice !== 'auto' ? voice : null;
  if (!chosenVoice) {
    if (lang.startsWith('es')) {
      chosenVoice = 'Paulina';
    } else if (lang.startsWith('en')) {
      chosenVoice = 'Samantha';
    } else if (lang.startsWith('fr')) {
      chosenVoice = 'Thomas';
    } else if (lang.startsWith('de')) {
      chosenVoice = 'Anna';
    } else if (lang.startsWith('it')) {
      chosenVoice = 'Alice';
    } else if (lang.startsWith('pt')) {
      chosenVoice = 'Luciana';
    } else if (lang.startsWith('zh')) {
      chosenVoice = 'Ting-Ting';
    } else if (lang.startsWith('ja')) {
      chosenVoice = 'Kyoko';
    } else if (lang.startsWith('ru')) {
      chosenVoice = 'Milena';
    } else {
      chosenVoice = 'Samantha';
    }
  }

  const escapedText = text.replace(/"/g, '\\"');
  exec(`say -v "${chosenVoice}" "${escapedText}" || say "${escapedText}"`, (err) => {
    if (err) console.error('TTS error:', err);
  });
}

function getSystemVoices() {
  return new Promise((resolve) => {
    if (process.platform !== 'darwin') {
      resolve([]);
      return;
    }
    exec("say -v '?'", { timeout: 3000 }, (err, stdout) => {
      if (err || !stdout) {
        resolve([]);
        return;
      }
      const lines = stdout.split('\n');
      const voices = [];
      for (const line of lines) {
        const match = line.match(/^([^\s].*?)\s+([a-z]{2}_[A-Z]{2})\s+#\s*(.*)$/);
        if (match) {
          voices.push({
            name: match[1].trim(),
            lang: match[2].trim(),
            example: match[3].trim(),
          });
        }
      }
      resolve(voices);
    });
  });
}

function stopSpeaking() {
  exec('killall say', () => {});
}

function createTray() {
  try {
    const iconPath = path.join(__dirname, 'trayIconTemplate.png');
    let icon = null;
    if (fs.existsSync(iconPath)) {
      icon = nativeImage.createFromPath(iconPath);
      if (!icon.isEmpty()) {
        icon.setTemplateImage(true);
      }
    }
    if (!icon || icon.isEmpty()) {
      icon = nativeImage.createEmpty();
    }

    tray = new Tray(icon);
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Astro Traductor', enabled: false },
      { type: 'separator' },
      { label: 'Abrir Traductor (Cmd+Alt+D)', click: () => showModal() },
      { label: 'Capturar Texto de Pantalla (OCR)', click: () => triggerScreenOCR() },
      { type: 'separator' },
      {
        label: 'Permisos de Accesibilidad',
        click: () => systemPreferences.isTrustedAccessibilityClient(true)
      },
      { type: 'separator' },
      { label: 'Salir de Astro', click: () => app.quit() }
    ]);
    tray.setToolTip('Astro - Traductor Universal IA');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => showModal());
  } catch (err) {
    console.warn('Tray creation warning:', err.message);
  }
}

// IPC Handlers
ipcMain.on('hide-window', () => {
  if (mainWindow) mainWindow.hide();
});

ipcMain.on('auto-replace-text', (_event, text) => {
  autoReplaceText(text);
});

ipcMain.handle('get-clipboard-text', () => {
  try {
    const text = clipboard.readText();
    return typeof text === 'string' ? text : '';
  } catch (e) {
    return '';
  }
});

ipcMain.on('copy-to-clipboard', (_event, text) => {
  if (typeof text === 'string') {
    clipboard.writeText(text);
  }
});

ipcMain.handle('trigger-screen-ocr', async () => {
  return await triggerScreenOCR();
});

ipcMain.on('speak-text', (_event, { text, lang, voice }) => {
  speakText(text, lang, voice);
});

ipcMain.handle('get-system-voices', async () => {
  return await getSystemVoices();
});

ipcMain.on('set-window-pinned', (_event, pinned) => {
  isWindowPinned = !!pinned;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setAlwaysOnTop(true, 'floating');
  }
});

ipcMain.on('stop-speaking', () => {
  stopSpeaking();
});

ipcMain.handle('check-accessibility', () => {
  return isAccessibilityGranted(false);
});

ipcMain.on('open-accessibility-prefs', () => {
  isAccessibilityGranted(true);
});

app.whenReady().then(() => {
  createWindow();
  registerGlobalShortcuts();
  startDoubleCmdListener();
  createTray();
  isAccessibilityGranted(false);
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (cmdTapProcess) {
    cmdTapProcess.kill();
  }
});

app.on('window-all-closed', (e) => {
  e.preventDefault();
});
