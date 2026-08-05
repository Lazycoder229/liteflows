---
title: Components
description: "Build reusable PHP component classes that render HTML fragments, share data across all templates, and compose complex UIs in LitePHP."
---

# Components

> Build reusable PHP component classes that render HTML fragments, share data across all templates, and compose complex UIs in LitePHP.

View components pair a data-preparation method with a `.lites` template to produce reusable HTML fragments — similar to Blade components in Laravel.

### How Components Work

Every component extends `Core\View\Components\Component` and implements two protected abstract methods:

- `data()` — returns variables to pass to the template
- `view()` — returns the dot-notation template name

`render()` (or casting to string via `{!! $component !!}`) merges `ViewFactory`'s globally shared data with the component's own `data()`, then compiles and renders.

### Creating a Component

```php
<?php
namespace App\View\Components;
use Core\View\Components\Component;

class Alert extends Component
{
    public function __construct(
        private string $type    = 'info',
        private string $message = ''
    ) {}

    protected function data(): array
    {
        return ['type' => $this->type, 'message' => $this->message];
    }

    protected function view(): string
    {
        return 'components.alert'; // resolves to app/views/components/alert.lites
    }
}
```

```html
<!-- app/views/components/alert.lites -->
<div class="alert alert-{{ $type }}" role="alert">
    <p>{{ $message }}</p>
</div>
```

```php
use App\View\Components\Alert;

public function store(Request $request): void
{
    // ... save logic ...
    $alert = new Alert('success', 'Post saved successfully!');
    return $this->view('posts.show', ['post' => $post, 'alert' => $alert]);
}
```

```html
{!! $alert !!}

<article>
    <h1>{{ $post->title }}</h1>
    <div>{!! $post->html_content !!}</div>
</article>
```

### Sharing Data with ViewFactory

```php
use Core\View\Components\ViewFactory;

// service provider boot() or bootstrap/app.php
ViewFactory::share([
    'appName'     => config('app.name'),
    'currentUser' => auth_user(),
]);

ViewFactory::share(['cartCount' => $cart->count()]);
```

```html
<title>{{ $appName }}</title>
<p>Hello, {{ $currentUser['name'] ?? 'Guest' }}</p>
```

> **Note:** Shared data merges with component-level `data()` on every `render()`. If a key overlaps, the component's own value wins.

### The Header Component

Working example shipped in `Core/View/Components/Header.php`:

```php
use Core\View\Components\Header;

$header = new Header(
    pageTitle:         'Dashboard',
    searchPlaceholder: 'Search posts...',
    actions:           [['label' => 'New Post', 'url' => '/posts/create', 'style' => 'primary']],
    theme:             'light',
    layout:            'centered-search',
);

return $this->view('dashboard', ['header' => $header]);
```

```html
<!-- app/views/dashboard.lites -->
{!! $header !!}
<main class="container"><!-- page content --></main>
```

`Header` also pulls `flash('success')` and `flash('error')` from the session inside `data()`, so banners appear with no extra controller code.

### Built-in Starter Components

Shipped in `Core/View/Components/`:

| Component | Purpose |
|---|---|
| `Header` | Page header — title, action buttons, search bar, flash messages. `light`/`dark` themes. |
| `Sidebar` | Navigation sidebar — extend for your app's links and active-state logic. |
| `Cart` | Shopping cart action component — e-commerce starting point. |
| `Logout` | Logout button posting to your logout route with CSRF token. |
| `Notif` | Notification bell — wire to your notification count. |

> **Tip:** These are starting points, not a locked-in UI library — copy into `app/View/Components/`, rename, and modify freely.

### Best Practices

- **Keep classes thin** — components only prepare data; move logic/queries to services.
- **Use `ViewFactory` for globals** — auth user, app name, unread count, etc.
- **Render with `{!! !!}`** — `{{ }}` HTML-encodes and breaks the markup.
- **Name templates clearly** — `components.my-component-name` → `app/views/components/my-component-name.lites`.
