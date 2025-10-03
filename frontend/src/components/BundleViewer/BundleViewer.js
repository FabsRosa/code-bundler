import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { Package, Copy, Download, CheckCircle, AlertCircle, FileText } from 'lucide-react';

const ViewerContainer = styled.div`
  height: 100%;
  background: ${props => props.theme.surface};
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

const Title = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.theme.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Stats = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  color: ${props => props.theme.textSecondary};
  font-size: 0.875rem;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Button = styled.button`
  background: ${props => props.primary ? props.theme.accent : 'transparent'};
  color: ${props => props.primary ? 'white' : props.theme.text};
  border: ${props => props.primary ? 'none' : `1px solid ${props.theme.border}`};
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: ${props => props.primary ? props.theme.accentHover : props.theme.surfaceElevated};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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

const CopySuccess = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => props.theme.success};
  font-size: 0.875rem;
  font-weight: 500;
`;

const Warning = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  margin: 1rem;
  margin-bottom: 0;
  background: ${props => props.theme.surfaceElevated};
  border: 1px solid ${props => props.theme.danger};
  border-radius: 6px;
  color: ${props => props.theme.danger};
  font-size: 0.875rem;
`;

const Info = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  margin: 1rem;
  background: ${props => props.theme.surfaceElevated};
  border: 1px solid ${props => props.theme.accent};
  border-radius: 6px;
  color: ${props => props.theme.accent};
  font-size: 0.875rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin: 1rem;
`;

const StatCard = styled.div`
  background: ${props => props.theme.surfaceElevated};
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  padding: 0.75rem;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.theme.accent};
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.textSecondary};
`;

function BundleViewer({ bundle, loading, selectedFilesCount }) {
  const [copied, setCopied] = useState(false);

  const bundleStats = useMemo(() => {
    if (!bundle) return null;

    const lines = bundle.split('\n').length;
    const files = (bundle.match(/##### FILE:/g) || []).length;
    const sizeInBytes = new Blob([bundle]).size;
    const sizeInKB = Math.round(sizeInBytes / 1024);
    const sizeInMB = sizeInKB > 1024 ? (sizeInKB / 1024).toFixed(2) : null;

    return { lines, files, sizeInBytes, sizeInKB, sizeInMB };
  }, [bundle]);

  // ... (handleCopy, handleDownload functions remain the same)

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

  return (
    <ViewerContainer>
      <ViewerHeader>
        <Title>
          <Package size={20} />
          Project Bundle
        </Title>

        <Stats>
          {bundleStats && (
            <>
              <StatItem>
                <FileText size={14} />
                <strong>{bundleStats.files}</strong> files
              </StatItem>
              <StatItem>
                <strong>{bundleStats.lines}</strong> lines
              </StatItem>
              <StatItem>
                <strong>
                  {bundleStats.sizeInMB ? `${bundleStats.sizeInMB} MB` : `${bundleStats.sizeInKB} KB`}
                </strong>
              </StatItem>
            </>
          )}
        </Stats>

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

      {bundleStats && (
        <>
          <StatsGrid>
            <StatCard>
              <StatValue>{bundleStats.files}</StatValue>
              <StatLabel>Files</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{bundleStats.lines}</StatValue>
              <StatLabel>Lines</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>
                {bundleStats.sizeInMB ? `${bundleStats.sizeInMB} MB` : `${bundleStats.sizeInKB} KB`}
              </StatValue>
              <StatLabel>Size</StatLabel>
            </StatCard>
          </StatsGrid>

          <Info>
            <Package size={16} />
            Bundle contains {bundleStats.files} files, {bundleStats.lines} lines,
            {bundleStats.sizeInMB ? ` ${bundleStats.sizeInMB} MB` : ` ${bundleStats.sizeInKB} KB`}
          </Info>
        </>
      )}

      {bundleStats && bundleStats.sizeInKB > 180 && (
        <Warning>
          <AlertCircle size={16} />
          Large bundle detected ({bundleStats.sizeInKB}KB). Some AI models may have token limits.
        </Warning>
      )}

      <Content>{bundle}</Content>
    </ViewerContainer>
  );
}

export default BundleViewer;