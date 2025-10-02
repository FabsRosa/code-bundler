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

  // Adjust panels when fileViewer appears/disappears
  useEffect(() => {
    if (!hasFileViewer && middlePanelWidth > 0) {
      const totalWidth = leftPanelWidth + middlePanelWidth;
      setLeftPanelWidth(totalWidth);
      setMiddlePanelWidth(0);
    } else if (hasFileViewer && middlePanelWidth === 0) {
      setLeftPanelWidth(30);
      setMiddlePanelWidth(35);
    }
  }, [hasFileViewer, middlePanelWidth, leftPanelWidth]);

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
      setLeftPanelWidth(Math.max(20, Math.min(60, percentage)));
    } else if (isResizing === 'middle') {
      const middlePercentage = Math.max(20, Math.min(60, percentage - leftPanelWidth));
      setMiddlePanelWidth(middlePercentage);
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

  const rightPanelWidth = 100 - leftPanelWidth - middlePanelWidth;

  return (
    <PanelsContainer ref={containerRef}>
      {/* File Tree Panel */}
      <Panel style={{ width: `${leftPanelWidth}%` }}>
        {fileTree}
      </Panel>

      {/* First Resizer */}
      <VerticalResizer onMouseDown={() => startResizing('left')} />

      {/* File Viewer Panel */}
      <Panel
        style={{ width: `${middlePanelWidth}%` }}
        collapsed={!hasFileViewer}
      >
        {fileViewer}
      </Panel>

      {/* Second Resizer */}
      {hasFileViewer && (
        <VerticalResizer onMouseDown={() => startResizing('middle')} />
      )}

      {/* Bundle Viewer Panel */}
      <Panel style={{ width: `${rightPanelWidth}%` }}>
        {bundleViewer}
      </Panel>
    </PanelsContainer>
  );
}

export default ResizablePanels;