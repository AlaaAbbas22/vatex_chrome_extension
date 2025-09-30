import React, { useEffect, useRef } from "react";

const LatexDisplayer = ({ latex }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Load MathJax script if not already loaded
    if (!window.MathJax) {
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
      script.async = true;
      document.head.appendChild(script);
    }

    // Update content and typeset
    const updateMathJax = () => {
      if (containerRef.current && window.MathJax) {
        containerRef.current.innerHTML = `$$${latex}$$`;
        window.MathJax.typesetClear([containerRef.current]);
        window.MathJax.typesetPromise([containerRef.current]).catch((err) => {
          console.error("MathJax typesetting failed:", err);
        });
      }
    };

    // Wait for MathJax to load if it's not already loaded
    if (window.MathJax) {
      updateMathJax();
    } else {
      const checkMathJax = setInterval(() => {
        if (window.MathJax) {
          clearInterval(checkMathJax);
          updateMathJax();
        }
      }, 100);
    }

    return () => {
      if (containerRef.current && window.MathJax) {
        window.MathJax.typesetClear([containerRef.current]);
      }
    };
  }, [latex]);

  return <div ref={containerRef} className="latex-content" />;
};

export default LatexDisplayer;
