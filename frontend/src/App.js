import React, { useState, useCallback } from 'react';
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
  const [bundle, setBundle] = useState('');
  const [loading, setLoading] = useState(false);

  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;

  const handleProjectSelect = useCallback(async (projectData) => {
    if (!projectData || !projectData.files) {
      console.error('Invalid project data');
      return;
    }

    // Build file tree from the selected files
    const fileTree = buildFileTree(projectData.files, projectData.rootPath);

    // Auto-select all non-excluded files
    const selectAllFiles = (nodes) => {
      const selected = new Set();

      if (!nodes || !Array.isArray(nodes)) return selected;

      nodes.forEach(node => {
        if (!node.isExcluded && !node.isDirectory && node.filePath) {
          selected.add(node.filePath);
        }
        if (node.children && Array.isArray(node.children)) {
          const childSelections = selectAllFiles(node.children);
          childSelections.forEach(path => selected.add(path));
        }
      });
      return selected;
    };

    const initialSelected = selectAllFiles(fileTree);
    setSelectedFiles(initialSelected);

    // Update project with the built tree
    setProject({
      ...projectData,
      tree: fileTree
    });

    // Clear previous states
    setSelectedFile(null);
    setBundle('');
  }, []);

  const generateBundle = useCallback(async () => {
    if (!project || !project.files || selectedFiles.size === 0) {
      alert('No files selected or project not loaded');
      return;
    }

    setLoading(true);
    try {
      const bundleContent = await generateBundleContent(
        project.files,
        Array.from(selectedFiles),
        project.rootPath
      );
      setBundle(bundleContent);
    } catch (error) {
      console.error('Failed to generate bundle:', error);
      alert('Failed to generate bundle. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [project, selectedFiles]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleFileSelect = useCallback((file) => {
    if (file && !file.isDirectory) {
      setSelectedFile(file);
    }
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

  // Safe count for header
  const totalFilesCount = project && project.tree ? countTotalFiles(project.tree) : 0;

  // ... rest of the component remains the same until the return statement

  return (
    <ThemeProvider theme={currentTheme}>
      <GlobalStyle />
      <AppContainer>
        <Header
          onProjectSelect={handleProjectSelect}
          selectedFilesCount={selectedFiles.size}
          totalFilesCount={totalFilesCount}
          onGenerateBundle={generateBundle}
          loading={loading}
          bundle={bundle}
          currentProject={project}
        />

        {!project ? (
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
              <SelectButton onClick={() => document.querySelector('input[type="file"]')?.click()}>
                Select Project Folder
              </SelectButton>
            </EmptyState>
          </MainContent>
        ) : (
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
        )}

        <ThemeToggle onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </ThemeToggle>
      </AppContainer>
    </ThemeProvider>
  );
}

// Read file content
function readFileContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// Helper function to count total files
function countTotalFiles(nodes) {
  if (!nodes || !Array.isArray(nodes)) return 0;

  let count = 0;
  nodes.forEach(node => {
    if (!node.isDirectory) {
      count++;
    }
    if (node.children && Array.isArray(node.children)) {
      count += countTotalFiles(node.children);
    }
  });
  return count;
}

// Helper function to build file tree from FileList
function buildFileTree(files, rootPath) {
  const root = {};

  // Ensure files is an array
  if (!files || !Array.isArray(files)) {
    return [];
  }

  files.forEach(file => {
    const path = file.webkitRelativePath || file.name;
    const parts = path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isDirectory = i < parts.length - 1;

      if (!current[part]) {
        current[part] = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          filePath: isDirectory ? null : path,
          isDirectory,
          isExcluded: isExcluded(part, isDirectory),
          children: {},
          file: isDirectory ? null : file,
          lineCount: isDirectory ? 0 : countFileLines(file)
        };
      }

      if (isDirectory) {
        current = current[part].children;
      }
    }
  });

  return convertToArray(root);
}

function convertToArray(node) {
  const array = Object.values(node).map(item => ({
    ...item,
    children: item.children ? convertToArray(item.children) : []
  }));

  return array.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });
}

// Count lines in a file (estimate from file size)
function countFileLines(file) {
  // Estimate lines based on file size (rough average of 50 chars per line)
  return Math.ceil(file.size / 50);
}

// Exclusion logic
function isExcluded(name, isDirectory) {
  const excludedFolders = ['.git', '.vscode', 'node_modules', '__pycache__', 'target', 'dist', 'build', '.next', '.nuxt'];
  const excludedFiles = ['.gitignore', '.env', 'package-lock.json', 'yarn.lock', '.DS_Store', 'Thumbs.db'];

  if (isDirectory) {
    return excludedFolders.includes(name) || excludedFolders.some(folder => name.includes(folder));
  }
  return excludedFiles.includes(name) || excludedFiles.some(file => name.endsWith(file));
}

// Generate bundle content
async function generateBundleContent(files, selectedFilePaths, rootPath) {
  const bundleParts = [];
  let totalFiles = 0;
  let totalLines = 0;

  // Add header
  bundleParts.push(`PROJECT BUNDLE FOR AI ANALYSIS`);
  bundleParts.push(`==============================`);
  bundleParts.push(`This file contains multiple project files separated by file headers.`);
  bundleParts.push(`Each file is prefixed with "##### FILE: [relative_path] #####"`);
  bundleParts.push(`Files are separated by "##### END FILE #####"`);
  bundleParts.push(`Total files: ${selectedFilePaths.length}`);
  bundleParts.push(`==============================`);
  bundleParts.push(``);

  // Process selected files
  for (const filePath of selectedFilePaths) {
    const file = files.find(f => (f.webkitRelativePath === filePath) || (f.name === filePath));
    if (!file) continue;

    try {
      const content = await readFileContent(file);
      const relativePath = file.webkitRelativePath || file.name;
      const lineCount = content.split('\n').length;

      totalFiles++;
      totalLines += lineCount;

      bundleParts.push(`##### FILE: ${relativePath} #####`);
      bundleParts.push(content);
      bundleParts.push(`##### END FILE #####`);
      bundleParts.push(``);
    } catch (error) {
      console.warn(`Skipping file ${filePath}:`, error);
    }
  }

  // Update header with actual counts
  bundleParts[5] = `Total files: ${totalFiles}, Total lines: ${totalLines}`;

  return bundleParts.join('\n');
}

export default App;