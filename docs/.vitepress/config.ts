import { defineConfig } from 'vitepress'

const sidebar = [
  {
    text: "Getting Started",
    collapsed: false,
    items: [
      { text: "Introduction", link: "/introduction" },
      { text: "Quickstart", link: "/quickstart" },
      { text: "Directory Structure", link: "/directory-structure" },
      { text: "Configuration", link: "/configuration" },
    ]
  },
  {
    text: "Core Concepts",
    collapsed: false,
    items: [
      { text: "Routing", link: "/core/routing" },
      { text: "Controllers", link: "/core/controllers" },
      { text: "Request", link: "/core/request" },
      { text: "Response", link: "/core/response" },
      { text: "Middleware", link: "/core/middleware" },
      { text: "Service Container", link: "/core/service-container" },
    ]
  },
  {
    text: "Database",
    collapsed: false,
    items: [
      { text: "Models", link: "/database/models" },
      { text: "Query Builder", link: "/database/query-builder" },
      { text: "Migrations", link: "/database/migrations" },
      { text: "Seeders & Factories", link: "/database/seeders-factories" },
      { text: "Relationships", link: "/database/relationships" },
    ]
  },
  {
    text: "Authentication & Authorization",
    collapsed: false,
    items: [
      { text: "Session Auth", link: "/auth/session-auth" },
      { text: "JWT Auth", link: "/auth/jwt" },
      { text: "Token Guard", link: "/auth/token-guard" },
      { text: "Authorization", link: "/auth/authorization" },
    ]
  },
  {
    text: "Views & Templates",
    collapsed: false,
    items: [
      { text: "Templates", link: "/views/templates" },
      { text: "Components", link: "/views/components" },
      { text: "Vite Assets", link: "/views/vite" },
    ]
  },
  {
    text: "Advanced Features",
    collapsed: false,
    items: [
      { text: "Validation", link: "/advanced/validation" },
      { text: "Cache", link: "/advanced/cache" },
      { text: "Queue", link: "/advanced/queue" },
      { text: "Mail", link: "/advanced/mail" },
      { text: "Events", link: "/advanced/events" },
      { text: "Session", link: "/advanced/session" },
      { text: "HTTP Client", link: "/advanced/http-client" },
    ]
  },
  {
    text: "Security",
    collapsed: false,
    items: [
      { text: "CSRF", link: "/security/csrf" },
      { text: "Security Headers", link: "/security/headers" },
      { text: "Rate Limiting", link: "/security/rate-limiting" },
    ]
  },
  {
    text: "Support & Utilities",
    collapsed: false,
    items: [
      { text: "Helpers", link: "/support/helpers" },
      { text: "Collections", link: "/support/collections" },
      { text: "Str & Arr", link: "/support/str-arr" },
    ]
  },
  {
    text: "CLI Reference",
    collapsed: false,
    items: [
      { text: "Overview", link: "/cli/overview" },
      { text: "Make Commands", link: "/cli/make-commands" },
      { text: "Database Commands", link: "/cli/database-commands" },
      { text: "App & Queue Commands", link: "/cli/app-commands" },
    ]
  },
]

export default defineConfig({
  title: 'LitePHP',
  description: 'A Laravel-inspired PHP 8.1+ framework with zero runtime dependencies.',
  cleanUrls: true,
  head: [
    ['meta', { name: 'theme-color', content: '#8b5cf6' }]
  ],
  themeConfig: {
    logo: undefined,
    nav: [
      { text: 'Guide', link: '/introduction' },
      { text: 'CLI', link: '/cli/overview' },
      { text: 'GitHub', link: 'https://github.com' }
    ],
    sidebar,
    search: {
      provider: 'local'
    },
    outline: {
      level: [2, 3],
      label: 'On this page'
    },
    editLink: {
      pattern: 'https://github.com/your-org/litephp-docs/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © LitePHP'
    }
  }
})
