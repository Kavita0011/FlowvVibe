import React, { lazy, Suspense } from 'react';
const ReactFlow = lazy(() => import('react-flow-renderer'));

function EditorCanvas() {
  return (
    <div className="editor-canvas">
      <Suspense fallback={<div>Loading...</div>}>
        <ReactFlow /> {/* Lazy-loaded component */}
      </Suspense>
    </div>
  );
}

export default EditorCanvas;