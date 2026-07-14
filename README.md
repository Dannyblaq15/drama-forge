# 🎬 DramaForge — AI Showrunner Studio

DramaForge is an autonomous, vertical short-drama generation platform built for **Track 2: AI Showrunner** of the Global AI Hackathon Series with Qwen Cloud. 

From a single-line premise input, DramaForge orchestrates a **seven-agent pipeline** using **Qwen Cloud** and **Alibaba Cloud Model Studio** to write, cast, storyboard, generate, score audio, and edit a final high-fidelity vertical mobile short-drama video, running autonomously under a real-time token budget cap.

---

## 🔗 Project Metadata & Live Deployment

* **Live Web App Link:** [https://dramaforge.duckdns.org](https://dramaforge.duckdns.org)
* **GitHub Repository:** [https://github.com/Dannyblaq15/drama-forge](https://github.com/Dannyblaq15/drama-forge)
* **API Technologies:** Qwen Cloud, Alibaba Cloud Model Studio, Alibaba Cloud OSS, ApsaraDB RDS MySQL, Firebase Auth.
* **Orchestration Stages:** 7 Stages (Hook -> Story -> Script -> Storyboard -> Video -> Audio -> Edit).

---

## ☁️ Proof of Alibaba Cloud Deployment

DramaForge is successfully deployed on a **dedicated Alibaba Cloud ECS (Elastic Compute Service) Instance** in Singapore/Beijing regions running Ubuntu 22.04 LTS.

### 🛡️ Production Infrastructure Layout:
1. **Application Runtime:** The Next.js 15.5 app runs natively on Node.js v20 under **PM2** (Process Manager 2) on local port `3000`. PM2 handles auto-restarts, process crashes, and system reboot survival.
2. **Reverse Proxy (Nginx):** Nginx is installed on port 80/443 as a reverse proxy, forwarding web traffic dynamically to `http://127.0.0.1:3000` while proxying websocket upgrades and headers.
3. **SSL/TLS Encryption (Let's Encrypt):** A valid, secure SSL/TLS certificate was generated and installed via **Certbot** for `dramaforge.duckdns.org`. It automatically redirects all standard HTTP traffic to secure HTTPS.
4. **Dynamic DNS (DuckDNS):** A background cron script runs on the ECS server every 5 minutes to verify and update the public IP address mapping on DuckDNS.
5. **Database Persistence:** Real-time character visuals and script blueprints are persisted inside a secure **Alibaba ApsaraDB RDS MySQL Database Instance** located in Singapore.

---

## 📐 System Architecture Diagram & Data Flow

Below is the conceptual layout of the components and data flow:

```
+-----------------------------------------------------------------------------------+
|                            UNIFIED Next.js WEB APP                                |
|  - UI: Premise Inputs, Budget Controls, Stepper & Live Cost Meter                 |
|  - Backend: 7-Agent Orchestrator, Telemetry Logger, local FFmpeg video engine     |
+-----------------------------------------------------------------------------------+
                                         │  ▲ (REST HTTP Polling)
                                         ▼  │
+-----------------------------------------------------------------------------------+
|                              DATABASE & ALIBABA SERVICES                          |
|  - Prisma DB: Character visual assets & Episode configurations                     |
|  - Qwen Cloud / DashScope: Text LLM & Wan Image/Video generators                  |
|  - OSS Storage: Stores generated portraits and mp4 video streams                  |
+-----------------------------------------------------------------------------------+
         │                               │                                │
         ▼ (SQL / Prisma)                ▼ (REST APIs)                    ▼ (OSS SDK)
+------------------+           +------------------+             +-------------------+
|   ApsaraDB RDS   |           |    Qwen Cloud    |             | Alibaba Cloud OSS |
| - MySQL Database |           | - DashScope MaaS |             | - Storage Bucket  |
| - Character logs |           | - Qwen / Wan     |             | - Media cache     |
+------------------+           +------------------+             +-------------------+
```

### Flow Sequence:
1. **User Setup:** User inputs a premise and budget in the Web Dashboard. Next.js triggers the orchestrator API (`POST /api/episodes/generate`).
2. **Orchestrator Sequence (7 Stages):**
   * **Stage 1 (Hook Strategist):** Queries `qwen-max` to formulate commercial hook outlines, title, and genre.
   * **Stage 2 (Story Architect):** Queries `qwen-max` to draft scenes using a dual-line plot structure (main plot + hidden reversal).
   * **Stage 3 (Scriptwriter):** Spawns parallel queries to `qwen-plus` to write dialogues and actions per scene.
   * **Stage 4 (Storyboard Director):** Spawns parallel queries to `qwen-max` to map camera angles, framing, and durations.
   * **Stage 5 (Casting & Video Engine):** Resolves character profiles in ApsaraDB RDS. Generates character portraits using `wan2.7-image`, uploads them to OSS, and caches them. Then, uses reference-guided `wan2.1-i2v-720p` (or `wanx2.1-t2v-turbo`) to render consistent character clips.
   * **Stage 6 (Audio & Music Scoring):** Downloads and caches cinematic stock backing tracks and merges sound scoring dynamically with duration-matching cuts.
   * **Stage 7 (Post-Production):** Formats clips to `720x1280` vertical, overlays dialogue subtitles, and concatenates clips using `ffmpeg` child processes.
3. **Telemetric Loop:** Throughout the run, the server writes logs and token costs to a persistent file (`tmp/pipeline-logs/`). The frontend polls `/api/episodes/[id]/progress` to render real-time progress. If costs cross 80% of the budget, **Economy Mode** automatically downgrades subsequent LLM calls from `qwen-max` to `qwen-plus`.
4. **Final Delivery:** The compiled mp4 video with audio overlay is saved to OSS and loaded into the dashboard player.

---

## ⚙️ Pipeline Agent Orchestration Flow (7 Stages)

```mermaid
graph TD
    Premise[User Premise Input] --> Stage1[Stage 1: Hook Strategist <br> qwen-max]
    Stage1 --> Stage2[Stage 2: Story Architect <br> qwen-max]
    Stage2 --> Stage3[Stage 3: Scriptwriter <br> Parallel qwen-plus]
    Stage3 --> Stage4[Stage 4: Storyboard Director <br> Parallel qwen-max]
    Stage4 --> Stage5[Stage 5: Casting & Video Engine <br> Wan Image & Video]
    Stage5 --> Stage6[Stage 6: Audio & Music <br> Sound Scoring Engine]
    Stage6 --> Stage7[Stage 7: Post-Production <br> FFmpeg Stitching]
    Stage7 --> FinalVideo[Vertical Episode Video + Audio + Screenplay]

    subgraph Budget Telemetry
        Stage1 -.-> CostCheck{Cost >= 80% Budget?}
        Stage2 -.-> CostCheck
        Stage3 -.-> CostCheck
        Stage4 -.-> CostCheck
        CostCheck -- Yes --o Economy[Economy Mode: Downgrade to qwen-plus]
    end
```

---

## 📄 JSON Schema Contracts (Agent Boundaries)

### 1. Hook Strategist Output
```json
{
  "title": "string (<= 15 characters)",
  "genre": "string (e.g., Cyberpunk, Werewolf, Revenge)",
  "commercialAngle": "string (commercial hook explanation)",
  "targetRuntimeSeconds": "number (range 60 - 120)"
}
```

### 2. Story Architect Output
```json
{
  "scenes": [
    {
      "sceneId": "string (e.g. scene_1)",
      "setting": "string (physical environment details)",
      "charactersPresent": ["string (character names)"],
      "emotionalBeat": "string (beat tone)",
      "plotLine": "string (must be 'main' or 'hidden')"
    }
  ]
}
```

### 3. Scriptwriter Output (Per Scene)
```json
{
  "sceneId": "string",
  "dialogue": [
    {
      "character": "string",
      "line": "string"
    }
  ],
  "actionLines": ["string (actions & expressions)"],
  "cameraDirection": "string (camera framing details)"
}
```

### 4. Storyboard Director Output (Per Scene)
```json
{
  "shots": [
    {
      "shotId": "string (e.g. shot_1_1)",
      "composition": "string (e.g. Close-up, Medium shot)",
      "characterPositions": "string (9:16 layout coordinates)",
      "cameraAngle": "string (e.g. Low angle, Dutch angle)",
      "durationSeconds": "number (duration of the shot)"
    }
  ]
}
```

---

## 🛠️ Getting Started & Setup

### Prerequisites
* **Node.js:** v18 or later
* **FFmpeg:** Pre-installed on target host machine (used for video pad/scale/concatenation)
  ```bash
  # macOS
  brew install ffmpeg
  # Ubuntu/ECS
  sudo apt-get update && sudo apt-get install -y ffmpeg
  ```

### Environment Variables
Configure the `.env` file located at the project root directory:
```env
# Alibaba Cloud Model Studio API Credentials
ALIBABA_API_KEY="your-dashscope-api-key"
ALIBABA_DASHSCOPE_URL="https://dashscope-intl.aliyuncs.com/api/v1"
ALIBABA_OPENAI_COMPATIBLE_URL="https://dashscope-intl.aliyuncs.com/compatible-mode/v1"

# Alibaba ApsaraDB RDS (MySQL)
DATABASE_URL="mysql://username:password@rds-endpoint:3306/database_name"

# Alibaba Object Storage Service (OSS) Configuration
ALIBABA_OSS_REGION="oss-ap-southeast-1"
ALIBABA_OSS_BUCKET="your-bucket-name"
ALIBABA_ACCESS_KEY_ID="your-access-key-id"
ALIBABA_ACCESS_KEY_SECRET="your-access-key-secret"
```

### Running Locally
To launch the unified application:
```bash
# 1. Install dependencies
npm install

# 2. Build the database client
npx prisma generate

# 3. Start development server
npm run dev # Access http://localhost:3000
```

---

## ☁️ Alibaba Cloud ECS & PM2 Deployment

We deploy the application natively on a **dedicated Alibaba ECS Ubuntu instance** in Singapore/Beijing regions:

1. **Setup Node & FFmpeg on ECS:**
   ```bash
   sudo apt-get update
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs ffmpeg
   sudo npm install -g pm2
   ```
2. **Clone & Build:**
   ```bash
   git clone https://github.com/Dannyblaq15/drama-forge.git
   cd drama-forge
   npm install
   npx prisma generate
   npm run build
   ```
3. **Run on HTTP Port 80:**
   ```bash
   PORT=80 pm2 start npm --name "dramaforge" -- start
   pm2 startup
   pm2 save
   ```

---

## 💼 Commercial & Community Scaling

### 1. The Pain Point
Traditional video production is slow, expensive, and out of reach for independent creators, content marketers, and small studios. In fast-growing vertical media sectors—such as the booming West African short-drama/skit scene—creators spend thousands of dollars on equipment, actors, and post-production editing for brief social media skits. DramaForge solves this by providing a zero-crew, end-to-end video synthesis pipeline that can write, cast, render, and subtitle a vertical episode for less than $0.20 in API tokens.

### 2. Community & Custom Developer Scaling
DramaForge can scale as a fully local or private developer suite:
* **Custom Character Libraries:** Developers can plug in their own local Stable Diffusion or LoRA adapters for highly specific visual identities.
* **Unified Pipeline API:** Exposes endpoints to integrate DramaForge with local renderers, custom voiceover tools, or headless vertical content channels.
* **Enterprise Deployments:** Run the full pipeline inside private VPC environments on Alibaba Cloud ECS to handle batch creation scripts for marketing agencies and studios.

### 3. Open Source Reusability
The core orchestration mechanics of DramaForge are completely decoupled from this specific interface. Any team can reuse:
* The typed seven-agent workflow contracts (Hook -> Story -> Script -> Storyboard -> Video -> Audio -> Edit).
* The character consistency database model mapping locked references to subsequent image-to-video API calls.
* The real-time Economy Mode budget limiter that dynamically throttles models from `qwen-max` to `qwen-plus` under token count pressure.

---

## 📄 License

This repository is open-source and licensed under the [MIT License](LICENSE).
