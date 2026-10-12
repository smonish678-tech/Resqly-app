package com.resqly.app;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

/**
 * Enables edge-to-edge drawing and publishes the actual Android safe-area
 * insets to the bundled web UI. Surfaces can extend behind system bars while
 * controls use the injected CSS variables to stay in safe, tappable areas.
 */
public class MainActivity extends BridgeActivity {
    private volatile float safeTopDp = 0f;
    private volatile float safeRightDp = 0f;
    private volatile float safeBottomDp = 0f;
    private volatile float safeLeftDp = 0f;
    private WebView resqlyWebView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        WindowCompat.setDecorFitsSystemWindows(window, false);
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setStatusBarContrastEnforced(false);
            window.setNavigationBarContrastEnforced(false);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams attributes = window.getAttributes();
            attributes.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            window.setAttributes(attributes);
        }

        WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(window, window.getDecorView());
        if (controller != null) {
            // White status icons work with the branded launch screen. React updates
            // the style when the active screen's background changes.
            controller.setAppearanceLightStatusBars(false);
            controller.setAppearanceLightNavigationBars(true);
        }

        resqlyWebView = getBridge().getWebView();
        if (resqlyWebView != null) {
            resqlyWebView.addJavascriptInterface(new SafeAreaBridge(), "ResqlySystemInsets");
        }

        // Observe insets at the WebView, not the decor root, so Android can
        // continue dispatching window insets through the activity normally.
        View insetTarget = resqlyWebView != null ? resqlyWebView : window.getDecorView();
        ViewCompat.setOnApplyWindowInsetsListener(insetTarget, (view, windowInsets) -> {
            Insets bars = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            float density = getResources().getDisplayMetrics().density;
            safeTopDp = bars.top / density;
            safeRightDp = bars.right / density;
            safeBottomDp = bars.bottom / density;
            safeLeftDp = bars.left / density;
            publishSafeInsetsToWebView();
            // Preserve dispatch to the WebView and Capacitor's child views.
            return windowInsets;
        });
        ViewCompat.requestApplyInsets(insetTarget);
    }

    private void publishSafeInsetsToWebView() {
        WebView webView = resqlyWebView;
        if (webView == null) return;

        String javascript =
            "(function(){var r=document.documentElement;if(!r)return;" +
            "r.style.setProperty('--resqly-safe-top','" + Float.toString(safeTopDp) + "px');" +
            "r.style.setProperty('--resqly-safe-right','" + Float.toString(safeRightDp) + "px');" +
            "r.style.setProperty('--resqly-safe-bottom','" + Float.toString(safeBottomDp) + "px');" +
            "r.style.setProperty('--resqly-safe-left','" + Float.toString(safeLeftDp) + "px');" +
            "})();";
        webView.post(() -> webView.evaluateJavascript(javascript, null));
    }

    /** Exposes only inset measurements, never native app capabilities or secrets. */
    private final class SafeAreaBridge {
        @JavascriptInterface
        public float top() { return safeTopDp; }

        @JavascriptInterface
        public float right() { return safeRightDp; }

        @JavascriptInterface
        public float bottom() { return safeBottomDp; }

        @JavascriptInterface
        public float left() { return safeLeftDp; }
    }
}
