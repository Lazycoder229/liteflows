---
title: Cache
description: "Use LitePHP's file-based cache to store query results, counters, and arbitrary data with TTL expiry, HMAC-signed payloads, and the remember pattern."
---

# Cache

> Use LitePHP's file-based cache to store query results, counters, and arbitrary data with TTL expiry, HMAC-signed payloads, and the remember pattern.

File cache in `storage/cache/data/`, protected against PHP object injection — every file HMAC-signed with `APP_KEY` before write.

### Basic Usage

```php
use Core\Cache\Cache;

Cache::put('featured_posts', $posts, 3600);   // TTL 1 hour
$posts = Cache::get('featured_posts');         // null if missing/expired
$posts = Cache::get('featured_posts', []);     // with default
if (Cache::has('featured_posts')) { /* ... */ }
Cache::forget('featured_posts');
Cache::flush(); // delete everything
```

> **Note:** TTL `0` stores forever — never expires unless `forget()`/`flush()` is called.

### The Remember Pattern

```php
$posts = Cache::remember('featured_posts', 3600, function () {
    return Post::query()->where('featured', true)->with('author')
        ->orderByDesc('published_at')->limit(10)->get();
});

$siteConfig = Cache::rememberForever('site_config', function () {
    return SiteConfig::first();
});
```

> **Note:** `remember()` treats a cached `null` as a cache miss and re-runs the callback — store a sentinel (`false`/`[]`) if `null` is a legitimate result.

### Atomic Counters

```php
$views = Cache::increment('post:views:' . $postId);       // creates at 0 if missing
$views = Cache::increment('post:views:' . $postId, 5);     // custom amount
$stock = Cache::decrement('product:stock:' . $productId);
$stock = Cache::decrement('product:stock:' . $productId, 3);

// TTL on first hit (window); preserved if key already exists
$hits = Cache::increment('rate:' . $ipAddress, 1, 60);
if ($hits > 100) abort(429, 'Too Many Requests');
```

> **Warning:** `increment()` is atomic per-server, not distributed across multiple servers — use a Redis-backed driver for distributed rate limiting.

### The `cache()` Helper

```php
$value = cache('site_config');       // null if missing/expired
$value = cache('site_config', []);   // with default

// writes / remember still need the class:
use Core\Cache\Cache;
Cache::put('key', $value, 300);
$result = Cache::remember('key', 300, fn () => expensiveOperation());
```

### Namespaced Cache Keys

```php
Cache::put('users:profile:' . $userId, $profile, 1800);
Cache::put('posts:published:page:' . $page, $posts, 300);
Cache::put('stats:daily:' . date('Y-m-d'), $stats, 86400);
Cache::increment('rate:login:' . $ipAddress, 1, 300);
Cache::forget('users:profile:' . $userId);
```

> **Tip:** Adopt a `resource:scope:identifier` key convention for consistency and easy targeted invalidation.

### Clearing via CLI

```bash
php lite cache:clear   # data cache + compiled view cache + route cache
```

### Configuration

```php
// config/cache.php
return ['driver' => 'file', 'path' => storage_path('cache/data')];
```

Cache dir auto-created with `0750` permissions on first use.

**APP_KEY & HMAC Signing:** every cache file HMAC-signed before write; signature verified before `unserialize()` — prevents PHP object injection.

```ini
APP_KEY=base64:your-32-byte-random-key-here
```

> **Warning:** Without `APP_KEY`, cache falls back to a weak derived key — always set it in production.

### Best Practices

- Wrap heavy queries in `Cache::remember()`.
- Match TTL to data volatility — short (60–300s) for feeds/counts, long (3600+s) or `rememberForever` for static config.
- Call `Cache::forget('key')` in the same method that mutates the underlying data.
- Use `Cache::increment()` with a TTL for rate limiting/view counters.
