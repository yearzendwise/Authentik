const fs = require('fs');
const path = require('path');

// Simple build script to create a distributable package
function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const files = fs.readdirSync(src);
    files.forEach(file => {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      copyRecursive(srcPath, destPath);
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Create dist directory
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Copy necessary files
console.log('Building form builder package...');

// Copy source files with proper structure
const sourceFiles = [
  '../client/src/components/form-builder',
  '../client/src/hooks',
  '../client/src/types',
  '../client/src/utils',
  '../client/src/lib',
  '../client/src/components/ui'
];

sourceFiles.forEach(dir => {
  const srcPath = path.join(__dirname, dir);
  const fileName = path.basename(dir);
  const destPath = path.join(distDir, fileName);
  
  if (fs.existsSync(srcPath)) {
    copyRecursive(srcPath, destPath);
    console.log(`Copied ${fileName}`);
  }
});

// Copy local files
copyRecursive(path.join(__dirname, 'data'), path.join(distDir, 'data'));
copyRecursive(path.join(__dirname, 'utils'), path.join(distDir, 'utils'));
copyRecursive(path.join(__dirname, 'components'), path.join(distDir, 'components'));

// Copy styles
fs.copyFileSync(path.join(__dirname, 'styles.css'), path.join(distDir, 'index.css'));

// Create a simplified index.js
const indexContent = `
// Form Builder Components
export { default as FormBuilder } from './components/FormBuilder';
export { default as FormWizard } from './form-builder/form-wizard';
export { default as ThemedFormRenderer } from './form-builder/themed-form-renderer';

// Hooks
export { default as useFormWizard } from './hooks/use-form-wizard';
export { default as useFormBuilder } from './hooks/use-form-builder';

// Data
export { themes } from './data/themes';

// Styles
import './index.css';
`;

fs.writeFileSync(path.join(distDir, 'index.js'), indexContent);

console.log('Build completed! Package is ready in ./dist/');
console.log('');
console.log('To use in another project:');
console.log('1. Copy the ./lib/dist folder to your project');
console.log('2. Import: import { FormBuilder } from "./path/to/dist"');
console.log('3. Make sure Tailwind CSS is configured in your project');