#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// ES modules don't have __dirname, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Configuration
const REPORT_FILE = path.join(projectRoot, 'migration-progress.md');

// File complexity weights
const COMPLEXITY_WEIGHTS = {
  // Higher weight = more complex/important
  components: {
    root: 5,        // Root components are typically most complex
    voiceChat: 4,   // Voice chat features are core functionality
    conversation: 4, // Conversation components are also core
    layout: 3,      // Layout components are important but less complex
    ui: 2           // UI components are simpler
  },
  pages: {
    root: 4,         // Main pages
    api: 5,          // API routes often contain business logic
    auth: 4,         // Auth pages are critical for security
    conversations: 3 // Conversation pages
  },
  other: {
    contexts: 4,    // Context providers can be complex
    hooks: 5,       // Custom hooks often contain complex logic
    lib: 5,         // Library files are critical infrastructure
    types: 3        // Type definitions are important but simpler
  }
};

const DIRECTORIES = {
  components: {
    root: {
      path: './components',
      filter: file => !file.includes('/') && (file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts'))
    },
    voiceChat: {
      path: './components/VoiceChat',
      filter: file => file.includes('/VoiceChat/') && (file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts'))
    },
    conversation: {
      path: './components/conversation', 
      filter: file => file.includes('/conversation/') && (file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts'))
    },
    layout: {
      path: './components/layout',
      filter: file => file.includes('/layout/') && (file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts'))
    },
    ui: {
      path: './components/ui',
      filter: file => file.includes('/ui/') && (file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts'))
    }
  },
  pages: {
    root: {
      path: './pages',
      filter: file => file.match(/^\.\/pages\/[^/]*\.(js|jsx|ts|tsx)$/) && !file.startsWith('./pages/api/') && 
                      !file.startsWith('./pages/auth/') && !file.startsWith('./pages/conversations/')
    },
    api: {
      path: './pages/api',
      filter: file => file.includes('/api/') && (file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts'))
    },
    auth: {
      path: './pages/auth',
      filter: file => file.includes('/auth/') && (file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts'))
    },
    conversations: {
      path: './pages/conversations',
      filter: file => file.includes('/conversations/') && (file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts'))
    }
  },
  other: {
    contexts: {
      path: './contexts',
      filter: file => file.startsWith('./contexts/') && (file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts'))
    },
    hooks: {
      path: './hooks',
      filter: file => file.startsWith('./hooks/') && (file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts'))
    },
    lib: {
      path: './lib',
      filter: file => file.startsWith('./lib/') && (file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts'))
    },
    types: {
      path: './types',
      filter: file => file.startsWith('./types/') && (file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts'))
    }
  }
};

// Per-developer tracking - this can be filled out as needed
const DEVELOPERS = {
  'dev1': 'Developer One',
  'dev2': 'Developer Two',
  'dev3': 'Developer Three'
};

// Get all source files
function getAllFiles() {
  try {
    const command = 'find . -path "*/node_modules/*" -prune -o \\( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \\) -print | grep -v ".next" | sort';
    const output = execSync(command, { encoding: 'utf-8' });
    return output.split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding files:', error);
    return [];
  }
}

// Get file size as a complexity indicator
function getFileComplexity(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').length;
    
    // Simple complexity calculation based on line count
    // Real complexity might consider more factors like nesting depth, etc.
    if (lines > 500) return 3; // High complexity
    if (lines > 200) return 2; // Medium complexity
    return 1; // Low complexity
  } catch (error) {
    return 1; // Default to low complexity if file can't be read
  }
}

// Analyze type coverage in TypeScript files
function getTypeCoverage(filePath) {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
    return { coverage: 0, anyCount: 0 };
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Count 'any' type occurrences as a negative indicator
    const anyCount = (content.match(/: any/g) || []).length;
    
    // Count proper type annotations as positive indicators
    const typeAnnotations = (content.match(/: [A-Z][A-Za-z<>[\]{}|&]+/g) || []).length;
    const interfaceCount = (content.match(/interface [A-Z][A-Za-z]+ \{/g) || []).length;
    const typeCount = (content.match(/type [A-Z][A-Za-z]+ =/g) || []).length;
    
    // A very simple coverage estimation
    const declarations = typeAnnotations + interfaceCount + typeCount;
    const totalTypes = declarations + anyCount;
    
    const coverage = totalTypes > 0 ? Math.round((declarations / totalTypes) * 100) : 100;
    
    return {
      coverage,
      anyCount
    };
  } catch (error) {
    return { coverage: 0, anyCount: 0 };
  }
}

// Get the last person who modified the file
function getLastFileEditor(filePath) {
  try {
    const command = `git log -n 1 --pretty=format:%an -- ${filePath}`;
    const editor = execSync(command, { encoding: 'utf-8' }).trim();
    return editor || 'Unknown';
  } catch (error) {
    return 'Unknown';
  }
}

// Calculate stats for a directory
function calculateDirectoryStats(files, filterFn, categoryType, categoryName) {
  const filteredFiles = files.filter(filterFn);
  const fileBaseNames = {};
  const weight = COMPLEXITY_WEIGHTS[categoryType]?.[categoryName] || 1;
  
  // Group files by base name
  filteredFiles.forEach(file => {
    const baseName = path.basename(file).split('.')[0];
    if (!fileBaseNames[baseName]) {
      fileBaseNames[baseName] = [];
    }
    fileBaseNames[baseName].push(file);
  });

  // Count stats
  let total = 0;
  let migrated = 0;
  let weightedTotal = 0;
  let weightedMigrated = 0;
  let typeCoverageSum = 0;
  let anyTypeCount = 0;
  const developers = {};
  const fileDetails = [];
  
  Object.entries(fileBaseNames).forEach(([baseName, files]) => {
    const hasJS = files.some(f => f.endsWith('.js') || f.endsWith('.jsx'));
    const hasTS = files.some(f => f.endsWith('.ts') || f.endsWith('.tsx'));
    
    // Get the TS or JS file for analysis
    const fileToAnalyze = hasTS 
      ? files.find(f => f.endsWith('.ts') || f.endsWith('.tsx'))
      : files.find(f => f.endsWith('.js') || f.endsWith('.jsx'));
    
    if (!fileToAnalyze) return;
    
    const complexity = getFileComplexity(fileToAnalyze);
    const fileWeight = weight * complexity;
    const lastEditor = getLastFileEditor(fileToAnalyze);
    const typeCoverage = hasTS ? getTypeCoverage(fileToAnalyze) : { coverage: 0, anyCount: 0 };
    
    // Track developer contributions
    if (!developers[lastEditor]) {
      developers[lastEditor] = { migrated: 0, total: 0 };
    }
    developers[lastEditor].total++;
    
    total++;
    weightedTotal += fileWeight;
    
    if (hasTS) {
      migrated++;
      weightedMigrated += fileWeight;
      typeCoverageSum += typeCoverage.coverage;
      anyTypeCount += typeCoverage.anyCount;
      
      if (lastEditor) {
        developers[lastEditor].migrated++;
      }
    }
    
    fileDetails.push({
      name: baseName,
      hasTS,
      complexity,
      weight: fileWeight,
      lastEditor,
      typeCoverage: typeCoverage.coverage,
      anyCount: typeCoverage.anyCount
    });
  });
  
  const completion = total > 0 ? Math.round((migrated / total) * 100) : 100;
  const weightedCompletion = weightedTotal > 0 ? Math.round((weightedMigrated / weightedTotal) * 100) : 100;
  const averageTypeCoverage = migrated > 0 ? Math.round(typeCoverageSum / migrated) : 0;
  
  return {
    total,
    migrated,
    completion,
    weightedCompletion,
    averageTypeCoverage,
    anyTypeCount,
    pending: total - migrated,
    developers,
    fileDetails,
    weight
  };
}

// Generate the report
function generateReport(files) {
  // Calculate stats for each directory
  const stats = {
    components: {},
    pages: {},
    other: {}
  };
  
  // Calculate component stats
  Object.entries(DIRECTORIES.components).forEach(([key, config]) => {
    stats.components[key] = calculateDirectoryStats(files, config.filter, 'components', key);
  });
  
  // Calculate pages stats
  Object.entries(DIRECTORIES.pages).forEach(([key, config]) => {
    stats.pages[key] = calculateDirectoryStats(files, config.filter, 'pages', key);
  });
  
  // Calculate other stats
  Object.entries(DIRECTORIES.other).forEach(([key, config]) => {
    stats.other[key] = calculateDirectoryStats(files, config.filter, 'other', key);
  });
  
  // Calculate overall stats with weighting
  let totalWeightedScore = 0;
  let totalMigratedWeightedScore = 0;
  let totalFiles = 0;
  let totalMigrated = 0;
  let totalAnyTypes = 0;
  let totalTypeCoverageSum = 0;
  const developerStats = {};
  
  // Process component stats
  Object.values(stats.components).forEach(stat => {
    totalWeightedScore += stat.total * stat.weight;
    totalMigratedWeightedScore += stat.migrated * stat.weight;
    totalFiles += stat.total;
    totalMigrated += stat.migrated;
    totalAnyTypes += stat.anyTypeCount;
    totalTypeCoverageSum += stat.averageTypeCoverage * stat.migrated;
    
    // Accumulate developer stats
    Object.entries(stat.developers).forEach(([dev, devStat]) => {
      if (!developerStats[dev]) {
        developerStats[dev] = { migrated: 0, total: 0 };
      }
      developerStats[dev].migrated += devStat.migrated;
      developerStats[dev].total += devStat.total;
    });
  });
  
  // Process page stats
  Object.values(stats.pages).forEach(stat => {
    totalWeightedScore += stat.total * stat.weight;
    totalMigratedWeightedScore += stat.migrated * stat.weight;
    totalFiles += stat.total;
    totalMigrated += stat.migrated;
    totalAnyTypes += stat.anyTypeCount;
    totalTypeCoverageSum += stat.averageTypeCoverage * stat.migrated;
    
    // Accumulate developer stats
    Object.entries(stat.developers).forEach(([dev, devStat]) => {
      if (!developerStats[dev]) {
        developerStats[dev] = { migrated: 0, total: 0 };
      }
      developerStats[dev].migrated += devStat.migrated;
      developerStats[dev].total += devStat.total;
    });
  });
  
  // Process other stats
  Object.values(stats.other).forEach(stat => {
    totalWeightedScore += stat.total * stat.weight;
    totalMigratedWeightedScore += stat.migrated * stat.weight;
    totalFiles += stat.total;
    totalMigrated += stat.migrated;
    totalAnyTypes += stat.anyTypeCount;
    totalTypeCoverageSum += stat.averageTypeCoverage * stat.migrated;
    
    // Accumulate developer stats
    Object.entries(stat.developers).forEach(([dev, devStat]) => {
      if (!developerStats[dev]) {
        developerStats[dev] = { migrated: 0, total: 0 };
      }
      developerStats[dev].migrated += devStat.migrated;
      developerStats[dev].total += devStat.total;
    });
  });
  
  const overallCompletion = Math.round((totalMigrated / totalFiles) * 100);
  const weightedOverallCompletion = Math.round((totalMigratedWeightedScore / totalWeightedScore) * 100);
  const averageTypeCoverage = totalMigrated > 0 ? Math.round(totalTypeCoverageSum / totalMigrated) : 0;
  
  // Calculate overall component and pages stats
  const componentTotals = Object.values(stats.components).reduce(
    (acc, curr) => ({ 
      total: acc.total + curr.total, 
      migrated: acc.migrated + curr.migrated,
      weightedTotal: acc.weightedTotal + (curr.total * curr.weight),
      weightedMigrated: acc.weightedMigrated + (curr.migrated * curr.weight)
    }),
    { total: 0, migrated: 0, weightedTotal: 0, weightedMigrated: 0 }
  );
  
  const pagesTotals = Object.values(stats.pages).reduce(
    (acc, curr) => ({ 
      total: acc.total + curr.total, 
      migrated: acc.migrated + curr.migrated,
      weightedTotal: acc.weightedTotal + (curr.total * curr.weight),
      weightedMigrated: acc.weightedMigrated + (curr.migrated * curr.weight)
    }),
    { total: 0, migrated: 0, weightedTotal: 0, weightedMigrated: 0 }
  );
  
  stats.components.overall = {
    total: componentTotals.total,
    migrated: componentTotals.migrated,
    completion: Math.round((componentTotals.migrated / componentTotals.total) * 100),
    weightedCompletion: Math.round((componentTotals.weightedMigrated / componentTotals.weightedTotal) * 100)
  };
  
  stats.pages.overall = {
    total: pagesTotals.total,
    migrated: pagesTotals.migrated,
    completion: Math.round((pagesTotals.migrated / pagesTotals.total) * 100),
    weightedCompletion: Math.round((pagesTotals.weightedMigrated / pagesTotals.weightedTotal) * 100)
  };
  
  // Generate the markdown content
  let content = `# TypeScript Migration Progress Report\n\n`;
  
  // Overview stats
  content += `## Overview Statistics\n`;
  content += `- Total JavaScript Files: ${totalFiles - totalMigrated}\n`;
  content += `- Total TypeScript Files: ${totalMigrated}\n`;
  content += `- Standard Completion: ${overallCompletion}%\n`;
  content += `- Weighted Completion: ${weightedOverallCompletion}%\n`;
  content += `- Type Coverage Quality: ${averageTypeCoverage}%\n`;
  content += `- Total \`any\` Type Uses: ${totalAnyTypes}\n\n`;
  
  // Progress bars
  content += `### Visual Progress\n\n`;
  content += createProgressBar("Overall Migration", overallCompletion);
  content += createProgressBar("Weighted Migration", weightedOverallCompletion);
  content += createProgressBar("Type Coverage", averageTypeCoverage);
  content += `\n`;
  
  // Components stats
  content += `## Migration Progress by Directory\n\n`;
  content += `### Components Directory\n`;
  content += `| Category | Migrated | Total | Completion | Weighted | Type Coverage |\n`;
  content += `|----------|----------|-------|------------|----------|---------------|\n`;
  
  Object.entries(stats.components).forEach(([key, stat]) => {
    if (key === 'overall') {
      content += `| **Overall Components** | **${stat.migrated}** | **${stat.total}** | **${stat.completion}%** | **${stat.weightedCompletion}%** | **-** |\n`;
    } else {
      const displayName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      content += `| ${displayName} Components | ${stat.migrated} | ${stat.total} | ${stat.completion}% | ${stat.weightedCompletion}% | ${stat.averageTypeCoverage}% |\n`;
    }
  });
  
  // Pages stats
  content += `\n### Pages Directory\n`;
  content += `| Category | Migrated | Total | Completion | Weighted | Type Coverage |\n`;
  content += `|----------|----------|-------|------------|----------|---------------|\n`;
  
  Object.entries(stats.pages).forEach(([key, stat]) => {
    if (key === 'overall') {
      content += `| **Overall Pages** | **${stat.migrated}** | **${stat.total}** | **${stat.completion}%** | **${stat.weightedCompletion}%** | **-** |\n`;
    } else {
      const displayName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      content += `| ${displayName} Pages | ${stat.migrated} | ${stat.total} | ${stat.completion}% | ${stat.weightedCompletion}% | ${stat.averageTypeCoverage}% |\n`;
    }
  });
  
  // Other stats
  content += `\n### Other Directories\n`;
  content += `| Directory | Migrated | Total | Completion | Weighted | Type Coverage |\n`;
  content += `|-----------|----------|-------|------------|----------|---------------|\n`;
  
  Object.entries(stats.other).forEach(([key, stat]) => {
    const displayName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    content += `| ${displayName} | ${stat.migrated} | ${stat.total} | ${stat.completion}% | ${stat.weightedCompletion}% | ${stat.averageTypeCoverage}% |\n`;
  });
  
  // Developer stats
  content += `\n## Developer Contributions\n`;
  content += `| Developer | Files Migrated | Total Files | Completion |\n`;
  content += `|-----------|----------------|-------------|------------|\n`;
  
  Object.entries(developerStats)
    .sort((a, b) => b[1].migrated - a[1].migrated)
    .forEach(([dev, stats]) => {
      const completionPercentage = stats.total > 0 ? Math.round((stats.migrated / stats.total) * 100) : 0;
      content += `| ${dev} | ${stats.migrated} | ${stats.total} | ${completionPercentage}% |\n`;
    });
  
  // Identify pending files
  const pendingFiles = getPendingFiles(files);
  
  content += `\n## Files Pending Migration\n\n`;
  
  // High priority files
  content += `### High Priority\n`;
  if (pendingFiles.components.root.length === 0) {
    content += `1. Root Components (All migrated!)\n`;
  } else {
    content += `1. Root Components (${pendingFiles.components.root.map(f => `\`${path.basename(f)}\``).join(', ')})\n`;
  }
  
  if (pendingFiles.other.hooks.length === 0) {
    content += `2. Core Hooks (All hooks migrated!)\n`;
  } else {
    content += `2. Core Hooks (${pendingFiles.other.hooks.map(f => `\`${path.basename(f)}\``).join(', ')})\n`;
  }
  
  if (pendingFiles.pages.root.length === 0) {
    content += `3. Main Pages (All migrated!)\n`;
  } else {
    content += `3. Main Pages (Remaining: ${pendingFiles.pages.root.map(f => `\`${path.basename(f)}\``).join(', ')})\n`;
  }
  
  // Medium priority files
  content += `\n### Medium Priority\n`;
  if (pendingFiles.components.voiceChat.length === 0) {
    content += `1. VoiceChat Components (All migrated!)\n`;
  } else {
    content += `1. VoiceChat Components (Remaining: ${pendingFiles.components.voiceChat.map(f => `\`${path.basename(f)}\``).join(', ')})\n`;
  }
  
  if (pendingFiles.components.layout.length === 0) {
    content += `2. Layout Components (All migrated!)\n`;
  } else {
    content += `2. Layout Components (Remaining: ${pendingFiles.components.layout.map(f => `\`${path.basename(f)}\``).join(', ')})\n`;
  }
  
  if (pendingFiles.components.conversation.length === 0) {
    content += `3. Conversation Components (All migrated!)\n`;
  } else {
    content += `3. Conversation Components (Remaining: ${pendingFiles.components.conversation.map(f => `\`${path.basename(f)}\``).slice(0, 3).join(', ')}${pendingFiles.components.conversation.length > 3 ? ', etc.' : ''})\n`;
  }
  
  if (pendingFiles.components.ui.length === 0) {
    content += `4. UI Components (All migrated!)\n`;
  } else {
    content += `4. UI Components (Remaining: ${pendingFiles.components.ui.map(f => `\`${path.basename(f)}\``).slice(0, 3).join(', ')}${pendingFiles.components.ui.length > 3 ? ', etc.' : ''})\n`;
  }
  
  // Lower priority files
  content += `\n### Lower Priority\n`;
  if (pendingFiles.pages.api.length === 0) {
    content += `1. API Routes (All migrated!)\n`;
  } else {
    content += `1. API Routes (${pendingFiles.pages.api.length} files remaining)\n`;
  }
  
  if (pendingFiles.other.lib.length === 0) {
    content += `2. Library Files (All migrated!)\n`;
  } else {
    content += `2. Library Files (${pendingFiles.other.lib.length} files remaining)\n`;
  }
  
  if (pendingFiles.pages.auth.length === 0) {
    content += `3. Auth Pages (All migrated!)\n`;
  } else {
    content += `3. Auth Pages (${pendingFiles.pages.auth.length} files remaining)\n`;
  }
  
  content += `\n## Recent Progress\n`;
  content += `- Converted key layout components\n`;
  content += `- Migrated all core hooks\n`;
  content += `- Converted main pages (index and conversation)\n`;
  content += `- Added TypeScript configuration and type definitions\n`;
  
  content += `\n## Next Steps\n`;
  content += `1. Complete migration of remaining root components\n`;
  content += `2. Finish VoiceChat component migration\n`;
  content += `3. Convert remaining conversation components\n`;
  content += `4. Focus on critical API routes\n`;
  content += `5. Add more type definitions to support library migration\n`;
  
  content += `\n## CI/CD Integration\n`;
  content += `This report can be automatically generated as part of your CI/CD pipeline by adding the following to your workflow:\n\n`;
  content += "```yaml\n";
  content += "- name: Update TypeScript Migration Progress\n";
  content += "  run: |\n";
  content += "    node scripts/update-ts-progress.js\n";
  content += "    git add migration-progress.md\n";
  content += "    git commit -m \"Update TypeScript migration progress [skip ci]\"\n";
  content += "    git push origin ${{ github.ref }}\n";
  content += "```\n";
  
  content += `\n## How to Contribute\n`;
  content += `- Pick a file from the high priority list\n`;
  content += `- Create a TypeScript version with proper types\n`;
  content += `- Ensure tests pass and functionality is maintained\n`;
  content += `- Minimize the use of \`any\` types to improve type coverage\n`;
  content += `- Update this progress report by running \`node scripts/update-ts-progress.js\`\n`;
  
  content += `\n\n*Last updated: ${new Date().toISOString().split('T')[0]}*`;
  
  return content;
}

// Helper function to create a simple ASCII progress bar
function createProgressBar(label, percentage, width = 30) {
  const filledWidth = Math.round(width * percentage / 100);
  const emptyWidth = width - filledWidth;
  
  const filledBar = '█'.repeat(filledWidth);
  const emptyBar = '░'.repeat(emptyWidth);
  
  return `${label.padEnd(20)} [${filledBar}${emptyBar}] ${percentage}%\n`;
}

// Get pending files for each category
function getPendingFiles(files) {
  const pendingFiles = {
    components: {},
    pages: {},
    other: {}
  };
  
  // Filter component files
  Object.entries(DIRECTORIES.components).forEach(([key, config]) => {
    const filteredFiles = files.filter(config.filter);
    const fileBaseNames = {};
    
    // Group files by base name
    filteredFiles.forEach(file => {
      const baseName = path.basename(file).split('.')[0];
      if (!fileBaseNames[baseName]) {
        fileBaseNames[baseName] = [];
      }
      fileBaseNames[baseName].push(file);
    });
    
    // Get JS files without TS counterparts
    pendingFiles.components[key] = [];
    Object.entries(fileBaseNames).forEach(([baseName, files]) => {
      const hasJS = files.some(f => f.endsWith('.js') || f.endsWith('.jsx'));
      const hasTS = files.some(f => f.endsWith('.ts') || f.endsWith('.tsx'));
      
      if (hasJS && !hasTS) {
        const jsFile = files.find(f => f.endsWith('.js') || f.endsWith('.jsx'));
        if (jsFile) {
          pendingFiles.components[key].push(jsFile);
        }
      }
    });
  });
  
  // Filter pages files
  Object.entries(DIRECTORIES.pages).forEach(([key, config]) => {
    const filteredFiles = files.filter(config.filter);
    const fileBaseNames = {};
    
    // Group files by base name
    filteredFiles.forEach(file => {
      const baseName = path.basename(file).split('.')[0];
      if (!fileBaseNames[baseName]) {
        fileBaseNames[baseName] = [];
      }
      fileBaseNames[baseName].push(file);
    });
    
    // Get JS files without TS counterparts
    pendingFiles.pages[key] = [];
    Object.entries(fileBaseNames).forEach(([baseName, files]) => {
      const hasJS = files.some(f => f.endsWith('.js') || f.endsWith('.jsx'));
      const hasTS = files.some(f => f.endsWith('.ts') || f.endsWith('.tsx'));
      
      if (hasJS && !hasTS) {
        const jsFile = files.find(f => f.endsWith('.js') || f.endsWith('.jsx'));
        if (jsFile) {
          pendingFiles.pages[key].push(jsFile);
        }
      }
    });
  });
  
  // Filter other files
  Object.entries(DIRECTORIES.other).forEach(([key, config]) => {
    const filteredFiles = files.filter(config.filter);
    const fileBaseNames = {};
    
    // Group files by base name
    filteredFiles.forEach(file => {
      const baseName = path.basename(file).split('.')[0];
      if (!fileBaseNames[baseName]) {
        fileBaseNames[baseName] = [];
      }
      fileBaseNames[baseName].push(file);
    });
    
    // Get JS files without TS counterparts
    pendingFiles.other[key] = [];
    Object.entries(fileBaseNames).forEach(([baseName, files]) => {
      const hasJS = files.some(f => f.endsWith('.js') || f.endsWith('.jsx'));
      const hasTS = files.some(f => f.endsWith('.ts') || f.endsWith('.tsx'));
      
      if (hasJS && !hasTS) {
        const jsFile = files.find(f => f.endsWith('.js') || f.endsWith('.jsx'));
        if (jsFile) {
          pendingFiles.other[key].push(jsFile);
        }
      }
    });
  });
  
  return pendingFiles;
}

// Main function
function main() {
  try {
    console.log('Analyzing TypeScript migration progress...');
    const files = getAllFiles();
    
    if (files.length === 0) {
      console.error('No files found. Check paths and permissions.');
      process.exit(1);
    }
    
    console.log(`Found ${files.length} source files. Generating report...`);
    const report = generateReport(files);
    
    fs.writeFileSync(REPORT_FILE, report);
    console.log(`Successfully updated ${REPORT_FILE}`);
    
    // Update the dashboard
    console.log('Updating migration dashboard...');
    try {
      const updateDashboardCommand = 'node scripts/update-dashboard.js';
      execSync(updateDashboardCommand, { encoding: 'utf-8' });
      console.log('Successfully updated migration dashboard');
    } catch (dashboardError) {
      console.error('Error updating dashboard:', dashboardError);
      // Continue execution even if dashboard update fails
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 