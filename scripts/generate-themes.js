const fs = require('fs');
const path = require('path');

const stylesDir = path.join(__dirname, '..', 'node_modules', 'highlight.js', 'styles');
const outputFile = path.join(__dirname, '..', 'dist', 'themes.json');

try {
  // Ensure dist directory exists
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });

  // Read styles directory
  const files = fs.readdirSync(stylesDir);
  const themesSet = new Set();

  files.forEach(file => {
    if (file.endsWith('.css')) {
      let themeName = path.basename(file, '.css');
      themeName = themeName.replace(/\.min$/, '');
      themesSet.add(themeName);
    }
  });

  // Convert to sorted array and write to JSON file
  const themes = Array.from(themesSet).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  fs.writeFileSync(outputFile, JSON.stringify(themes, null, 2));

  console.log(`Generated ${outputFile} with ${themes.length} themes`);
} catch (err) {
  console.error(`Error generating themes: ${err.message}`);
  process.exit(1);
}
