---
title: Mail
description: "Send transactional email via SMTP using Mailable classes. Queue for background delivery, render view templates, and set recipients with a fluent API."
---

# Mail

> Send transactional email via SMTP using Mailable classes. Queue for background delivery, render view templates, and set recipients with a fluent API.

Each `Mailable` class represents one email — knows its recipients, subject, body. Send immediately (blocking) or queue via `Mailer::queue()`.

### Configuration

```ini
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=587
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourapp.com
MAIL_FROM_NAME="My App"
```

```php
// config/mail.php
return [
    'host'       => env('MAIL_HOST', 'localhost'),
    'port'       => env('MAIL_PORT', 587),
    'username'   => env('MAIL_USERNAME', ''),
    'password'   => env('MAIL_PASSWORD', ''),
    'encryption' => env('MAIL_ENCRYPTION', 'tls'),
    'from'       => ['address' => env('MAIL_FROM_ADDRESS', 'noreply@example.com'), 'name' => env('MAIL_FROM_NAME', 'LitePHP')],
];
```

`MAIL_ENCRYPTION`: `tls` (STARTTLS, port 587, default), `ssl` (implicit TLS, port 465), or `none`.

### Creating a Mailable

```bash
php lite make:mail WelcomeEmail
```

```php
namespace App\Mail;
use Core\Mail\Mailable;
use App\Models\User;

class WelcomeEmail extends Mailable
{
    public function __construct(private User $user) {}

    public function build(): void
    {
        $this->to($this->user->email)
            ->subject('Welcome to ' . config('app.name'))
            ->view('emails.welcome', ['userName' => $this->user->name, 'loginUrl' => url('/login')]);
    }
}
```

`view()` renders a plain PHP template from `app/views/` — `'emails.welcome'` → `app/views/emails/welcome.php`.

```html
<!-- app/views/emails/welcome.php -->
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body>
    <h1>Welcome, <?= e($userName) ?>!</h1>
    <p>Your account is ready. <a href="<?= e($loginUrl) ?>">Log in now</a>.</p>
</body></html>
```

> **Note:** Email templates use plain PHP (`<?= ?>`), not `.lites` directives. LitePHP validates the resolved path stays inside `app/views/` — path-traversal throws `RuntimeException`.

### Complete Send-with-Template Example

```php
// app/Mail/OrderConfirmation.php
namespace App\Mail;
use Core\Mail\Mailable;

class OrderConfirmation extends Mailable
{
    public function __construct(private array $order, private array $customer) {}

    public function build(): void
    {
        $this->to($this->customer['email'])
            ->cc('billing@yourapp.com')
            ->subject('Order #' . $this->order['id'] . ' Confirmed')
            ->view('emails.order-confirmation', [
                'order' => $this->order,
                'customerName' => $this->customer['name'],
                'supportEmail' => config('mail.from.address'),
            ]);
    }
}
```

```html
<!-- app/views/emails/order-confirmation.php -->
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family: sans-serif; color: #333;">
    <h1>Thank you, <?= e($customerName) ?>!</h1>
    <p>Your order <strong>#<?= e($order['id']) ?></strong> has been confirmed.</p>
    <table>
        <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
        <tbody>
            <?php foreach ($order['items'] as $item): ?>
            <tr><td><?= e($item['name']) ?></td><td><?= e($item['qty']) ?></td><td>$<?= number_format($item['price'] / 100, 2) ?></td></tr>
            <?php endforeach; ?>
        </tbody>
    </table>
    <p>Questions? Reply to <a href="mailto:<?= e($supportEmail) ?>"><?= e($supportEmail) ?></a>.</p>
</body></html>
```

```php
// app/Controllers/OrderController.php
namespace App\Controllers;
use Core\Mail\Mailer;
use App\Mail\OrderConfirmation;

class OrderController
{
    public function store(): never
    {
        $order    = Order::create(request()->all());
        $customer = auth();

        Mailer::queue(new OrderConfirmation($order->toArray(), $customer), queue: 'emails'); // response returns immediately

        flash('success', 'Order #' . $order->id . ' placed!');
        redirect('/orders/' . $order->id);
    }
}
```

```bash
php lite queue:work --queue=emails
```

### Sending Email

```php
// Immediately (blocking)
use Core\Mail\Mailer;
Mailer::send(new WelcomeEmail($user));
mail_send(new WelcomeEmail($user)); // global helper

// Queued (non-blocking)
Mailer::queue(new WelcomeEmail($user));
Mailer::queue(new WelcomeEmail($user), delay: 30, queue: 'emails');
```

### Fluent Mailable API

```php
$email = new OrderConfirmation($order, $customer);
$email->to($customer['email'])
    ->cc('billing@yourapp.com')
    ->bcc('archive@yourapp.com')
    ->subject('Order #' . $order['id'] . ' Confirmed');
Mailer::send($email);
```

```php
// Inline HTML, no template
(new MyMailable())->to('user@example.com')->subject('Quick update')
    ->html('<h1>Your task is complete!</h1><p>Log in to view the results.</p>');

// Plain text
(new MyMailable())->to('user@example.com')->subject('Your export is ready')
    ->text('Your CSV export is ready. Log in to download it.');

// Multiple recipients
(new WeeklyDigest())->to(['alice@example.com', 'bob@example.com'])
    ->cc(['manager@yourapp.com'])->subject('Weekly Digest');
```

### Raw Email

```php
use Core\Mail\Mailer;
Mailer::raw(to: 'user@example.com', subject: 'Quick notification', body: 'Your background task finished successfully.', isHtml: false);
```

### Security

> **Note:** Every address validated with `filter_var(FILTER_VALIDATE_EMAIL)`; CR/LF stripped from header values before hitting the SMTP socket — prevents header injection from user-supplied data.

> **Warning:** Never log or display SMTP credentials — keep them in `.env`, excluded via `.gitignore`.
