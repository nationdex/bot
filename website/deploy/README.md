# Optional: Nginx and Ngrok for the admin panel

The panel needs neither. It runs inside the bot and listens on `PANEL_PORT` (default 3000) by itself.
Use these only if you want a real domain, HTTPS, or a public address without opening ports.

| You want | Use | Needs |
| --- | --- | --- |
| A domain with HTTPS on your own server | [`nginx/nationdex-panel.conf`](nginx/nationdex-panel.conf) | Nginx, a domain, certbot |
| Nginx on a LAN or behind another TLS layer | [`nginx/nationdex-panel.http.conf`](nginx/nationdex-panel.http.conf) | Nginx |
| A quick public HTTPS address, no port forwarding | [`ngrok/ngrok.yml.example`](ngrok/ngrok.yml.example) or `bun run panel:ngrok` | Ngrok account (free) |

You can combine them (Ngrok in front of the panel while Nginx is not used, or Nginx alone). They do not depend on each other.

## Nginx

1. Put `PANEL_HOST=127.0.0.1` in `website/.env` so only Nginx reaches the panel, then restart the bot.
2. Copy a config to `/etc/nginx/conf.d/`, change `panel.example.com`, run `sudo nginx -t && sudo systemctl reload nginx`.
   The HTTPS file lists the certbot command at the top. It also rate-limits the sign-in form and adds security headers.
3. Browse to your domain. The panel marks its session cookie `Secure` when Nginx tells it the visitor used HTTPS.

## Ngrok

Quick one-liner (after `ngrok config add-authtoken <token>` once):

```sh
bun run panel:ngrok
```

With the config file (keeps a static domain in one place; the copy is git-ignored):

```sh
cp website/deploy/ngrok/ngrok.yml.example website/deploy/ngrok/ngrok.yml
NGROK_AUTHTOKEN=<token> ngrok start panel --config website/deploy/ngrok/ngrok.yml
```

While the tunnel runs the panel is public: use a strong owner password. Never write your auth token into a file you
commit. Ngrok's free plan may show a one-time warning page to visitors.

## HTTPS without a proxy

The panel can also serve HTTPS itself: set `PANEL_TLS_CERT` and `PANEL_TLS_KEY` (paths to a certificate and key) in `website/.env`.

## Why HTTPS matters here

Browsers only ask for Brotli, allow installing the panel as an app (PWA), and keep the `Secure` cookie over HTTPS
(localhost counts as secure). Over plain HTTP on a LAN address the panel still works, with gzip and as a normal page.
