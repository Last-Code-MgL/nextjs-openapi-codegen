/**
 * nextjs-codegen — API pública
 *
 * Exporta os geradores para uso programático direto,
 * sem nenhuma dependência do Kubb ou outro framework.
 */

// ─── Geradores ───────────────────────────────────────────────────────────────
export { generateRoutes } from './generateRoutes.js';
export { generateServices } from './generateServices.js';
export { generateApiClient } from './generateApiClient.js';
export { generateFetchBackend } from './generateFetchBackend.js';

// ─── Utilitários ─────────────────────────────────────────────────────────────
export {
  fetchSpec,
  extractOperations,
  toNextPath,
  slugifyTag,
  resolveRef,
  refName,
  getSuccessResponseSchema,
} from './utils.js';

// ─── Tipos públicos ───────────────────────────────────────────────────────────
export type { GenerateApiClientOptions } from './generateApiClient.js';
export type { GenerateFetchBackendOptions } from './generateFetchBackend.js';

/** Configuração de uma entrada no nextjs-codegen.config.mjs */
export interface CodegenConfig {
  /** Identificador desta entrada (ex: 'core', 'payments') */
  name?: string;

  /**
   * URL ou caminho local para o spec OpenAPI/Swagger.
   * @example 'https://api.example.com/api-json'
   * @example './openapi.json'
   */
  spec: string;

  /**
   * Diretório de saída para os Route Handlers do Next.js.
   * @default 'src/app/api'
   */
  routesOut?: string;

  /**
   * Diretório de saída para os services frontend tipados.
   * @default 'src/services'
   */
  servicesOut?: string;

  /**
   * Caminho de import do apiClient nos services gerados.
   * @default '@/lib/apiClient'
   */
  apiClientPath?: string;

  /**
   * Nome da variável de ambiente que contém a URL do backend.
   * @example 'CORE_API_URL'
   * @default 'API_URL'
   */
  apiEnvVar?: string;

  /**
   * URL de fallback se a variável de ambiente não estiver definida.
   * @example 'https://api.example.com'
   */
  apiFallback?: string;

  /**
   * Prefixo do path do OpenAPI a ser removido antes de criar os routes.
   * Evita gerar src/app/api/api/users.
   * @default '/api'
   */
  stripPathPrefix?: string;

  /**
   * Nome do cookie que contém o JWT.
   * - apiClient.ts: lê via js-cookie e envia como Bearer
   * - fetchBackend.ts: lê via next/headers e propaga server-side
   * Se não definido, nenhuma auth automática é adicionada.
   * @example 'accessToken'
   */
  cookieName?: string;

  /**
   * Opções para geração do apiClient.ts (cliente axios browser).
   * Passe `false` para não gerar este arquivo.
   */
  apiClient?: false | {
    /** Caminho de saída @default 'src/lib/apiClient.ts' */
    outputPath?: string;
    /** Sobrescreve o cookieName global só para este arquivo */
    cookieName?: string;
    /** Injeta headers de device tracking (deviceId, OS, browser) @default false */
    deviceTracking?: boolean;
    /** Redirect ao receber 401 @default '/auth' */
    unauthorizedRedirect?: string;
  };

  /**
   * Opções para geração do fetchBackend.ts (cliente HTTP server-side).
   * Passe `false` para não gerar este arquivo.
   */
  fetchBackend?: false | {
    /** Caminho de saída @default 'src/lib/fetchBackend.ts' */
    outputPath?: string;
    /** Sobrescreve o cookieName global só para este arquivo */
    cookieName?: string;
    /** Timeout em ms @default 15000 */
    timeout?: number;
  };
}
