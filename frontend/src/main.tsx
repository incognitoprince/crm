import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import App from "./App";
import "./index.css";

// Prevent Android's system status bar from drawing over the CRM header.
// This is a no-op in the regular web app.
if (Capacitor.isNativePlatform()) {
  void StatusBar.setOverlaysWebView({ overlay: false })
    .then(() => StatusBar.setBackgroundColor({ color: "#FFFFFF" }))
    .then(() => StatusBar.setStyle({ style: Style.Dark }))
    .catch(() => {
      // Keep app startup working even if a device does not support a status-bar option.
    });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
