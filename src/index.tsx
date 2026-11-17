import { AppRegistry } from 'react-native';
import App from './App';

// Register the app with React Native Web
AppRegistry.registerComponent('AstroTranslator', () => App);

const rootTag = document.getElementById('root');
if (rootTag) {
  AppRegistry.runApplication('AstroTranslator', {
    rootTag,
  });
}
