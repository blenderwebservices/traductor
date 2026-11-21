import React, { useState, useEffect } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { TranslatorModal } from './components/TranslatorModal';

export const App: React.FC = () => {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState<'dark' | 'light'>(systemScheme === 'dark' ? 'dark' : 'dark'); // Default to dark for sleek spotlight feel

  useEffect(() => {
    if (systemScheme) {
      setTheme(systemScheme);
    }
  }, [systemScheme]);

  useEffect(() => {
    // Listen for theme updates from macOS native system
    if (window.electronAPI) {
      const unsub = window.electronAPI.onThemeChanged((newTheme) => {
        setTheme(newTheme);
      });
      return unsub;
    }
  }, []);

  const isDark = theme === 'dark';

  return (
    <View style={styles.root}>
      <TranslatorModal isDark={isDark} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    position: 'absolute' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 8,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
});

export default App;
