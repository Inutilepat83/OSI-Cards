#!/usr/bin/env node

/**
 * Generate LLM Prompt as JSON file for API endpoint
 * This creates a static JSON file that can be served at /api/llm_prompt
 *
 * Reuses the same generator from generate-llm-prompt.js to ensure consistency
 */

const fs = require('fs');
const path = require('path');

// Import the prompt generation logic
const REGISTRY_PATH = path.join(__dirname, '../projects/osi-cards-lib/section-registry.json');
const OUTPUT_PATH = path.join(__dirname, '../src/assets/api/llm_prompt.json');

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate the prompt JSON using the shared generator
function generatePromptJson() {
  console.log('📖 Reading section-registry.json...');
  const content = fs.readFileSync(REGISTRY_PATH, 'utf8');
  const registry = JSON.parse(content);

  // Import generateLLMPrompt from generate-llm-prompt.js
  // This ensures we use the exact same prompt generation logic
  const { generateLLMPrompt } = require('./generate-llm-prompt.js');

  console.log('🔧 Generating LLM system prompt...');
  const prompt = generateLLMPrompt(registry);

  const response = {
    prompt: prompt,
    generatedAt: new Date().toISOString(),
    version: registry.version || '1.0.0',
    metadata: {
      sectionCount: Object.keys(registry.sections || {}).filter(
        (k) => !registry.sections[k].isInternal
      ).length,
      aliasCount: Object.keys(registry.typeAliases || {}).length,
      characters: prompt.length,
      estimatedTokens: Math.ceil(prompt.length / 4),
    },
  };

  // Write JSON file
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(response, null, 2), 'utf8');
  console.log(`✅ Generated: ${OUTPUT_PATH}`);
  console.log(`📊 Prompt Stats: ${response.metadata.characters} chars, ~${response.metadata.estimatedTokens} tokens`);
}

try {
  generatePromptJson();
} catch (error) {
  console.error('Error generating prompt JSON:', error);
  process.exit(1);
}
