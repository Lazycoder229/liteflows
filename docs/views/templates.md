---
title: Templates (.lites)
description: "Complete reference for the .lites template engine — variables, layouts, loops, conditionals, includes, stacks, CSRF, and template caching in LitePHP."
---

# Templates (.lites)

> Complete reference for the .lites template engine — variables, layouts, loops, conditionals, includes, stacks, CSRF, and template caching in LitePHP.

`.lites` is a Blade-inspired template engine that compiles templates to plain PHP and caches the result. Templates live in `app/views/` with the `.lites` extension.

### Rendering a Template

Dot notation maps to directory separators: `posts.index` → `app/views/posts/index.lites`.

```php
return $this->view('posts.index', ['posts' => $posts]);   // in a controller
return view('posts.index', ['posts' => $posts]);           // global helper
```

### Variables

```html
<!-- Escaped (XSS-safe) — use for user data -->
<h1>{{ $post->title }}</h1>
<p>{{ $user->name }}</p>

<!-- Raw/unescaped — only for trusted content -->
<div>{!! $post->html_content !!}</div>
```

> **Warning:** Never render unescaped user input with `{!! !!}` — reserve raw output for self-generated or sanitised HTML.

### Layouts

```html
<!-- layouts/app.lites -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>@yield('title', 'My App')</title>
    @stack('styles')
</head>
<body>
    <nav><!-- navigation --></nav>
    <main>
        @yield('content')
    </main>
    @stack('scripts')
</body>
</html>
```

```html
<!-- posts/index.lites -->
@extends('layouts.app')

@section('title', 'Posts')

@section('content')
    <h1>All Posts</h1>
    @foreach($posts as $post)
        <article>
            <h2>{{ $post->title }}</h2>
            <p>{{ $post->excerpt }}</p>
        </article>
    @endforeach
@endsection

@push('scripts')
    <script src="/js/posts.js"></script>
@endpush
```

Inline section values (short, single-value like `<title>`):

```html
@section('title', 'Edit Post')
```

### Conditionals

```html
@if($user->isAdmin())
    <a href="/admin">Admin Panel</a>
@elseif($user->isEditor())
    <a href="/editor">Editor Dashboard</a>
@else
    <p>Welcome, {{ $user->name }}</p>
@endif
```

### Loops

```html
@foreach($posts as $post)
    <div class="post">
        <h2>{{ $post->title }}</h2>
        <p>{{ $post->excerpt }}</p>
    </div>
@endforeach

@for($i = 0; $i < 5; $i++)
    <p>Item {{ $i }}</p>
@endfor

@while(!$queue->isEmpty())
    <p>{{ $queue->dequeue() }}</p>
@endwhile
```

### Includes

```html
@include('partials.header')
@include('partials.sidebar')

<!-- pass extra data -->
@include('components.alert', ['type' => 'success', 'message' => 'Saved!'])
```

> **Note:** Circular includes (A → B → A) throw a `RuntimeException` with the full render stack.

### Stacks

```html
<!-- child template or partial — contributions append, not overwrite -->
@push('scripts')
    <script src="/js/chart.js"></script>
@endpush

@push('styles')
    <link rel="stylesheet" href="/css/dashboard.css">
@endpush
```

```html
<!-- layout — render pushed entries in order -->
@stack('styles')   <!-- in <head> -->
@stack('scripts')  <!-- before </body> -->
```

Inline one-liner:

```html
@push('meta', '<meta name="robots" content="noindex">')
```

### CSRF Protection

```html
<form method="POST" action="/posts">
    @csrf
    <!-- Renders: <input type="hidden" name="_csrf_token" value="..."> -->
    <input type="text" name="title">
    <button type="submit">Create Post</button>
</form>
```

> **Warning:** Always include `@csrf` in forms that mutate data — requests without it are rejected before reaching your controller.

### Method Spoofing

```html
<form method="POST" action="/posts/{{ $post->id }}">
    @csrf
    @method('PUT')
    <input type="text" name="title" value="{{ $post->title }}">
    <button type="submit">Update Post</button>
</form>

<form method="POST" action="/posts/{{ $post->id }}">
    @csrf
    @method('DELETE')
    <button type="submit">Delete</button>
</form>
```

### Inline PHP

```html
@php
    $formattedDate = date('M j, Y', strtotime($post->created_at));
    $readingTime   = ceil(str_word_count(strip_tags($post->body)) / 200);
@endphp

<p>Published: {{ $formattedDate }} · {{ $readingTime }} min read</p>
```

Use sparingly — heavy logic belongs in the controller/service.

### Template Comments

```html
{{-- This section is rendered on the server; the comment is invisible in source --}}
<section class="hero">
    <h1>{{ $headline }}</h1>
</section>
```

Stripped at compile time (unlike `<!-- -->` which reaches the browser).

### Displaying Validation Errors

```html
<div class="form-group">
    <label for="email">Email</label>
    <input type="email" id="email" name="email"
        value="{{ old('email') }}"
        class="{{ hasError('email') ? 'input-error' : '' }}">
    @if(hasError('email'))
        <span class="error-message">{{ errors('email') }}</span>
    @endif
</div>
```

Full error summary:

```html
@php $allErrors = errors(); @endphp
@if(!empty($allErrors))
    <div class="alert alert-danger">
        <ul>
            @foreach($allErrors as $field => $messages)
                @foreach($messages as $message)
                    <li>{{ $message }}</li>
                @endforeach
            @endforeach
        </ul>
    </div>
@endif
```

### Template Caching

```php
// config/view.php
return [
    'cache' => true, // false during development
];
```

**Development** (`cache: false`) — checks file modification time every request, recompiles on change; no manual cache clearing needed.

**Production** (`cache: true`) — compiles once, trusts the cached file (no `stat()` calls). Clear after deploying template changes:

```bash
php lite cache:clear
```

> **Tip:** Compiled cache files use `0750` permissions — on shared hosting, other users can't read them.
