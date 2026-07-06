## 📸 Demo

<video src="https://github.com/user-attachments/assets/a94154fa-6932-4c9c-97d0-e1bd6ef57cc0" controls width="100%" poster=""></video>

# 🚀 VibeShare
### High-Performance Social Media Platform with Hub-and-Spoke AI Multi-Agent Orchestration

**VibeShare** is an enterprise-grade, real-time social networking ecosystem engineered for sub-millisecond data availability and automated agentic workflow delegation. Moving beyond traditional monolithic design patterns, VibeShare utilizes an advanced architecture splitting a Next.js/TypeScript frontend from a decoupled, high-throughput Node.js & Express backend. The ecosystem features a dedicated Redis caching layer, optimized relational database indexes, and an autonomous multi-agent orchestration framework powered by the Vercel AI SDK. Designed for extreme speed, security, and scalability under heavy write stress.

---

## 🌐 Platform Highlights

* **Decoupled Architecture:** Clean architectural separation between an interactive Next.js web application and a specialized Node/Express API service engine.
* **AI Multi-Agent Orchestration:** Powered by the Vercel AI SDK to delegate complex analytical and generative tasks dynamically to isolated expert sub-agents.
* **Real-Time Stream Engine:** Leveraging custom standalone WebSocket loops for low-latency point-to-point communication.
* **Cache-Aside Architecture:** Bypasses relational database boundaries entirely to serve hot read paths directly from memory.
* **Secure & Production-Ready:** Capped connection architectures, environment-wide pool singleton wrappers, and client-side fail-fast gates.

---

## ✨ Features

### 🧑‍🤝‍🧑 Social Media Suite
* **Content Pipeline:** Create rich text posts, upload fast video reels, and share temporary timeline stories via a clean, glassmorphic layout.
* **Offset-Paginated Reads:** Feed lookups query exact data ranges (`skip`, `take`) using explicit Prisma parameter limits to preserve data stream efficiency.
* **Atomic States:** Utilizes unique composite table constraints (`userId_postId`) to execute atomic data modifications on likes and commentary additions without race conditions.
* **S3-Backed Asset Uploader:** Handles media payloads using direct buffer streams or presigned put-URL queries to upload assets directly to an AWS S3 bucket.
* **Profile Safeguards:** Sanitizes editing input, lowercases metadata, and verifies profile handle collisions before committing relational database updates.

### 💬 Real-Time Messaging & Sockets
* **Instant Direct Messaging:** Point-to-point messaging pipelines with zero browser polling overhead.
* **Custom Event Loop Binding:** Attaches Socket.IO servers directly to the underlying HTTP layer via specialized Pages Router integration, disabling standard body parsing parameters for instant handshakes.
* **Active Room Mapping:** Upon session confirmation, client connection sockets instantly subscribe to isolated network rooms named after their Clerk user ID parameters to enable secure tracking.
* **Decoupled Relaying:** Coordinates REST API commits seamlessly with client-side real-time socket loops, immediately broadcasting raw payload streams across active user groups.

### 🤖 Hub-and-Spoke AI Multi-Agent Copilot
* **Zod-Validated Planner Agent:** Intercepts message contexts and classifies queries via a structured JSON schema validated using a strict Zod blueprint to route intentions across downstream nodes (`"analytics"`, `"content"`, or `"both"`).
* **Database Analytics Expert:** Operates via an isolated sub-agent wrapped in a defensive `bindToolUserId` middleware decorator. It forces the injection of the active user session ID into tool fields to block context-hijacking. Tools include tracking follower sizes, compiling post trends, and running math-heavy aggregations to compute profile engagement rates.
* **Content Strategist Sub-Agent:** Drives copy creation with embedded system prompt policy controls. Enforces a strict VibeShare platform exclusivity rule, mandates a **search-first image pipeline (Unsplash API checking)**, and falls back to **Pollinations AI text-to-image synthesis** if no stock matches are found. Implements a Human-in-the-Loop policy requiring direct user consent before making any write commits.
* **Context Sliding & Optimization:** Employs an automated structural mapper that filters out chat histories, compressing operations down to a sliding window of the last 6 messages to stay safely within Groq cloud rate-limiting boundaries.

### 📝 Smart Conversational Summarizer
* **Transcript Structuring:** Pulls up to 50 chronological message records between discussion partners, mapping the text elements into an inline chat transcript schema.
* **Chain-of-Thought Filtering:** Runs a regular expression string replacement block (`/<think>[\s\S]*?<\/think>/gi`) to strip out raw `<think>` blocks output by deep reasoning models (like Qwen on Groq) before streaming clean markdown code summaries to the user viewport.

### 🔐 Security & Core Infrastructure
* **Edge Routing Matchers:** Employs explicit path matchers within a specialized proxy configuration to categorize resource lookups into public, admin, or Clerk-protected route environments.
* **Fixed-Window Counter Guard:** Integrates a Redis-backed token pipeline that tracks incoming request velocities by generating incrementing IP-specific rate-limiting string keys.
* **Capped Connection Pooling:** Sets strict pooling parameters (`max: 10` connections, `5000ms` connection timeout) to prevent relational database server pools from overloading during write-intensive spikes, protecting the server loop from starvation.

---

## 📊 Verified Performance Engineering Benchmarks

### 1. Database Index Scan Optimization (`EXPLAIN ANALYZE`)
* **Unoptimized Baseline (Sequential Full-Table Scan):** **6.904 ms** execution time. Without proper key configurations, user lookups forced an $O(n)$ sweep across 100,002 rows, reading 1,923 memory buffer pages.
* **Optimized Index Scan (B-Tree Binary Traversal):** **0.043 ms (43 Microseconds)** execution time. Restructuring queries around a unique B-Tree index key modified evaluation complexity to $O(\log n)$, reducing memory page reads down to 4 pages and assessing exactly 1 row.

### 2. Cache-Aside Throughput & Capacity Scaling
* **Uncached / Database Cold Start Delay:** ~2.3 seconds (caused by Neon serverless compute node wake-up cycles on cache misses).
* **Redis Hot-Cache Memory Hit:** **21 ms – 37 ms** processing velocity.
* **Maximum Load Capacity (k6 Mixed Stress Test):** Handled **13,413 total completed requests** over 150 persistent virtual users, sustaining an operational throughput of **447.1 req/s** with a **100% success rate**.

---

## 🛠 Tech Stack

### **Frontend**
* ![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white) **Next.js 15 (App Router)** - Server-side rendering & optimized layout architecture.
* ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) **TypeScript** - Enforced type safety across all execution layers.
* ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white) **Tailwind CSS** - Modern responsive utility-first styling.
* ![Redux](https://img.shields.io/badge/Redux_Toolkit-593D88?style=for-the-badge&logo=redux&logoColor=white) **Redux Toolkit** - Global client state synchronization.

### **Backend & Real-Time Transport**
* ![Node](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white) **Node.js** - Asynchronous JavaScript runtime.
* ![Express](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge) **Express.js** - Light, high-performance web framework for handling discrete server API routing paths.
* ![Socket](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white) **Socket.IO** - Real-time event-driven bidirectional WebSocket communication loops.

### **Database, Caching & AI Orchestration**
* ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white) **PostgreSQL (Neon DB)** - Relational storage cloud cluster with optimized B-Tree constraints.
* ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white) **Prisma ORM** - Type-safe database schema mapping and query construction.
* ![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white) **Redis** - High-throughput key-value memory cache engine for hot read paths.
* 🤖 **AI Framework:** Vercel AI SDK, Qwen 2.5 (Groq Cloud), Ollama (Local Engine)

### **APIs & Third-Party Services**
* 🔍 **Image Search API:** Unsplash API (Contextual stock image discovery)
* 🎨 **Image Generation API:** Pollinations AI (Fallback programmatic text-to-image synthesis)
* 🌐 **Data & Storage APIs:** Tavily API (Real-time news search engine), AWS S3 SDK (Media asset distribution)

### **DevOps & Infrastructure**
* ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white) **Docker Compose** - Multi-service infrastructure virtualization and containerization.

---

## 🐳 Containerization & Deployment Setup

VibeShare is fully containerized to guarantee identical staging behaviors using a single-command deployment profile.

1. **Production Compilation Dockerfile:** Incorporates a single-stage `node:alpine` base image, packages all dependencies, triggers type-compilation via `npx prisma generate`, builds static production assets, and executes the server loop.
2. **Multi-Service Docker Compose Topology:** Integrates the web application container node with an isolated `redis:alpine` service container mapped to host port 6380 to avoid network proxy overlap. It injects local `.env` variables and establishes `host.docker.internal` network pathways so the virtualized container can interface seamlessly with local Ollama AI models running on the host OS gateway.

```bash
# To spin up the complete production infrastructure stack:
docker compose up --build -d
