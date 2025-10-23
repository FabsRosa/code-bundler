import React, { useState, useCallback, useMemo } from 'react';
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components';
import { FolderOpen, Sun, Moon } from 'lucide-react';

import Header from './components/Header/Header';
import ResizablePanels from './components/ResizablePanels/ResizablePanels';
import FileTree from './components/FileTree/FileTree';
import FileViewer from './components/FileViewer/FileViewer';
import BundleViewer from './components/BundleViewer/BundleViewer';
import LoadingOverlay from './components/LoadingOverlay/LoadingOverlay';

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
  mode: 'light',
  isDark: false,
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
  mode: 'dark',
  isDark: true,
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
    setLoading(true);

    try {
      if (!projectData || !projectData.files) {
        console.error('Invalid project data');
        return;
      }

      // Build file tree from the selected files
      const fileTree = buildFileTree(projectData.files, projectData.rootPath);

      // Hydrate accurate line counts before updating state
      await populateTreeLineCounts(fileTree);

      // Auto-select only non-excluded files
      const selectNonExcludedFiles = (nodes) => {
        const selected = new Set();

        if (!nodes || !Array.isArray(nodes)) return selected;

        nodes.forEach(node => {
          // Only select files that are NOT excluded
          if (!node.isExcluded && !node.isDirectory && node.filePath) {
            selected.add(node.filePath);
          }
          // Recursively process children
          if (node.children && Array.isArray(node.children)) {
            const childSelections = selectNonExcludedFiles(node.children);
            childSelections.forEach(path => selected.add(path));
          }
        });
        return selected;
      };

      const initialSelected = selectNonExcludedFiles(fileTree);
      setSelectedFiles(initialSelected);

      // Update project with the built tree
      setProject({
        ...projectData,
        tree: fileTree
      });

      // Clear previous states
      setSelectedFile(null);
      setBundle('');

    } catch (error) {
      console.error("Failed to process project:", error);
      alert(`Error loading project: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
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
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (file && !file.isDirectory) {
      setSelectedFile(file);
    }
  }, []);

  const handleFileDeselect = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const handleFileToggle = useCallback((filePath, isExcluded, isForced) => {
    // Don't allow toggling if the file is effectively excluded and not forced
    if (isExcluded && !isForced) {
      return;
    }

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

  const { totalLinesCount, selectedLinesCount } = useMemo(() => {
    if (!project || !project.tree) {
      return { totalLinesCount: 0, selectedLinesCount: 0 };
    }

    let totalLines = 0;
    let selectedLines = 0;
    const fileMap = new Map();

    // Recursive function to traverse the tree and collect data
    const traverse = (nodes, parentBlocked = false) => {
      if (!nodes || !Array.isArray(nodes)) return;
      nodes.forEach(node => {
        const isBlocked = parentBlocked || node.isExcluded;
        if (!node.isDirectory) {
          // Map file path to its line count for quick lookup
          fileMap.set(node.filePath, node.lineCount || 0);
          if (!isBlocked) {
            totalLines += node.lineCount || 0;
          }
        }
        if (node.children) {
          traverse(node.children, isBlocked);
        }
      });
    };

    traverse(project.tree);

    // Calculate selected lines from the map
    selectedFiles.forEach(filePath => {
      selectedLines += fileMap.get(filePath) || 0;
    });

    return { totalLinesCount: totalLines, selectedLinesCount: selectedLines };
  }, [project, selectedFiles]);


  return (
    <ThemeProvider theme={currentTheme}>
      <GlobalStyle />
      {loading && (
        <LoadingOverlay message="Analyzing..." />
      )}
      <AppContainer>
        <Header
          onProjectSelect={handleProjectSelect}
          selectedFilesCount={selectedFiles.size}
          totalFilesCount={totalFilesCount}
          selectedLinesCount={selectedLinesCount}
          totalLinesCount={totalLinesCount}
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

// Helper function to count total files
// Helper function to count total files in unblocked folders
function countTotalFiles(nodes, parentBlocked = false) {
  if (!nodes || !Array.isArray(nodes)) return 0;

  let count = 0;
  nodes.forEach(node => {
    const isBlocked = parentBlocked || node.isExcluded;
    if (!node.isDirectory && !isBlocked) {
      count++;
    }
    if (node.children && Array.isArray(node.children)) {
      count += countTotalFiles(node.children, isBlocked);
    }
  });
  return count;
}

// Enhanced exclusion logic
function isExcluded(name, isDirectory) {
  const excludedFolders = [
    '.git', '.vscode', 'node_modules', '__pycache__', 'target',
    'dist', 'build', '.next', '.nuxt', '.idea', '.vs', 'coverage',
    '__tests__', 'test', 'tests', 'tmp', 'temp', '.husky', '.github',
    'coverage', '.nyc_output', '.parcel-cache', '.docker', '.config',
    'logs', 'log', 'cache', '.cache', 'backup', 'backups'
  ];

  const excludedFiles = [
    '.gitignore', '.env', 'package-lock.json', 'yarn.lock',
    '.DS_Store', 'Thumbs.db', '.log', '.tmp', '.cache',
    '*.min.js', '*.min.css', '*.map', '*.log', '*.tar', '*.gz',
    '*.zip', '*.pdf', '*.png', '*.jpg', '*.jpeg', '*.gif', '*.ico',
    '*.svg', '*.woff', '*.woff2', '*.ttf', '*.eot', '*.bin',
    'README.md', 'license', 'LICENSE', 'changelog', 'CHANGELOG.md',
    'dockerfile.dev', 'dockerfile.prod', 'docker-compose.dev',
    'docker-compose.prod', 'Makefile', 'CMakeLists.txt',
    'dockerfile.debug', 'docker-compose.debug',

  ];

  if (isDirectory) {
    return excludedFolders.includes(name) ||
      excludedFolders.some(folder => name.includes(folder));
  }

  // Check exact matches
  if (excludedFiles.includes(name)) return true;

  // Check pattern matches
  return excludedFiles.some(pattern => {
    if (pattern.includes('*')) {
      const regexPattern = '^' + pattern.replace(/\*/g, '.*') + '$';
      const regex = new RegExp(regexPattern);
      return regex.test(name);
    }
    return name.endsWith(pattern);
  });
}

// Build file tree with proper exclusion inheritance
function buildFileTree(files, rootPath) {
  const root = {};

  if (!files || !Array.isArray(files)) {
    return [];
  }

  // First pass: build basic structure
  files.forEach(file => {
    const path = file.webkitRelativePath || file.name;
    const parts = path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isDirectory = i < parts.length - 1;
      const nodePath = parts.slice(0, i + 1).join('/');

      if (!current[part]) {
        current[part] = {
          name: part,
          path: nodePath,
          filePath: nodePath,
          isDirectory,
          isExcluded: isExcluded(part, isDirectory),
          children: {},
          file: isDirectory ? null : file,
          lineCount: 0
        };
      }

      if (isDirectory) {
        current = current[part].children;
      }
    }
  });

  // Second pass: inherit exclusion from parents and sort children
  const applyParentExclusionsAndSort = (nodes, parentExcluded = false) => {
    // Convert to array and sort folders first, files last, both alphabetically
    const arr = Object.values(nodes).map(node => {
      const isNodeExcluded = parentExcluded || node.isExcluded;
      return {
        ...node,
        isExcluded: isNodeExcluded,
        children: node.children ? applyParentExclusionsAndSort(node.children, isNodeExcluded) : []
      };
    });
    // Sort: folders first, files last, both alphabetically
    arr.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
    return arr;
  };

  const treeWithExclusions = applyParentExclusionsAndSort(root);

  return treeWithExclusions;
}

// Populate tree with accurate line counts sourced from file contents
async function populateTreeLineCounts(nodes) {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return;
  }

  const tasks = [];

  const traverse = (treeNodes) => {
    treeNodes.forEach(node => {
      if (!node) {
        return;
      }

      if (!node.isDirectory && node.file && typeof node.file.text === 'function') {
        const task = node.file.text()
          .then(content => {
            node.lineCount = calculateLineCountFromContent(content);
          })
          .catch(() => {
            node.lineCount = node.lineCount || 0;
          });
        tasks.push(task);
      }

      if (Array.isArray(node.children) && node.children.length > 0) {
        traverse(node.children);
      }
    });
  };

  traverse(nodes);

  if (tasks.length > 0) {
    await Promise.allSettled(tasks);
  }
}

function calculateLineCountFromContent(content) {
  if (typeof content !== 'string' || content.length === 0) {
    return 0;
  }

  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return normalized === '' ? 0 : normalized.split('\n').length;
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
  bundleParts.push(`==============================`);
  bundleParts.push(``);

  // Process selected files
  for (const filePath of selectedFilePaths) {
    const file = files.find(f => (f.webkitRelativePath === filePath) || (f.name === filePath));
    if (!file) continue;

    try {
      let content = await readFileContent(file);
      const relativePath = file.webkitRelativePath || file.name;

      // Remove file path comment at the beginning if it exists
      content = removeFilePathComment(content, relativePath);

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

// Helper function to remove file path comments at the beginning of files
function removeFilePathComment(content, filePath) {
  if (!content || !filePath) return content;

  // Extract lines and check the first real line
  const lines = content.split('\n');
  if (!lines.length) return content;

  const firstLine = lines[0].trim();

  // Get path variations to check
  const pathVariations = [];

  // Original path
  pathVariations.push(filePath);

  // Path without leading slash
  if (filePath.startsWith('/')) {
    pathVariations.push(filePath.substring(1));
  }

  // Path without root folder (everything after the first slash)
  const pathParts = filePath.split('/');
  if (pathParts.length > 1) {
    const pathWithoutRoot = pathParts.slice(1).join('/');
    pathVariations.push(pathWithoutRoot);
  }

  // Path with only filename (last part)
  if (pathParts.length > 0) {
    pathVariations.push(pathParts[pathParts.length - 1]);
  }

  // Generate all possible comment patterns
  const possibleComments = [];

  pathVariations.forEach(path => {
    // JavaScript/CSS style comments
    possibleComments.push(`// ${path}`);
    possibleComments.push(`//${path}`);

    // Shell/Python/Ruby style comments
    possibleComments.push(`# ${path}`);
    possibleComments.push(`#${path}`);

    // HTML style comments
    possibleComments.push(`<!-- ${path} -->`);
    possibleComments.push(`<!--${path}-->`);
  });

  // Check if the first line matches any comment pattern
  if (possibleComments.some(comment => firstLine === comment)) {
    // Remove the first line
    return lines.slice(1).join('\n');
  }

  // No matching comment found, return original content
  return content;
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

export default App;