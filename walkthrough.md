# 🚀 Walkthrough — Monorepo Restructuring & QwenAI Badge

We have restructured the **drama-forge** project from a split Next.js/NestJS monorepo into a single, flat, self-contained Next.js application, exactly matching the clean layout of your `startup-sim` repository.

---

## 🛠️ Changes Completed

### 1. Merged Server & Frontend Architectures
* **NestJS Eliminated:** Completely removed the complex NestJS backend server, removing overhead and avoiding startup and CORS problems.
* **Plain TypeScript Services:** All NestJS background orchestrators, pipeline generators, and AI services (Qwen/DashScope, Casting, Video Generation, FFmpeg Post-Production) have been converted into clean, optimized TypeScript service modules in [src/services/](file:///Users/mac/drama-forge/src/services/).
* **Prisma Singleton:** Created a single central Prisma client connection pool at [src/lib/prisma.ts](file:///Users/mac/drama-forge/src/lib/prisma.ts) for optimal resource management.

### 2. Implemented Next.js App Router API Endpoints
Recreated all original backend endpoints directly inside Next.js App Router:
* `POST /api/episodes/generate` → Triggers the background pipeline asynchronously.
* `GET  /api/episodes/[id]`     → Fetches the generated episode details.
* `GET  /api/episodes/[id]/progress` → Exposes the real-time progress events for polling.
* `GET  /api/characters/[projectId]` → Retrieves the project's cast characters.
* `POST /api/editing/compile`   → Runs FFmpeg and subtitle burn-in overlays on custom video tracks.

### 3. Sockets Replaced with Stateless HTTP Polling
* Refactored [src/components/studio-activity.tsx](file:///Users/mac/drama-forge/src/components/studio-activity.tsx) to use standard HTTP polling rather than Socket.io WebSockets. This makes progress reports robust, stateless, and fully compatible with any serverless or static hosting deployment.

### 4. Added "Powered with QwenAI" Badge
* Added a floating, premium-looking glassmorphic pill badge in [src/app/layout.tsx](file:///Users/mac/drama-forge/src/app/layout.tsx). It features a subtle pulsing indigo dot and automatically displays across **every single page** of the app (landing page, login, studio dashboard, timeline compiler, profile, etc.).

---

## 💻 How to Run

Since the layout is now flat, you only need to run:

```bash
# 1. Install dependencies
npm install

# 2. Build the client schema
npx prisma generate

# 3. Start development server
npm run dev
```

Both pages and backend compile steps will run seamlessly on **Port 3000**!

---

## 🚀 Native Ubuntu & PM2 Deployment (Without Docker)

You can run the Next.js application natively on your Ubuntu-based ECS server in the background using PM2:

### 1. Install System Dependencies on ECS
Run this on your ECS terminal to set up the Node.js environment and FFmpeg:
```bash
sudo apt-get update -y

# Install Node.js 20 and NPM
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install FFmpeg for post-production compilation
sudo apt-get install -y ffmpeg

# Install PM2 globally
sudo npm install -g pm2
```

### 2. Build the App
In your project directory on the ECS instance:
```bash
npm install
npx prisma generate
npm run build
```

### 3. Start App with PM2
Binds Next.js port `3000` directly to HTTP port `80`:
```bash
PORT=80 pm2 start npm --name "dramaforge" -- start
pm2 startup
pm2 save
```
