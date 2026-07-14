# 🚀 Walkthrough — Next.js Deployment to Alibaba Cloud ECS

We have successfully configured the repository to support a unified deployment of the Next.js frontend and backend API routes on a dedicated **Alibaba Cloud ECS (Elastic Compute Service)** Linux instance.

---

## 📦 What Was Created

### 1. [ECS_DEPLOYMENT.md](file:///Users/mac/drama-forge/ECS_DEPLOYMENT.md)
A comprehensive, step-by-step deployment guide detailing:
* How to configure the **ECS instance** in the same VPC/VSwitch as your ApsaraDB RDS database.
* Commands to install **Node.js, Git, PM2**, and **Nginx** on your Ubuntu/Debian ECS instance.
* Setting up the **Nginx reverse proxy** to forward standard Port 80/443 traffic to Next.js on Port 3000.
* Configuring **Security Groups** on ECS and whitelisting your ECS instance's IP on your **ApsaraDB RDS** instance.
* Deploying and keeping Next.js running in the background using **PM2**.

### 2. [deploy-ecs.sh](file:///Users/mac/drama-forge/deploy-ecs.sh)
An automated bash deployment orchestrator at your workspace root offering:
* **Option 1 (PM2 & Git):** Logs into your remote ECS instance via SSH, pulls the latest changes, runs Prisma client generation, builds the production Next.js files, and reloads PM2 with zero downtime.
* **Option 2 (Docker):** Safely checks for a `Dockerfile` (automatically creating a optimized Multi-stage Next.js production build container if missing) and outputs tags to push to **Alibaba Container Registry (ACR)**.

---

## 🛠️ Verification Steps

1. **Test DB schema & compile locally:**
   Make sure you have run the schema update locally:
   ```bash
   npx prisma generate
   ```
2. **Execute deploy orchestrator:**
   Run `./deploy-ecs.sh` from the project root and select your preferred workflow (PM2/SSH or Docker) to deploy your app directly onto Alibaba Cloud ECS!
