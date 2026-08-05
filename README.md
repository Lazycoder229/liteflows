# LitePHP Docs (VitePress)

This is the LitePHP documentation site, converted to [VitePress](https://vitepress.dev).

## Structure

```
litephp-vitepress/
├── package.json
└── docs/
    ├── .vitepress/
    │   └── config.mjs       # site config, nav, sidebar, search
    ├── index.md              # homepage (hero + features)
    ├── introduction.md
    ├── quickstart.md
    ├── directory-structure.md
    ├── configuration.md
    ├── core/                 # Core Concepts
    ├── database/              # Database
    ├── auth/                  # Authentication & Authorization
    ├── views/                 # Views & Templates
    ├── advanced/               # Advanced Features
    ├── security/                # Security
    ├── support/                  # Support & Utilities
    └── cli/                       # CLI Reference
```

39 pages total, matching the original site's navigation one-for-one.

## Local development

```bash
npm install
npm run docs:dev
```

Visit `http://localhost:5173`.

## Build for production

```bash
npm run docs:build
npm run docs:preview
```

Static output is written to `docs/.vitepress/dist/` — deployable to any static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages, etc.).

## Notes

- Local full-text search is enabled out of the box (`themeConfig.search.provider: 'local'`) — no external Algolia account needed.
- `editLink` and the GitHub social link in `.vitepress/config.mjs` point to placeholder URLs (`your-org/litephp-docs`, `https://github.com`) — update them to your actual repository before deploying.
- Every page carries `title`/`description` frontmatter (used for `<title>` and meta tags / SEO and social previews).
