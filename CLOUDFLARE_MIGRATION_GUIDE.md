# Cloudflare Migration & Cold-Start Resolution Guide

This document outlines how to resolve cold-start issues on Render and migrate the **Deck Backend** (`api_connect`) to **Cloudflare** for free.

---

## 📌 Problem Overview
Render's Free Tier spins down inactive web services after **15 minutes**. When a new API request arrives, Render spins up the container from scratch, leading to a **50–90 second latency spike (cold start)**.

---

## ⚡ Solution 1: Zero-Code Fix (Keep Render 24/7 Awake)

If you want to keep your existing Node.js + Express setup on Render without any code changes, use a free ping monitor to keep the server warm.

### Steps:
1. Sign up for a free monitor on **[cron-job.org](https://cron-job.org)** or **[UptimeRobot](https://uptimerobot.com)**.
2. Create an **HTTP / GET** monitor pointing to your health check endpoint:
   ```text
   https://deck-api-g59h.onrender.com/health
   ```
3. Set the schedule to run **every 10 minutes** (Render sleeps after 15 minutes).
4. **Outcome**: The service stays continuously awake with 0 cold starts.

---

## 🌐 Solution 2: Migrate to Cloudflare Workers (0ms Cold Starts)

Cloudflare Workers runs on V8 Isolates across 300+ edge locations worldwide, providing **0ms cold starts** and a generous free tier (100,000 requests/day).

### Architecture Difference

```
[ Traditional Server (Render) ]
Client Request ──> Render Container (OS + Node.js) ──> Long-running process (port 5000)

[ Edge Worker (Cloudflare) ]
Client Request ──> Cloudflare Edge Node (V8 Isolate) ──> Event fetch(request) ──> Fast Response
```

---

### Step-by-Step Migration Instructions

### 1. Install Wrangler & Workers Adapter
Install the Cloudflare developer CLI (`wrangler`) and compatibility packages:

```bash
npm install --save-dev wrangler @cloudflare/workers-adapter
```

---

### 2. Add `wrangler.jsonc` Configuration
Create a file named `wrangler.jsonc` in the root of your project:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "deck-backend",
  "main": "src/worker.js",
  "compatibility_date": "2024-09-23",
  "compatibility_flags": ["nodejs_compat"],
  "vars": {
    "NODE_ENV": "production"
  }
}
```

---

### 3. Create Edge Worker Entrypoint (`src/worker.js`)
Create `src/worker.js` to bridge incoming Cloudflare Worker requests into your Express application:

```javascript
import app from './App';

export default {
  async fetch(request, env, ctx) {
    // Forward environment secrets to process.env
    if (env.MONGODB_URI) process.env.MONGODB_URI = env.MONGODB_URI;
    if (env.PATH_API) process.env.PATH_API = env.PATH_API;
    if (env.JWT_SECRET) process.env.JWT_SECRET = env.JWT_SECRET;
    if (env.REFRESH_TOKEN_SECRET) process.env.REFRESH_TOKEN_SECRET = env.REFRESH_TOKEN_SECRET;

    // Return the response handled by Express
    return new Promise((resolve) => {
      app(request, resolve);
    });
  },
};
```

---

### 4. Adapt Database Connection (`src/db/data.js`)
Ensure MongoDB connections are reused across serverless invocations rather than opened repeatedly:

```javascript
const mongoose = require('mongoose');

let cachedConnection = null;

async function connectDB() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  const uri = process.env.MONGODB_URI || process.env.PATH_API;
  if (!uri) {
    throw new Error('Database URI is missing in environment variables.');
  }

  cachedConnection = await mongoose.connect(uri, {
    bufferCommands: false,
    maxPoolSize: 10,
  });

  return cachedConnection;
}

module.exports = { connectDB };
```

> **Important MongoDB Atlas Setting:**  
> In MongoDB Atlas, go to **Network Access** > **IP Access List** and ensure `0.0.0.0/0` (Allow access from anywhere) is enabled, as Cloudflare Workers run across dynamic edge IP addresses.

---

### 5. Login and Deploy via Wrangler

1. **Login to Cloudflare:**
   ```bash
   npx wrangler login
   ```

2. **Add Your Secrets:**
   ```bash
   npx wrangler secret put MONGODB_URI
   npx wrangler secret put JWT_SECRET
   npx wrangler secret put REFRESH_TOKEN_SECRET
   ```

3. **Deploy to Cloudflare:**
   ```bash
   npx wrangler deploy
   ```

4. Your API will be live at:
   ```
   https://deck-backend.<your-cloudflare-subdomain>.workers.dev
   ```

---

## 📊 Comparison Matrix

| Metric | Render Free Tier | Render + 10m Keep-Alive | Cloudflare Workers Free |
| :--- | :--- | :--- | :--- |
| **Cold Start** | ~50–90 seconds | **0 seconds** | **0 milliseconds** |
| **Effort** | None | **2 minutes (No code change)** | ~15 minutes setup |
| **Cost** | Free | **Free** | **Free (100k req/day)** |
| **Max Execution Time** | Unlimited | Unlimited | 50ms CPU time |
| **Edge Global Distribution** | No (Single Region) | No (Single Region) | Yes (300+ Locations) |

---

## 🛠 Useful NPM Scripts
Add these to your `package.json` for easy local development and deployment:

```json
"scripts": {
  "deploy:cf": "wrangler deploy",
  "dev:cf": "wrangler dev"
}
```
