

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Find the shadow root using the correct container ID
const container = document.getElementById("chrome-extension-container");
if (container) {
    const shadowRoot = container.shadowRoot;
    const reactRoot = shadowRoot.getElementById("react-shadow-root");

    if (reactRoot) {
        const root = ReactDOM.createRoot(reactRoot);
        root.render(<App />);
    }
}
