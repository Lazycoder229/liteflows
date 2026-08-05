---
title: Service Container
description: "Learn how LitePHP's IoC container manages class dependencies, auto-wires constructors, handles bindings and singletons, and powers facades and providers."
---

# Service Container

> Learn how LitePHP's IoC container manages class dependencies, auto-wires constructors, handles bindings and singletons, and powers facades and providers.

The service container is an IoC container that builds your application's classes, auto-resolving constructor dependencies via PHP reflection — most classes never need explicit registration.

```php
class PostController extends Controller
{
    public function __construct(
        private PostService    $postService,
        private PostRepository $postRepository,
    ) {}
}
```

If a parameter has a primitive type with no default and can't be resolved, the container throws a `RuntimeException`.

### Container Method Reference

| Method | Signature | Description |
|---|---|---|
| `bind` | `bind(string $abstract, callable $resolver): void` | Register a factory; each `make()` returns a fresh instance |
| `singleton` | `singleton(string $abstract, callable $resolver): void` | Factory called once; subsequent `make()` returns cached instance |
| `instance` | `instance(string $abstract, object $object): void` | Store a pre-built object; every `make()` returns that exact object |
| `make` | `make(string $abstract): mixed` | Resolve and return an instance; auto-wires if unregistered |
| `call` | `call(callable $callback, array $params = []): mixed` | Invoke a callable with auto-injected dependencies |
| `has` | `has(string $abstract): bool` | Whether an abstract is resolvable |
| `alias` | `alias(string $alias, string $abstract): void` | Map a short name to an existing abstract |

### Binding

```php
$container = app();

$container->bind(PostRepositoryInterface::class, function ($container) {
    return new PostRepository($container->make(Database::class));
});
```

Every `make(PostRepositoryInterface::class)` call returns a **fresh** instance.

```php
$container->bind('mailer', function ($container) {
    return new Mailer(config('mail'));
});
$mailer = app('mailer');
```

> **Note:** Regular bindings produce a fresh instance on every `make()`. Use a singleton to reuse the same instance.

### Singletons

```php
$container->singleton(Database::class, function ($container) {
    return new Database(config('database'));
});
$container->singleton('cache', function ($container) {
    return new CacheManager(config('cache'));
});
```

Pre-built objects:

```php
$configObject = new Config(require 'config/app.php');
$container->instance('config', $configObject);
```

### Resolving Services

```php
$postService = app(PostService::class);
$postService = app()->make(PostService::class);
$cache = app('cache');
```

### Calling with Dependency Injection

```php
$result = app()->call([PostController::class, 'store']);

$result = app()->call(function (PostService $service, Request $request) {
    return $service->create($request->all());
});
```

### Service Providers

`register()` runs first (bind things), `boot()` runs after all providers register (safe to use other services):

```php
namespace App\Providers;
use Core\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->container->bind(
            PostRepositoryInterface::class,
            fn($c) => new PostRepository($c->make(Database::class))
        );

        $this->container->singleton(PaymentGateway::class, function ($c) {
            return new StripeGateway(env('STRIPE_KEY'));
        });
    }

    public function boot(): void
    {
        Gate::define('admin', fn($user) => $user['role'] === 'admin');
    }
}
```

```php
// config/app.php
return [
    'providers' => [
        App\Providers\AppServiceProvider::class,
        App\Providers\EventServiceProvider::class,
    ],
];
```

> **Note:** Never call `boot()` logic inside `register()` — a service another provider registers may not be ready yet.

### Aliases

```php
$container->singleton(CacheManager::class, fn($c) => new CacheManager(config('cache')));
$container->singleton(Mailer::class,       fn($c) => new Mailer(config('mail')));

$container->alias('cache',  CacheManager::class);
$container->alias('mailer', Mailer::class);

$cache  = app('cache');
$mailer = app('mailer');
```

> **Note:** `alias()` maps a short key to an **existing abstract** — it must already be bound or auto-wireable.

### Circular Dependency Detection

```
RuntimeException: Circular dependency detected: App\Services\PostService
```

> **Warning:** Break cycles by extracting shared logic into a third class, or use an event/observer pattern to decouple.

### Practical End-to-End Example

```php
interface PostRepositoryInterface
{
    public function find(int $id): ?Post;
    public function all(): array;
}

class PostRepository implements PostRepositoryInterface
{
    public function __construct(private Database $db) {}
    public function find(int $id): ?Post { /* ... */ }
    public function all(): array { /* ... */ }
}
```

```php
// App/Providers/PostServiceProvider.php
namespace App\Providers;
use Core\Support\ServiceProvider;

class PostServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->container->bind(
            PostRepositoryInterface::class,
            fn($c) => new PostRepository($c->make(Database::class))
        );

        $this->container->singleton(PostService::class, function ($c) {
            return new PostService(
                $c->make(PostRepositoryInterface::class),
                $c->make(Cache::class)
            );
        });
    }
}
```

```php
// App/Controllers/PostController.php
namespace App\Controllers;
use Core\Controller;

class PostController extends Controller
{
    public function __construct(private PostService $postService) {}

    public function index(): string
    {
        $posts = $this->postService->all();
        return $this->view('posts.index', compact('posts'));
    }
}
```

### Facades

Static proxies to services stored in the container:

```php
use Core\Facades\Route;
use Core\Facades\Auth;
use Core\Facades\Cache;

Route::get('/posts', [PostController::class, 'index']);
if (Auth::check()) { $user = Auth::user(); }
Cache::put('posts', $posts, 3600);
$posts = Cache::get('posts');
```

Custom facade:

```php
namespace App\Facades;
use Core\Support\Facade;
use App\Services\PaymentGateway;

class Payment extends Facade
{
    protected static function getFacadeAccessor(): string { return PaymentGateway::class; }
}
```

```php
Payment::charge($user, 2999);
// Equivalent to: app(PaymentGateway::class)->charge($user, 2999);
```

> **Note:** Facades resolve lazily — `make()` is called on first static method invocation, then cached in `Facade::$resolved` for the rest of the request.

### Best Practices

- **Bind interfaces, not concretions** — swap implementations without touching controllers.
- **Use singletons for expensive objects** — DB connections, cache managers, queue/HTTP clients.
- **Register in Service Providers** — controllers/commands/middleware should never call `$app->bind()` directly.
- **Declare dependencies in constructors** — prefer constructor injection over `app()->make()` inside methods.
