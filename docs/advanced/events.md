---
title: Events
description: "Decouple application logic with named events and listeners. Covers registering, dispatching, one-time listeners, and centralizing all event wiring cleanly."
---

# Events

> Decouple application logic with named events and listeners. Covers registering, dispatching, one-time listeners, and centralizing all event wiring cleanly.

Lightweight synchronous event system built on `EventDispatcher` — all methods static.

### Registering a Listener

```php
use Core\Events\EventDispatcher;

EventDispatcher::listen('user.registered', function (array $payload) {
    mail_send(new WelcomeEmail($payload['user']));
});

EventDispatcher::listen('user.registered', function (array $payload) {
    Profile::create(['user_id' => $payload['user']->id]);
});

// global helper
listen('user.registered', function (array $payload) { mail_send(new WelcomeEmail($payload['user'])); });
```

### Dispatching an Event

```php
use Core\Events\EventDispatcher;

EventDispatcher::dispatch('user.registered', ['user' => $user]);
event('user.registered', ['user' => $user]); // preferred helper
```

All listeners run synchronously, in registration order.

### One-Time Listeners

```php
EventDispatcher::once('user.registered', function (array $payload) {
    log_message('info', 'First registration recorded.'); // fires once only
});
```

### Checking for Listeners

```php
if (EventDispatcher::hasListeners('order.placed')) {
    event('order.placed', ['order' => $order]);
}
```

### Removing Listeners

```php
EventDispatcher::forget('user.registered'); // remove all listeners for one event
EventDispatcher::flushAll();                 // remove every listener for every event — useful in test tearDown()
```

### Organizing Events as Classes

```php
namespace App\Events;
use App\Models\User;

class UserRegistered
{
    public const NAME = 'user.registered';
    public function __construct(public readonly User $user) {}
}
```

```php
listen(UserRegistered::NAME, function (array $payload) { mail_send(new WelcomeEmail($payload['user'])); });
event(UserRegistered::NAME, ['user' => $user]);
```

### Registering Listeners in Service Providers

```php
namespace App\Providers;
use Core\ServiceProvider;
use App\Events\UserRegistered;
use App\Events\OrderPlaced;
use App\Events\PostPublished;
use App\Listeners\SendWelcomeEmailListener;
use App\Listeners\NotifySubscribersListener;
use App\Listeners\SendOrderConfirmationListener;

class EventServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        listen(UserRegistered::NAME, [SendWelcomeEmailListener::class, 'handle']);
        listen(PostPublished::NAME,  [NotifySubscribersListener::class, 'handle']);
        listen(OrderPlaced::NAME,    [SendOrderConfirmationListener::class, 'handle']);
    }
}
```

```php
namespace App\Listeners;
use App\Mail\WelcomeEmail;

class SendWelcomeEmailListener
{
    public function handle(array $payload): void { mail_send(new WelcomeEmail($payload['user'])); }
}
```

### Full Example: User Registration Flow

```php
// app/Events/UserRegistered.php
namespace App\Events;
class UserRegistered
{
    public const NAME = 'user.registered';
    public function __construct(public readonly object $user) {}
}
```

```php
// app/Listeners/SendWelcomeEmailListener.php
namespace App\Listeners;
class SendWelcomeEmailListener
{
    public function handle(array $payload): void { mail_send(new \App\Mail\WelcomeEmail($payload['user'])); }
}
```

```php
// EventServiceProvider::boot()
public function boot(): void
{
    listen(\App\Events\UserRegistered::NAME, [\App\Listeners\SendWelcomeEmailListener::class, 'handle']);
}
```

```php
public function register(): never
{
    $user = User::create(request()->only(['name', 'email', 'password']));
    event(\App\Events\UserRegistered::NAME, ['user' => $user]);
    redirect('/dashboard');
}
```

### Best Practices

- Register all listeners in a service provider's `boot()` — never inline in controllers/models.
- Keep event names in class constants (`UserRegistered::NAME`) — autocomplete, no typos, single rename point.
- Dispatch is **synchronous** and blocks until listeners finish — for heavy work, dispatch a queue job inside the listener instead of doing it directly.
