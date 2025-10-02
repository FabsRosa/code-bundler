import React, { useState, useCallback, useRef } from 'react';
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components';
import { FolderOpen, Sun, Moon } from 'lucide-react';

import Header from './components/Header/Header';
import ResizablePanels from './components/ResizablePanels/ResizablePanels';
import FileTree from './components/FileTree/FileTree';
import FileViewer from './components/FileViewer/FileViewer';
import BundleViewer from './components/BundleViewer/BundleViewer';

const lightTheme = {
  background: '#ffffff',
  surface: '#f8f9fa',
  surfaceElevated: '#ffffff',
  border: '#e1e5e9',
  text: '#2d3748',
  textSecondary: '#4a5568',
  accent: '#3b82f6',
  accentHover: '#2563eb',
  danger: '#ef4444',
  success: '#10b981',
  codeBackground: '#f8f9fa',
  codeBorder: '#e1e5e9',
};

const darkTheme = {
  background: '#0f0f23',
  surface: '#1a1b2f',
  surfaceElevated: '#23243f',
  border: '#2d2f45',
  text: '#e2e8f0',
  textSecondary: '#a0aec0',
  accent: '#3b82f6',
  accentHover: '#60a5fa',
  danger: '#f87171',
  success: '#34d399',
  codeBackground: '#1a1b2f',
  codeBorder: '#2d2f45',
};

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background: ${props => props.theme.background};
    color: ${props => props.theme.text};
    overflow: hidden;
  }

  code {
    font-family: 'Fira Code', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace;
  }

  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${props => props.theme.surface};
  }

  ::-webkit-scrollbar-thumb {
    background: ${props => props.theme.border};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme.accent};
  }
`;

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: ${props => props.theme.background};
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 2rem;
  text-align: center;
`;

const EmptyStateIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${props => props.theme.surface};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.accent};
`;

const EmptyStateTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.theme.text};
  margin-bottom: 0.5rem;
`;

const EmptyStateDescription = styled.p`
  color: ${props => props.theme.textSecondary};
  max-width: 400px;
  line-height: 1.5;
`;

const SelectButton = styled.button`
  background: ${props => props.theme.accent};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: ${props => props.theme.accentHover};
  }
`;

const ThemeToggle = styled.button`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: ${props => props.theme.surface};
  border: 1px solid ${props => props.theme.border};
  color: ${props => props.theme.text};
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 1000;

  &:hover {
    background: ${props => props.theme.surfaceElevated};
    transform: scale(1.05);
  }
`;

function App() {
  const [theme, setTheme] = useState('dark');
  const [project, setProject] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [fileContents, setFileContents] = useState({});
  const [bundle, setBundle] = useState('');
  const [loading, setLoading] = useState(false);

  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;

  const handleProjectSelect = useCallback(async (projectData) => {
    setProject(projectData);
    // Auto-select all non-excluded files
    const selectAllFiles = (nodes) => {
      const selected = new Set();
      nodes.forEach(node => {
        if (!node.isExcluded && !node.isDirectory) {
          selected.add(node.fullPath);
        }
        if (node.children) {
          selectAllFiles(node.children).forEach(path => selected.add(path));
        }
      });
      return selected;
    };

    const initialSelected = selectAllFiles(projectData.tree);
    setSelectedFiles(initialSelected);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleFileSelect = useCallback((file) => {
    setSelectedFile(file);
  }, []);

  const handleFileDeselect = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const handleFileToggle = useCallback((filePath, isExcluded, isForced) => {
    setSelectedFiles(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(filePath)) {
        newSelected.delete(filePath);
      } else {
        newSelected.add(filePath);
      }
      return newSelected;
    });
  }, []);

  const generateBundle = useCallback(async () => {
    if (!project || selectedFiles.size === 0) return;

    setLoading(true);
    try {
      const response = await fetch('/api/generate-bundle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: Array.from(selectedFiles),
          projectRoot: project.rootPath,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate bundle');
      }

      const data = await response.json();
      setBundle(data.bundle);
    } catch (error) {
      console.error('Failed to generate bundle:', error);
      // You might want to show a toast notification here
    } finally {
      setLoading(false);
    }
  }, [project, selectedFiles]);


  if (!project) {
    return (
      <ThemeProvider theme={currentTheme}>
        <GlobalStyle />
        <AppContainer>
          <Header onProjectSelect={handleProjectSelect} />
          <MainContent>
            <EmptyState>
              <EmptyStateIcon>
                <FolderOpen size={32} />
              </EmptyStateIcon>
              <EmptyStateTitle>No Project Selected</EmptyStateTitle>
              <EmptyStateDescription>
                Select a project folder to start bundling your files for AI analysis.
                The application will automatically exclude common unnecessary files and folders.
              </EmptyStateDescription>
              <SelectButton onClick={() => document.getElementById('folder-input')?.click()}>
                Select Project Folder
              </SelectButton>
            </EmptyState>
          </MainContent>
          <ThemeToggle onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </ThemeToggle>
        </AppContainer>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={currentTheme}>
      <GlobalStyle />
      <AppContainer>
        <Header
          onProjectSelect={handleProjectSelect}
          selectedFilesCount={selectedFiles.size}
          totalFilesCount={countTotalFiles(project.tree)}
          onGenerateBundle={generateBundle}
          loading={loading}
          bundle={bundle}
        />
        <MainContent>
          <ResizablePanels
            fileTree={
              <FileTree
                tree={project.tree}
                selectedFiles={selectedFiles}
                onFileToggle={handleFileToggle}
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
              />
            }
            fileViewer={
              selectedFile && (
                <FileViewer
                  file={selectedFile}
                  onClose={handleFileDeselect}
                />
              )
            }
            bundleViewer={
              <BundleViewer
                bundle={bundle}
                loading={loading}
                selectedFilesCount={selectedFiles.size}
              />
            }
            hasFileViewer={!!selectedFile}
          />
        </MainContent>
        <ThemeToggle onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </ThemeToggle>
      </AppContainer>
    </ThemeProvider>
  );
}

// Helper function to count total files
function countTotalFiles(nodes) {
  let count = 0;
  nodes.forEach(node => {
    if (!node.isDirectory) {
      count++;
    }
    if (node.children) {
      count += countTotalFiles(node.children);
    }
  });
  return count;
}

export default App;