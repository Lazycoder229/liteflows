---
title: HTTP Client
description: "Make outbound API requests with LitePHP's HTTP client. No cURL required — PHP streams power a fluent builder with Bearer auth and JSON response helpers."
---

# HTTP Client

> Make outbound API requests with LitePHP's HTTP client. No cURL required — PHP streams power a fluent builder with Bearer auth and JSON response helpers.

Uses native PHP stream wrappers — no cURL extension needed. Responses wrapped in `ClientResponse`.

### Basic Requests

```php
use Core\Http\Client;

$response = Client::get('https://api.example.com/users');
$response = Client::get('https://api.example.com/users', ['page' => 2, 'per_page' => 20]);
$response = Client::post('https://api.example.com/users', ['name' => 'Alice', 'email' => 'alice@example.com']);
$response = Client::put('https://api.example.com/users/1', ['name' => 'Alice Smith']);
$response = Client::patch('https://api.example.com/users/1', ['email' => 'alice.smith@example.com']);
$response = Client::delete('https://api.example.com/users/1');
```

`Content-Type: application/json` is set automatically and the body `json_encode()`d for `post()`/`put()`/`patch()`.

### Fluent Configuration

```php
use Core\Http\Client;

$client = (new Client())
    ->baseUrl('https://api.example.com')
    ->withToken('your-api-token')     // Authorization: Bearer <token>
    ->withHeader('Accept', 'application/json')
    ->withHeader('X-API-Version', '2')
    ->timeout(30);

$users    = $client->get('/users');       // relative to baseUrl
$newUser  = $client->post('/users', ['name' => 'Bob', 'email' => 'bob@example.com']);
$specific = $client->get('/users/42');
```

| Method | Description |
|---|---|
| `baseUrl(string $url)` | Prepend to all relative request paths |
| `withToken(string $token)` | Set `Authorization: Bearer <token>` |
| `withHeader(string $key, string $value)` | Set an arbitrary header |
| `timeout(int $seconds)` | Max wait, default 10 |

### Working with Responses

```php
$response = Client::get('https://api.example.com/posts');

$status = $response->status();  // e.g. 200, 404, 500
$raw    = $response->body();     // raw string
$posts  = $response->json();     // array|null

if ($response->ok()) { /* 2xx */ }
if ($response->failed()) { /* 4xx/5xx */ }

$response->throw(); // RuntimeException if status >= 400
```

### Error Handling

```php
$response = Client::get('https://api.example.com/posts/999');

if ($response->failed()) {
    $body = $response->json();
    log_message('error', 'Post lookup failed: ' . ($body['message'] ?? 'unknown error'));
    return ['error' => 'Post not found', 'status' => $response->status()];
}
return $response->json();
```

```php
$data = Client::get('https://api.example.com/users/1')->throw()->json();
```

### Practical Example: Payment Gateway Integration

```php
namespace App\Services;
use Core\Http\Client;

class StripeService
{
    private Client $client;

    public function __construct()
    {
        $this->client = (new Client())
            ->baseUrl('https://api.stripe.com/v1')
            ->withToken(config('services.stripe.secret'))
            ->withHeader('Stripe-Version', '2023-10-16')
            ->timeout(30);
    }

    public function charge(int $amountCents, string $currency, string $source): array
    {
        $response = $this->client->post('/charges', ['amount' => $amountCents, 'currency' => $currency, 'source' => $source]);

        if ($response->failed()) {
            $error = $response->json();
            throw new \RuntimeException('Stripe charge failed: ' . ($error['error']['message'] ?? 'Unknown error'));
        }
        return $response->json();
    }

    public function refund(string $chargeId): array
    {
        return $this->client->post('/refunds', ['charge' => $chargeId])->throw()->json();
    }

    public function getCustomer(string $customerId): array
    {
        return $this->client->get('/customers/' . $customerId)->throw()->json();
    }
}
```

```php
namespace App\Controllers;
use App\Services\StripeService;

class PaymentController
{
    public function __construct(private StripeService $stripe) {}

    public function charge(): never
    {
        try {
            $charge = $this->stripe->charge(
                amountCents: (int) request('amount') * 100,
                currency:    'usd',
                source:      request('stripe_token')
            );
            flash('success', 'Payment of $' . request('amount') . ' confirmed.');
            redirect('/orders/' . $charge['id']);
        } catch (\RuntimeException $e) {
            flash('error', $e->getMessage());
            redirect('/checkout');
        }
    }
}
```

### Sending Custom Request Types

```php
$client = new Client();
$response = $client->request('OPTIONS', 'https://api.example.com/resource');
$response = $client->request('POST', 'https://api.example.com/webhooks', ['event' => 'order.shipped', 'orderId' => 42]);
```

### Best Practices

> **Tip:** Use `baseUrl()` for any API called more than once — trivial to swap staging/production via config.

> **Tip:** Set explicit `timeout()` on every client instance — 15–30 seconds is a reasonable upper bound.

> **Warning:** Never hardcode API keys — store in `.env`, read with `config()`/`env()`.

> **Note:** Uses `file_get_contents()` with a stream context and `verify_peer: true` — respects your PHP install's CA bundle. SSL errors in dev usually mean `curl.cainfo`/`openssl.cafile` needs setting in `php.ini`.
