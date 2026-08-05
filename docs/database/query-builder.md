---
title: Query Builder
description: "Master LitePHP's fluent QueryBuilder — WHERE clauses, joins, aggregates, pagination, eager loading, and raw queries with full code examples."
---

# Query Builder

> Master LitePHP's fluent QueryBuilder — WHERE clauses, joins, aggregates, pagination, eager loading, and raw queries with full code examples.

Every method returns the same builder instance for chaining; queries execute on a terminal method (`get()`, `first()`, or an aggregate). All identifiers are quoted, all values bound via PDO — SQL-injection protected by default.

### Starting a Query

```php
$query = Post::query(); // QueryBuilder scoped to `posts`

// Equivalent — most builder methods can be called directly on the model
Post::query()->where('status', 'published')->get();
Post::where('status', 'published')->get();
```

### WHERE Clauses

```php
Post::query()->where('status', 'published')->get();        // col = ?
Post::query()->where('views', '>', 100)->get();             // col > ?
Post::query()->where('views', '>=', 50)->get();
Post::query()->where('title', 'LIKE', '%PHP%')->get();
Post::query()->where('title', 'NOT LIKE', '%spam%')->get();
```

Operators: `=`, `!=`, `<>`, `<`, `>`, `<=`, `>=`, `LIKE`, `NOT LIKE`.

```php
Post::query()->where('status', 'published')->orWhere('featured', true)->get();

Post::query()->whereIn('status', ['draft', 'published'])->get();
Post::query()->whereNotIn('status', ['archived', 'deleted'])->get();
```

> **Note:** Empty array to `whereIn()` returns no rows (`1 = 0`). Empty array to `whereNotIn()` is a no-op.

```php
Post::query()->whereBetween('created_at', '2024-01-01', '2024-12-31')->get();
Post::query()->whereLike('title', '%PHP%')->get(); // wraps where($col, 'LIKE', $value)
Post::query()->whereNull('deleted_at')->get();
Post::query()->whereNotNull('published_at')->get();
```

Grouped conditions:

```php
// WHERE status = 'published' AND (role = 'admin' OR role = 'editor')
Post::query()
    ->where('status', 'published')
    ->whereGroup(function ($q) { $q->where('role', 'admin')->orWhere('role', 'editor'); })
    ->get();

// WHERE featured = 1 OR (status = 'published' AND views > 100)
Post::query()
    ->where('featured', 1)
    ->orWhereGroup(function ($q) { $q->where('status', 'published')->where('views', '>', 100); })
    ->get();
```

### SELECT & Columns

```php
Post::query()->select('id', 'title', 'created_at')->where('status', 'published')->get();

Post::query()
    ->select('posts.id', 'posts.title', 'users.name')
    ->join('users', 'posts.user_id', '=', 'users.id')
    ->get();
```

### ORDER, LIMIT & OFFSET

```php
Post::query()
    ->orderBy('created_at', 'DESC')
    ->orderBy('title', 'ASC')
    ->limit(10)
    ->offset(20)
    ->get();

Post::query()->latest()->get();               // ORDER BY created_at DESC
Post::query()->latest('published_at')->get();
Post::query()->oldest()->get();               // ORDER BY created_at ASC
```

### JOINs

```php
// INNER JOIN
Post::query()->select('posts.id', 'posts.title', 'users.name')
    ->join('users', 'posts.user_id', '=', 'users.id')->get();

// LEFT JOIN
Post::query()->select('posts.id', 'posts.title', 'comments.body')
    ->leftJoin('comments', 'posts.id', '=', 'comments.post_id')->get();

// RIGHT JOIN
Post::query()->select('posts.title', 'categories.name')
    ->rightJoin('categories', 'posts.category_id', '=', 'categories.id')->get();
```

> **Note:** Table/column identifiers in join conditions are validated and back-tick-quoted automatically — only alphanumerics and underscores allowed in table names.

### GROUP BY & HAVING

```php
// Categories with more than 5 published posts
Post::query()
    ->select('category_id')
    ->where('status', 'published')
    ->groupBy('category_id')
    ->having('count', '>', 5)
    ->get();
```

### Aggregates

```php
$total = Post::query()->count();
$published = Post::query()->where('status', 'published')->count();
$totalViews = Post::query()->sum('views');
$avgRating = Post::query()->avg('rating');
$lowest = Product::query()->min('price');
$highest = Product::query()->max('price');
```

### Fetching Results

```php
$posts = Post::query()->where('status', 'published')->get(); // array, [] if none

$post = Post::query()->where('slug', 'hello-world')->first(); // null if none, LIMIT 1

$post = Post::query()->where('slug', 'hello-world')->firstOrFail(); // RuntimeException if none

// No dedicated exists() — use count()
$taken = User::query()->where('email', 'alice@example.com')->count() > 0;
```

### Pagination

```php
$page = (int) request()->query('page', 1);

$result = Post::query()
    ->where('status', 'published')
    ->orderBy('created_at', 'DESC')
    ->paginate(15, $page); // 15/page
```

`paginate()` returns:

| Key | Type | Description |
|---|---|---|
| `data` | `array` | Model instances for the current page |
| `total` | `int` | Total matching rows |
| `per_page` | `int` | Items requested per page |
| `current_page` | `int` | Current page number |
| `last_page` | `int` | Total pages |
| `from` | `int\|null` | 1-based index of first item on page |
| `to` | `int\|null` | 1-based index of last item on page |

```php
$posts       = $result['data'];
$total       = $result['total'];
$currentPage = $result['current_page'];
$lastPage    = $result['last_page'];
$hasMore     = $currentPage < $lastPage;
```

> **Tip:** For JSON APIs, return the full pagination array directly with `response()->json($result)`.

### Eager Loading (N+1 Prevention)

```php
// Avoid — N+1
$posts = Post::all();
foreach ($posts as $post) { echo $post->author->name; } // 1 extra query per post

// Do this instead
$posts = Post::query()->with('author')->get();
foreach ($posts as $post) { echo $post->author->name; } // already loaded

$posts = Post::query()->with('author', 'tags', 'comments')->get(); // multiple relations

$post = Post::query()->with('author', 'tags')->where('slug', 'hello-world')->first();
```

> **Warning:** Eager loading only works for relations defined as methods (`hasOne`, `hasMany`, `belongsTo`). Accessing a relationship property without `with()` in a loop always triggers N+1.

### Raw Queries

```php
use Core\Database;
$db = app(Database::class);

$posts = $db->select('SELECT * FROM posts WHERE status = ?', ['published']);
$post  = $db->first('SELECT * FROM posts WHERE id = ?', [1]);

$ok = $db->insert('posts', ['title' => 'Hello', 'body' => 'World']);
$id = $db->lastInsertId();

$ok = $db->update('posts', ['views' => 42], '`id` = ?', [1]);
$db->delete('posts', '`id` = ?', [1]);
```

> **Warning:** Never interpolate user input directly into raw SQL — always pass values as bound parameters. Raw queries bypass QueryBuilder's identifier quoting.

```php
// Hydrate Model instances from a raw SELECT
$posts = Post::raw(
    'SELECT * FROM posts WHERE MATCH(title, body) AGAINST(? IN BOOLEAN MODE)',
    ['+PHP +framework']
);
```
