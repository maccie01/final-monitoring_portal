import React from "react";
import ReactDOM from "react-dom/client";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Enable axe-core accessibility testing in development
if (import.meta.env.DEV) {
  import("@axe-core/react").then((axe) => {
    axe.default(React, ReactDOM, 1000, {
      rules: [
        // Exclude rules that may be too strict for development
        { id: "color-contrast", enabled: true },
        { id: "label", enabled: true },
        { id: "button-name", enabled: true },
      ],
    });
  }).catch((error) => {
    console.warn("Failed to load axe-core:", error);
  });
}

createRoot(document.getElementById("root")!).render(<App />);
