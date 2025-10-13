import React, { useRef } from 'react';
import styled from 'styled-components';
import { FolderOpen, Package, Download } from 'lucide-react';

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

const FileInput = styled.input`
  display: none;
`;

const ProjectInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => props.theme.textSecondary};
  font-size: 0.875rem;
`;

function Header({
  onProjectSelect,
  selectedFilesCount,
  totalFilesCount,
  selectedLinesCount,
  totalLinesCount,
  onGenerateBundle,
  loading,
  bundle,
  currentProject
}) {
  const fileInputRef = useRef(null);

  const handleSelectProject = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelection = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    try {
      // Get the common path to determine the project root
      const paths = files.map(file => file.webkitRelativePath || file.name);
      const commonPath = findCommonPath(paths);

      const projectData = {
        files: files,
        rootPath: commonPath,
        name: commonPath.split('/').filter(Boolean).pop() || 'Project'
      };

      onProjectSelect(projectData);
    } catch (error) {
      console.error('Error processing files:', error);
      alert('Error processing selected files. Please try again.');
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

        {currentProject && (
          <ProjectInfo>
            <FolderOpen size={16} />
            {currentProject.name}
          </ProjectInfo>
        )}

        {(selectedFilesCount !== undefined && totalFilesCount !== undefined && totalFilesCount > 0) && (
          <Stats>
            |
            <StatItem>
              <strong>{selectedFilesCount}</strong> of <strong>{totalFilesCount}</strong> files selected
            </StatItem>
            |
            {(selectedLinesCount !== undefined && totalLinesCount !== undefined) && (
              <StatItem>
                <strong>{selectedLinesCount.toLocaleString()}</strong> of <strong>{totalLinesCount.toLocaleString()}</strong> lines selected
              </StatItem>
            )}
          </Stats>
        )}
      </LeftSection>

      <RightSection>
        <Actions>
          <Button onClick={handleSelectProject}>
            <FolderOpen size={16} />
            Select Project Folder
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

      <FileInput
        ref={fileInputRef}
        type="file"
        webkitdirectory="true"
        directory="true"
        multiple
        onChange={handleFileSelection}
      />
    </HeaderContainer>
  );
}

// Helper function to find common path
function findCommonPath(paths) {
  if (paths.length === 0) return '';
  if (paths.length === 1) return paths[0].split('/').slice(0, -1).join('/');

  const splitPaths = paths.map(path => path.split('/'));
  const commonParts = [];

  const minLength = Math.min(...splitPaths.map(path => path.length));

  for (let i = 0; i < minLength; i++) {
    const part = splitPaths[0][i];
    if (splitPaths.every(path => path[i] === part)) {
      commonParts.push(part);
    } else {
      break;
    }
  }

  return commonParts.join('/');
}

export default Header;