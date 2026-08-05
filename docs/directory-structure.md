---
title: Directory Structure
description: "A complete walkthrough of every directory and file in a LitePHP project — what lives where, what you own, and what the framework manages for you."
---

# Directory Structure

> A complete walkthrough of every directory and file in a LitePHP project — what lives where, what you own, and what the framework manages for you.

## Full Directory Tree

```
my-app/
├── app/
│   ├── Controllers/       # HTTP controllers
│   ├── Models/            # ActiveRecord-style ORM models
│   ├── Services/          # Business logic service classes
│   ├── Middleware/        # Custom middleware
│   ├── Routes/            # Web routes
│   └── views/             # .lites template files
├── database/
│   ├── migrations/        # Schema migration files
│   ├── seeders/           # Database seeders
│   └── factories/         # Model factories
├── public/
│   └── index.php          # Front controller / entry point
├── storage/
│   ├── cache/             # Compiled views, route cache, file cache
│   ├── logs/              # Application logs
│   ├── framework/
│   │   └── sessions/      # PHP session files
│   └── uploads/           # User file uploads
├── node_modules/          # Frontend dependencies (don't modify)
├── vendor/                # LitePHP framework package (don't modify)
├── .env                   # Environment variables
├── .env.example           # Environment template
├── autoload.php           # PSR-4 class autoloader
├── composer.json
└── lite                   # CLI entry point
```

## Top-Level Directories

### `app/`

Where you write all of your application code. The PSR-4 autoloader maps the `App\` namespace root to this directory.

| Subdirectory | Purpose |
|---|---|
| `Controllers/` | Handles HTTP actions. Should be thin — parse request, delegate to a Service, return a Response. |
| `Models/` | ORM model classes. Each model maps to a database table. The default `User` model is referenced by `config/auth.php`. |
| `Services/` | Business logic classes. |
| `Middleware/` | Custom middleware classes. The Kernel auto-discovers any class carrying a `#[RegisterMiddleware]` attribute. |
| `Routes/` | Web and API route definitions. `web.php` passes through CSRF middleware automatically; `api.php` uses token or JWT auth. |
| `views/` | All `.lites` template files. `response()->view('posts.index')` renders `app/views/posts/index.lites`. |

### `database/`

| Subdirectory | Command | Purpose |
|---|---|---|
| `migrations/` | `php lite migrate` | Schema migration files |
| `seeders/` | `php lite db:seed` | Database seeders |
| `factories/` | — | Fake data generators for tests |

### `public/`

The only directory exposed to the web. `index.php` is the single entry point: defines `APP_BASE_PATH`, requires `autoload.php`, then hands off to `Core/Bootstrap/app.php`.

> **Apache:** Copy `.htaccess` from the framework's `storage/` example to `public/` to enable clean URLs.
>
> **Nginx:** Add `try_files $uri $uri/ /index.php?$query_string` to your server block.

### `storage/`

Written to by the framework at runtime. Must be writable by your web server process.

| Subdirectory | Purpose |
|---|---|
| `cache/` | Compiled views (`cache/views/`), route cache (`cache/data/`), file-driver cache entries |
| `logs/` | Application logs. A new dated file (`app-YYYY-MM-DD.log`) is created each day |
| `framework/sessions/` | PHP session files, pointed to by `session_save_path()` during bootstrap |
| `uploads/` | Files uploaded by users via the built-in upload helpers |

### `node_modules/`

Frontend dependencies managed by npm. **Do not modify directly.**

### `vendor/`

The LitePHP framework package managed by Composer. **Do not modify directly.**

## Key Files

### `autoload.php`

Custom PSR-4 autoloader registering two namespace prefixes:

```php
$prefixMap = [
    'Core\\' => $frameworkRoot . '/Core/',
    'App\\'  => $appRoot       . '/app/',
];
```

### `lite`

The CLI entry point. Run with `php lite <command>` — a plain PHP script, no global install needed.