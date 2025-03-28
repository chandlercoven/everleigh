#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules don't have __dirname, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// File paths
const PROGRESS_FILE = path.join(projectRoot, 'migration-progress.md');
const DASHBOARD_FILE = path.join(projectRoot, 'migration-dashboard.md');

// Parse the migration progress file
function parseMigrationData() {
  try {
    const content = fs.readFileSync(PROGRESS_FILE, 'utf-8');
    const data = {
      totalFiles: 0,
      migratedFiles: 0,
      weightedProgress: 0,
      typeQuality: 0,
      anyCount: 0,
      categories: [],
      developers: [],
      priorities: {
        high: [],
        medium: [],
        low: {}
      }
    };
    
    // Extract basic stats - updated regex to better match our format
    const statsMatch = content.match(/- Total JavaScript Files: (\d+)\s*\n- Total TypeScript Files: (\d+)\s*\n- Standard Completion: (\d+)%\s*\n- Weighted Completion: (\d+)%\s*\n- Type Coverage Quality: (\d+)%\s*\n- Total `any` Type Uses: (\d+)/s);
    
    if (statsMatch) {
      const jsFiles = parseInt(statsMatch[1]);
      const tsFiles = parseInt(statsMatch[2]);
      
      data.totalFiles = jsFiles + tsFiles;
      data.migratedFiles = tsFiles;
      data.migrationPercentage = parseInt(statsMatch[3]);
      data.weightedProgress = parseInt(statsMatch[4]);
      data.typeQuality = parseInt(statsMatch[5]);
      data.anyCount = parseInt(statsMatch[6]);
    } else {
      console.log("Failed to match basic stats pattern");
      // Fallback to older format if not found
      const jsMatch = content.match(/Total JavaScript Files: (\d+)/);
      const tsMatch = content.match(/Total TypeScript Files: (\d+)/);
      const completionMatch = content.match(/Migration Completion: (\d+)%/);
      
      if (jsMatch && tsMatch && completionMatch) {
        const jsFiles = parseInt(jsMatch[1]);
        const tsFiles = parseInt(tsMatch[1]);
        
        data.totalFiles = jsFiles + tsFiles;
        data.migratedFiles = tsFiles;
        data.migrationPercentage = parseInt(completionMatch[1]);
        data.weightedProgress = data.migrationPercentage; // Default to standard completion
        data.typeQuality = 80; // Default value
        data.anyCount = 0;
      }
    }
    
    // Components section - improved regex to handle table format
    let componentsSection = content.match(/### Components Directory\s+\|\s*Category\s*\|\s*Migrated\s*\|\s*Total\s*\|\s*Completion\s*\|[\s\S]+?\n([\s\S]+?)(?=\n\n)/);
    if (componentsSection) {
      const lines = componentsSection[1].split('\n').filter(line => line.trim() !== '' && line.includes('|'));
      const componentsCategory = { name: 'Components', items: [], completion: 0 };
      
      // First find the overall component stats
      const overallLine = lines.find(line => line.toLowerCase().includes('overall components'));
      if (overallLine) {
        const overallMatch = overallLine.match(/\|\s*([^|]+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)%/);
        if (overallMatch) {
          componentsCategory.completion = parseInt(overallMatch[4]);
        }
      }
      
      // Process individual component categories
      lines.forEach(line => {
        // Skip the overall line since we already processed it
        if (line.toLowerCase().includes('overall components')) return;
        
        // Match the table row format with more flexibility
        const match = line.match(/\|\s*([^|]+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)%/);
        if (match) {
          const name = match[1].trim().replace(/\*\*/g, '');
          const completion = parseInt(match[4]);
          
          componentsCategory.items.push({
            name,
            completion
          });
        }
      });
      
      data.categories.push(componentsCategory);
    } else {
      console.log("Failed to match components section");
    }
    
    // Pages section - improved regex
    let pagesSection = content.match(/### Pages Directory\s+\|\s*Category\s*\|\s*Migrated\s*\|\s*Total\s*\|\s*Completion\s*\|[\s\S]+?\n([\s\S]+?)(?=\n\n)/);
    if (pagesSection) {
      const lines = pagesSection[1].split('\n').filter(line => line.trim() !== '' && line.includes('|'));
      const pagesCategory = { name: 'Pages', items: [], completion: 0 };
      
      // First find the overall pages stats
      const overallLine = lines.find(line => line.toLowerCase().includes('overall pages'));
      if (overallLine) {
        const overallMatch = overallLine.match(/\|\s*([^|]+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)%/);
        if (overallMatch) {
          pagesCategory.completion = parseInt(overallMatch[4]);
        }
      }
      
      // Process individual page categories
      lines.forEach(line => {
        // Skip the overall line since we already processed it
        if (line.toLowerCase().includes('overall pages')) return;
        
        // Match the table row format
        const match = line.match(/\|\s*([^|]+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)%/);
        if (match) {
          const name = match[1].trim().replace(/\*\*/g, '');
          const completion = parseInt(match[4]);
          
          pagesCategory.items.push({
            name,
            completion
          });
        }
      });
      
      data.categories.push(pagesCategory);
    } else {
      console.log("Failed to match pages section");
    }
    
    // Other section - improved regex
    let otherSection = content.match(/### Other Directories\s+\|\s*Directory\s*\|\s*Migrated\s*\|\s*Total\s*\|\s*Completion\s*\|[\s\S]+?\n([\s\S]+?)(?=\n\n)/);
    if (otherSection) {
      const lines = otherSection[1].split('\n').filter(line => line.trim() !== '' && line.includes('|'));
      const otherCategory = { name: 'Other', items: [], completion: 0 };
      let totalMigrated = 0;
      let totalFiles = 0;
      
      lines.forEach(line => {
        // Updated regex pattern
        const match = line.match(/\|\s*([^|]+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)%/);
        if (match) {
          const name = match[1].trim();
          const migrated = parseInt(match[2]);
          const total = parseInt(match[3]);
          const completion = parseInt(match[4]);
          
          otherCategory.items.push({
            name,
            completion
          });
          
          totalMigrated += migrated;
          totalFiles += total;
        }
      });
      
      // Calculate other category completion
      otherCategory.completion = totalFiles > 0 ? Math.round((totalMigrated / totalFiles) * 100) : 0;
      data.categories.push(otherCategory);
    } else {
      console.log("Failed to match other directories section");
    }
    
    // Developer contributions - improved regex
    let devSection = content.match(/## Developer Contributions\s+\|\s*Developer\s*\|\s*Files Migrated\s*\|\s*Total Files\s*\|\s*Completion\s*\|([\s\S]+?)(?=\n\n)/);
    if (devSection) {
      const lines = devSection[1].split('\n').filter(line => line.trim() !== '' && line.includes('|'));
      
      lines.forEach(line => {
        const match = line.match(/\|\s*([^|]+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)%\s*\|/);
        if (match) {
          const name = match[1].trim();
          const migrated = parseInt(match[2]);
          const total = parseInt(match[3]);
          const completion = parseInt(match[4]);
          
          data.developers.push({
            name,
            migrated,
            total,
            completion
          });
        }
      });
    } else {
      console.log("Failed to match developer contributions section");
    }
    
    // Priority files - improved patterns
    // High priority
    const highPrioritySection = content.match(/### High Priority\s+([\s\S]+?)(?=\n\n)/);
    if (highPrioritySection) {
      const highPriorityContent = highPrioritySection[1];
      
      // Look for patterns like "Main Pages (Remaining: `file1.js`, `file2.js`)"
      const fileMatches = highPriorityContent.match(/\(Remaining: ([^)]+)\)/g);
      
      if (fileMatches) {
        fileMatches.forEach(matchStr => {
          const files = matchStr.match(/`([^`]+)`/g);
          if (files) {
            data.priorities.high = data.priorities.high.concat(files.map(f => f.replace(/`/g, '')));
          }
        });
      }
    }
    
    // Medium priority
    const mediumPrioritySection = content.match(/### Medium Priority\s+([\s\S]+?)(?=\n\n)/);
    if (mediumPrioritySection) {
      const mediumPriorityContent = mediumPrioritySection[1];
      
      // Extract files from different component types
      const fileMatches = mediumPriorityContent.match(/\(Remaining: ([^)]+)\)/g);
      
      if (fileMatches) {
        fileMatches.forEach(matchStr => {
          const files = matchStr.match(/`([^`]+)`/g);
          if (files) {
            data.priorities.medium = data.priorities.medium.concat(files.map(f => f.replace(/`/g, '')));
          }
        });
      }
    }
    
    // Lower priority
    const lowPrioritySection = content.match(/### Lower Priority\s+([\s\S]+?)(?=\n\n)/);
    if (lowPrioritySection) {
      const lowContent = lowPrioritySection[1];
      
      const apiMatch = lowContent.match(/API Routes \((\d+) files remaining\)/);
      if (apiMatch) {
        data.priorities.low.apiRoutes = parseInt(apiMatch[1]);
      }
      
      const libMatch = lowContent.match(/Library Files \((\d+) files remaining\)/);
      if (libMatch) {
        data.priorities.low.libraryFiles = parseInt(libMatch[1]);
      }
      
      const authMatch = lowContent.match(/Auth Pages \((\d+) files remaining\)/);
      if (authMatch) {
        data.priorities.low.authPages = parseInt(authMatch[1]);
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error parsing migration data:', error);
    return null;
  }
}

// Create progress bar
function createProgressBar(percentage, width = 30) {
  if (isNaN(percentage)) percentage = 0;
  
  const filledWidth = Math.round(width * percentage / 100);
  const emptyWidth = width - filledWidth;
  
  const filledBar = '█'.repeat(filledWidth);
  const emptyBar = '░'.repeat(emptyWidth);
  
  return `[${filledBar}${emptyBar}] ${percentage}%`;
}

// Generate the dashboard
function generateDashboard(data) {
  let content = `# TypeScript Migration Dashboard\n\n`;
  
  // Quick stats
  content += `## Quick Stats\n\n`;
  content += `| Metric | Value |\n`;
  content += `|--------|-------|\n`;
  content += `| 🧮 **Total Files** | ${data.totalFiles} |\n`;
  content += `| ✅ **Migrated Files** | ${data.migratedFiles} (${data.migrationPercentage}%) |\n`;
  content += `| ⚖️ **Weighted Progress** | ${data.weightedProgress}% |\n`;
  content += `| 📝 **Type Quality** | ${data.typeQuality}% |\n`;
  content += `| 🚩 **'any' Type Uses** | ${data.anyCount} |\n\n`;
  
  // Migration progress bars
  content += `## Migration Progress\n\n`;
  content += "```\n";
  content += `Overall Migration    ${createProgressBar(data.migrationPercentage)}\n`;
  content += `Weighted Migration   ${createProgressBar(data.weightedProgress)}\n`;
  content += `Type Coverage        ${createProgressBar(data.typeQuality)}\n`;
  content += "```\n\n";
  
  // Category completion
  content += `## Category Completion\n\n`;
  content += "```\n";
  
  // Process each category
  data.categories.forEach(category => {
    content += `${category.name.padEnd(20)} ${createProgressBar(category.completion)}\n`;
    
    // Add subcategories
    category.items.forEach(item => {
      const name = item.name.replace(/Components$/, '').trim();
      content += `├── ${name.padEnd(16)} ${createProgressBar(item.completion)}\n`;
    });
    
    content += "\n";
  });
  
  content += "```\n\n";
  
  // Developer contributions
  if (data.developers.length > 0) {
    content += `## Developer Contributions\n\n`;
    content += `| Developer | Files | Percent |\n`;
    content += `|-----------|-------|--------|\n`;
    
    // Sort developers by number of migrated files
    data.developers.sort((a, b) => b.migrated - a.migrated);
    
    data.developers.forEach(dev => {
      content += `| ${dev.name} | ${dev.migrated} | ${Math.round((dev.migrated / data.migratedFiles) * 100)}% |\n`;
    });
    
    content += `\n`;
  }
  
  // Priority files
  content += `## Priority Files\n\n`;
  
  // High priority
  content += `### High Priority\n`;
  if (data.priorities.high.length > 0) {
    content += `- Remaining pages: ${data.priorities.high.map(file => '`' + file + '`').join(', ')}\n\n`;
  } else {
    content += `- All high priority files have been migrated! 🎉\n\n`;
  }
  
  // Medium priority
  content += `### Medium Priority\n`;
  if (data.priorities.medium.length > 0) {
    // Split by type if possible
    const voiceChatFiles = data.priorities.medium.filter(f => f.includes('VoiceChat'));
    const conversationFiles = data.priorities.medium.filter(f => !f.includes('VoiceChat'));
    
    if (voiceChatFiles.length > 0) {
      content += `- VoiceChat: ${voiceChatFiles.map(file => '`' + file + '`').join(', ')} \n`;
    }
    
    if (conversationFiles.length > 0) {
      content += `- Conversation: ${conversationFiles.map(file => '`' + file + '`').join(', ')}\n\n`;
    } else {
      content += `\n`;
    }
  } else {
    content += `- All medium priority files have been migrated! 🎉\n\n`;
  }
  
  // Lower priority
  content += `### Lower Priority\n`;
  content += `- API Routes: ${data.priorities.low.apiRoutes || 0} files\n`;
  content += `- Library Files: ${data.priorities.low.libraryFiles || 0} files\n`;
  content += `- Auth Pages: ${data.priorities.low.authPages || 0} files\n\n`;
  
  // CI/CD Integration status
  content += `## CI/CD Integration Status\n\n`;
  content += `✅ **Enabled**: Migration report is automatically generated in CI pipeline\n\n`;
  
  // Next steps
  content += `## Next Steps\n\n`;
  content += `1. Convert remaining root pages (${data.priorities.high.length} files)\n`;
  content += `2. Finish VoiceChat components (${data.priorities.medium.filter(f => f.includes('VoiceChat')).length} file${data.priorities.medium.filter(f => f.includes('VoiceChat')).length !== 1 ? 's' : ''} and Conversation components (${data.priorities.medium.filter(f => !f.includes('VoiceChat')).length} file${data.priorities.medium.filter(f => !f.includes('VoiceChat')).length !== 1 ? 's' : ''})\n`;
  content += `3. Improve type coverage in API routes\n`;
  content += `4. Start migration of library files\n\n`;
  
  content += `*Last updated: ${new Date().toISOString().split('T')[0]}*`;
  
  return content;
}

// Main function
function main() {
  try {
    console.log('Generating TypeScript migration dashboard...');
    
    // Parse data from the migration progress file
    const data = parseMigrationData();
    if (!data) {
      console.error('Failed to parse migration data.');
      process.exit(1);
    }
    
    // Generate the dashboard
    const dashboardContent = generateDashboard(data);
    
    // Write the dashboard file
    fs.writeFileSync(DASHBOARD_FILE, dashboardContent);
    console.log(`Successfully generated ${DASHBOARD_FILE}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 