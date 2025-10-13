import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { Package, Copy, Download, CheckCircle, AlertCircle, FileText, AlignLeft, BarChart2, HardDrive } from 'lucide-react';

const ViewerContainer = styled.div`
  height: 100%;
  background: ${props => props.theme.surface};
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ViewerHeader = styled.div`
  padding: 0.5rem 1.5rem;
  border-bottom: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.surfaceElevated};
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  min-height: 70px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
`;

const HeaderGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const Title = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.theme.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 77px;
`;

const StatsContainer = styled.div`
  display: flex;
  align-items: center;
  height: 28px;
  padding-right: 1.5rem;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 100%;
  color: ${props => props.theme.textSecondary};
  font-size: 0.875rem;
  white-space: nowrap;
  
  &:not(:last-child) {
    margin-right: 1rem;
    padding-right: 1rem;
    border-right: 1px solid ${props => props.theme.border};
  }
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 120px; /* Ensure consistent button width */
  
  @media (min-width: 769px) {
    align-self: center;
  }
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s;
  
  ${props => props.primary ? `
    background: ${props.theme.accent};
    color: white;
    border: 1px solid ${props.theme.accent};
    
    &:hover {
      background: ${props.theme.accentHover};
      border-color: ${props.theme.accentHover};
    }
  ` : `
    background: transparent;
    color: ${props.theme.text};
    border: 1px solid ${props.theme.border};
    
    &:hover {
      border-color: ${props.theme.accent};
      color: ${props.theme.accent};
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CopySuccess = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: ${props => props.theme.success};
  font-size: 0.875rem;
  font-weight: 500;
  width: 100%;
  padding: 0.5rem;
`;

const Content = styled.pre`
  flex: 1;
  padding: 1rem;
  margin: 0;
  font-family: 'Fira Code', monospace;
  font-size: 0.875rem;
  line-height: 1.4;
  color: ${props => props.theme.text};
  background: ${props => props.theme.codeBackground};
  border: 1px solid ${props => props.theme.codeBorder};
  margin: 1rem;
  border-radius: 8px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  tab-size: 2;
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
  color: ${props => props.theme.textSecondary};
`;

const EmptyStateIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: ${props => props.theme.surfaceElevated};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.accent};
`;

const EmptyStateText = styled.p`
  max-width: 300px;
  line-height: 1.5;
`;

function BundleViewer({ bundle, loading, selectedFilesCount }) {
  const [copied, setCopied] = useState(false);

  const bundleStats = useMemo(() => {
    if (!bundle) return null;

    const lines = bundle.split('\n').length;
    // Use selectedFilesCount if available, otherwise fallback to header count
    const files = ((bundle.match(/##### FILE:/g) || []).length - 1);
    const sizeInBytes = new Blob([bundle]).size;
    const sizeInKB = Math.round(sizeInBytes / 1024);
    const sizeInMB = sizeInKB > 1024 ? (sizeInKB / 1024).toFixed(2) : null;

    return { lines, files, sizeInBytes, sizeInKB, sizeInMB };
  }, [bundle, selectedFilesCount]);

  const handleCopy = async () => {
    if (!bundle) return;
    try {
      await navigator.clipboard.writeText(bundle);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('Failed to copy bundle to clipboard');
    }
  };

  const handleDownload = () => {
    if (!bundle) return;
    const blob = new Blob([bundle], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project-bundle.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <ViewerContainer>
        <ViewerHeader>
          <Title>
            <Package size={20} />
            Project Bundle
          </Title>
        </ViewerHeader>
        <EmptyState>
          <EmptyStateIcon>
            <Package size={24} />
          </EmptyStateIcon>
          <EmptyStateText>Generating bundle...</EmptyStateText>
        </EmptyState>
      </ViewerContainer>
    );
  }

  if (!bundle) {
    return (
      <ViewerContainer>
        <ViewerHeader>
          <Title>
            <Package size={20} />
            Project Bundle
          </Title>
        </ViewerHeader>
        <EmptyState>
          <EmptyStateIcon>
            <Package size={24} />
          </EmptyStateIcon>
          <EmptyStateText>
            {selectedFilesCount > 0
              ? 'Click "Generate Bundle" to create your project bundle for AI analysis.'
              : 'Select files from your project to generate a bundle for AI analysis.'
            }
          </EmptyStateText>
        </EmptyState>
      </ViewerContainer>
    );
  }

  // Calculate bundle stats
  const fileCount = bundle ? (bundle.match(/##### FILE:/g) || []).length : 0;
  const lineCount = bundle ? bundle.split('\n').length : 0;
  const sizeInKB = bundle ? Math.ceil(bundle.length / 1024) : 0;

  return (
    <ViewerContainer>
      <ViewerHeader>
        <HeaderGroup>
          <Title>
            <Package size={20} />
            Project Bundle
          </Title>

          {bundle && (
            <StatsContainer>
              <StatItem>
                <FileText size={14} />
                {fileCount} file{fileCount !== 1 ? 's' : ''}
              </StatItem>

              <StatItem>
                <BarChart2 size={14} />
                {lineCount.toLocaleString()} line{lineCount !== 1 ? 's' : ''}
              </StatItem>

              <StatItem>
                {sizeInKB} KB
              </StatItem>
            </StatsContainer>
          )}
        </HeaderGroup>

        <Actions>
          {copied ? (
            <CopySuccess>
              <CheckCircle size={16} />
              Copied!
            </CopySuccess>
          ) : (
            <Button onClick={handleCopy}>
              <Copy size={16} />
              Copy
            </Button>
          )}
          <Button primary onClick={handleDownload}>
            <Download size={16} />
            Download
          </Button>
        </Actions>
      </ViewerHeader>

      <Content>{bundle}</Content>
    </ViewerContainer>
  );
}

export default BundleViewer;