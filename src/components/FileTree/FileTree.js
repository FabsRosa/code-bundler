import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Search, X, Minus, Package } from 'lucide-react';

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

const HeaderTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const HeaderBottom = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
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

const SelectedLinesCounter = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: ${props => props.theme.textSecondary};
  background: ${props => props.theme.background};
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  border: 1px solid ${props => props.theme.border};
`;

const Title = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.theme.text};
  margin-bottom: 0.5rem;
`;

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.5rem 2rem 0.5rem 0.5rem;
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

const SearchIcon = styled.div`
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.textSecondary};
`;

const ClearSearchButton = styled.button`
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${props => props.theme.textSecondary};
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 3px;
  
  &:hover {
    background: ${props => props.theme.surfaceElevated};
    color: ${props => props.theme.accent};
  }
`;

const SearchStats = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.textSecondary};
  margin-top: 0.5rem;
  text-align: center;
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
  min-height: 2rem;

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
    if (props.isDirectory && props.checked === 'partial') return '#00a3b9ff';
    if (props.isDirectory) return '#00a3b9ff';
    return '#74a0ffff';
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
  background: ${props => {
    if (props.isFolder && props.checked === 'partial') return '#00a3b95e';
    if (props.isFolder) return '#00a3b95e';
    return props.theme.accent + '60';
  }};
  padding: 0.125rem 0.375rem;
  border-radius: 12px;
  min-width: 2rem;
  text-align: center;
  border: 1px solid ${props => {
    if (props.isFolder) return '#00a3b9a1';
    return props.theme.accent + '99';
  }};
`;

const Checkbox = styled.div`
  width: 16px;
  height: 16px;
  border: 1px solid ${props => {
    if (props.isFolder && props.checked === 'partial') return '#00a3b9ce';
    if (props.isFolder && props.checked) return '#00a3b9ce';
    return props.theme.border;
  }};
  border-radius: 3px;
  background: ${props => {
    if (props.disabled) return props.theme.border;
    if (props.isFolder && props.checked === 'partial') return "#00a3b979";
    if (props.isFolder && props.checked) return '#00a3b9d5';
    if (props.checked) return props.theme.accent;
    return 'transparent';
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.4 : 1};
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

// Helper function to flatten tree for counting (defined outside component)
const flattenTree = (nodes) => {
  let allNodes = [];
  nodes.forEach(node => {
    allNodes.push(node);
    if (node.children) {
      allNodes = [...allNodes, ...flattenTree(node.children)];
    }
  });
  return allNodes;
};

function FileTree({ tree, selectedFiles, onFileToggle, onFileSelect, selectedFile }) {
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [forcedPaths, setForcedPaths] = useState(new Set());

  // Expand root folder(s) by default when tree changes
  React.useEffect(() => {
    if (tree && Array.isArray(tree) && tree.length > 0) {
      const rootFolders = tree.filter(node => node.isDirectory).map(node => node.filePath);
      setExpandedFolders(new Set(rootFolders));
    }
  }, [tree]);

  // Helper to check if a node is effectively blocked
  const isNodeBlocked = (node) => {
    if (node.isExcluded && !forcedPaths.has(node.filePath)) {
      return true;
    }

    let currentPath = node.filePath;
    const pathParts = currentPath.split('/');

    for (let i = pathParts.length - 1; i > 0; i--) {
      const parentPath = pathParts.slice(0, i).join('/');
      if (tree.some(n => n.filePath === parentPath && n.isExcluded && !forcedPaths.has(parentPath))) {
        return true;
      }
    }

    return false;
  };

  // Calculate total selected lines
  const totalSelectedLines = useMemo(() => {
    if (!tree || !Array.isArray(tree)) return 0;

    let totalLines = 0;

    const calculateLines = (nodes) => {
      nodes.forEach(node => {
        if (!node.isDirectory && selectedFiles.has(node.filePath) && !isNodeBlocked(node)) {
          totalLines += node.lineCount || 0;
        }
        if (node.children && Array.isArray(node.children)) {
          calculateLines(node.children);
        }
      });
    };

    calculateLines(tree);
    return totalLines;
  }, [tree, selectedFiles, forcedPaths]); // Add forcedPaths to dependencies

  // Enhanced search filtering with proper match counting
  const { filteredTree, matchCount } = useMemo(() => {
    if (!tree || !Array.isArray(tree)) {
      return { filteredTree: [], matchCount: 0 };
    }

    if (!searchTerm.trim()) {
      return {
        filteredTree: tree,
        matchCount: 0
      };
    }

    const searchLower = searchTerm.toLowerCase();
    let totalMatchesCount = 0;

    const filterNodes = (nodes) => {
      return nodes.filter(node => {
        const matchesSearch = node.name.toLowerCase().includes(searchLower);

        if (node.isDirectory) {
          const filteredChildren = filterNodes(node.children || []);
          const hasMatchingChildren = filteredChildren.length > 0;

          // Auto-expand folders that contain matches
          if (hasMatchingChildren && !expandedFolders.has(node.filePath)) {
            setExpandedFolders(prev => new Set(prev).add(node.filePath));
          }

          return matchesSearch || hasMatchingChildren;
        } else {
          if (matchesSearch && !isNodeBlocked(node)) {
            totalMatchesCount++;
          }
          return matchesSearch;
        }
      }).map(node => {
        if (node.isDirectory) {
          return {
            ...node,
            children: filterNodes(node.children || [])
          };
        }
        return node;
      });
    };

    const filtered = filterNodes(tree);
    return {
      filteredTree: filtered,
      matchCount: totalMatchesCount
    };
  }, [tree, searchTerm, expandedFolders, forcedPaths]);

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

    const shouldSelect = currentState === 'none';

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
      // Deselect if already selected
      if (selectedFile && selectedFile.filePath === node.filePath) {
        onFileSelect(null);
      } else {
        onFileSelect(node);
      }
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Collapse all folders except the root folder
  const collapseAllFolders = () => {
    if (!tree || !Array.isArray(tree) || tree.length === 0) {
      setExpandedFolders(new Set());
      return;
    }
    // Only keep root folder(s) expanded
    const rootFolders = tree.filter(node => node.isDirectory).map(node => node.filePath);
    setExpandedFolders(new Set(rootFolders));
  };

  const renderTree = (nodes, depth = 0) => {
    if (!nodes || !Array.isArray(nodes)) return null;

    return nodes.map(node => {
      const isExpanded = expandedFolders.has(node.filePath);
      const isSelected = selectedFile?.filePath === node.filePath;
      const isBlocked = isNodeBlocked(node);
      const isChecked = selectedFiles.has(node.filePath);
      const iconSize = 16;

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
                checked={folderSelectionState === 'all' ? true :
                  folderSelectionState === 'partial' ? 'partial' : false}
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
              checked={folderSelectionState === 'all' ? true :
                folderSelectionState === 'partial' ? 'partial' : false}
              isBlocked={isBlocked}
            >
              {node.isDirectory ? (
                // Use filled folder icon if selected, otherwise outlined
                isExpanded
                  ? (folderSelectionState === 'all'
                    ? <FolderOpen size={iconSize} fill="#00a3b9e0" />
                    : (folderSelectionState === 'partial'
                      ? <FolderOpen size={iconSize} fill="#00a3b979" />
                      : <FolderOpen size={iconSize} />))
                  : (folderSelectionState === 'all'
                    ? <Folder size={iconSize} fill="#00a3b9f3" />
                    : (folderSelectionState === 'partial'
                      ? <Folder size={iconSize} fill="#00a3b979" />
                      : <Folder size={iconSize} />))
              ) : (
                isChecked
                  ? <File size={iconSize} fill={"#74a0ff70"} />
                  : <File size={iconSize} />
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
              <LineCount
                isFolder
                checked={folderSelectionState === 'all' ? true :
                  folderSelectionState === 'partial' ? 'partial' : false}
              >
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
          <HeaderTop>
            <Title>
              <Package size={16} />
              Project Files
            </Title>
          </HeaderTop>
          <HeaderBottom>
            <SearchContainer>
              <SearchInput
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
              {searchTerm ? (
                <ClearSearchButton onClick={clearSearch}>
                  <X size={14} />
                </ClearSearchButton>
              ) : (
                <SearchIcon>
                  <Search size={14} />
                </SearchIcon>
              )}
            </SearchContainer>
          </HeaderBottom>
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
        <HeaderTop>
          <Title>
            <Package size={16} />
            Project Files
          </Title>
          <HeaderActions>
            {/* Selected Lines Counter */}
            {selectedFiles.size > 0 && (
              <SelectedLinesCounter>
                <Package size={12} />
                {totalSelectedLines} lines selected
              </SelectedLinesCounter>
            )}
            {/* Collapse All Button */}
            <ActionButton
              onClick={collapseAllFolders}
              title="Collapse all folders"
            >
              <Minus size={14} />
            </ActionButton>
          </HeaderActions>
        </HeaderTop>
        <HeaderBottom>
          <SearchContainer>
            <SearchInput
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchTerm ? (
              <ClearSearchButton onClick={clearSearch}>
                <X size={14} />
              </ClearSearchButton>
            ) : (
              <SearchIcon>
                <Search size={14} />
              </SearchIcon>
            )}
          </SearchContainer>
          {searchTerm && (
            <SearchStats>
              {matchCount > 0 ? `${matchCount} files found` : 'No files found'}
            </SearchStats>
          )}
        </HeaderBottom>
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