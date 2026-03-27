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

// ─── Colours (sem dependências externas) ─────────────────────────────────────
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

// ─── Init: cria o arquivo de config ──────────────────────────────────────────
function runInit(configPath) {
  if (existsSync(configPath)) {
    console.log(`\n${c.yellow}!${c.reset} ${configPath} já existe. Não foi sobrescrito.\n`);
    return;
  }

  const starter = `// nextjs-codegen.config.mjs
// Documentação: https://github.com/seu-usuario/nextjs-codegen

/** @type {import('nextjs-codegen').CodegenConfig[]} */
export default [
  {
    name: 'my-api',

    // URL ou caminho do seu Swagger/OpenAPI
    spec: 'https://api.example.com/api-json',

    // Diretórios de saída (relativos à raiz do projeto)
    routesOut: 'src/app/api',
    servicesOut: 'src/services',

    // Variável de ambiente com a URL do backend
    apiEnvVar: 'API_URL',
    apiFallback: 'https://api.example.com',

    // Remove o prefixo /api dos paths do OpenAPI
    stripPathPrefix: '/api',

    // Nome do cookie JWT — usado no apiClient (browser) e fetchBackend (server)
    // Remova ou deixe undefined para desativar autenticação automática
    cookieName: 'accessToken',

    // Opções do apiClient.ts (axios browser)
    apiClient: {
      outputPath: 'src/lib/apiClient.ts',
      deviceTracking: false,         // true = injeta x-device-id, x-device-os etc.
      unauthorizedRedirect: '/auth', // redirect ao receber 401
    },

    // Opções do fetchBackend.ts (HTTP server-side Next.js Route Handlers)
    fetchBackend: {
      outputPath: 'src/lib/fetchBackend.ts',
      timeout: 15000,
    },
  },
];
`;

  writeFileSync(configPath, starter, 'utf-8');
  console.log(`\n${ok(`Config criado: ${configPath}`)}`);
  console.log(`\n  Próximo passo:\n`);
  console.log(`  1. Edite o arquivo e configure o seu spec e apiEnvVar`);
  console.log(`  2. ${c.cyan}npx nextjs-codegen generate${c.reset}\n`);
}

// ─── Generate: roda os geradores ─────────────────────────────────────────────
async function runGenerate(configPath) {
  if (!existsSync(configPath)) {
    console.error(`\n${err(`Config não encontrado: ${configPath}`)}`);
    console.log(`\n  Crie um com: ${c.cyan}npx nextjs-codegen init${c.reset}\n`);
    process.exit(1);
  }

  // Importa a config
  let configs;
  try {
    const mod = await import(pathToFileURL(resolve(configPath)).href);
    configs = mod.default ?? mod;
    if (!Array.isArray(configs)) configs = [configs];
  } catch (e) {
    console.error(`\n${err(`Falha ao carregar config: ${configPath}`)}`);
    console.error(`  ${c.red}${e.message}${c.reset}\n`);
    process.exit(1);
  }

  // Importa os geradores do dist compilado
  const distEntry = new URL('../dist/index.js', import.meta.url).href;
  let generators;
  try {
    generators = await import(distEntry);
  } catch (e) {
    console.error(`\n${err('Falha ao carregar o nextjs-codegen. Execute "npm run build" primeiro.')}`);
    console.error(`  ${c.red}${e.message}${c.reset}\n`);
    process.exit(1);
  }

  const { generateRoutes, generateServices, generateApiClient, generateFetchBackend, fetchSpec } = generators;

  const cwd = process.cwd();
  let totalRoutes = 0;
  let totalServices = 0;
  let errors = 0;

  console.log(`\n${c.bold}nextjs-codegen${c.reset} ${dim('— iniciando...')}\n`);

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

    // 1. apiClient.ts
    if (apiClientOpts !== false) {
      try {
        const f = generateApiClient({ cookieName, ...(apiClientOpts ?? {}) }, cwd);
        console.log(`  ${ok(f)}`);
      } catch (e) {
        console.error(`  ${err('apiClient.ts: ' + e.message)}`);
        errors++;
      }
    }

    // 2. fetchBackend.ts
    if (fetchBackendOpts !== false) {
      try {
        const f = generateFetchBackend({ cookieName, ...(fetchBackendOpts ?? {}) }, cwd);
        console.log(`  ${ok(f)}`);
      } catch (e) {
        console.error(`  ${err('fetchBackend.ts: ' + e.message)}`);
        errors++;
      }
    }

    // 3. Spec
    if (!specPathOrUrl) {
      console.error(`  ${err('"spec" não definido — routes e services ignorados.')}`);
      errors++;
      continue;
    }

    let parsedSpec;
    try {
      console.log(`  ${tip(`spec: ${specPathOrUrl}`)}`);
      parsedSpec = await fetchSpec(specPathOrUrl);
      const pathCount = Object.keys(parsedSpec.paths ?? {}).length;
      console.log(`  ${dim(`${pathCount} path(s) encontrado(s)`)}`);
    } catch (e) {
      console.error(`  ${err('Falha ao carregar spec: ' + e.message)}`);
      errors++;
      continue;
    }

    // 4. Routes
    try {
      const routeFiles = await generateRoutes({
        spec: parsedSpec, stripPathPrefix, apiEnvVar, apiFallback, routesOut, cwd,
      });
      totalRoutes += routeFiles.length;
      console.log(`  ${ok(`${routeFiles.length} route(s)  →  ${routesOut}/`)}`);
    } catch (e) {
      console.error(`  ${err('routes: ' + e.message)}`);
      errors++;
    }

    // 5. Services
    try {
      const serviceFiles = await generateServices({
        spec: parsedSpec, stripPathPrefix, apiModule, servicesOut, apiClientPath, cwd,
      });
      totalServices += serviceFiles.length;
      console.log(`  ${ok(`${serviceFiles.length} service file(s)  →  ${servicesOut}/`)}`);
    } catch (e) {
      console.error(`  ${err('services: ' + e.message)}`);
      errors++;
    }

    console.log('');
  }

  // Sumário final
  if (errors > 0) {
    console.log(`${c.yellow}Concluído com ${errors} erro(s).${c.reset}`);
  } else {
    console.log(`${c.green}${c.bold}Concluído!${c.reset} ${dim(`${totalRoutes} routes · ${totalServices} service files`)}\n`);
  }
}

// ─── Parse de argumentos ──────────────────────────────────────────────────────
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
    console.error(`\n${err(`Comando desconhecido: "${command}"`)}`);
    printHelp();
    process.exit(1);
}
