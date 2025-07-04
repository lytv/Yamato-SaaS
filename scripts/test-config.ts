#!/usr/bin/env node

/**
 * Simple test to validate config file
 */

import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

async function testConfig() {
  try {
    const configPath = join(process.cwd(), 'scripts', 'configs', 'plandetail-config.ts');
    console.log('Loading config from:', configPath);
    
    const configModule = await import(pathToFileURL(configPath).href);
    console.log('Available exports:', Object.keys(configModule));
    
    const config = configModule.planDetailConfig || configModule.plandetailConfig || configModule.default;
    
    if (config) {
      console.log('✅ Config loaded successfully!');
      console.log('Entity Name:', config.entityName);
      console.log('Table Name:', config.tableName);
      console.log('Fields Count:', config.fields.length);
      console.log('Relationships Enabled:', config.features.relationships);
      
      // Check for relationships
      const relationFields = config.fields.filter(f => f.relation);
      console.log('Relation Fields:', relationFields.length);
      relationFields.forEach(field => {
        console.log(`  - ${field.name}: ${field.relation.type} -> ${field.relation.entity}`);
      });
    } else {
      console.log('❌ No config found');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testConfig();
