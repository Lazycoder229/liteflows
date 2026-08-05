---
title: "make: Commands"
description: "Use LitePHP's make: commands to scaffold controllers, models, migrations, services, jobs, mailables, seeders, and views without writing boilerplate by hand."
---

# make: Commands

> Use LitePHP's make: commands to scaffold controllers, models, migrations, services, jobs, mailables, seeders, and views without writing boilerplate by hand.

Every generator checks for an existing file first — never overwrites edited code.

### make:controller

```bash
php lite make:controller PostController                # app/Controllers/PostController.php
php lite make:controller PostController --resource      # + index, create, store, show, edit, update, destroy
php lite make:controller Admin/UserController           # app/Controllers/Admin/UserController.php, namespace App\Controllers\Admin
```

`--resource` stub:

```php
// app/Controllers/PostController.php  (--resource)
namespace App\Controllers;
use Core\Controller;
use Core\Http\Request;
use Core\Http\Response;

class PostController extends Controller
{
    public function index(Request $request, Response $response): void { $this->view('posts.index'); }        // GET /posts
    public function create(Request $request, Response $response): void { $this->view('posts.create'); }       // GET /posts/create
    public function store(Request $request, Response $response): void { $this->redirectRoute('posts.index'); } // POST /posts
    public function show(Request $request, Response $response, string $id): void { $this->view('posts.show', compact('id')); }   // GET /posts/{id}
    public function edit(Request $request, Response $response, string $id): void { $this->view('posts.edit', compact('id')); }   // GET /posts/{id}/edit
    public function update(Request $request, Response $response, string $id): void { $this->redirectRoute('posts.index'); }      // PUT /posts/{id}
    public function destroy(Request $request, Response $response, string $id): void { $this->redirectRoute('posts.index'); }     // DELETE /posts/{id}
}
```

> **Note:** `Controller` suffix appended automatically if omitted — `make:controller Post` and `make:controller PostController` both produce `PostController.php`.

### make:model

Table name derived by converting PascalCase to snake_case — **no automatic pluralization**.

```bash
php lite make:model Post                  # app/Models/Post.php, $table = 'post'
php lite make:model Post --timestamps     # + $timestamps = true
php lite make:model BlogPost              # $table = 'blog_post'
```

```php
// app/Models/Post.php
namespace App\Models;
use Core\Database\Model;

class Post extends Model
{
    protected static string $table      = 'post';
    protected static string $primaryKey = 'id';
    protected static bool   $timestamps = false;
    protected static array $fillable = [];
    protected static array $guarded  = ['id'];
}
```

> **Tip:** Edit `$table` directly after generation if your naming convention differs.

### make:migration

```bash
php lite make:migration create_posts_table
# database/migrations/2024_01_15_120000_create_posts_table.php
```

```php
use Core\Database\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $this->schemaCreate('posts', function ($table) {
            $table->id();
            $table->timestamps();
        });
    }
    public function down(): void { $this->dropTable('posts'); }
};
```

> **Note:** The generator strips `create_`/`_table` from the name to infer the table — `create_posts_table` targets `posts`.

### make:middleware

Detects group (`web`, `api`, `global`) from the name, places in matching sub-folder, pre-fills `#[RegisterMiddleware]`:

```bash
php lite make:middleware AuthMiddleware    # app/Middleware/Web/AuthMiddleware.php — group: web, alias: auth
php lite make:middleware ApiRateLimit      # app/Middleware/Api/ApiRateLimit.php — group: api, alias: rate-limit
php lite make:middleware GlobalLogger      # app/Middleware/Global/GlobalLogger.php — group: global, alias: logger
```

```php
// app/Middleware/Web/AuthMiddleware.php
namespace App\Middleware\Web;
use Core\Middleware\Middleware;
use Core\Http\Request;
use Core\Http\Response;
use Core\Middleware\Attributes\RegisterMiddleware;

#[RegisterMiddleware(group: 'web', alias: 'auth')]
class AuthMiddleware extends Middleware
{
    public function handle(Request $request, Response $response, callable $next): mixed
    {
        // TODO: implement middleware logic
        return $next($request, $response);
    }
}
```

### make:service

```bash
php lite make:service PostService              # app/Services/PostService.php
php lite make:service PostService --resource    # + all, find, create, update, delete stubs
```

```php
// app/Services/PostService.php  (--resource)
namespace App\Services;

class PostService
{
    public function all(): array { return []; }
    public function find(int|string $id): mixed { return null; }
    public function create(array $data): mixed { return null; }
    public function update(int|string $id, array $data): bool { return false; }
    public function delete(int|string $id): bool { return false; }
}
```

> **Note:** `Service` suffix appended automatically — `make:service Post --resource` and `make:service PostService --resource` both produce `PostService.php`.

### make:job

```bash
php lite make:job SendWelcomeEmail   # app/Jobs/SendWelcomeEmail.php
```

```php
namespace App\Jobs;
use Core\Queue\Job;

class SendWelcomeEmail extends Job
{
    public function __construct(/* inject your data here */) {}
    public function handle(): void { /* job logic */ }
    public function failed(\Throwable $e): void { /* called when retries exhausted */ }
}
```

### make:mail

```bash
php lite make:mail WelcomeEmail   # app/Mail/WelcomeEmail.php
```

```php
namespace App\Mail;
use Core\Mail\Mailable;

class WelcomeEmail extends Mailable
{
    public function __construct() {}

    public function build(): void
    {
        $this->to('recipient@example.com')->subject('WelcomeEmail')->html('<h1>Hello from LitePHP!</h1>');
    }
}
```

### make:resource

Runs `make:model` + `make:service` + `make:controller` together, wired up:

```bash
php lite make:resource Post
# app/Models/Post.php
# app/Services/PostService.php      (full CRUD)
# app/Controllers/PostController.php  (uses PostService)
```

```php
// app/Controllers/PostController.php
namespace App\Controllers;
use Core\Controller;
use Core\Http\Request;
use Core\Http\Response;
use App\Services\PostService;

class PostController extends Controller
{
    public function __construct(private PostService $service) {}

    public function index(Request $request, Response $response): void
    {
        $posts = $this->service->all();
        $this->view('posts.index', compact('posts'));
    }

    public function store(Request $request, Response $response): void
    {
        $this->service->create($request->all());
        $this->redirectRoute('posts.index');
    }

    public function update(Request $request, Response $response, string $id): void
    {
        $this->service->update($id, $request->all());
        $this->redirectRoute('posts.index');
    }

    public function destroy(Request $request, Response $response, string $id): void
    {
        $this->service->delete($id);
        $this->redirectRoute('posts.index');
    }
    // ... show, create, edit also generated
}
```

The service uses smart pluralization for table names — `Post` → `posts`, `Category` → `categories`, `Person` → `people` — and calls `findOrFail()` to throw on missing records.

### make:seeder

```bash
php lite make:seeder UserSeeder   # app/Database/Seeders/UserSeeder.php
```

```php
namespace App\Database\Seeders;
use Core\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void { /* $this->call(AnotherSeeder::class); */ }
}
```

### make:view

Dot-notation → directory separators, placed in `app/Views/`:

```bash
php lite make:view posts.index         # app/Views/posts/index.php
php lite make:view admin.users.index   # app/Views/admin/users/index.php
php lite make:view layouts.app         # app/Views/layouts/app.php
```

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Index</title>
</head>
<body>
    <h1>Index</h1>
</body>
</html>
```

Title derived from the last dot-notation segment.

### Full Scaffold Workflow

```bash
php lite make:resource Post           # model + service + controller
php lite make:migration create_posts_table
```

```php
// fill in the migration
public function up(): void
{
    $this->schemaCreate('posts', function ($table) {
        $table->id();
        $table->string('title');
        $table->text('body');
        $table->timestamps();
    });
}
```

```bash
php lite migrate
php lite make:view posts.index
php lite make:view posts.show
php lite make:view posts.create
php lite make:view posts.edit
```

Then register routes in `app/Routes/web.php` or `app/Routes/api.php` — controller and service are already wired.
