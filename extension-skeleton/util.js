/**
 * @file util.js
 * @description Utility functions for the extension
 * @date 2025-09-07
 */

/*
 * This file is responsible for fixing the assets (images, etc.) paths.
 */
setTimeout(() => {
  // Find the Shadow DOM container
  const container = document.getElementById("chrome-extension-container");
  if (container && container.shadowRoot) {
    // Select all images within the Shadow DOM
    const images = container.shadowRoot.querySelectorAll("img");
    images.forEach((img) => {
      // Ensure we only modify relative paths (not external URLs)
      const imgSrc = img.getAttribute("src");
      if (imgSrc && !imgSrc.startsWith("http")) {
        img.src = chrome.runtime.getURL(imgSrc);
      }
    });
  }
}, 5000);
