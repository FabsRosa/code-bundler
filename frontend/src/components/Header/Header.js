import React from 'react';
import styled from 'styled-components';
import { FolderOpen, Package, Download, Settings } from 'lucide-react';

const HeaderContainer = styled.header`
  background: ${props => props.theme.surface};
  border-bottom: 1px solid ${props => props.theme.border};
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: ${props => props.theme.accent};
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

const DirectoryInput = styled.input`
  display: none;
`;

function Header({
  onProjectSelect,
  selectedFilesCount,
  totalFilesCount,
  onGenerateBundle,
  loading,
  bundle
}) {
  const handleNewProject = async () => {
    // For web implementation, we'll use a text input for directory path
    // In a real Electron app, this would use electron.dialog
    const path = prompt('Enter the absolute path to your project directory:');
    if (path) {
      try {
        const response = await fetch('/api/scan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ rootPath: path }),
        });

        if (!response.ok) {
          throw new Error('Failed to scan directory');
        }

        const data = await response.json();
        onProjectSelect(data);
      } catch (error) {
        console.error('Failed to scan project:', error);
        alert('Failed to scan project folder. Make sure the path is correct and the server has access.');
      }
    }
  };

  const handleDownloadBundle = () => {
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

  return (
    <HeaderContainer>
      <LeftSection>
        <Logo>
          <Package size={24} />
          Code Bundler
        </Logo>

        {(selectedFilesCount !== undefined && totalFilesCount !== undefined) && (
          <Stats>
            <StatItem>
              <strong>{selectedFilesCount}</strong> of <strong>{totalFilesCount}</strong> files selected
            </StatItem>
          </Stats>
        )}
      </LeftSection>

      <RightSection>
        <Actions>
          <Button onClick={handleNewProject}>
            <FolderOpen size={16} />
            New Project
          </Button>

          <Button
            primary
            onClick={onGenerateBundle}
            disabled={!selectedFilesCount || loading}
          >
            <Package size={16} />
            {loading ? 'Generating...' : 'Generate Bundle'}
          </Button>

          <Button onClick={handleDownloadBundle} disabled={!bundle}>
            <Download size={16} />
            Download
          </Button>
        </Actions>
      </RightSection>
    </HeaderContainer>
  );
}

export default Header;