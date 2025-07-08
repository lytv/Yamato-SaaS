#!/usr/bin/env node

/**
 * OutsourceOrder Generator Helper Script
 * Easy command to generate all CRUD files for OutsourceOrder entity
 */

const { spawn } = require('child_process');
const path = require('path');

// Configuration
const ENTITY_NAME = 'outsourceorder';
const CONFIG_PATH = './configs/outsource-order-config.ts';
const SCRIPT_PATH = './enhanced-generate-advanced-entity-V4-improved.ts';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    log(colors.cyan, `\n🔄 Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

async function main() {
  try {
    // Change to scripts directory first
    const scriptDir = path.dirname(process.argv[1]);
    process.chdir(scriptDir);
    log(colors.blue, `Working directory: ${process.cwd()}`);
    
    const args = process.argv.slice(2);
    const isDryRun = args.includes('--dry-run') || args.includes('-d');
    const isVerbose = args.includes('--verbose') || args.includes('-v');
    const isForce = args.includes('--force') || args.includes('-f');
    const withBackup = args.includes('--backup') || args.includes('-b');

    log(colors.magenta, '🚀 OutsourceOrder Entity Generator');
    log(colors.yellow, '=====================================');
    
    // Build command arguments
    const commandArgs = [
      'npx', 'tsx',
      SCRIPT_PATH,
      ENTITY_NAME,
      CONFIG_PATH
    ];

    // Add options
    if (isDryRun) {
      commandArgs.push('--dry-run');
      log(colors.yellow, '🔍 DRY RUN MODE - Files will NOT be created');
    }
    
    if (isVerbose) {
      commandArgs.push('--verbose');
    }
    
    if (isForce) {
      commandArgs.push('--force');
    }
    
    if (withBackup) {
      commandArgs.push('--backup');
    }

    log(colors.blue, `📋 Entity: ${ENTITY_NAME}`);
    log(colors.blue, `📁 Config: ${CONFIG_PATH}`);
    log(colors.blue, `⚙️  Options: ${args.join(' ') || 'none'}`);

    // Run the generator
    await runCommand('npx', [
      'tsx',
      SCRIPT_PATH,
      ENTITY_NAME,
      CONFIG_PATH,
      ...args
    ]);

    log(colors.green, '\n✅ OutsourceOrder entity generation completed successfully!');
    
    if (!isDryRun) {
      log(colors.cyan, '\n📁 Generated files:');
      log(colors.reset, '   📄 Types: /types/outsourceOrder.ts');
      log(colors.reset, '   📄 Queries: /libs/queries/outsourceOrder.ts');
      log(colors.reset, '   📄 Validations: /libs/validations/outsourceOrder.ts');
      log(colors.reset, '   📄 Main Hook: /hooks/useOutsourceOrders.ts');
      log(colors.reset, '   📄 Mutations Hook: /hooks/useOutsourceOrderMutations.ts');
      log(colors.reset, '   📄 Filters Hook: /hooks/useOutsourceOrderFilters.ts');
      log(colors.reset, '   📄 Export Hook: /hooks/useOutsourceOrderExport.ts');
      log(colors.reset, '   📄 API Route: /app/api/outsourceOrders/route.ts');
      
      log(colors.yellow, '\n⚠️  Note: Schema file was skipped since outsourceOrderSchema already exists');
      log(colors.green, '\n🎉 Ready to use! Import the hooks in your components.');
    }

  } catch (error) {
    log(colors.red, `\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Help text
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log(colors.magenta, '🚀 OutsourceOrder Entity Generator Help');
  log(colors.yellow, '=====================================');
  log(colors.cyan, '\nUsage:');
  log(colors.reset, '  node generate-outsource-order.js [options]');
  log(colors.reset, '  # Or directly: npx tsx enhanced-generate-advanced-entity-V4-improved.ts outsourceorder ./configs/outsource-order-config.ts [options]');
  log(colors.cyan, '\nOptions:');
  log(colors.reset, '  --dry-run, -d    Preview changes without creating files');
  log(colors.reset, '  --verbose, -v    Show detailed logging');
  log(colors.reset, '  --force, -f      Overwrite existing files');
  log(colors.reset, '  --backup, -b     Backup existing files before overwrite');
  log(colors.reset, '  --help, -h       Show this help');
  log(colors.cyan, '\nExamples:');
  log(colors.reset, '  node generate-outsource-order.js --dry-run');
  log(colors.reset, '  node generate-outsource-order.js --verbose --backup');
  log(colors.reset, '  node generate-outsource-order.js --force');
  process.exit(0);
}

// Run the script
main();
