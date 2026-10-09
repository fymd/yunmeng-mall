# Reverse proxy examples — Nginx / Caddy

Assume the Next.js app listens on `127.0.0.1:3000`.

## Caddy

```caddyfile
your-domain.com {
  encode gzip

  reverse_proxy 127.0.0.1:3000

  header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains"
  }
}
```

## Nginx

```nginx
server {
  listen 80;
  server_name your-domain.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name your-domain.com;

  ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

  client_max_body_size 8m;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

## Environment

```env
NEXTAUTH_URL=https://your-domain.com
# Alipay/WeChat notify_url must use the same public HTTPS origin
```
