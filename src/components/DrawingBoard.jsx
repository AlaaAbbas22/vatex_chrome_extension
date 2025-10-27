import { useEffect, useRef } from "react";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

const DrawingBoard = ({
  store,
  editorRef,
  onDrawingChange,
  isLoadingFromSocketRef,
}) => {
  const debounceTimerRef = useRef(null);

  // Listen to store changes and emit them
  useEffect(() => {
    if (!store) return;

    const cleanupFn = store.listen(() => {
      // Don't emit if we're loading from socket
      if (isLoadingFromSocketRef && isLoadingFromSocketRef.current) {
        console.log("Skipping emit - loading from socket");
        return;
      }

      // Clear any existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce the drawing change
      debounceTimerRef.current = setTimeout(() => {
        onDrawingChange();
      }, 1000);
    });

    return () => {
      cleanupFn();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [store, onDrawingChange, isLoadingFromSocketRef]);

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
