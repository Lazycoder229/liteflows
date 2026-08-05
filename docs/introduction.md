---
title: Introduction
description: "LitePHP is a Laravel-inspired PHP 8.1+ framework with zero runtime dependencies. Build web apps and APIs with familiar conventions and a small footprint."
---

# Introduction

> LitePHP is a Laravel-inspired PHP 8.1+ framework with zero runtime dependencies. Build web apps and APIs with familiar conventions and a small footprint.

LitePHP is a Laravel-inspired PHP framework designed for developers who want familiar, expressive conventions without pulling in hundreds of third-party packages. It requires PHP 8.1 or higher, carries **zero runtime dependencies**, and ships everything you need — routing, an ActiveRecord-style ORM, session and JWT authentication, request validation, a queue system, a template engine, security defaults, and a code-generation CLI — as one cohesive, MIT-licensed package.

### Feature highlights

- **Routing** — Expressive route definitions for both web and API endpoints, with support for middleware, route groups, named routes, and parameter constraints.
- **ORM & Database** — An ActiveRecord-style ORM with a fluent query builder, relationship support, and PDO-backed connections to MySQL and SQLite.
- **Authentication** — Session-based auth for web apps and JWT or token-based auth for APIs — all configured through a single `auth.php` file and your `.env`.
- **Validation** — Declarative, rule-based request validation with automatic error collection, keeping your controllers clean and free of manual checks.
- **Queue System** — Dispatch background jobs to a queue and process them asynchronously via the `lite queue:work` CLI command — no separate broker required.
- **Template Engine** — The `.lites` template engine compiles views to plain PHP with automatic escaping. View caching is toggled with a single `VIEW_CACHE` env flag.
- **Security Defaults** — CSRF protection, configurable CORS middleware, secure session cookies, and a boot-time guard that prevents running with `APP_DEBUG=true` in production.
- **CLI Tools** — The `lite` command-line tool generates controllers, models, services, migrations, jobs, and more — so you spend time writing logic, not boilerplate.

### Who is LitePHP for?

**Developers learning modern PHP.** If you want to understand how a real framework works — dependency injection, middleware pipelines, an ORM, route caching — LitePHP's small codebase gives you a clear view. You get Laravel-like ergonomics without the learning curve of navigating a multi-thousand-file monorepo.

**Teams building focused applications.** When you're building a REST API, a headless back-end, or a modest web app and you don't need the full surface area of Laravel or Symfony, LitePHP lets you move fast, keep your `vendor/` lean, and own every layer of your stack.

### Requirements

| Requirement | Minimum version                         |
| ----------- | ---------------------------------------- |
| PHP         | 8.1                                      |
| Composer    | 2.x                                      |
| Database    | MySQL 5.7+ or SQLite 3                   |
| Web server  | Apache, Nginx, or PHP's built-in server  |

### Architecture overview

Every HTTP request to a LitePHP application travels through the same ordered pipeline, defined in `Core/Bootstrap/app.php`:

1. **Autoloader** — The PSR-4 autoloader maps the `Core\` namespace to `Core/` and the `App\` namespace to `app/`, making all framework and application classes available without manual `require` calls.
2. **Environment** — `Core\Config\Env` parses your `.env` file line-by-line, strips surrounding quotes, and populates both `$_ENV` and an internal static registry. Values are accessible anywhere via the `env()` helper.
3. **Config** — `Core\Config\Config::load()` reads every file under `Core/Config/defaults/`, then merges any matching files from your project's `config/` directory on top using `array_replace_recursive`. This means you only override the keys you care about.
4. **Cache** — The file cache driver boots and creates its storage directory if needed.
5. **Container** — An IoC container is instantiated and the core services (`Request`, `Response`, `Router`, `Database`) are registered as singletons or instances.
6. **Facade** — The `Route` facade is wired to the `Router` instance so you can call `Route::get()` anywhere in your route files.
7. **Session** — The session save path is set to `storage/framework/sessions/`, the session is started, and the `Session` alias is bound into the container.
8. **Auth** — `Auth::configure()` reads `config/auth.php` and registers your User model, field names, and JWT settings.
9. **Middleware** — The `Kernel` runs `autoDiscover()` to scan `app/Middleware/` for classes carrying a `#[RegisterMiddleware]` attribute, then wraps every request with CSRF verification and any route-matched middleware.
10. **Router** — The `Router` matches the incoming URI and HTTP method against your registered routes. In production, routes are loaded from a file cache keyed to your app name, skipping the cost of re-parsing `web.php` on every request.
11. **Controller → Response** — The matched route's handler (a closure or controller method) is invoked and returns a `Response` object, which the `Kernel` sends back to the browser.

> **Tip:** LitePHP enforces a production safety guard during bootstrap: if both `APP_ENV=production` and `APP_DEBUG=true` are set in your `.env`, the application throws a `RuntimeException` immediately and refuses to serve requests. This prevents accidentally exposing detailed stack traces to end users. Always set `APP_DEBUG=false` before deploying.
