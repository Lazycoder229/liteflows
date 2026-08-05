---
title: Migrations
description: "Use LitePHP migrations to version-control your database schema — create tables, add columns, define indexes and foreign keys, and roll back safely."
---

# Migrations

> Use LitePHP migrations to version-control your database schema — create tables, add columns, define indexes and foreign keys, and roll back safely.

Migrations are version-controlled PHP files describing schema. Each has `up()` (apply) and `down()` (reverse).

### Creating a Migration

```bash
php lite make:migration create_posts_table
```

Creates `database/migrations/2024_01_01_000000_create_posts_table.php` — timestamp prefix ensures run order.

### Writing a Migration

```php
use Core\Database\Migration;
use Core\Database\Schema\Blueprint;

class CreatePostsTable extends Migration
{
    public function up(): void
    {
        $this->schemaCreate('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->string('title', 255);
            $table->string('slug', 255)->unique();
            $table->longText('body');
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->integer('views')->default(0)->unsigned();
            $table->boolean('featured')->default(false);
            $table->json('meta')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void { $this->dropTable('posts'); }
}
```

> **Note:** `schemaCreate()` issues `CREATE TABLE IF NOT EXISTS` — re-running a completed migration won't throw.

### Blueprint Column Types

| Method | SQL type | Notes |
|---|---|---|
| `$table->id()` | `BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY` | Standard surrogate PK |
| `$table->uuid('uuid')` | `CHAR(36) NOT NULL PRIMARY KEY` | UUID primary key |
| `$table->string('name', 255)` | `VARCHAR(255) NOT NULL` | Length defaults to 255 |
| `$table->char('code', 3)` | `CHAR(3) NOT NULL` | Fixed-length string |
| `$table->text('bio')` | `TEXT` | Up to 65,535 chars |
| `$table->longText('content')` | `LONGTEXT` | Up to 4 GB of text |
| `$table->json('meta')` | `JSON` | Native JSON column |
| `$table->integer('count')` | `INT NOT NULL DEFAULT 0` | 32-bit integer |
| `$table->tinyInteger('flag')` | `TINYINT NOT NULL DEFAULT 0` | 8-bit integer |
| `$table->bigInteger('views')` | `BIGINT NOT NULL DEFAULT 0` | 64-bit integer |
| `$table->decimal('price', 10, 2)` | `DECIMAL(10,2) NOT NULL DEFAULT 0` | Defaults: total=10, places=2 |
| `$table->float('rating', 8, 2)` | `FLOAT(8,2) NOT NULL DEFAULT 0` | Defaults: total=8, places=2 |
| `$table->boolean('active')` | `TINYINT(1) NOT NULL DEFAULT 0` | `->default(true)` for 1 |
| `$table->enum('status', [...])` | `ENUM('a','b',...) NOT NULL` | Constrained value list |
| `$table->timestamp('published_at')` | `TIMESTAMP NULL DEFAULT NULL` | Nullable by default |
| `$table->timestamps()` | `created_at`, `updated_at` | Auto-managed by Model |
| `$table->date('birth_date')` | `DATE NULL` | Date only |
| `$table->dateTime('event_at')` | `DATETIME NULL` | Date + time, no timezone |
| `$table->softDeletes()` | `deleted_at TIMESTAMP NULL DEFAULT NULL` | Required for `SoftDeletes` trait |
| `$table->foreignId('user_id')` | `BIGINT UNSIGNED NOT NULL` | Pair with `->constrained()` |

### Column Modifiers

| Modifier | Description |
|---|---|
| `->nullable()` | `NOT NULL` → `NULL` |
| `->default($value)` | `DEFAULT 'value'` — strings quoted, integers not |
| `->unique()` | `UNIQUE KEY` index |
| `->index()` | Non-unique `INDEX` |
| `->unsigned()` | Appends `UNSIGNED` to integer types |
| `->constrained('table')` | `FOREIGN KEY ... REFERENCES table(id) ON DELETE CASCADE` |

```php
$table->string('email')->unique();
$table->string('nickname')->nullable();
$table->integer('score')->default(0)->unsigned();
$table->foreignId('author_id')->constrained('users');
$table->timestamp('expires_at')->nullable();
```

### Running Migrations

```bash
php lite migrate              # run all pending — tracked in `migrations` table
php lite migrate:rollback     # roll back the most recent batch, in reverse order
```

### Altering Existing Tables

Always create a new migration — never edit one that already ran in production.

```php
class AddExcerptToPosts extends Migration
{
    public function up(): void { $this->addColumn('posts', '`excerpt` TEXT NULL AFTER `title`'); }
    public function down(): void { $this->dropColumn('posts', 'excerpt'); }
}
```

```php
class AddIndexToPostsSlug extends Migration
{
    public function up(): void
    {
        $this->addIndex('posts', 'slug');       // regular index
        $this->addUniqueIndex('posts', 'slug');  // unique index
    }
    public function down(): void { /* drop manually via addColumn / raw query */ }
}
```

### Migration Tips

- Always implement `down()`, even without plans to rollback in production — speeds up local dev reset/rebuild.
- **Never modify a migration that already ran in production** — create a new one instead.
- Use `$table->foreignId('user_id')->constrained('users')` over plain `bigInteger` — adds a proper FK with `ON DELETE CASCADE`.
- Tables use `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci` by default — full transaction support, FK enforcement, proper Unicode/emoji handling.
