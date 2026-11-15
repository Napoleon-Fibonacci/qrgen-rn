/**
 * Entry pratinjau web. Memakai AppRegistry dari react-native-web, sama seperti
 * `index.js` untuk Android.
 */
import { AppRegistry } from 'react-native-web';
import App from '../App';

AppRegistry.registerComponent('QrGenApp', () => App);

AppRegistry.runApplication('QrGenApp', {
  rootTag: document.getElementById('root'),
  initialProps: {},
});
