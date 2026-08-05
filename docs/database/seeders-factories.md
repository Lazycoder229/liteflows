---
title: Seeders & Factories
description: "Populate your LitePHP database with seeders for fixed base data and factories for bulk generated test records — with full code examples for both."
---

# Seeders & Factories

> Populate your LitePHP database with seeders for fixed base data and factories for bulk generated test records — with full code examples for both.

**Seeders** are for deterministic, environment-specific data (admin users, permission sets, lookup tables). **Factories** generate realistic fake records in bulk for local development and tests.

### Creating a Seeder

```bash
php lite make:seeder UserSeeder
```

```php
namespace Database\Seeders;
use Core\Database\Seeder;
use App\Models\User;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create(['name' => 'Admin User', 'email' => 'admin@example.com', 'password' => bcrypt('password'), 'role' => 'admin']);
        User::create(['name' => 'Editor', 'email' => 'editor@example.com', 'password' => bcrypt('password'), 'role' => 'editor']);
    }
}
```

### Calling Other Seeders

```php
namespace Database\Seeders;
use Core\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(UserSeeder::class);      // users before posts
        $this->call(CategorySeeder::class);
        $this->call(PostSeeder::class);      // references users + categories
        $this->call(TagSeeder::class);
    }
}
```

### Running Seeders

```bash
php lite db:seed UserSeeder        # single seeder
php lite db:seed DatabaseSeeder    # root seeder — calls all others
```

> **Tip:** Use `User::firstOrCreate(['email' => 'admin@example.com'], [...])` in seeders instead of `create()` so they're safely re-runnable.

> **Warning:** Seeders respect mass-assignment rules — inserted columns must be in `$fillable` on each model.

### Creating a Factory

Create manually in `database/factories/`, extending `Core\Database\Factory`:

```php
namespace Database\Factories;
use Core\Database\Factory;
use App\Models\Post;

class PostFactory extends Factory
{
    protected string $model = Post::class;

    public function definition(): array
    {
        return [
            'title'   => $this->faker->sentence(),
            'body'    => $this->faker->paragraph(),
            'status'  => 'draft',
            'user_id' => 1,
        ];
    }
}
```

### Using Factories

```php
// make() — attribute array, no DB write
$attributes = PostFactory::new()->make();

// create() — insert one row, return Post instance
$post = PostFactory::new()->create();

// count() — insert multiple
$posts = PostFactory::new()->count(10)->create();

// state() — override attributes
$published = PostFactory::new()->state(['status' => 'published'])->create();
$posts = PostFactory::new()->count(5)->state(['user_id' => 42, 'status' => 'published'])->create();
```

`make()`/`create()` accept a final `$overrides` array that takes highest precedence over `definition()` and `state()`:

```php
$posts = PostFactory::new()->count(3)->state(['status' => 'published'])->create(['user_id' => auth()->id()]);
```

### Built-in Faker Helpers

| Method | Returns | Description |
|---|---|---|
| `$this->faker->name()` | `string` | Random full name, e.g. `"Alice Smith"` |
| `$this->faker->uniqueEmail()` | `string` | Unique `@example.com` address |
| `$this->faker->word()` | `string` | Random word, small fixed vocabulary |
| `$this->faker->sentence()` | `string` | Three random words as a sentence |
| `$this->faker->paragraph()` | `string` | Three sentences |
| `$this->faker->number($min, $max)` | `int` | Random integer inclusive |

> **Note:** The built-in faker is intentionally minimal (fixed vocab, `@example.com` emails). For richer fake data, override `definition()` to call a third-party library.

### Using Factories Inside Seeders

```php
namespace Database\Seeders;
use Core\Database\Seeder;
use App\Models\User;
use Database\Factories\PostFactory;
use Database\Factories\UserFactory;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@example.com'],
            ['name' => 'Admin', 'password' => bcrypt('password'), 'role' => 'admin']
        );

        $users = UserFactory::new()->count(20)->create();

        foreach ($users as $user) {
            PostFactory::new()->count(5)->state(['user_id' => $user->id, 'status' => 'published'])->create();
        }
    }
}
```

> **Tip:** Keep `DatabaseSeeder` idempotent with `firstOrCreate()` for fixed records. For factory data, truncating and re-seeding from scratch in dev is fine.
