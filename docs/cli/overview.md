---
title: Overview
description: "A complete reference for the LitePHP lite CLI tool — run make generators, database migrations, cache management, and queue workers from your terminal."
---

# Overview

> A complete reference for the LitePHP lite CLI tool — run make generators, database migrations, cache management, and queue workers from your terminal.

The `lite` file in your project root is the CLI entry point. Run every framework task via `php lite <command>`.

### Usage

```bash
php lite <command> [arguments] [--options]
```

### List All Commands

```bash
php lite
# or
php lite --help
```

### All Available Commands

| Command | Description |
|---|---|
| `make:controller` | Generate a new controller class |
| `make:model` | Generate a new model class |
| `make:migration` | Generate a new database migration |
| `make:middleware` | Generate a new middleware class |
| `make:service` | Generate a new service class |
| `make:job` | Generate a new queue job class |
| `make:mail` | Generate a new Mailable class |
| `make:resource` | Scaffold Model + Service + Controller together |
| `make:seeder` | Generate a new database seeder class |
| `make:view` | Generate a new view template |
| `migrate` | Run all pending database migrations |
| `migrate:rollback` | Roll back the most recent migration |
| `db:seed` | Run a database seeder class |
| `route:cache` | Cache all routes for production |
| `route:clear` | Clear the route cache |
| `cache:clear` | Clear data, view, and route caches |
| `env:init` | Copy `.env.example` to `.env` |
| `key:generate` | Generate and set `APP_KEY` in `.env` |
| `jwt:secret` | Generate and set `APP_JWT_SECRET` in `.env` |
| `queue:work` | Start the queue worker process |
| `queue:migrate` | Create the `jobs` and `failed_jobs` tables |
| `queue:failed` | List all failed queue jobs |

### Creating Custom Commands

Extend `Core\Console\Command`, implement `signature()`, `description()`, `handle()`:

```php
namespace App\Console;
use Core\Console\Command;

class GenerateSitemapCommand extends Command
{
    public function signature(): string { return 'sitemap:generate'; }
    public function description(): string { return 'Generate the XML sitemap'; }

    public function handle(array $args = []): void
    {
        $this->info('Generating sitemap...');
        $posts = Post::query()->where('status', 'published')->get();
        // ... build and write sitemap XML ...
        $this->success('Sitemap generated at public/sitemap.xml');
    }
}
```

`signature()`'s return value is the exact string typed after `php lite` — `'sitemap:generate'` means `php lite sitemap:generate`.

### Output Methods

```php
$this->info('Informational message');    // green  [INFO]
$this->success('Operation completed!');  // green  [OK]
$this->error('Something failed!');       // red    [ERROR]
$this->warn('Careful here...');          // yellow [WARN]
$this->line('Plain output');             // no badge
```

### Registering Custom Commands

```php
// Core/Console/Kernel.php
use App\Console\GenerateSitemapCommand;

public function __construct()
{
    $this->register([
        // ... existing commands ...
        new GenerateSitemapCommand(),
    ]);
}
```

> **Warning:** Don't modify the `lite` file itself — it's `DO NOT MODIFY`. Register commands in `Core/Console/Kernel.php`.

### File Creation Helper

```php
$stubContent = "<?php\n\nnamespace App\\Reports;\n\nclass {$name}Report\n{\n}\n";
$this->createFile("app/Reports/{$name}Report.php", $stubContent);
// [INFO] Created: app/Reports/SalesReport.php
// or: [WARN] Already exists: app/Reports/SalesReport.php
```

### Sub-path Support

```php
$parsed = $this->parseName('Admin/UserController');
// $parsed['class']    => 'UserController'
// $parsed['subpath']  => 'Admin'
// $parsed['fullpath'] => 'Admin/UserController'
```

Same helper used by `make:controller`, `make:model`, and every built-in generator.
