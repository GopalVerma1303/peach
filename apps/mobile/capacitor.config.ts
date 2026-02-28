import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gopx.drive',
  appName: 'gopx-drive',
  webDir: '../web/dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
