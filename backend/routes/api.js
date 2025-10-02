const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

// Default exclusions
const DEFAULT_EXCLUDED_FOLDERS = [
  '.git', '.vscode', 'node_modules', '__pycache__', 'target',
  'dist', 'build', '.next', '.nuxt', 'out'
];

const DEFAULT_EXCLUDED_FILES = [
  '.gitignore', '.env', 'package-lock.json', 'yarn.lock',
  '.DS_Store', 'Thumbs.db', '.log', '.tmp'
];

// Utility functions
const isExcluded = (name, isDirectory) => {
  if (isDirectory) {
    return DEFAULT_EXCLUDED_FOLDERS.some(pattern =>
      name.includes(pattern) || pattern === name
    );
  }
  return DEFAULT_EXCLUDED_FILES.some(pattern =>
    name.endsWith(pattern) || pattern === name
  );
};

const countLines = (content) => {
  return content.split('\n').length;
};

// Get file tree structure
router.post('/scan', async (req, res) => {
  try {
    const { rootPath } = req.body;

    if (!rootPath) {
      return res.status(400).json({ error: 'Root path is required' });
    }

    const scanDirectory = async (dirPath, relativePath = '') => {
      const items = await fs.readdir(dirPath);
      const result = [];

      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const itemRelativePath = path.join(relativePath, item);

        try {
          const stats = await fs.stat(fullPath);
          const isDirectory = stats.isDirectory();

          const node = {
            name: item,
            path: itemRelativePath,
            fullPath: fullPath,
            isDirectory,
            isExcluded: isExcluded(item, isDirectory),
            children: []
          };

          if (isDirectory) {
            node.children = await scanDirectory(fullPath, itemRelativePath);
          } else {
            try {
              const content = await fs.readFile(fullPath, 'utf8');
              node.lineCount = countLines(content);
              node.size = stats.size;
            } catch (readError) {
              node.lineCount = 0;
              node.size = 0;
            }
          }

          result.push(node);
        } catch (error) {
          console.warn(`Skipping ${fullPath}:`, error.message);
        }
      }

      return result.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
    };

    const tree = await scanDirectory(rootPath);
    res.json({ tree, rootPath });

  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: 'Failed to scan directory' });
  }
});

// Get file content
router.get('/file', async (req, res) => {
  try {
    const { filePath } = req.query;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const content = await fs.readFile(filePath, 'utf8');
    res.json({ content });

  } catch (error) {
    console.error('File read error:', error);
    res.status(500).json({ error: 'Failed to read file' });
  }
});

// Generate bundle endpoint
router.post('/generate-bundle', async (req, res) => {
  try {
    const { files, projectRoot } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'No files selected' });
    }

    if (!projectRoot) {
      return res.status(400).json({ error: 'Project root is required' });
    }

    let totalLines = 0;
    const bundleParts = [];

    // Add header
    bundleParts.push(`PROJECT BUNDLE FOR AI ANALYSIS`);
    bundleParts.push(`==============================`);
    bundleParts.push(`This file contains multiple project files separated by file headers.`);
    bundleParts.push(`Each file is prefixed with "##### FILE: [relative_path] #####"`);
    bundleParts.push(`Files are separated by "##### END FILE #####"`);
    bundleParts.push(`Total files: ${files.length}`);
    bundleParts.push(`Project structure: [brief structure overview]`);
    bundleParts.push(`==============================`);
    bundleParts.push(``);

    // Process each file
    for (const filePath of files) {
      try {
        // Check if file exists and is readable
        await fs.access(filePath);
        const stats = await fs.stat(filePath);

        // Skip files larger than 1MB to prevent memory issues
        if (stats.size > 1024 * 1024) {
          console.warn(`Skipping large file: ${filePath}`);
          continue;
        }

        const content = await fs.readFile(filePath, 'utf8');
        const relativePath = path.relative(projectRoot, filePath);
        const lineCount = countLines(content);
        totalLines += lineCount;

        // Add file to bundle
        bundleParts.push(`##### FILE: ${relativePath} #####`);
        bundleParts.push(content);
        bundleParts.push(`##### END FILE #####`);
        bundleParts.push(``);

      } catch (error) {
        console.warn(`Skipping ${filePath}:`, error.message);
        // Continue with other files even if one fails
      }
    }

    // Update header with actual counts
    bundleParts[5] = `Total files: ${files.length}, Total lines: ${totalLines}`;

    const bundle = bundleParts.join('\n');

    res.json({
      bundle,
      totalFiles: files.length,
      totalLines,
      bundleSize: bundle.length
    });

  } catch (error) {
    console.error('Bundle generation error:', error);
    res.status(500).json({ error: 'Failed to generate bundle' });
  }
});

module.exports = router;