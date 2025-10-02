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
    if (props.isExcluded) return props.theme.textSecondary;
    return props.theme.textSecondary;
  }};
  opacity: ${props => props.isExcluded && !props.forced ? 0.5 : 1};
`;

const NodeName = styled.span`
  flex: 1;
  font-size: 0.875rem;
  opacity: ${props => props.isExcluded && !props.forced ? 0.5 : 1};
  color: ${props => {
    if (props.isExcluded && !props.forced) return props.theme.textSecondary;
    if (props.selected) return props.theme.accent;
    return props.theme.text;
  }};
`;

const LineCount = styled.span`
  font-size: 0.75rem;
  color: ${props => props.theme.textSecondary};
  background: ${props => props.theme.background};
  padding: 0.125rem 0.375rem;
  border-radius: 12px;
  min-width: 2rem;
  text-align: center;
`;

const Checkbox = styled.input`
  margin: 0;
  cursor: pointer;
  opacity: ${props => props.disabled ? 0.5 : 1};
  
  &:disabled {
    cursor: not-allowed;
  }
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
  const [forcedFiles, setForcedFiles] = useState(new Set());

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

  const handleFileToggle = (fileNode, event) => {
    event.stopPropagation();

    if (fileNode.isExcluded && !forcedFiles.has(fileNode.filePath)) {
      setForcedFiles(prev => new Set(prev).add(fileNode.filePath));
    } else {
      onFileToggle(fileNode.filePath, fileNode.isExcluded, forcedFiles.has(fileNode.filePath));
    }
  };

  const handleFileClick = (file) => {
    if (file.isDirectory) {
      toggleFolder(file.fullPath);
    } else {
      onFileSelect(file);
    }
  };

  const filteredTree = useMemo(() => {
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
      const isExpanded = expandedFolders.has(node.fullPath);
      const isSelected = selectedFile?.fullPath === node.fullPath;
      const isForced = forcedFiles.has(node.fullPath);
      const isChecked = selectedFiles.has(node.fullPath);

      return (
        <TreeNode key={node.fullPath} depth={depth}>
          <NodeItem
            selected={isSelected}
            onClick={() => handleFileClick(node)}
          >
            {node.isDirectory ? (
              <NodeIcon
                isDirectory
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(node.fullPath);
                }}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </NodeIcon>
            ) : (
              <div style={{ width: '16px' }} /> // Spacer for alignment
            )}

            <NodeIcon
              isDirectory={node.isDirectory}
              isExcluded={node.isExcluded}
              forced={isForced}
            >
              {node.isDirectory ? (
                isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />
              ) : (
                <File size={14} />
              )}
            </NodeIcon>

            <NodeName
              isExcluded={node.isExcluded}
              forced={isForced}
              selected={isSelected}
            >
              {node.name}
            </NodeName>

            {!node.isDirectory && (
              <>
                <LineCount>
                  {node.lineCount || 0}
                </LineCount>

                <Checkbox
                  type="checkbox"
                  checked={isChecked}
                  disabled={fileNode.isExcluded && !isForced}
                  onChange={(e) => handleFileToggle(fileNode, e)}
                  onClick={(e) => e.stopPropagation()}
                />
              </>
            )}
          </NodeItem>

          {node.isDirectory && isExpanded && node.children && (
            renderTree(node.children, depth + 1)
          )}
        </TreeNode>
      );
    });
  };

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