import React, { useState, useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';

const PanelsContainer = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
`;

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  
  ${props => props.collapsed && `
    display: none;
  `}
`;

const Resizer = styled.div`
  background: ${props => props.theme.border};
  cursor: col-resize;
  position: relative;
  z-index: 10;
  transition: background 0.2s;
  
  &:hover {
    background: ${props => props.theme.accent};
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: -2px;
    right: -2px;
  }
`;

const VerticalResizer = styled(Resizer)`
  width: 3px;
  min-width: 3px;
  margin: 0 -1px;
`;

function ResizablePanels({ fileTree, fileViewer, bundleViewer, hasFileViewer }) {
  const [leftPanelWidth, setLeftPanelWidth] = useState(30);
  const [middlePanelWidth, setMiddlePanelWidth] = useState(35);
  const [isResizing, setIsResizing] = useState(null);
  const containerRef = useRef(null);
  const lastMiddlePanelWidthRef = useRef(35); // Remember last middle panel width

  // When fileViewer appears/disappears, adjust the bundle panel, keep file tree consistent
  useEffect(() => {
    if (!hasFileViewer && middlePanelWidth > 0) {
      // Store the current middle panel width before hiding
      lastMiddlePanelWidthRef.current = middlePanelWidth;
      setMiddlePanelWidth(0);
    } else if (hasFileViewer && middlePanelWidth === 0) {
      // Restore the last middle panel width when showing
      setMiddlePanelWidth(lastMiddlePanelWidthRef.current);
    }
  }, [hasFileViewer, middlePanelWidth]);

  const startResizing = useCallback((panel) => {
    setIsResizing(panel);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(null);
  }, []);

  const resize = useCallback((mouseMoveEvent) => {
    if (!isResizing || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const mouseX = mouseMoveEvent.clientX - containerRect.left;
    const percentage = (mouseX / containerWidth) * 100;

    if (isResizing === 'left') {
      // When resizing left panel, keep it within bounds
      const newLeftWidth = Math.max(20, Math.min(60, percentage));
      setLeftPanelWidth(newLeftWidth);
    } else if (isResizing === 'middle') {
      // When resizing middle panel, adjust it and update the ref for remembering
      const newMiddleWidth = Math.max(20, Math.min(60, percentage - leftPanelWidth));
      setMiddlePanelWidth(newMiddleWidth);
      lastMiddlePanelWidthRef.current = newMiddleWidth;
    }
  }, [isResizing, leftPanelWidth]);

  useEffect(() => {
    const handleMouseMove = (e) => resize(e);
    const handleMouseUp = () => stopResizing();

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, resize, stopResizing]);

  // Calculate right panel width based on the other two
  const rightPanelWidth = 100 - leftPanelWidth - (hasFileViewer ? middlePanelWidth : 0);

  return (
    <PanelsContainer ref={containerRef}>
      {/* File Tree Panel - Always visible, consistent width */}
      <Panel style={{ width: `${leftPanelWidth}%` }}>
        {fileTree}
      </Panel>

      {/* First Resizer - Between file tree and file viewer */}
      <VerticalResizer onMouseDown={() => startResizing('left')} />

      {/* File Viewer Panel - Only visible when a file is selected */}
      <Panel
        style={{ width: `${hasFileViewer ? middlePanelWidth : 0}%` }}
        collapsed={!hasFileViewer}
      >
        {fileViewer}
      </Panel>

      {/* Second Resizer - Between file viewer and bundle (only when file viewer is visible) */}
      {hasFileViewer && (
        <VerticalResizer onMouseDown={() => startResizing('middle')} />
      )}

      {/* Bundle Viewer Panel - Takes remaining space */}
      <Panel style={{ width: `${rightPanelWidth}%` }}>
        {bundleViewer}
      </Panel>
    </PanelsContainer>
  );
}

export default ResizablePanels;