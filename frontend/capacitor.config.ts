import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.resqly.app',
  appName: 'Resqly',
  webDir: 'build',
  // bundledWebRuntime is no longer needed in v7
  android: {
    allowMixedContent: false,
    adjustMarginsForEdgeToEdge: 'disable',
    // Production backend is HTTPS; the webview is served from https://localhost
    // (Capacitor default), so cookies/storage stay scoped to the app.
  },
  server: {
    // androidScheme=https makes the WebView origin `https://localhost`,
    // which is required for service-worker-like persistence and matches
    // production CORS behaviour.
    androidScheme: 'https',
    // Do not set `url` here in production builds — that would point the
    // webview at a remote URL instead of loading the bundled web build.
    cleartext: false,
  },
  plugins: {
    StatusBar: { overlaysWebView: true, style: 'DARK' },
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#1d4ed8',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#1d4ed8',
    },
    Geolocation: {
      // Permission strings live in AndroidManifest.xml
    },
    Camera: {
      // Permission strings live in AndroidManifest.xml
    },
  },
};

export default config;
