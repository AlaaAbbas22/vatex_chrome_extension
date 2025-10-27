import { useEffect } from "react";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

const DrawingBoard = ({ store, editorRef, onDrawingChange }) => {
  // Listen to store changes and emit them
  useEffect(() => {
    if (!store) return;

    const cleanupFn = store.listen(() => {
      // Debounce the drawing change
      const timeoutId = setTimeout(() => {
        onDrawingChange();
      }, 1000);

      return () => clearTimeout(timeoutId);
    });

    return cleanupFn;
  }, [store, onDrawingChange]);

  return (
    <div style={{ width: "100%", height: "400px" }}>
      <Tldraw
        store={store}
        onMount={(editor) => {
          if (editorRef) {
            editorRef.current = editor;
          }
        }}
      />
    </div>
  );
};

export default DrawingBoard;
