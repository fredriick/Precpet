import type { CapacitorConfig } from '@capacitor/cli';

// The iOS app is a native shell around the deployed Precept PWA: the WebView
// loads the live app and CoreBluetooth is bridged in via the PreceptBle plugin.
// Set PRECEPT_APP_URL to the real deployed URL before `npx cap sync ios`
// (the current value is a placeholder and intentionally will not resolve).
const APP_URL = process.env.PRECEPT_APP_URL ?? 'https://precept-pwa.invalid';

const config: CapacitorConfig = {
  appId: 'com.precpet.app',
  appName: 'Precept',
  webDir: '.next',
  server: {
    url: APP_URL,
    cleartext: false,
  },
};

export default config;
