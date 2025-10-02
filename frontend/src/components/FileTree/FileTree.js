import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';

const TreeContainer = styled.div`
  height: 100%;
  background: ${props => props.theme.surface};
  border-right: 1px solid ${props => props.theme.border};
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const TreeHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.surfaceElevated};
`;

const Title = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.theme.text};
  margin-bottom: 0.5rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid ${props => props.theme.border};
  border-radius: 4px;
  background: ${props => props.theme.background};
  color: ${props => props.theme.text};
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.accent};
  }
`;

const TreeContent = styled.div`
  flex: 1;
  overflow: auto;
  padding: 0.5rem;
`;

const TreeNode = styled.div`
  margin-left: ${props => props.depth * 16}px;
`;

const NodeItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;

  &:hover {
    background: ${props => props.theme.surfaceElevated};
  }

  ${props => props.selected && `
    background: ${props.theme.surfaceElevated};
    color: ${props.theme.accent};
  `}
`;

const NodeIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: ${props => {
    if (props.isDirectory) return '#f59e0b';
    return props.theme.textSecondary;
  }};
  opacity: ${props => props.isBlocked ? 0.5 : 1};
`;

const NodeName = styled.span`
  flex: 1;
  font-size: 0.875rem;
  opacity: ${props => props.isBlocked ? 0.5 : 1};
  color: ${props => {
    if (props.isBlocked) return props.theme.textSecondary;
    if (props.selected) return props.theme.accent;
    return props.theme.text;
  }};
`;

const LineCount = styled.span`
  font-size: 0.75rem;
  color: ${props => props.theme.text};
  background: ${props => props.isFolder ? '#7c2d12' : props.theme.background};
  padding: 0.125rem 0.375rem;
  border-radius: 12px;
  min-width: 2rem;
  text-align: center;
  border: 1px solid ${props => props.theme.border};
`;

const Checkbox = styled.div`
  width: 16px;
  height: 16px;
  border: 1px solid ${props => {
    if (props.isFolder && props.checked === 'partial') return '#f59e0b';
    if (props.isFolder && props.checked) return '#f59e0b';
    return props.theme.border;
  }};
  border-radius: 3px;
  background: ${props => {
    if (props.disabled) return props.theme.border;
    if (props.isFolder && props.checked === 'partial') return 'rgba(245, 158, 11, 0.3)';
    if (props.isFolder && props.checked) return '#f59e0b';
    if (props.checked) return props.theme.accent;
    return 'transparent';
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.5 : 1};
  transition: all 0.2s;

  &:hover {
    border-color: ${props => props.disabled ? props.theme.border : props.theme.accent};
  }
`;

const CheckIcon = styled.div`
  color: white;
  font-size: 12px;
  font-weight: bold;
  line-height: 1;
`;

const PartialIcon = styled.div`
  width: 8px;
  height: 2px;
  background: white;
  border-radius: 1px;
`;

const EmptyState = styled.div`
  padding: 2rem;
  text-align: center;
  color: ${props => props.theme.textSecondary};
  font-size: 0.875rem;
`;

function FileTree({ tree, selectedFiles, onFileToggle, onFileSelect, selectedFile }) {
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [forcedPaths, setForcedPaths] = useState(new Set());

  // Helper to check if a node is effectively blocked
  const isNodeBlocked = (node) => {
    // If the node itself is excluded and not forced, it's blocked
    if (node.isExcluded && !forcedPaths.has(node.filePath)) {
      return true;
    }

    // Check if any parent is excluded and not forced
    let currentPath = node.filePath;
    const pathParts = currentPath.split('/');

    for (let i = pathParts.length - 1; i > 0; i--) {
      const parentPath = pathParts.slice(0, i).join('/');
      // If we find a parent that is excluded and not forced, this node is blocked
      if (tree.some(n => n.filePath === parentPath && n.isExcluded && !forcedPaths.has(parentPath))) {
        return true;
      }
    }

    return false;
  };

  // Helper to get all file paths in a folder (recursive)
  const getAllFilePathsInFolder = (folderNode) => {
    if (!folderNode) return [];

    let paths = [];

    const collectPaths = (node) => {
      if (!node.isDirectory) {
        paths.push(node.filePath);
      }
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(collectPaths);
      }
    };

    collectPaths(folderNode);
    return paths;
  };

  // Helper to get only unblocked file paths in a folder
  const getUnblockedFilePathsInFolder = (folderNode) => {
    if (!folderNode) return [];

    let paths = [];

    const collectUnblockedPaths = (node) => {
      if (!node.isDirectory && !isNodeBlocked(node)) {
        paths.push(node.filePath);
      }
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(collectUnblockedPaths);
      }
    };

    collectUnblockedPaths(folderNode);
    return paths;
  };

  // Helper to get folder selection state
  const getFolderSelectionState = (folderNode) => {
    const unblockedFilePaths = getUnblockedFilePathsInFolder(folderNode);
    if (unblockedFilePaths.length === 0) return 'none';

    const selectedCount = unblockedFilePaths.filter(path => selectedFiles.has(path)).length;

    if (selectedCount === 0) return 'none';
    if (selectedCount === unblockedFilePaths.length) return 'all';
    return 'partial';
  };

  // Helper to count selected lines in folder
  const getFolderLineCount = (folderNode) => {
    if (!folderNode.isDirectory) return 0;

    let totalLines = 0;
    const countLinesRecursive = (node) => {
      if (!node.isDirectory && selectedFiles.has(node.filePath) && !isNodeBlocked(node)) {
        totalLines += node.lineCount || 0;
      }
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(countLinesRecursive);
      }
    };

    countLinesRecursive(folderNode);
    return totalLines;
  };

  const toggleFolder = (folderPath) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  };

  const handleForceNode = (node) => {
    setForcedPaths(prev => {
      const newForced = new Set(prev);

      // Add the node itself
      newForced.add(node.filePath);

      // Add all parent paths to unblock the path to root
      let currentPath = node.filePath;
      const pathParts = currentPath.split('/');

      for (let i = pathParts.length - 1; i > 0; i--) {
        const parentPath = pathParts.slice(0, i).join('/');
        newForced.add(parentPath);
      }

      // If it's a folder, force all children recursively
      if (node.isDirectory && node.children) {
        const forceChildrenRecursive = (children) => {
          children.forEach(child => {
            newForced.add(child.filePath);
            if (child.children) {
              forceChildrenRecursive(child.children);
            }
          });
        };
        forceChildrenRecursive(node.children);
      }

      return newForced;
    });
  };

  const handleFileToggle = (node, event) => {
    event.stopPropagation();

    const isBlocked = isNodeBlocked(node);

    if (isBlocked) {
      // First click on blocked file: unblock it
      handleForceNode(node);
    } else {
      // Normal toggle for files
      onFileToggle(node.filePath, node.isExcluded, true);
    }
  };

  const handleFolderToggle = (folderNode, event) => {
    event.stopPropagation();

    const isBlocked = isNodeBlocked(folderNode);

    if (isBlocked) {
      // First click on blocked folder: unblock it
      handleForceNode(folderNode);
      return;
    }

    const unblockedFilePaths = getUnblockedFilePathsInFolder(folderNode);
    const currentState = getFolderSelectionState(folderNode);

    // If folder is fully selected, deselect all; otherwise select all
    const shouldSelect = currentState !== 'all';

    unblockedFilePaths.forEach(filePath => {
      if (shouldSelect && !selectedFiles.has(filePath)) {
        onFileToggle(filePath, folderNode.isExcluded, true);
      } else if (!shouldSelect && selectedFiles.has(filePath)) {
        onFileToggle(filePath, folderNode.isExcluded, true);
      }
    });
  };

  const handleFileClick = (node) => {
    if (node.isDirectory) {
      toggleFolder(node.filePath);
    } else {
      onFileSelect(node);
    }
  };

  const filteredTree = useMemo(() => {
    if (!tree || !Array.isArray(tree)) return [];

    if (!searchTerm) return tree;

    const filterNodes = (nodes) => {
      return nodes.filter(node => {
        const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase());
        if (node.isDirectory) {
          const children = filterNodes(node.children || []);
          return matchesSearch || children.length > 0;
        }
        return matchesSearch;
      });
    };

    return filterNodes(tree);
  }, [tree, searchTerm]);

  const renderTree = (nodes, depth = 0) => {
    if (!nodes || !Array.isArray(nodes)) return null;

    return nodes.map(node => {
      const isExpanded = expandedFolders.has(node.filePath);
      const isSelected = selectedFile?.filePath === node.filePath;
      const isBlocked = isNodeBlocked(node);
      const isChecked = selectedFiles.has(node.filePath);

      // For folders, determine selection state
      const folderSelectionState = node.isDirectory ? getFolderSelectionState(node) : null;
      const folderLineCount = node.isDirectory ? getFolderLineCount(node) : 0;
      const showFolderLineCount = node.isDirectory && folderLineCount > 0 &&
        (folderSelectionState === 'partial' || folderSelectionState === 'all') &&
        !isBlocked;

      return (
        <TreeNode key={node.filePath} depth={depth}>
          <NodeItem
            selected={isSelected}
            onClick={() => handleFileClick(node)}
          >
            {node.isDirectory ? (
              <NodeIcon
                isDirectory
                isBlocked={isBlocked}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(node.filePath);
                }}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </NodeIcon>
            ) : (
              <div style={{ width: '16px' }} />
            )}

            <NodeIcon
              isDirectory={node.isDirectory}
              isBlocked={isBlocked}
            >
              {node.isDirectory ? (
                isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />
              ) : (
                <File size={14} />
              )}
            </NodeIcon>

            <NodeName
              isBlocked={isBlocked}
              selected={isSelected}
            >
              {node.name}
            </NodeName>

            {/* Line count for files */}
            {!node.isDirectory && !isBlocked && (
              <LineCount>
                {node.lineCount || 0}
              </LineCount>
            )}

            {/* Line count for folders (only show when files are selected and not blocked) */}
            {node.isDirectory && showFolderLineCount && (
              <LineCount isFolder>
                {folderLineCount}
              </LineCount>
            )}

            {/* Checkbox for files */}
            {!node.isDirectory && (
              <Checkbox
                checked={isChecked}
                disabled={isBlocked}
                onClick={(e) => handleFileToggle(node, e)}
              >
                {isChecked && <CheckIcon>✓</CheckIcon>}
              </Checkbox>
            )}

            {/* Checkbox for folders */}
            {node.isDirectory && (
              <Checkbox
                isFolder
                checked={folderSelectionState === 'all' ? true :
                  folderSelectionState === 'partial' ? 'partial' : false}
                disabled={isBlocked}
                onClick={(e) => handleFolderToggle(node, e)}
              >
                {folderSelectionState === 'all' && <CheckIcon>✓</CheckIcon>}
                {folderSelectionState === 'partial' && <PartialIcon />}
              </Checkbox>
            )}
          </NodeItem>

          {node.isDirectory && isExpanded && node.children && (
            renderTree(node.children, depth + 1)
          )}
        </TreeNode>
      );
    });
  };

  if (!tree || !Array.isArray(tree)) {
    return (
      <TreeContainer>
        <TreeHeader>
          <Title>Project Files</Title>
          <SearchInput
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </TreeHeader>
        <TreeContent>
          <EmptyState>No files available</EmptyState>
        </TreeContent>
      </TreeContainer>
    );
  }

  return (
    <TreeContainer>
      <TreeHeader>
        <Title>Project Files</Title>
        <SearchInput
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </TreeHeader>

      <TreeContent>
        {filteredTree.length > 0 ? (
          renderTree(filteredTree)
        ) : (
          <EmptyState>
            {searchTerm ? 'No files match your search' : 'No files found'}
          </EmptyState>
        )}
      </TreeContent>
    </TreeContainer>
  );
}

export default FileTree;