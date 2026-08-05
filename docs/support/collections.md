---
title: Collections
description: "Learn how to use LitePHP Collections to transform, filter, sort, and aggregate arrays with a fluent chainable API — including every method with real examples."
---

# Collections

> Learn how to use LitePHP Collections to transform, filter, sort, and aggregate arrays with a fluent chainable API — including every method with real examples.

`Collection` wraps a plain array in a fluent, chainable API. Every transforming method returns a **new** `Collection` — the original is never mutated. Implements `Countable`, `IteratorAggregate`, `JsonSerializable`.

### Creating Collections

```php
$numbers = collect([1, 2, 3, 4, 5]);

$users = collect([
    ['name' => 'Alice', 'role' => 'admin'],
    ['name' => 'Bob',   'role' => 'editor'],
]);

$empty = \Core\Support\Collection::make();
$posts = \Core\Support\Collection::make($postArray);
```

### Inspecting

```php
$col = collect([10, 20, 30]);
$col->count();      // 3
$col->isEmpty();    // false
$col->isNotEmpty(); // true
$col->all();        // [10, 20, 30] — raw array
```

### Transforming

```php
// map
$doubled = collect([1, 2, 3])->map(fn($n) => $n * 2); // [2, 4, 6]
$titles = collect($posts)->map(fn($post) => $post->title);

// filter — keep where true; no args removes falsy values
$published = collect($posts)->filter(fn($post) => $post->status === 'published');
$truthy = collect([0, 1, null, 'hello', false])->filter(); // [1, 'hello']

// reject — inverse of filter
$active = collect($users)->reject(fn($user) => $user->banned);
$nonEmpty = collect($items)->reject(fn($item) => empty($item));

// flatMap — map then flatten one level
$tags = collect($posts)->flatMap(fn($post) => $post->tags);

// flatten — recursive
collect([[1, 2], [3, [4, 5]]])->flatten()->all(); // [1, 2, 3, 4, 5]
```

### Aggregates

```php
collect([1, 2, 3, 4, 5])->sum();    // 15
collect([1, 2, 3])->avg();          // 2.0
collect([3, 1, 4, 1, 5])->min();    // 1
collect([3, 1, 4, 1, 5])->max();    // 5
collect([1, 2, 3])->count();        // 3

collect($orders)->sum('total');     // aggregate on a column
collect($products)->max('price');

$sum = collect([1, 2, 3, 4])->reduce(fn($carry, $item) => $carry + $item, 0); // 10
```

### Searching

```php
collect([1, 2, 3])->contains(2);                  // true
collect([1, 2, 3])->contains(fn($v) => $v > 10);  // false

collect($posts)->first();                          // or null
collect($posts)->last();                            // or null
collect($posts)->first(fn($p) => $p->featured);    // first matching
collect($posts)->find(fn($p) => $p->id === 42);    // alias for first() w/ callback
```

### Extracting Columns

```php
// pluck
$names = collect($users)->pluck('name'); // Collection(['Alice', 'Bob', 'Carol'])

// keyBy — reindex by a key's value
$usersById = collect($users)->keyBy('id');
$bySlug = collect($posts)->keyBy(fn($post) => $post->slug);

// groupBy
$byRole = collect($users)->groupBy('role');
// ['admin' => [User, User], 'editor' => [User], ...]
$byMonth = collect($orders)->groupBy(fn($o) => date('Y-m', strtotime($o->created_at)));
```

### Slicing & Paging

```php
collect($posts)->take(5);           // first 5
collect($posts)->skip(10);          // after first 10
collect($posts)->slice(10, 5);      // 5 starting at offset 10

$batches = collect($emails)->chunk(100); // Collection of Collections, 100 each
foreach ($batches as $batch) { sendEmails($batch->all()); }
```

### Sorting

```php
$sorted = collect($posts)->sortBy('title');
$newest = collect($posts)->sortBy('created_at', 'desc');
$newest = collect($posts)->sortByDesc('created_at'); // shorthand
$byLength = collect($posts)->sortBy(fn($p) => strlen($p->title));
collect([1, 2, 3])->reverse()->all(); // [3, 2, 1]
```

### Uniqueness

```php
collect([1, 2, 2, 3, 3, 3])->unique()->all(); // [1, 2, 3]
$uniqueUsers = collect($users)->unique('email');
```

### Merging and Set Operations

```php
$a = collect([1, 2, 3]);
$b = collect([3, 4, 5]);

$a->merge($b)->all();       // [1, 2, 3, 3, 4, 5]
$a->diff($b)->all();        // [1, 2]
$a->intersect($b)->all();   // [3]
```

### Keys and Values

```php
$assoc = collect(['a' => 1, 'b' => 2, 'c' => 3]);
$assoc->keys()->all();   // ['a', 'b', 'c']
$assoc->values()->all(); // [1, 2, 3] — re-indexed
```

### Iteration

```php
collect($posts)->each(function ($post) { echo $post->title . PHP_EOL; });

collect($posts)->each(function ($post) {
    if ($post->id === 99) return false; // stops iteration
    processPost($post);
});

foreach (collect($posts) as $post) { echo $post->title; } // standard foreach works
```

### Serialization

```php
$col = collect($posts);
$col->toArray();   // recursive — nested Collections become arrays
$col->toJson();     // JSON string
json_encode($col);  // same output via JsonSerializable
```

### Chaining Example

```php
$featuredTitles = collect($posts)
    ->filter(fn($p) => $p->status === 'published')
    ->reject(fn($p) => $p->sponsored)
    ->sortBy('created_at', 'desc')
    ->take(5)
    ->pluck('title');
```

```php
// branching without affecting the original
$all      = collect($posts)->filter(fn($p) => $p->status === 'published');
$recent   = $all->sortBy('created_at', 'desc')->take(10);
$featured = $all->filter(fn($p) => $p->featured)->take(3);
// $all is unchanged
```
