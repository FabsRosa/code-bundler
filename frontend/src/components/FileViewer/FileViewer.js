import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, File as FileIcon, Download, Copy } from 'lucide-react';
import axios from 'axios';

const ViewerContainer = styled.div`
  height: 100%;
  background: ${props => props.theme.surface};
  border-right: 1px solid ${props => props.theme.border};
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ViewerHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.surfaceElevated};
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
`;

const FileName = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.theme.text};
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FilePath = styled.span`
  font-size: 0.875rem;
  color: ${props => props.theme.textSecondary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Button = styled.button`
  background: transparent;
  border: 1px solid ${props => props.theme.border};
  color: ${props => props.theme.text};
  padding: 0.375rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme.surfaceElevated};
    border-color: ${props => props.theme.accent};
    color: ${props => props.theme.accent};
  }
`;

const CloseButton = styled(Button)`
  border: none;
  background: transparent;
  
  &:hover {
    background: ${props => props.theme.border};
    border: none;
  }
`;

const ContentContainer = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
`;

const LineNumbers = styled.div`
  background: ${props => props.theme.codeBackground};
  border-right: 1px solid ${props => props.theme.codeBorder};
  padding: 1rem 0.5rem;
  font-family: 'Fira Code', monospace;
  font-size: 0.75rem;
  color: ${props => props.theme.textSecondary};
  text-align: right;
  user-select: none;
  overflow-y: auto;
  min-width: 3rem;
`;

const LineNumber = styled.div`
  line-height: 1.4;
`;

const CodeContent = styled.pre`
  flex: 1;
  padding: 1rem;
  margin: 0;
  font-family: 'Fira Code', monospace;
  font-size: 0.875rem;
  line-height: 1.4;
  color: ${props => props.theme.text};
  background: ${props => props.theme.codeBackground};
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  tab-size: 2;
`;

const LoadingState = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.textSecondary};
  font-size: 0.875rem;
`;

const ErrorState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: ${props => props.theme.danger};
  text-align: center;
  padding: 2rem;
`;

const CopySuccess = styled.div`
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: ${props => props.theme.success};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  z-index: 1000;
  animation: slideIn 0.2s ease-out;

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

function FileViewer({ file, onClose }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (file) {
      loadFileContent();
    }
  }, [file]);

  const loadFileContent = async () => {
    if (!file || file.isDirectory) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/file?filePath=${encodeURIComponent(file.fullPath)}`);
      setContent(response.data.content);
    } catch (err) {
      console.error('Failed to load file content:', err);
      setError('Failed to load file content. The file might be binary or too large.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const lines = content.split('\n');
  const lineNumbers = Array.from({ length: lines.length }, (_, i) => i + 1);

  if (!file) return null;

  return (
    <ViewerContainer>
      <ViewerHeader>
        <FileInfo>
          <FileIcon size={16} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <FileName>{file.name}</FileName>
            <FilePath>{file.path}</FilePath>
          </div>
        </FileInfo>

        <Actions>
          <Button onClick={handleCopy} title="Copy content">
            <Copy size={16} />
          </Button>
          <Button onClick={handleDownload} title="Download file">
            <Download size={16} />
          </Button>
          <CloseButton onClick={onClose} title="Close viewer">
            <X size={16} />
          </CloseButton>
        </Actions>
      </ViewerHeader>

      <ContentContainer>
        {loading ? (
          <LoadingState>Loading file content...</LoadingState>
        ) : error ? (
          <ErrorState>
            <div>{error}</div>
            <Button onClick={loadFileContent}>Retry</Button>
          </ErrorState>
        ) : (
          <>
            <LineNumbers>
              {lineNumbers.map(number => (
                <LineNumber key={number}>{number}</LineNumber>
              ))}
            </LineNumbers>
            <CodeContent>{content}</CodeContent>
          </>
        )}
      </ContentContainer>

      {copySuccess && <CopySuccess>Copied to clipboard!</CopySuccess>}
    </ViewerContainer>
  );
}

export default FileViewer;