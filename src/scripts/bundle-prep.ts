import fs from 'fs';
import path from 'path';

function getFiles(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(full));
    } else if (full.endsWith('.js')) {
      results.push(full);
    }
  }
  return results;
}

const forgescriptNativeFiles = getFiles('node_modules/@tryforge/forgescript/dist/native');
const forgescriptEventsFiles = getFiles('node_modules/@tryforge/forgescript/dist/handlers/events');
const canvasFunctionsFiles = getFiles('node_modules/@tryforge/forge.canvas/dist/functions');
const dbFunctionsFiles = getFiles('node_modules/@nationdex/db/dist/functions');
const dbEventsFiles = getFiles('node_modules/@nationdex/db/dist/events');
const apiFunctionsFiles = getFiles('node_modules/@nationdex/api/dist/functions');

const botFunctionsFiles = getFiles('dist/functions');
const botCommandsFiles = getFiles('dist/commands');
const botSlashFiles = getFiles('dist/slash');

let code = `
// AUTO-GENERATED BUNDLE IMPORTS

`;

function generateImportBlock(name: string, files: string[], isModule: boolean) {
  let result = `export const get_${name} = () => [\n`;
  for (const file of files) {
    const posixFile = file.split(path.sep).join('/');
    let reqPath = posixFile;
    if (isModule) {
      reqPath = posixFile.replace('node_modules/', '');
    } else {
      reqPath = '../' + posixFile;
    }
    result += `  require(${JSON.stringify(reqPath)}),\n`;
  }
  result += `];\n`;
  return result;
}

code += generateImportBlock('forgescriptNative', forgescriptNativeFiles, true);
code += generateImportBlock('forgescriptEvents', forgescriptEventsFiles, true);
code += generateImportBlock('canvasFunctions', canvasFunctionsFiles, true);
code += generateImportBlock('dbFunctions', dbFunctionsFiles, true);
code += generateImportBlock('dbEvents', dbEventsFiles, true);
code += generateImportBlock('apiFunctions', apiFunctionsFiles, true);

code += generateImportBlock('botFunctions', botFunctionsFiles, false);
code += generateImportBlock('botCommands', botCommandsFiles, false);
code += generateImportBlock('botSlash', botSlashFiles, false);

fs.writeFileSync('src/bundle-imports.ts', code);
console.log('Bundle imports script generated successfully.');
