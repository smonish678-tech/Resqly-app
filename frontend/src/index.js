import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/index.css";
import App from "@/App";

function syncNativeSafeAreaInsets() {
  const nativeInsets = window.ResqlySystemInsets;
  if (!nativeInsets) return;
  try {
    const root = document.documentElement;
    ['top', 'right', 'bottom', 'left'].forEach((edge) => {
      const value = Number(nativeInsets[edge]());
      if (Number.isFinite(value) && value >= 0) {
        root.style.setProperty('--resqly-safe-' + edge, value + 'px');
      }
    });
  } catch {
    // A missing native bridge must never prevent the web app from rendering.
  }
}
syncNativeSafeAreaInsets();
window.addEventListener('resize', syncNativeSafeAreaInsets, { passive: true });
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) syncNativeSafeAreaInsets();
});


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
