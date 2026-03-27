#!/usr/bin/env node

/**
 * nextjs-codegen CLI
 *
 * Commands:
 *   nextjs-codegen generate             Generate routes, services, apiClient and fetchBackend
 *   nextjs-codegen init                 Create a nextjs-codegen.config.mjs starter file
 *   nextjs-codegen --help               Show this help
 *
 * Options:
 *   --config <path>   Path to config file (default: nextjs-codegen.config.mjs)
 */

import { pathToFileURL } from 'url';
import { resolve, dirname } from 'path';
import { existsSync, writeFileSync } from 'fs';

// ─── Colors (Zero dependencies native escape codes) ───────────────────────────
const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  green:  '\x1b[32m',
  cyan:   '\x1b[36m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  gray:   '\x1b[90m',
};

const ok  = (s) => `${c.green}✓${c.reset} ${s}`;
const err = (s) => `${c.red}✗${c.reset} ${s}`;
const tip = (s) => `${c.cyan}→${c.reset} ${s}`;
const dim = (s) => `${c.gray}${s}${c.reset}`;

// ─── Help ─────────────────────────────────────────────────────────────────────
function printHelp() {
  console.log(`
${c.bold}nextjs-codegen${c.reset} ${dim('v1.0.0')}

${c.bold}Usage:${c.reset}
  nextjs-codegen ${c.cyan}generate${c.reset}               Generate all files from config
  nextjs-codegen ${c.cyan}init${c.reset}                   Create a starter config file
  nextjs-codegen ${c.cyan}--help${c.reset}                 Show this help

${c.bold}Options:${c.reset}
  --config ${c.yellow}<path>${c.reset}                Config file path
                                 (default: nextjs-codegen.config.mjs)

${c.bold}Examples:${c.reset}
  ${dim('# First time setup')}
  npx nextjs-codegen init
  npx nextjs-codegen generate

  ${dim('# Custom config path')}
  npx nextjs-codegen generate --config ./configs/api.mjs

  ${dim('# In package.json scripts')}
  ${dim('"codegen": "nextjs-codegen generate"')}
`);
}

// ─── Init: Scaffolding a configuration file natively ──────────────────────────
function runInit(configPath) {
  if (existsSync(configPath)) {
    console.log(`\n${c.yellow}!${c.reset} ${configPath} already exists. Skipping so your data is not overwritten.\n`);
    return;
  }

  const starter = `// nextjs-codegen.config.mjs
// Documentation: https://github.com/your-username/nextjs-openapi-codegen

/** @type {import('nextjs-openapi-codegen').CodegenConfig[]} */
export default [
  {
    name: 'my-api',

    // URL or absolute standard directory linking against your current OpenAPI/Swagger definition map array
    spec: 'https://api.example.com/api-json',

    // Directory paths mapping natively pointing into your root endpoints
    routesOut: 'src/app/api',
    servicesOut: 'src/services',

    // Essential system ENVs guiding internal Route Handler caller proxy logic natively 
    apiEnvVar: 'API_URL',
    apiFallback: 'https://api.example.com',

    // Removes the /api prefix normally found inside the raw spec paths natively tracking root configurations
    stripPathPrefix: '/api',

    // JWT global cookie name — actively intercepts client behaviors natively executing server-side routing guards
    // Remove or set undefined bypassing implicit authorization mechanisms securely
    cookieName: 'accessToken',

    // Browser Axios apiClient.ts configurations defining native security endpoints implicitly
    apiClient: {
      outputPath: 'src/lib/apiClient.ts',
      deviceTracking: false,         // true = natively injects x-device-id, x-device-os headers internally
      unauthorizedRedirect: '/auth', // redirect URI upon fetching 401 exceptions
    },

    // Server-side HTTP fetchBackend.ts caller options generating native route integrations locally
    fetchBackend: {
      outputPath: 'src/lib/fetchBackend.ts',
      timeout: 15000,
    },
  },
];
`;

  writeFileSync(configPath, starter, 'utf-8');
  console.log(`\n${ok(`Configuration file generated: ${configPath}`)}`);
  console.log(`\n  Next Steps:\n`);
  console.log(`  1. Edit the file and map your specific "spec" URL and "apiEnvVar" endpoints.`);
  console.log(`  2. Run ${c.cyan}npx nextjs-codegen generate${c.reset} to build out the API natively!\n`);
}

// ─── Generate functionality core loop ─────────────────────────────────────────
async function runGenerate(configPath) {
  if (!existsSync(configPath)) {
    console.error(`\n${err(`Configuration map was not found: ${configPath}`)}`);
    console.log(`\n  Scaffold a new layout executing: ${c.cyan}npx nextjs-codegen init${c.reset}\n`);
    process.exit(1);
  }

  // Imports predefined mappings
  let configs;
  try {
    const mod = await import(pathToFileURL(resolve(configPath)).href);
    configs = mod.default ?? mod;
    if (!Array.isArray(configs)) configs = [configs];
  } catch (e) {
    console.error(`\n${err(`Failed to load target configuration map natively: ${configPath}`)}`);
    console.error(`  ${c.red}${e.message}${c.reset}\n`);
    process.exit(1);
  }

  // Integrates explicitly exposed API tools via the dist compiler output root directly 
  const distEntry = new URL('../dist/index.js', import.meta.url).href;
  let generators;
  try {
    generators = await import(distEntry);
  } catch (e) {
    console.error(`\n${err('Failed to mount internal nextjs-codegen tools. Run "npm run build" first to map external systems.')}`);
    console.error(`  ${c.red}${e.message}${c.reset}\n`);
    process.exit(1);
  }

  const { generateRoutes, generateServices, generateApiClient, generateFetchBackend, fetchSpec } = generators;

  const cwd = process.cwd();
  let totalRoutes = 0;
  let totalServices = 0;
  let errors = 0;

  console.log(`\n${c.bold}nextjs-codegen${c.reset} ${dim('— running sequence mappings...')}\n`);

  for (const cfg of configs) {
    const {
      name = 'default',
      spec: specPathOrUrl,
      routesOut = 'src/app/api',
      servicesOut = 'src/services',
      apiEnvVar = 'API_URL',
      apiFallback = '',
      stripPathPrefix = '/api',
      apiModule,
      apiClientPath = '@/lib/apiClient',
      cookieName,
      apiClient: apiClientOpts,
      fetchBackend: fetchBackendOpts,
    } = cfg;

    console.log(`${c.bold}${c.cyan}[${name}]${c.reset}`);

    // 1. apiClient.ts mapper natively generated outputs locally
    if (apiClientOpts !== false) {
      try {
        const f = generateApiClient({ cookieName, ...(apiClientOpts ?? {}) }, cwd);
        console.log(`  ${ok(f)}`);
      } catch (e) {
        console.error(`  ${err('apiClient.ts: ' + e.message)}`);
        errors++;
      }
    }

    // 2. fetchBackend.ts mapping resolving root dependencies
    if (fetchBackendOpts !== false) {
      try {
        const f = generateFetchBackend({ cookieName, ...(fetchBackendOpts ?? {}) }, cwd);
        console.log(`  ${ok(f)}`);
      } catch (e) {
        console.error(`  ${err('fetchBackend.ts: ' + e.message)}`);
        errors++;
      }
    }

    // 3. System spec resolution bridging remote networks directly parsing JSON natively
    if (!specPathOrUrl) {
      console.error(`  ${err('Missing "spec" entry config endpoint property mapping. Routes and Services have been skipped.')}`);
      errors++;
      continue;
    }

    let parsedSpec;
    try {
      console.log(`  ${tip(`spec: ${specPathOrUrl}`)}`);
      parsedSpec = await fetchSpec(specPathOrUrl);
      const pathCount = Object.keys(parsedSpec.paths ?? {}).length;
      console.log(`  ${dim(`${pathCount} mapped remote operation path(s) successfully executed`)}`);
    } catch (e) {
      console.error(`  ${err('Spec payload evaluation execution halted: ' + e.message)}`);
      errors++;
      continue;
    }

    // 4. Routes construction logic bridging APIs explicitly linking Next.js App Router rules
    try {
      const routeFiles = await generateRoutes({
        spec: parsedSpec, stripPathPrefix, apiEnvVar, apiFallback, routesOut, cwd,
      });
      totalRoutes += routeFiles.length;
      console.log(`  ${ok(`\${routeFiles.length} constructed route(s)     →  ${routesOut}/`)}`);
    } catch (e) {
      console.error(`  ${err('routes system execution failure: ' + e.message)}`);
      errors++;
    }

    // 5. Services and generic native bindings mapped internally binding strongly typed endpoints 
    try {
      const serviceFiles = await generateServices({
        spec: parsedSpec, stripPathPrefix, apiModule, servicesOut, apiClientPath, cwd,
      });
      totalServices += serviceFiles.length;
      console.log(`  ${ok(`\${serviceFiles.length} generated service file(s)  →  ${servicesOut}/`)}`);
    } catch (e) {
      console.error(`  ${err('services system execution failure: ' + e.message)}`);
      errors++;
    }

    console.log('');
  }

  // Final generic outputs capturing execution metrics explicitly
  if (errors > 0) {
    console.log(`${c.yellow}Executed completely throwing ${errors} reported system error occurrences natively.${c.reset}`);
  } else {
    console.log(`${c.green}${c.bold}Execution Completed!${c.reset} ${dim(`${totalRoutes} bridged routes · ${totalServices} typed service modules created`)}\n`);
  }
}

// ─── Argument Parse bindings capturing root system actions ─────────────────────
const args = process.argv.slice(2);

const command   = args.find(a => !a.startsWith('-')) ?? 'generate';
const configIdx = args.indexOf('--config');
const configArg = configIdx !== -1 ? args[configIdx + 1] : null;
const configPath = resolve(process.cwd(), configArg ?? 'nextjs-codegen.config.mjs');

if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

switch (command) {
  case 'init':
    runInit(configPath);
    break;
  case 'generate':
    await runGenerate(configPath);
    break;
  default:
    console.error(`\n${err(`Native internal command flag unresolved mapping executing system tool: "${command}"`)}`);
    printHelp();
    process.exit(1);
}
