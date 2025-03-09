fetch(chrome.runtime.getURL("index.html"))
    .then(response => response.text())
    .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // Find CSS and JS files dynamically
        const cssFile = doc.querySelector('link[rel="stylesheet"]')?.getAttribute("href");
        const jsFile = doc.querySelector('script[type="module"]')?.getAttribute("src");

        if (!cssFile || !jsFile) {
            console.error("Could not find asset files.");
            return;
        }

        // Create a container for the Shadow DOM
        const container = document.createElement("div");
        container.id = "chrome-extension-container";
        container.style.position = "fixed";
        container.style.zIndex = "9999";
        container.style.resize = "both";
        container.style.overflow = "auto";
        container.style.top = "0";
        container.style.left = "0";
        container.style.backgroundColor = "white";
        container.style.border = "1px solid black";
        // Add message bridge before creating shadow root
        window.addEventListener('message', function(event) {
            // Only accept messages from the same frame
            if (event.source !== window) return;
        
            if (event.data.type && event.data.type.startsWith('FROM_PAGE_')) {
                // Forward message to extension
                chrome.runtime.sendMessage(event.data.message, function(response) {
                    window.postMessage({
                        type: 'FROM_EXTENSION_' + event.data.type.slice(10),
                        response: response
                    }, '*');
                });
            }
        });
        // Create a Shadow Root
        const shadowRoot = container.attachShadow({ mode: "open" });

        // Create a wrapper div for React root
        const reactRoot = document.createElement("div");
        reactRoot.id = "react-shadow-root";
        shadowRoot.appendChild(reactRoot);

        // Append styles dynamically
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = chrome.runtime.getURL(cssFile);
        shadowRoot.appendChild(style);

        // Inject the container into the main document
        document.body.appendChild(container);

        // Inject React JS dynamically inside Shadow DOM
        const script = document.createElement("script");
        script.src = chrome.runtime.getURL(jsFile);
        script.type = "module";
        script.onload = () => script.remove();
        shadowRoot.appendChild(script);

        // === DRAGGING FUNCTIONALITY ===
        const header = document.createElement("div");
        header.style.backgroundColor = "darkblue";
        header.style.color = "white";
        header.style.padding = "10px";
        header.style.cursor = "move";
        header.style.position = "absolute";
        header.style.top = "0";
        header.style.width = "80%";
        header.innerText = "Drag me";
        shadowRoot.appendChild(header);

        header.onmousedown = function(event) {
            let shiftX = event.clientX - container.getBoundingClientRect().left;
            let shiftY = event.clientY - container.getBoundingClientRect().top;

            function moveAt(pageX, pageY) {
                container.style.left = pageX - shiftX + 'px';
                container.style.top = pageY - shiftY + 'px';
            }

            function onMouseMove(event) {
                moveAt(event.pageX, event.pageY);
            }

            document.addEventListener('mousemove', onMouseMove);

            header.onmouseup = function() {
                document.removeEventListener('mousemove', onMouseMove);
                header.onmouseup = null;
            };
        };

        header.ondragstart = function() {
            return false;
        };
    });
// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FROM_SOCKET_LATEX') {
    window.postMessage({
      type: 'FROM_EXTENSION_SOCKET_LATEX',
      data: message.data
    }, '*');
  }

  if (message.type === 'FROM_SOCKET_TEXT') {
    window.postMessage({
      type: 'FROM_EXTENSION_SOCKET_TEXT',
      data: message.data
    }, '*');
  }
});

// Listen for messages from the page to be forwarded to the background
window.addEventListener('message', function(event) {
  if (event.source !== window) return;

  if (event.data.type === 'FROM_PAGE_EMIT_TEXT') {
    chrome.runtime.sendMessage(event.data.message, response => {
      // Handle response if needed
    });
  }
});
