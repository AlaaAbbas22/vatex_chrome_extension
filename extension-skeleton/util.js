setTimeout(() => {
    // Find the Shadow DOM container
    const container = document.getElementById("chrome-extension-container");
    console.log("container", container);
    if (container && container.shadowRoot) {
        // Select all images within the Shadow DOM
        const images = container.shadowRoot.querySelectorAll("img");
        console.log("images", images);
        images.forEach(img => {
            console.log("Before:", img.src);

            // Ensure we only modify relative paths (not external URLs)
            const imgSrc = img.getAttribute("src");
            if (imgSrc && !imgSrc.startsWith("http")) {
                img.src = chrome.runtime.getURL(imgSrc);
                console.log("After:", img.src);
            }
        });
    }
}, 5000);
