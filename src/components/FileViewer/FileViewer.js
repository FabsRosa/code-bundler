import React, { useState, useEffect } from 'react';
import styled, { useTheme } from 'styled-components';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markup';
import { X, File as FileIcon, Download, Copy } from 'lucide-react';

const ViewerContainer = styled.div`
  height: 100%;
  background: ${props => props.theme.surface};
  border-right: 1px solid ${props => props.theme.border};
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
  min-height: 93.5px;
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
`;

const FileName = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.theme.text};
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FilePath = styled.span`
  font-size: 0.875rem;
  color: ${props => props.theme.textSecondary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Button = styled.button`
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

const CloseButton = styled(Button)`
  border: none;
  background: transparent;
  
  &:hover {
    background: ${props => props.theme.border};
    border: none;
  }
`;

const ContentContainer = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
`;

const CodeContent = styled.pre`
  flex: 1;
  padding: 1rem;
  margin: 0;
  font-family: 'Fira Code', monospace;
  font-size: 0.85rem !important;
  line-height: 1.4;
  color: ${props => props.theme.text};
  background: ${props => props.theme.codeBackground};
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  tab-size: 2;

  /* Override Prism background and font-size for all code blocks */
  &,
  &.language-none,
  &.language-text,
  &.language-javascript,
  &.language-typescript,
  &.language-python,
  &.language-java,
  &.language-markdown,
  &.language-css,
  &.language-json,
  &.language-bash,
  &.language-yaml,
  &.language-html {
    background: ${props => props.theme.codeBackground} !important;
    font-size: 0.85rem !important;
  }

  &[data-theme='dark'] {
    color: #f8f8f2;

    .token.comment,
    .token.prolog,
    .token.doctype,
    .token.cdata {
      color: #999999;
    }

    .token.punctuation {
      color: #f8f8f2;
    }

    .token.property,
    .token.tag,
    .token.constant,
    .token.symbol,
    .token.deleted {
      color: #e2777a;
    }

    .token.boolean,
    .token.number {
      color: #648dffff;
    }

    .token.selector,
    .token.attr-name,
    .token.string,
    .token.char,
    .token.builtin,
    .token.inserted {
      color: #7ec699;
    }

    .token.operator,
    .token.entity,
    .token.url,
    .language-css .token.string,
    .style .token.string,
    .token.variable {
      color: #67cdcc;
    }

    .token.atrule,
    .token.attr-value,
    .token.function,
    .token.class-name {
      color: #e6db74;
    }

    .token.keyword {
      color: #cc99cd;
    }

    .token.regex,
    .token.important {
      color: #f8c555;
    }

    .token.bold {
      font-weight: 600;
    }

    .token.italic {
      font-style: italic;
    }
  }

  &[data-theme='light'] {
    color: #1f2937;

    .token.comment,
    .token.prolog,
    .token.doctype,
    .token.cdata {
      color: #707070ff;
    }

    .token.punctuation {
      color: #374151;
    }

    .token.property,
    .token.tag,
    .token.constant,
    .token.symbol,
    .token.deleted {
      color: #b13200ff;
    }

    .token.boolean,
    .token.number {
      color: #2563eb;
    }

    .token.selector,
    .token.attr-name,
    .token.string,
    .token.char,
    .token.builtin,
    .token.inserted {
      color: #047857;
    }

    .token.operator,
    .token.entity,
    .token.url,
    .language-css .token.string,
    .style .token.string,
    .token.variable {
      color: #0f766e;
    }

    .token.atrule,
    .token.attr-value,
    .token.function,
    .token.class-name {
      color: #b16a00d7;
    }

    .token.keyword {
      color: #7c3aed;
    }

    .token.regex,
    .token.important {
      color: #be123c;
    }

    .token.bold {
      font-weight: 600;
    }

    .token.italic {
      font-style: italic;
    }
  }
`;

const LoadingState = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.textSecondary};
  font-size: 0.875rem;
`;

const ErrorState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: ${props => props.theme.danger};
  text-align: center;
  padding: 2rem;
`;

const CopySuccess = styled.div`
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: ${props => props.theme.success};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  z-index: 1000;
  animation: slideIn 0.2s ease-out;

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

// Helper function to detect language for basic syntax awareness
const detectLanguage = (filename) => {
  const extension = filename.split('.').pop().toLowerCase();

  const languageMap = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'java': 'java',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'less': 'less',
    'json': 'json',
    'xml': 'xml',
    'md': 'markdown',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'c': 'c',
    'cpp': 'cpp',
    'h': 'c',
    'hpp': 'cpp',
    'sql': 'sql',
    'sh': 'bash',
    'bash': 'bash',
    'zsh': 'bash',
    'yml': 'yaml',
    'yaml': 'yaml',
  };

  return languageMap[extension] || 'text';
};

// Prism.js language mapping
const prismLanguageMap = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  markdown: 'markdown',
  css: 'css',
  json: 'json',
  bash: 'bash',
  yaml: 'yaml',
  html: 'html',
  text: 'none',
};

function FileViewer({ file, onClose }) {
  const theme = useTheme();
  const themeIdentifiers = [theme?.mode, theme?.name, theme?.appearance, theme?.palette]
    .filter(value => typeof value === 'string')
    .map(value => value.toLowerCase());
  const isDarkTheme = themeIdentifiers.includes('dark') || Boolean(theme?.isDark);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (file) {
      loadFileContent();
    }
  }, [file]);

  const loadFileContent = async () => {
    if (!file || file.isDirectory || !file.file) {
      setError('File not available for preview');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fileContent = await readFileContent(file.file);
      setContent(fileContent);
    } catch (err) {
      console.error('Failed to load file content:', err);
      setError('Failed to load file content. The file might be binary or too large.');
    } finally {
      setLoading(false);
    }
  };

  // Read file content from File object
  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Detect language for syntax highlighting
  const language = file ? detectLanguage(file.name) : 'text';
  const prismLang = prismLanguageMap[language] || 'none';
  let highlightedContent;
  if (prismLang === 'none' || !Prism.languages[prismLang]) {
    // Render as plain text if grammar is not available
    highlightedContent = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  } else {
    highlightedContent = Prism.highlight(content, Prism.languages[prismLang], prismLang);
  }

  if (!file) return null;

  return (
    <ViewerContainer>
      <ViewerHeader>
        <FileInfo>
          <FileIcon size={16} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <FileName>{file.name}</FileName>
            <FilePath>{file.path}</FilePath>
          </div>
        </FileInfo>

        <Actions>
          <Button onClick={handleCopy} title="Copy content">
            <Copy size={16} />
          </Button>
          <Button onClick={handleDownload} title="Download file">
            <Download size={16} />
          </Button>
          <CloseButton onClick={onClose} title="Close viewer">
            <X size={16} />
          </CloseButton>
        </Actions>
      </ViewerHeader>

      <ContentContainer>
        {loading ? (
          <LoadingState>Loading file content...</LoadingState>
        ) : error ? (
          <ErrorState>
            <div>{error}</div>
            <Button onClick={loadFileContent}>Retry</Button>
          </ErrorState>
        ) : (
          <CodeContent
            data-theme={isDarkTheme ? 'dark' : 'light'}
            className={`language-${prismLang}`}
            dangerouslySetInnerHTML={{ __html: highlightedContent }}
          />
        )}
      </ContentContainer>

      {copySuccess && <CopySuccess>Copied to clipboard!</CopySuccess>}
    </ViewerContainer>
  );
}

export default FileViewer;