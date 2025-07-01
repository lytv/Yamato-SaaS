#!/usr/bin/env node

/**
 * Entity Generator Script
 * Clones todos structure to create new entity with CRUD functionality
 * Usage: npx ts-node scripts/generate-entity.ts notes
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface FieldConfig {
  name: string;
  type: 'string' | 'text' | 'number' | 'boolean' | 'date';
  required: boolean;
  maxLength?: number;
  label: string;
}

interface EntityConfig {
  entityName: string;        // 'Note'
  entityNameLower: string;   // 'note'
  entityNamePlural: string;  // 'notes'
  tableName: string;         // 'note'
  fields: FieldConfig[];
  features: {
    pagination: boolean;
    search: boolean;
    sorting: boolean;
    stats: boolean;
  };
}

// Notes configuration
const notesConfig: EntityConfig = {
  entityName: 'Note',
  entityNameLower: 'note',
  entityNamePlural: 'notes',
  tableName: 'note',
  fields: [
    {
      name: 'title',
      type: 'string',
      required: true,
      maxLength: 255,
      label: 'Title'
    },
    {
      name: 'content',
      type: 'text',
      required: true,
      label: 'Content'
    },
    {
      name: 'category',
      type: 'string',
      required: false,
      maxLength: 100,
      label: 'Category'
    }
  ],
  features: {
    pagination: true,
    search: true,
    sorting: true,
    stats: true
  }
};

function replaceTemplateVars(content: string, config: EntityConfig): string {
  return content
    // Entity names
    .replace(/todo/g, config.entityNameLower)
    .replace(/Todo/g, config.entityName)
    .replace(/todos/g, config.entityNamePlural)
    .replace(/Todos/g, config.entityName + 's')
    
    // Field-specific replacements for notes
    .replace(/title: text\('title'\)\.notNull\(\),/g, 'title: text(\'title\').notNull(),')
    .replace(/message: text\('message'\)\.notNull\(\),/g, 'content: text(\'content\').notNull(),\n  category: text(\'category\'),')
    
    // Validation replacements
    .replace(/message: z\.string\(\)\.min\(1, 'Message is required'\)\.max\(2000, 'Message must be less than 2000 characters'\)/g, 
      'content: z.string().min(1, \'Content is required\').max(10000, \'Content must be less than 10000 characters\'),\n  category: z.string().max(100, \'Category must be less than 100 characters\').optional()')
    
    // Form field replacements
    .replace(/message/g, 'content')
    .replace(/Message/g, 'Content')
    
    // Add category field in components
    .replace(/(<Controller\s+name="content"[\s\S]*?<\/Controller>)/g, 
      '$1\n\n        <div className="space-y-2">\n          <Label htmlFor="category">{t(\'note.form.category\')}</Label>\n          <Controller\n            name="category"\n            control={control}\n            render={({ field, fieldState }) => (\n              <div>\n                <Input\n                  {...field}\n                  id="category"\n                  type="text"\n                  placeholder="Optional category"\n                  className={fieldState.error ? \'border-red-500\' : \'\'}\n                />\n                {fieldState.error && (\n                  <p className="mt-1 text-sm text-red-600">{fieldState.error.message}</p>\n                )}\n              </div>\n            )}\n          />\n        </div>')
    
    // Database search fields
    .replace(/ilike\(todoSchema\.message, searchTerm\)/g, 'ilike(noteSchema.content, searchTerm), ilike(noteSchema.category, searchTerm)')
    .replace(/ilike\([^.]+\.message, searchTerm\)/g, 'ilike(noteSchema.content, searchTerm), ilike(noteSchema.category, searchTerm)');
}

function generateFile(sourcePath: string, targetPath: string, config: EntityConfig): void {
  try {
    if (!existsSync(sourcePath)) {
      console.warn(`⚠️  Source file not found: ${sourcePath}`);
      return;
    }

    const sourceContent = readFileSync(sourcePath, 'utf-8');
    const generatedContent = replaceTemplateVars(sourceContent, config);
    
    // Ensure target directory exists
    const targetDir = join(targetPath, '..');
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }
    
    writeFileSync(targetPath, generatedContent);
    console.log(`✅ Generated: ${targetPath}`);
  } catch (error) {
    console.error(`❌ Error generating ${targetPath}:`, error);
  }
}

function main() {
  const config = notesConfig;
  console.log(`🚀 Generating ${config.entityName} entity...`);

  // File mapping: source -> target
  const fileMappings = [
    // Types
    ['src/types/todo.ts', `src/types/${config.entityNameLower}.ts`],
    
    // Validation
    ['src/libs/validations/todo.ts', `src/libs/validations/${config.entityNameLower}.ts`],
    
    // Database queries
    ['src/libs/queries/todo.ts', `src/libs/queries/${config.entityNameLower}.ts`],
    
    // API client
    ['src/libs/api/todos.ts', `src/libs/api/${config.entityNamePlural}.ts`],
    
    // Hooks
    ['src/hooks/useTodos.ts', `src/hooks/use${config.entityName}s.ts`],
    ['src/hooks/useTodoMutations.ts', `src/hooks/use${config.entityName}Mutations.ts`],
    ['src/hooks/useTodoFilters.ts', `src/hooks/use${config.entityName}Filters.ts`],
    
    // Components
    ['src/features/todo/TodoForm.tsx', `src/features/${config.entityNameLower}/${config.entityName}Form.tsx`],
    ['src/features/todo/TodoList.tsx', `src/features/${config.entityNameLower}/${config.entityName}List.tsx`],
    ['src/features/todo/TodoSkeleton.tsx', `src/features/${config.entityNameLower}/${config.entityName}Skeleton.tsx`],
    
    // API routes
    ['src/app/api/todos/route.ts', `src/app/api/${config.entityNamePlural}/route.ts`],
    ['src/app/api/todos/[id]/route.ts', `src/app/api/${config.entityNamePlural}/[id]/route.ts`],
    ['src/app/api/todos/stats/route.ts', `src/app/api/${config.entityNamePlural}/stats/route.ts`],
    
    // Pages
    ['src/app/[locale]/(auth)/dashboard/todos/page.tsx', `src/app/[locale]/(auth)/dashboard/${config.entityNamePlural}/page.tsx`],
  ];

  // Generate all files
  fileMappings.forEach(([source, target]) => {
    generateFile(String(source), String(target), config);
  });

  console.log(`\n🎉 ${config.entityName} entity generated successfully!`);
  console.log('\n📋 Next steps:');
  console.log('1. Update src/models/Schema.ts to add noteSchema');
  console.log('2. Update dashboard layout to add notes navigation');
  console.log('3. Run database migration if needed');
  console.log('4. Add translation keys for notes');
  console.log('5. Test the generated components');
}

if (require.main === module) {
  main();
}
