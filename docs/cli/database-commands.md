---
title: Database Commands
description: "Run and roll back database migrations, seed test data, and create queue tables using LitePHP's migrate, migrate:rollback, db:seed, and queue:migrate commands."
---

# Database Commands

> Run and roll back database migrations, seed test data, and create queue tables using LitePHP's migrate, migrate:rollback, db:seed, and queue:migrate commands.

Every command is safe to re-run — LitePHP tracks which migrations already executed.

### migrate

```bash
php lite migrate
```

```
[INFO] Database [litephp] already exists.
[OK]   Migrated: 2024_01_01_000000_create_users_table
[OK]   Migrated: 2024_01_02_000000_create_posts_table
```

Under the hood:
- **Auto-creates the database** if missing, using `config/database.php` (from `.env`).
- **Creates a `migrations` tracking table** on first run (`id`, `migration`, `ran_at`).
- **Skips already-applied migrations** — safe to re-run.
- **Applies in sorted filename order** — timestamp prefix controls sequence.

Nothing to run:

```
[INFO] Nothing to migrate.
```

> **Note:** If `.env` has no `DB_DATABASE`, the command errors before touching the database.

### migrate:rollback

Undoes the **single most recent migration** via its `down()`, then removes that row from the tracking table:

```bash
php lite migrate:rollback
```

```
[OK] Rolled back: 2024_01_02_000000_create_posts_table
```

- **One migration per run** — the highest `id`; run again for the one before it.
- **Requires the migration file to still exist** — deleted files error out.
- **Does not delete the file** — `php lite migrate` re-applies it.

```
[INFO] Nothing to rollback.
```

> **Warning:** Never use `migrate:rollback` in production against live data — `down()` typically drops tables/columns. Development only.

### db:seed

```bash
php lite db:seed                                    # runs App\Database\Seeders\DatabaseSeeder (default)
php lite db:seed "App\Database\Seeders\UserSeeder"   # fully-qualified class name
```

```
[OK] Database seeding complete.
```

```php
// app/Database/Seeders/DatabaseSeeder.php
namespace App\Database\Seeders;
use Core\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(UserSeeder::class);
        $this->call(PostSeeder::class);
    }
}
```

```php
// app/Database/Seeders/UserSeeder.php
namespace App\Database\Seeders;
use Core\Database\Seeder;
use App\Models\User;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create(['name' => 'Alice', 'email' => 'alice@example.com']);
    }
}
```

> **Tip:** Build a `DatabaseSeeder` calling every other seeder — then `php lite db:seed` alone fully repopulates a fresh dev database.

### queue:migrate

Creates `jobs` and `failed_jobs` tables — run once per environment before using queue features:

```bash
php lite queue:migrate
```

```
[OK] Created tables: jobs, failed_jobs
```

Safe to re-run — no-op once tables exist.

### Migration File Structure

```php
// database/migrations/2024_06_10_143022_create_posts_table.php
use Core\Database\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $this->schemaCreate('posts', function ($table) {
            $table->id();
            $table->string('title');
            $table->text('body')->nullable();
            $table->boolean('published')->default(false);
            $table->timestamps();
        });
    }
    public function down(): void { $this->dropTable('posts'); }
};
```

### Standard Database Workflow

```bash
php lite make:migration create_posts_table
# fill in up()/down()
php lite migrate
php lite make:seeder UserSeeder
# edit app/Database/Seeders/UserSeeder.php
php lite db:seed "App\Database\Seeders\UserSeeder"

# adjust during development:
php lite migrate:rollback
# edit the migration file
php lite migrate
```

> **Warning:** Never edit an already-applied migration in a shared/production environment — other developers/servers won't re-run it. Always create a **new** migration to alter an existing table.

> **Tip:** Keep `down()` accurate — a rollback failing because `down()` references a dropped column is painful to debug.
