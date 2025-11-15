import React, { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

const LatexDisplayer = ({ latex }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && latex) {
      try {
        // Render LaTeX using KaTeX - completely local, no external links
        katex.render(latex, containerRef.current, {
          throwOnError: false,
          displayMode: true, // Display mode for block equations
          output: "html",
        });
      } catch (err) {
        console.error("KaTeX rendering failed:", err);
        // Fallback to showing raw LaTeX
        containerRef.current.textContent = `$$${latex}$$`;
      }
    }
  }, [latex]);

  return <div ref={containerRef} className="latex-content" />;
};

export default LatexDisplayer;
