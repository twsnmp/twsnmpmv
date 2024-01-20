import { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';


const config: CapacitorConfig = {
  appId: 'jp.co.twise.twsnmpmv',
  appName: 'twsnmpmv',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    cleartext: true,
  },
  ios: {
    scrollEnabled: true,
    contentInset: 'always',
    webContentsDebuggingEnabled: true,
  },
  android:{
    allowMixedContent: true,
  },
  plugins: {
    Keyboard: {
      resize: KeyboardResize.Native,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
