import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.resqly.app',
  appName: 'Resqly',
  webDir: 'build',
  // bundledWebRuntime is no longer needed in v7
  android: {
    allowMixedContent: false,
    // Keep the WebView edge-to-edge on all Android versions. Native insets are
    // exposed as CSS variables so tappable content remains clear of system bars.
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
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#1d4ed8',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      // Keep the system bars visible and transparent instead of switching modes
      // when the splash screen closes.
      splashFullScreen: false,
      splashImmersive: false,
    },
    StatusBar: {
      // The native window and WebView both draw behind transparent system bars.
      // Route-aware icon contrast is set by NativeSystemBars in App.js.
      overlaysWebView: true,
      style: 'DARK',
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
