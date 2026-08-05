---
layout: home

hero:
  name: "LitePHP"
  text: "A Lightweight PHP Framework"
  tagline: Laravel-inspired conventions, zero runtime dependencies, PHP 8.1+.
  actions:
    - theme: brand
      text: Get Started
      link: /introduction
    - theme: alt
      text: Quickstart
      link: /quickstart
    - theme: alt
      text: CLI Reference
      link: /cli/overview
---

<div class="features-grid">
  <div class="feature-card">
    <div class="feature-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
    </div>
    <h3>Routing</h3>
    <p>Expressive route definitions for web and API endpoints, with middleware, groups, named routes, and route caching.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
    </div>
    <h3>ORM & Database</h3>
    <p>An ActiveRecord-style ORM with a fluent query builder, relationships, and PDO-backed MySQL/SQLite connections.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    </div>
    <h3>Authentication</h3>
    <p>Session-based auth for web apps, JWT or token-based auth for APIs — all configured through one auth.php file.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
    </div>
    <h3>Validation</h3>
    <p>Declarative, rule-based request validation with automatic error collection and FormRequest classes.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
    </div>
    <h3>Queue System</h3>
    <p>Dispatch background jobs and process them asynchronously via the lite queue:work CLI command — no broker required.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
    </div>
    <h3>Template Engine</h3>
    <p>The .lites template engine compiles views to plain PHP with automatic escaping and optional view caching.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    </div>
    <h3>Security Defaults</h3>
    <p>CSRF protection, configurable CORS, secure session cookies, and OWASP security headers out of the box.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 17 6-6-6-6"/><path d="M12 19h8"/></svg>
    </div>
    <h3>CLI Tools</h3>
    <p>The lite command-line tool generates controllers, models, services, migrations, jobs, and more.</p>
  </div>
</div>

<style>
/* Center hero — override all VitePress breakpoints */
.VPHero { text-align: center !important; }

.VPHero .container,
.VPHero .main {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  text-align: center !important;
  max-width: 960px !important;
  margin: 0 auto !important;
}

.VPHero .name,
.VPHero .name .clip,
.VPHero .text,
.VPHero .tagline,
.VPHero h1,
.VPHero p {
  text-align: center !important;
  width: 100% !important;
  max-width: 100% !important;
}

.VPHero .actions {
  display: flex !important;
  justify-content: center !important;
  flex-wrap: wrap !important;
  width: 100% !important;
}

@media (min-width: 640px) {
  .VPHero .name,
  .VPHero .name .clip,
  .VPHero .text,
  .VPHero .tagline {
    text-align: center !important;
  }
  .VPHero .main {
    align-items: center !important;
  }
}

@media (min-width: 960px) {
  .VPHero .container {
    flex-direction: column !important;
    align-items: center !important;
  }
  .VPHero .main {
    max-width: 100% !important;
    align-items: center !important;
    text-align: center !important;
  }
  .VPHero .name,
  .VPHero .name .clip,
  .VPHero .text,
  .VPHero .tagline {
    text-align: center !important;
  }
  .VPHero .actions {
    justify-content: center !important;
  }
}

/* Custom features grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  max-width: 1152px;
  margin: 0 auto;
  padding: 40px 24px 80px;
}

@media (max-width: 1024px) {
  .features-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .features-grid { grid-template-columns: 1fr; }
}

.feature-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 24px;
  transition: border-color 0.25s;
}
.feature-card:hover {
  border-color: var(--vp-c-brand-1);
}

.feature-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  margin-bottom: 16px;
}
.feature-icon svg {
  width: 24px;
  height: 24px;
}

.feature-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 8px;
  border: none;
  padding: 0;
}
.feature-card p {
  font-size: 14px;
  color: var(--vp-c-text-2);
  line-height: 1.6;
  margin: 0;
}
</style>