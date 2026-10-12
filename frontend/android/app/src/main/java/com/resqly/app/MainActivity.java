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
 * Edge-to-edge system bars with safe-area values forwarded to the web layer.
 * The Agora native-call plugin registration is intentionally retained.
 */
public class MainActivity extends BridgeActivity {
    private volatile float safeTopDp = 0f;
    private volatile float safeRightDp = 0f;
    private volatile float safeBottomDp = 0f;
    private volatile float safeLeftDp = 0f;
    private WebView resqlyWebView;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AgoraCallPlugin.class);
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
            // The launch screen is blue; the web layer switches icon style per screen.
            controller.setAppearanceLightStatusBars(false);
            controller.setAppearanceLightNavigationBars(true);
        }

        resqlyWebView = getBridge().getWebView();
        if (resqlyWebView != null) {
            resqlyWebView.addJavascriptInterface(new SafeAreaBridge(), "ResqlySystemInsets");
        }

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
            return windowInsets;
        });
        ViewCompat.requestApplyInsets(insetTarget);
    }

    private void publishSafeInsetsToWebView() {
        WebView webView = resqlyWebView;
        if (webView == null) return;

        String js = "(function(){var r=document.documentElement;if(!r)return;" +
            "r.style.setProperty('--resqly-safe-top','" + Float.toString(safeTopDp) + "px');" +
            "r.style.setProperty('--resqly-safe-right','" + Float.toString(safeRightDp) + "px');" +
            "r.style.setProperty('--resqly-safe-bottom','" + Float.toString(safeBottomDp) + "px');" +
            "r.style.setProperty('--resqly-safe-left','" + Float.toString(safeLeftDp) + "px');" +
            "})();";
        webView.post(() -> webView.evaluateJavascript(js, null));
    }

    /** Exposes only safe-area measurements to the bundled UI. */
    private final class SafeAreaBridge {
        @JavascriptInterface public float top() { return safeTopDp; }
        @JavascriptInterface public float right() { return safeRightDp; }
        @JavascriptInterface public float bottom() { return safeBottomDp; }
        @JavascriptInterface public float left() { return safeLeftDp; }
    }
}
