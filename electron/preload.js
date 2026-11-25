const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  hideWindow: () => ipcRenderer.send('hide-window'),
  setWindowPinned: (pinned) => ipcRenderer.send('set-window-pinned', pinned),
  
  // Selection and replacement
  autoReplaceText: (text) => ipcRenderer.send('auto-replace-text', text),
  getClipboardText: () => ipcRenderer.invoke('get-clipboard-text'),
  copyToClipboard: (text) => ipcRenderer.send('copy-to-clipboard', text),
  
  // OCR Screen capture
  triggerScreenOCR: () => ipcRenderer.invoke('trigger-screen-ocr'),
  
  // Text-to-speech
  speakText: (text, lang, voice) => ipcRenderer.send('speak-text', { text, lang, voice }),
  stopSpeaking: () => ipcRenderer.send('stop-speaking'),
  getVoices: () => ipcRenderer.invoke('get-system-voices'),
  
  // System info & permissions
  checkAccessibility: () => ipcRenderer.invoke('check-accessibility'),
  openAccessibilityPreferences: () => ipcRenderer.send('open-accessibility-prefs'),
  
  // Events from main process
  onShowWithText: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('show-with-text', handler);
    return () => ipcRenderer.removeListener('show-with-text', handler);
  },
  onWindowFocus: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('window-focus', handler);
    return () => ipcRenderer.removeListener('window-focus', handler);
  },
  onThemeChanged: (callback) => {
    const handler = (_event, theme) => callback(theme);
    ipcRenderer.on('theme-changed', handler);
    return () => ipcRenderer.removeListener('theme-changed', handler);
  }
});
