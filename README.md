# nextjs-openapi-codegen

A lightning-fast, zero-dependency CLI that generates complete **Next.js App Router API Route Handlers** and fully typed **Frontend Services** directly from any OpenAPI / Swagger specification.

Stop writing boilerplate. Connect your APIs in seconds.

[![npm version](https://img.shields.io/npm/v/nextjs-openapi-codegen)](https://www.npmjs.com/package/nextjs-openapi-codegen)
[![license](https://img.shields.io/npm/l/nextjs-openapi-codegen)](./LICENSE)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](./package.json)

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Commands](#commands)
  - [run](#run)
  - [generate](#generate)
  - [diff](#diff)
  - [init](#init)
- [Configuration Reference](#configuration-reference)
  - [name](#name)
  - [spec](#spec)
  - [routesOut](#routesout)
  - [servicesOut](#servicesout)
  - [apiEnvVar](#apienvvar)
  - [apiFallback](#apifallback)
  - [stripPathPrefix](#strippathprefix)
  - [cookieName](#cookiename)
  - [apiClientPath](#apiclientpath)
  - [apiClient](#apiclient)
  - [fetchBackend](#fetchbackend)
  - [Multiple APIs](#multiple-apis)
- [What Gets Generated](#what-gets-generated)
  - [Route Handlers](#route-handlers)
  - [Typed Services](#typed-services)
  - [apiClient.ts](#apiclientts)
  - [fetchBackend.ts](#fetchbackendts)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Zero dependencies** — powered by raw Node.js builtins, no bloated toolchains
- **Next.js 13+ App Router native** — generates modern `route.ts` handlers with async `context.params` (Next.js 15+ ready)
- **End-to-end TypeScript** — types derived directly from your OpenAPI schemas, including `allOf`, `oneOf`, `anyOf`, and nullable support
- **Authentication built-in** — automatic JWT cookie propagation between browser, route handler, and backend API
- **Interactive setup** — `nextjs-codegen run` guides you through the full configuration in under a minute
- **Diff before you generate** — `nextjs-codegen diff` shows exactly what changed in your spec before writing any files
- **Config validation** — clear, actionable errors pointing to the exact field before any file is touched
- **Multiple APIs** — configure several OpenAPI specs in a single config file, each generating independently

---

## Installation

Install as a dev dependency in your Next.js project:

```bash
# npm
npm install --save-dev nextjs-openapi-codegen

# pnpm
pnpm add -D nextjs-openapi-codegen

# yarn
yarn add -D nextjs-openapi-codegen

# bun
bun add -d nextjs-openapi-codegen
```

Or run directly without installing:

```bash
npx nextjs-openapi-codegen run
```

---

## Quick Start

**New project — use the interactive wizard:**

```bash
npx nextjs-codegen run
```

It asks 6 questions, writes your config, and optionally generates everything right away.

**Already have a config:**

```bash
npx nextjs-codegen generate
```

**Check what changed in your spec before re-generating:**

```bash
npx nextjs-codegen diff
```

---

## Commands

### `run`

```bash
npx nextjs-codegen run
npx nextjs-codegen run --config ./configs/my-api.mjs
```

**Recommended for first-time setup.** Launches an interactive wizard that guides you through every configuration option step by step. No need to read docs first — everything is explained inline with examples.

**What it does:**

1. Asks for an API name (label for CLI output)
2. Asks for your OpenAPI spec URL or local file path *(required)*
3. Asks for the path prefix to strip from spec routes
4. Asks for the backend URL env variable name and fallback URL
5. Asks for the JWT cookie name (or skips auth if left blank)
6. Asks whether to run `generate` immediately after saving

If a config file already exists, it asks whether to overwrite it before proceeding.

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--config <path>` | Where to write the config file | `nextjs-codegen.config.mjs` |

---

### `generate`

```bash
npx nextjs-codegen generate
npx nextjs-codegen generate --config ./configs/my-api.mjs
```

Reads your config and generates all output files. For each config entry, in order:

1. Validates the config — stops with clear errors if anything is wrong, before touching any file
2. Generates `apiClient.ts` (unless `apiClient: false`)
3. Generates `fetchBackend.ts` (unless `fetchBackend: false`)
4. Fetches the OpenAPI spec (URL or local file)
5. Generates one `route.ts` per API path
6. Generates one service directory per OpenAPI tag

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--config <path>` | Path to config file | `nextjs-codegen.config.mjs` |

**In `package.json` scripts:**

```json
{
  "scripts": {
    "codegen": "nextjs-codegen generate"
  }
}
```

---

### `diff`

```bash
npx nextjs-codegen diff
npx nextjs-codegen diff --config ./configs/my-api.mjs
```

Fetches the latest spec and compares what *would* be generated against what already exists on disk — **without writing any files**.

Use this after your backend team deploys API changes to understand what needs to be re-generated:

```
nextjs-codegen diff — spec vs disk

[my-api]
  → fetching spec: https://api.example.com/api-json
  + 2 new route(s) not yet generated:
    + src/app/api/payments/[id]/route.ts
    + src/app/api/webhooks/route.ts
  - 1 route file(s) no longer in spec:
    - src/app/api/legacy/users/route.ts
    5 route(s) unchanged
  ✓ Services up to date — 4 service(s)

Run npx nextjs-codegen generate to apply changes.
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--config <path>` | Path to config file | `nextjs-codegen.config.mjs` |

---

### `init`

```bash
npx nextjs-codegen init
npx nextjs-codegen init --config ./configs/my-api.mjs
```

Writes a blank starter `nextjs-codegen.config.mjs` with all fields documented inline as comments. Does nothing if the file already exists.

> For first-time setup, prefer `run` — it fills in the values for you based on your answers.

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--config <path>` | Output path for the config file | `nextjs-codegen.config.mjs` |

---

## Configuration Reference

Your config file (`nextjs-codegen.config.mjs`) exports an array of config objects:

```js
/** @type {import('nextjs-openapi-codegen').CodegenConfig[]} */
export default [
  {
    name:            'my-api',
    spec:            'https://api.example.com/api-json',
    routesOut:       'src/app/api',
    servicesOut:     'src/services',
    apiEnvVar:       'API_URL',
    apiFallback:     'https://api.example.com',
    stripPathPrefix: '/api',
    cookieName:      'accessToken',
    apiClient: {
      outputPath:           'src/lib/apiClient.ts',
      deviceTracking:       false,
      unauthorizedRedirect: '/auth',
    },
    fetchBackend: {
      outputPath: 'src/lib/fetchBackend.ts',
      timeout:    15000,
    },
  },
];
```

---

### `name`

| | |
|---|---|
| Type | `string` |
| Required | No |
| Default | `"default"` |

A short label shown in CLI output to identify this entry. Useful when managing multiple APIs.

```js
name: 'payments'
```

---

### `spec`

| | |
|---|---|
| Type | `string` |
| Required | **Yes** |

URL or local file path to your OpenAPI / Swagger **JSON** spec.

```js
spec: 'https://api.example.com/api-json'  // remote URL
spec: './openapi.json'                     // local file (relative to cwd)
```

> YAML specs are not currently supported. Export your spec as JSON before use.

---

### `routesOut`

| | |
|---|---|
| Type | `string` |
| Required | No |
| Default | `"src/app/api"` |

Directory where generated `route.ts` files are written. Created automatically if it does not exist.

```js
routesOut: 'src/app/api'
```

---

### `servicesOut`

| | |
|---|---|
| Type | `string` |
| Required | No |
| Default | `"src/services"` |

Directory where typed service modules are written. Each OpenAPI tag becomes a subdirectory. Created automatically if it does not exist.

```js
servicesOut: 'src/services'
```

---

### `apiEnvVar`

| | |
|---|---|
| Type | `string` |
| Required | No |
| Default | `"API_URL"` |

Name of the `process.env` variable that holds the backend base URL. Generated route handlers read this at runtime.

```js
apiEnvVar: 'CORE_API_URL'
```

The generated handler will contain:
```ts
const API_URL = process.env.CORE_API_URL || '<apiFallback>';
```

---

### `apiFallback`

| | |
|---|---|
| Type | `string` |
| Required | No |
| Default | `""` |

Hardcoded URL used when `apiEnvVar` is not set in the environment. Useful for local development.

```js
apiFallback: 'https://api.example.com'
```

---

### `stripPathPrefix`

| | |
|---|---|
| Type | `string` |
| Required | No |
| Default | `"/api"` |

Removes this prefix from all OpenAPI paths before creating route files. Prevents double-nesting like `src/app/api/api/users/route.ts`.

```js
stripPathPrefix: '/api'
// /api/users/{id} → /users/{id} → src/app/api/users/[id]/route.ts
```

Set to `""` (empty string) to disable stripping entirely.

---

### `cookieName`

| | |
|---|---|
| Type | `string` |
| Required | No |
| Default | `undefined` |

Name of the HTTP-only cookie that stores the JWT token.

- In `apiClient.ts` — reads this cookie in the browser and attaches it as `Authorization: Bearer <token>` on every request
- In `fetchBackend.ts` — reads this cookie server-side via `next/headers` and propagates it to backend requests

```js
cookieName: 'accessToken'
```

Omit or set to `undefined` to disable automatic auth propagation entirely.

---

### `apiClientPath`

| | |
|---|---|
| Type | `string` |
| Required | No |
| Default | `"@/lib/apiClient"` |

Import path that generated service files use to import the `apiClient` instance.

```js
apiClientPath: '@/lib/apiClient'
// → import { apiClient } from '@/lib/apiClient';
```

---

### `apiClient`

| | |
|---|---|
| Type | `false \| object` |
| Required | No |
| Default | `{}` (generates with defaults) |

Controls generation of `apiClient.ts`. Set to `false` to skip this file entirely.

```js
apiClient: {
  // Output path for the generated file
  outputPath: 'src/lib/apiClient.ts',

  // Overrides the global cookieName for this file only
  cookieName: 'accessToken',

  // When true, injects x-device-id, x-device-os, x-device-browser headers
  // on every request for device fingerprinting / security tracking
  deviceTracking: false,

  // Path to redirect to when the backend returns 401
  unauthorizedRedirect: '/auth',
}

// Skip generation:
apiClient: false
```

---

### `fetchBackend`

| | |
|---|---|
| Type | `false \| object` |
| Required | No |
| Default | `{}` (generates with defaults) |

Controls generation of `fetchBackend.ts`. Set to `false` to skip this file entirely.

```js
fetchBackend: {
  // Output path for the generated file
  outputPath: 'src/lib/fetchBackend.ts',

  // Overrides the global cookieName for this file only
  cookieName: 'accessToken',

  // Maximum time in milliseconds before a backend request times out
  timeout: 15000,
}

// Skip generation:
fetchBackend: false
```

---

### Multiple APIs

Pass multiple objects in the array to manage several APIs in one project. Each entry runs independently:

```js
/** @type {import('nextjs-openapi-codegen').CodegenConfig[]} */
export default [
  {
    name:        'core',
    spec:        'https://api.example.com/api-json',
    routesOut:   'src/app/api',
    servicesOut: 'src/services/core',
    apiEnvVar:   'CORE_API_URL',
  },
  {
    name:        'payments',
    spec:        'https://payments.example.com/api-json',
    routesOut:   'src/app/api/payments',
    servicesOut: 'src/services/payments',
    apiEnvVar:   'PAYMENTS_API_URL',
    apiClient:   false,   // already handled by the core entry
    fetchBackend: false,
  },
];
```

---

## What Gets Generated

### Route Handlers

One `route.ts` file per OpenAPI path, written to `routesOut`. Each file acts as a typed HTTP proxy to your backend — handling path params, query strings, JSON bodies, and `multipart/form-data`.

```
src/app/api/
  users/
    route.ts            ← GET /users, POST /users
    [id]/
      route.ts          ← GET /users/{id}, PUT /users/{id}, DELETE /users/{id}
  products/
    route.ts
    [id]/
      route.ts
```

Each handler:
- Reads `Authorization` header from the incoming request and forwards it downstream
- Parses query strings automatically
- Handles `application/json` and `multipart/form-data` request bodies
- Returns structured `{ success: false, message }` on backend errors
- Catches all exceptions and returns `500` with a safe error message

---

### Typed Services

One directory per OpenAPI tag, written to `servicesOut`. Each exports async functions bound to the generated TypeScript types.

```
src/services/
  users/
    index.ts        ← getUsers(), createUser(), getUserById(), updateUser(), deleteUser()
    types.ts        ← User, CreateUserDto, UpdateUserDto, GetUsersResponse, ...
  products/
    index.ts
    types.ts
```

Types are derived from your OpenAPI schemas and support:
- Primitive types: `string`, `number`, `boolean`, `null`
- Objects and nested objects
- Arrays
- Enums (as TypeScript union literals)
- Composition: `allOf`, `oneOf`, `anyOf`
- Nullable fields (`nullable: true` in OAS 3.0, `type: ['string', 'null']` in OAS 3.1)
- `$ref` resolution with circular reference protection

---

### `apiClient.ts`

Generated at `apiClient.outputPath` (default: `src/lib/apiClient.ts`).

A pre-configured Axios instance for use in **browser/client components**:

- Reads the JWT from cookies on every request and attaches it as `Authorization: Bearer <token>`
- Intercepts `401` responses and redirects to `unauthorizedRedirect` (default: `/auth`)
- Optionally injects device fingerprint headers (`x-device-id`, `x-device-os`, `x-device-browser`) when `deviceTracking: true`

---

### `fetchBackend.ts`

Generated at `fetchBackend.outputPath` (default: `src/lib/fetchBackend.ts`).

A server-side HTTP helper for use **inside route handlers** (server-only):

- Reads the JWT from `next/headers` cookies (works in Server Components and Route Handlers)
- Propagates the token to outgoing backend requests as `Authorization: Bearer <token>`
- Configurable timeout (default: 15 seconds)
- Matches the native `fetch` interface

---

## Contributing

Bug reports, feature requests, and pull requests are welcome.

- Issues: [github.com/Last-Code-MgL/nextjs-openapi-codegen/issues](https://github.com/Last-Code-MgL/nextjs-openapi-codegen/issues)
- Repository: [github.com/Last-Code-MgL/nextjs-openapi-codegen](https://github.com/Last-Code-MgL/nextjs-openapi-codegen)

---

## License

MIT
