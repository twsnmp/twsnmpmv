import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'jp.co.twise.twsnmpmv',
  appName: 'twsnmpmv',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  ios: {
    scrollEnabled: false,
    contentInset: 'always',
    webContentsDebuggingEnabled: true,
  }
};

export default config;
