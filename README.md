# 🎬 DramaForge — AI Showrunner

DramaForge is an autonomous, vertical short-drama generation platform built for **Track 2: AI Showrunner** of the Global AI Hackathon Series with Qwen Cloud. 

From a single-line premise input, DramaForge orchestrates a six-agent pipeline using **Qwen Cloud** and **Alibaba Cloud Model Studio** to write, cast, storyboard, generate, and edit a final high-fidelity vertical mobile short-drama video, running autonomously under a real-time token budget cap.

---

## 📐 System Architecture Diagram & Data Flow

Below is the conceptual layout of the components and data flow:

```
+-----------------------------------------------------------------------------------+
|                                  Next.js FRONTEND                                 |
|  - Premise Inputs & Budget Controls  - Stepper & Cost Meter  - Casting Cards Grid |
+-----------------------------------------------------------------------------------+
                                         │  ▲ (REST & Socket.io)
                                         ▼  │
+-----------------------------------------------------------------------------------+
|                                  NestJS BACKEND                                   |
|  - 6 Agent Modules   - Orchestrator Engine   - Telemetry Logger   - FFmpeg Engine  |
+-----------------------------------------------------------------------------------+
         │                               │                                │
         ▼ (SQL / Prisma)                ▼ (REST APIs)                    ▼ (OSS SDK)
+------------------+           +------------------+             +-------------------+
|   ApsaraDB RDS   |           |    Qwen Cloud    |             | Alibaba Cloud OSS |
| - MySQL Database |           | - DashScope MaaS |             | - Storage Bucket  |
+------------------+           +------------------+             +-------------------+
```

### Flow Sequence:
1. **Frontend to Backend:** User inputs a premise and budget in the Next.js Frontend. Next.js triggers the NestJS Backend (`POST /api/episodes/generate`).
2. **Backend Orchestration:** NestJS starts the six-agent sequence:
   * **Stage 1 (Hook Strategist):** Queries `qwen-max` (via DashScope compatible mode) to formulate title, genre, and target runtime.
   * **Stage 2 (Story Architect):** Queries `qwen-max` to draft scenes using a dual-line plot structure (main plot + hidden reversal).
   * **Stage 3 (Scriptwriter):** Spawns parallel queries to `qwen-plus` to write dialogues and actions per scene.
   * **Stage 4 (Storyboard Director):** Spawns parallel queries to `qwen-max` to map camera angles and vertical positions.
   * **Stage 5 (Casting & Video Engine):** Resolves character references in ApsaraDB RDS. On cache miss, generates a locked character portrait using `wan2.7-image`, uploads it to OSS, and caches it. Then, uses `wan2.1-i2v-720p` (or `wanx2.1-t2v-turbo`) reference-guided video generation to render consistent character clips.
   * **Stage 6 (Post-Production):** Downscales clips to `720x1280` vertical, burns subtitles, stitches transitions, and concatenates clips using `ffmpeg` child processes.
3. **Telemetric Loop:** Throughout the run, NestJS logs token counts and costs to the database and streams updates live to Next.js via Socket.io. If costs cross 80% of the budget, **Economy Mode** downgrades remaining Scriptwriter/Storyboard calls from `qwen-max` to `qwen-plus`.
4. **Final Delivery:** The final video URL is persisted in the database and displayed in the frontend player alongside a downloadable script.

---

## ⚙️ Pipeline Agent Orchestration Flow (6 Stages)

```mermaid
graph TD
    Premise[User Premise Input] --> Stage1[Stage 1: Hook Strategist <br> qwen-max]
    Stage1 --> Stage2[Stage 2: Story Architect <br> qwen-max]
    Stage2 --> Stage3[Stage 3: Scriptwriter <br> Parallel qwen-plus]
    Stage3 --> Stage4[Stage 4: Storyboard Director <br> Parallel qwen-max]
    Stage4 --> Stage5[Stage 5: Casting & Video Engine <br> Wan Image & Video]
    Stage5 --> Stage6[Stage 6: Post-Production <br> FFmpeg Stitching]
    Stage6 --> FinalVideo[Vertical Episode Video + Screenplay]

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
Configure the `.env` file located in `frontend/.env` (re-used by both Next.js and NestJS):
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
1. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev # Port 3000
   ```
2. **Backend:**
   ```bash
   cd backend
   npm install
   npm run start:dev # Port 3001
   ```

---

## ☁️ Proof of Alibaba Cloud Deployment

The automation script [deploy-ecs.sh](deploy-ecs.sh) located at the workspace root is the official **Proof of Alibaba Cloud Deployment**.
It performs a zero-downtime, production-ready PM2 deployment onto a dedicated Alibaba ECS instance in Singapore/Beijing regions:
1. Logs into the remote ECS instance.
2. Pulls latest changes from Git.
3. Installs dependencies and runs Prisma Client generation for both NestJS and Next.js.
4. Builds the production bundle of Next.js and compiles NestJS.
5. Safely reloads the running PM2 processes: `dramaforge-frontend` and `dramaforge-backend`.

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
* The typed six-agent workflow contracts (Hook -> Story -> Script -> Storyboard -> Video -> Edit).
* The character consistency database model mapping locked references to subsequent image-to-video API calls.
* The real-time Economy Mode budget limiter that dynamically throttles models from `qwen-max` to `qwen-plus` under token count pressure.

---

## 📄 License

This repository is open-source and licensed under the [MIT License](LICENSE).
