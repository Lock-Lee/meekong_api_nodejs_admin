const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Import swagger spec using ts-node
require('ts-node/register');
const { swaggerSpec } = require('../src/shared/config/swagger.config.ts');

const OUTPUT_DIR = path.join(__dirname, '../docs');
const JSON_OUTPUT = path.join(OUTPUT_DIR, 'api-docs.json');
const YAML_OUTPUT = path.join(OUTPUT_DIR, 'api-docs.yaml');

// Create docs directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Export as JSON
fs.writeFileSync(JSON_OUTPUT, JSON.stringify(swaggerSpec, null, 2));
console.log(`✅ API documentation exported to JSON: ${JSON_OUTPUT}`);

// Optional: Export as YAML (requires js-yaml package)
try {
  const yaml = require('js-yaml');
  const yamlStr = yaml.dump(swaggerSpec);
  fs.writeFileSync(YAML_OUTPUT, yamlStr);
  console.log(`✅ API documentation exported to YAML: ${YAML_OUTPUT}`);
} catch (error) {
  console.log('ℹ️  Install js-yaml package to export YAML format: npm install --save-dev js-yaml');
}

console.log('\n📚 Documentation exported successfully!');
console.log(`   JSON: ${JSON_OUTPUT}`);
if (fs.existsSync(YAML_OUTPUT)) {
  console.log(`   YAML: ${YAML_OUTPUT}`);
}
