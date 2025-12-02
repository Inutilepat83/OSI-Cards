#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const SECTIONS_DIR = path.join(__dirname, '..', 'projects', 'osi-cards-lib', 'src', 'lib', 'components', 'sections');
const OUTPUT_FILE = path.join(__dirname, '..', 'SECTION_FUNCTIONALITY_REFERENCE.md');

const sectionDirs = fs.readdirSync(SECTIONS_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory() && !d.name.startsWith('_'))
  .map(d => d.name);

let output = '# Section Functionality Reference\n\n';
output += 'Documentation of section functionality before rebuild.\n\n';
output += `Generated: ${new Date().toISOString()}\n\n`;
output += `Total sections: ${sectionDirs.length}\n\n---\n\n`;

sectionDirs.sort().forEach(dir => {
  const defPath = path.join(SECTIONS_DIR, dir, fs.readdirSync(path.join(SECTIONS_DIR, dir)).find(f => f.endsWith('.definition.json')) || '');
  
  if (fs.existsSync(defPath)) {
    const def = JSON.parse(fs.readFileSync(defPath, 'utf8'));
    output += `## ${def.name} (\`${def.type}\`)\n\n`;
    output += `**Description**: ${def.description}\n\n`;
    output += `**Folder**: \`${dir}\`\n\n`;
    
    if (def.useCases) {
      output += '**Use Cases**:\n';
      def.useCases.forEach(uc => output += `- ${uc}\n`);
      output += '\n';
    }
    
    if (def.rendering) {
      output += '**Rendering**:\n';
      output += `- Uses fields: ${def.rendering.usesFields}\n`;
      output += `- Uses items: ${def.rendering.usesItems}\n`;
      output += `- Default columns: ${def.rendering.defaultColumns}\n\n`;
    }
    
    output += '---\n\n';
  }
});

fs.writeFileSync(OUTPUT_FILE, output);
console.log('✅ Documentation created: SECTION_FUNCTIONALITY_REFERENCE.md');
