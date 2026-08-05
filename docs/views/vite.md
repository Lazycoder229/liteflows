---
title: Vite Assets
description: "Set up Vite for CSS and JavaScript bundling in LitePHP, use the vite() helper in templates, and configure HMR for fast local development."
---

# Vite Assets

> Set up Vite for CSS and JavaScript bundling in LitePHP, use the vite() helper in templates, and configure HMR for fast local development.

The `vite()` helper resolves entry points to the correct URL in both dev (Vite dev server + HMR) and production (hashed filenames from the build manifest).

### The `vite()` Helper

```php
$tags = vite('resources/js/app.js');
```

```html
<head>
    <meta charset="UTF-8">
    @php echo vite('resources/css/app.css') @endphp
</head>
<body>
    @php echo vite('resources/js/app.js') @endphp
</body>
```

Multiple entries:

```html
@php echo vite(['resources/js/app.js', 'resources/css/app.css']) @endphp
```

> **Note:** `vite()` emits `<link rel="stylesheet">` for CSS entries and `<script type="module">` for JS. CSS imported inside a JS bundle also gets separate `<link>` tags automatically.

### Project Setup

```bash
npm init -y
npm install --save-dev vite
```

```js
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        outDir:   'public/build',
        manifest: true,
        rollupOptions: {
            input: ['resources/js/app.js', 'resources/css/app.css'],
        },
    },
    server: { port: 5173 },
});
```

```json
{
    "scripts": { "dev": "vite", "build": "vite build" }
}
```

```ini
# Development
VITE_DEV=true
VITE_URL=http://localhost:5173

# Production
VITE_DEV=false
APP_URL=https://yourapp.com
```

### Development Mode

```bash
npm run dev
```

`VITE_DEV=true` skips the manifest and injects the HMR client script:

```html
<script type="module" src="http://localhost:5173/@vite/client"></script>
<script type="module" src="http://localhost:5173/resources/js/app.js"></script>
```

### Production Build

```bash
npm run build
```

Outputs versioned files to `public/build/` and `public/build/.vite/manifest.json` (or `manifest.json` for older Vite). `VITE_DEV=false` reads this manifest and emits hashed filenames:

```html
<link rel="stylesheet" href="https://yourapp.com/build/assets/app-3a8f2c1d.css">
<script type="module" src="https://yourapp.com/build/assets/app-7b4e9f2a.js"></script>
```

> **Warning:** If `VITE_DEV=false` and the manifest is missing, `vite()` throws a `RuntimeException` — always `npm run build` before deploying (or as a CI step).

### Behaviour Summary

**Development:**

| Condition | `vite()` behaviour |
|---|---|
| `VITE_DEV=true` | Emits HMR client script + dev server URL per entry point |
| Dev server not running | Requests to `localhost:5173` fail — start with `npm run dev` |

**Production:**

| Condition | `vite()` behaviour |
|---|---|
| `VITE_DEV=false`, manifest present | Emits hashed `<link>`/`<script>` tags from manifest |
| `VITE_DEV=false`, manifest missing | Throws `RuntimeException` |
| CSS imported inside JS chunk | Separate `<link>` tag per CSS file in the chunk |

> **Tip:** Keep `VITE_DEV=true` locally and `false` (or unset) in production — templates never change; `vite()` handles both transparently.
