# Foreman CORS Configuration for Development

If you're still seeing CORS errors, you can configure Foreman to allow requests from your React app:

## Option 1: Configure Foreman Settings

1. Go to Foreman Web UI: http://localhost:3000
2. Navigate to **Administer** → **Settings** → **General**
3. Find the setting **Trusted Proxy IPs** and add: `127.0.0.1, ::1, localhost`
4. Find **CORS Domains** setting (if available) and add: `http://localhost:3001, http://localhost:3002`

## Option 2: Environment Variable (Recommended for Development)

Add this to your Foreman startup environment:

```bash
export FOREMAN_CORS_DOMAINS="http://localhost:3001,http://localhost:3002,http://localhost:3000"
export RAILS_ENV=development
```

Then restart Foreman.

## Option 3: Rails Console (Temporary Fix)

If you have access to Foreman's Rails console:

```ruby
# In Foreman Rails console
Setting.set('cors_domains', 'http://localhost:3001,http://localhost:3002,http://localhost:3000')
```

## Option 4: Nginx/Apache Proxy (Production-like)

If Foreman is behind a reverse proxy, configure it to handle CORS:

### Nginx
```nginx
location /api {
    proxy_pass http://localhost:3000;
    add_header Access-Control-Allow-Origin "http://localhost:3001" always;
    add_header Access-Control-Allow-Credentials true always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;

    if ($request_method = 'OPTIONS') {
        add_header Access-Control-Allow-Origin "http://localhost:3001";
        add_header Access-Control-Allow-Credentials true;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
        return 204;
    }
}
```

## Current Fix Applied

I've already applied a Vite proxy configuration that should handle this automatically by:

1. **Setting correct Origin header**: All requests appear to come from `http://localhost:3000`
2. **Using proxy paths**: API calls use `/api/v2` instead of full URLs
3. **Adding CORS headers**: Proxy adds proper CORS headers to responses

The React app now uses relative paths (`/api/v2`) that go through the Vite proxy, making requests appear to originate from the same origin as Foreman.