# 🏆 DramaForge Hackathon Submission Summary

This document serves as the official project submission guide for **Track 2: AI Showrunner** of the Global AI Hackathon Series. It contains the live URL, proof of deployment, and a detailed functional summary.

---

## 🔗 Project Metadata

* **Live Web App Link:** [https://dramaforge.duckdns.org](https://dramaforge.duckdns.org)
* **GitHub Repository:** [https://github.com/Dannyblaq15/drama-forge](https://github.com/Dannyblaq15/drama-forge)
* **API Technologies:** Qwen Cloud, Alibaba Cloud Model Studio, Alibaba Cloud OSS, ApsaraDB RDS MySQL, Firebase Auth.
* **Orchestration Stages:** 7 Stages (Hook -> Story -> Script -> Storyboard -> Video -> Audio -> Edit).

---

## ☁️ Proof of Alibaba Cloud Deployment

DramaForge has been deployed on a **dedicated Alibaba Cloud ECS (Elastic Compute Service) Instance** in Singapore/Beijing regions running Ubuntu 22.04 LTS.

### 🛡️ Production Infrastructure Layout:
1. **Application Runtime:** The Next.js 15.5 app runs natively on Node.js v20 under **PM2** (Process Manager 2) on local port `3000`. PM2 handles auto-restarts, process crashes, and system reboot survival.
2. **Reverse Proxy (Nginx):** Nginx is installed on port 80/443 as a reverse proxy, forwarding web traffic dynamically to `http://127.0.0.1:3000` while proxying websocket upgrades and headers.
3. **SSL/TLS Encryption (Let's Encrypt):** A valid, secure SSL/TLS certificate was generated and installed via **Certbot** for `dramaforge.duckdns.org`. It automatically redirects all standard HTTP traffic to secure HTTPS.
4. **Dynamic DNS (DuckDNS):** A background cron script runs on the ECS server every 5 minutes to verify and update the public IP address mapping on DuckDNS.
5. **Database Persistence:** Real-time character visuals and script blueprints are persisted inside a secure **Alibaba ApsaraDB RDS MySQL Database Instance** located in Singapore.

---

## 📄 Written Functional Summary

### 1. Unified Next.js Single-Process Architecture
We restructured the legacy monorepo (split Next.js/NestJS servers) into a single, flat Next.js application. All background orchestration services, database models, and FFmpeg transcoding pipelines run natively inside Next.js API Routes, making local execution and cloud deployment lightweight.

### 2. Autonomous 7-Stage Showrunner Pipeline
From a single-line user premise (e.g. *"A billionaire janitor catches the CFO red-handed"*), DramaForge executes seven autonomous stages:
* **Stage 1 (Hook Strategist):** Uses `qwen-max` to formulate the commercial title, short genre, and target runtime.
* **Stage 2 (Story Architect):** Uses `qwen-max` to compile story outline beats containing a main plot and a hidden reversal.
* **Stage 3 (Scriptwriter):** Spawns parallel prompts to `qwen-plus` to compile dialogue lines and character actions per scene.
* **Stage 4 (Storyboard Director):** Uses `qwen-max` to calculate mobile-friendly camera framing (e.g., Close-up, Medium-shot) and relative coordinate placements.
* **Stage 5 (Casting & Video Engine):** Searches for existing visual character sheets. If none exist, it generates consistent character portraits using `wan2.7-image`, uploads them to OSS, and caches them. It then triggers `wan2.1-i2v-720p` (or `wanx2.1-t2v-turbo`) image-to-video models on Alibaba Model Studio to render consistent video clips.
* **Stage 6 (Audio & Music Scoring):** Downloads a stock cinematic music backing track and overlays it onto the video, automatically cutting the music at the exact end of the clips using FFmpeg `-shortest` commands.
* **Stage 7 (Post-Production Editing):** Downloads all clips locally, scales them to vertical `720x1280` mobile format, burns dynamic subtitles at the bottom center of the frame, and concatenates them with smooth Cuts using a native `ffmpeg` process.

### 3. Economy Mode & Token Budget Limiter
* DramaForge protects you from runaway API bills by enforcing a **Token Budget Cap** (e.g., $1.00 maximum per run) defined in the UI.
* **Economy Mode:** As the stages progress, a telemetry module tracks cumulative tokens and costs. If the cost exceeds **80% of the set budget**, the orchestrator automatically downgrades remaining Scriptwriter and Storyboard steps from `qwen-max` to the cost-efficient `qwen-plus` model.

### 4. Interactive Timeline Editor
* Allows users to load their video libraries, rearrange clips in a multi-track editor, modify subtitle captions, and trigger custom FFmpeg video/audio renders.
* **Timeline Persistence:** All timeline assemblies are saved in real-time to the browser's `localStorage`, allowing users to navigate between tabs or write new scripts without losing their work.
