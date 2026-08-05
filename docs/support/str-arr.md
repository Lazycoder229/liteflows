---
title: Str & Arr
description: "Complete reference for LitePHP's Str and Arr utility classes — case conversion, slug generation, masking, dot-notation array access, grouping, flattening, and more."
---

# Str & Arr

> Complete reference for LitePHP's Str and Arr utility classes — case conversion, slug generation, masking, dot-notation array access, grouping, flattening, and more.

### Str

`Core\Support\Str` — every method static.

```php
use Core\Support\Str;
```

**Case Conversion:**

```php
Str::camel('hello_world')       // 'helloWorld'
Str::camel('user_profile_page') // 'userProfilePage'
Str::studly('hello_world')      // 'HelloWorld'
Str::studly('send_email_job')   // 'SendEmailJob'
Str::snake('helloWorld')        // 'hello_world'
Str::snake('SendEmailJob')      // 'send_email_job'
Str::snake('helloWorld', '-')   // 'hello-world'
Str::kebab('helloWorld')        // 'hello-world'
Str::kebab('UserProfilePage')   // 'user-profile-page'
Str::title('hello world')       // 'Hello World'
Str::title('the quick fox')     // 'The Quick Fox'
```

**Checking & Searching:**

```php
Str::startsWith('Hello World', 'Hello')          // true
Str::startsWith('Hello World', ['Hi', 'Hello'])  // true — array of needles
Str::startsWith('Hello World', 'World')          // false

Str::endsWith('Hello World', 'World')            // true
Str::endsWith('Hello World', ['PHP', 'World'])   // true

Str::contains('Hello World', 'World')            // true
Str::contains('Hello World', ['PHP', 'World'])   // true — any match
Str::contains('Hello World', 'Python')           // false
```

**Truncating:**

```php
Str::limit('The quick brown fox', 10)             // 'The quick ...' (multibyte-safe)
Str::limit('The quick brown fox', 10, ' [...]')
Str::limit('Short', 10)                            // 'Short' — no truncation

Str::words('The quick brown fox', 2)              // 'The quick...'
Str::words('The quick brown fox', 2, ' →')        // 'The quick →'

Str::excerpt($article, 'LitePHP', 100)            // context around a phrase
```

**URL & SEO:**

```php
Str::slug('Hello World!')           // 'hello-world'
Str::slug('  Spaces   Everywhere ') // 'spaces-everywhere'
Str::slug('Hello World', '_')       // 'hello_world'
```

> **Note:** `Str::slug()` uses `mb_strtolower()` and strips non-letter/non-digit chars before replacing spaces — handles accented characters cleanly.

**Generation:**

```php
Str::random(32)   // 32 hex chars, cryptographically random
Str::random(16)
Str::uuid()       // '550e8400-e29b-41d4-a716-446655440000'
```

**Padding:**

```php
Str::padLeft('5', 3, '0')    // '005'
Str::padLeft('42', 5, '0')   // '00042'
Str::padRight('5', 3, '0')   // '500'
Str::padRight('Hi', 5, '.')  // 'Hi...'
Str::padBoth('5', 3, '0')    // '050'
Str::padBoth('hi', 6, '-')   // '--hi--'
```

**Replace:**

```php
Str::replace('World', 'PHP', 'Hello World')             // 'Hello PHP'
Str::replace(['foo', 'bar'], ['a', 'b'], 'foo bar foo') // 'a b a'
Str::replaceFirst('a', 'x', 'aabbaa')                    // 'xabbaa'
Str::replaceLast('a', 'x', 'aabbaa')                     // 'aabbax'
```

**Masking:**

```php
// Str::mask(string, char, start_index, length)
Str::mask('alice@example.com', '*', 3, 10)     // 'ali**********om'
Str::mask('4111111111111111', '*', 4, 8)       // '4111********1111'
Str::mask('+1-800-555-0100', 'X', 5)           // '+1-80XXXXXXXXXX' — length omitted = to end
```

### Arr

`Core\Support\Arr` — dot-notation access on top of standard PHP array functions.

```php
use Core\Support\Arr;
```

**Dot-Notation Access:**

```php
$config = ['database' => ['mysql' => ['host' => 'localhost', 'port' => 3306]]];

Arr::get($config, 'database.mysql.host')              // 'localhost'
Arr::get($config, 'database.mysql.port')              // 3306
Arr::get($config, 'database.redis.host', '127.0.0.1') // default

Arr::set($config, 'database.mysql.name', 'mydb') // sets in-place
Arr::has($config, 'database.mysql.host')         // true
Arr::has($config, 'database.redis')              // false
Arr::forget($config, 'database.mysql.port')      // removes nested key
```

**Filtering:**

```php
$user = ['name' => 'Alice', 'email' => 'alice@example.com', 'password' => 'secret'];

Arr::only($user, ['name', 'email'])
Arr::except($user, ['password'])

Arr::where([1, 2, 3, 4, 5], fn($v) => $v > 3)  // [4, 5]
Arr::where($users, fn($u) => $u['active'])
```

**Extraction:**

```php
$users = [
    ['name' => 'Alice', 'role' => 'admin'],
    ['name' => 'Bob',   'role' => 'editor'],
    ['name' => 'Carol', 'role' => 'admin'],
];

Arr::pluck($users, 'name')          // ['Alice', 'Bob', 'Carol']
Arr::keyBy($users, 'name')          // ['Alice' => [...], 'Bob' => [...], ...]
Arr::groupBy($users, 'role')        // ['admin' => [Alice, Carol], 'editor' => [Bob]]
Arr::groupBy($orders, fn($o) => date('Y-m', strtotime($o['date'])))
```

**Manipulation:**

```php
Arr::flatten([[1, 2], [3, [4, 5]]])   // [1, 2, 3, 4, 5] — recursive
Arr::collapse([[1, 2], [3, 4], [5]])  // [1, 2, 3, 4, 5] — one level
Arr::chunk([1, 2, 3, 4, 5], 2)        // [[1,2], [3,4], [5]]

Arr::first([10, 20, 30])              // 10
Arr::last([10, 20, 30])               // 30
Arr::first($posts, fn($p) => $p['featured'])

Arr::sortBy($users, 'name')             // ascending
Arr::sortBy($users, 'created_at', 'desc')

Arr::wrap(null)      // []
Arr::wrap('hello')   // ['hello']
Arr::wrap(['a','b']) // ['a', 'b'] — unchanged

Arr::unique([1, 2, 2, 3, 3, 3]) // [1, 2, 3]
```

**Dot Flattening:**

```php
$nested = ['app' => ['name' => 'LitePHP', 'debug' => false], 'mail' => ['host' => 'smtp.example.com', 'port' => 587]];

Arr::toDot($nested);
// ['app.name' => 'LitePHP', 'app.debug' => false, 'mail.host' => 'smtp.example.com', 'mail.port' => 587]
```
