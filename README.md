## 📸 Demo

<video src="https://github.com/user-attachments/assets/a94154fa-6932-4c9c-97d0-e1bd6ef57cc0" controls width="100%" poster=""></video>

# 🚀 VibeShare
### High-Performance Social Media Platform with Hub-and-Spoke AI Multi-Agent Orchestration

**VibeShare** is an enterprise-grade, real-time full-stack social networking ecosystem engineered for sub-millisecond data availability and automated agentic workflow delegation. Built entirely within a unified Next.js and TypeScript environment, the platform handles complex traffic paths using a dedicated Redis caching layer, optimized PostgreSQL relational database indexes, and an autonomous multi-agent orchestration framework powered by the Vercel AI SDK. Designed for extreme speed, security, and scalability under heavy write stress.

---

## 🌐 Platform Highlights

* **AI Multi-Agent Orchestration:** Powered by the Vercel AI SDK to delegate complex analytical and generative tasks dynamically to isolated expert sub-agents.
* **Real-Time Stream Engine:** Leveraging custom Next.js WebSocket rooms for low-latency point-to-point communication.
* **Cache-Aside Architecture:** Bypasses relational database boundaries entirely to serve hot read paths directly from memory.
* **Secure & Production-Ready:** Capped connection pooling architectures, global database singleton wrappers, and client-side fail-fast gates.

---

## ✨ Features

### 🧑‍🤝‍🧑 Social Media Suite
* **Content Pipeline:** Create rich text posts, upload video reels, and share temporary timeline stories via a clean, glassmorphic layout.
* **Offset-Paginated Reads:** Feed lookups query exact data ranges (`skip`, `take`) using explicit Prisma parameter limits to preserve data stream efficiency.
* **Atomic States:** Utilizes unique composite table constraints (`userId_postId`) to execute atomic data modifications on likes and commentary additions without race conditions.
* **S3-Backed Asset Uploader:** Handles media payloads using direct buffer streams or presigned put-URL queries to upload assets directly to an AWS S3 bucket.
* **Profile Safeguards:** Sanitizes editing input, lowercases metadata, and verifies profile handle collisions before committing relational database updates.

### 💬 Real-Time Messaging & Sockets
* **Instant Direct Messaging:** Point-to-point messaging pipelines driven completely by **Socket.io** with zero browser polling overhead.
* **Custom Event Loop Binding:** Attaches Socket.io servers directly to the underlying HTTP server via specialized Pages Router integration (`pages/api/socket.ts`), disabling standard body parsing parameters for instant handshakes.
* **Active Room Mapping:** Upon session confirmation, client connection sockets instantly subscribe to isolated network rooms named after their Clerk user ID parameters to enable secure tracking.
* **Decoupled Relaying:** Coordinates REST API commits seamlessly with client-side real-time socket loops, immediately broadcasting raw payload streams across active user groups.

### 🤖 Hub-and-Spoke AI Multi-Agent Copilot
* **Zod-Validated Planner Hub:** Intercepts message contexts and classifies queries via a structured JSON schema validated using a strict Zod blueprint to route intentions across downstream expert nodes.
* **Resilient Model Fallback Stack:** Built using a dedicated `wrapWithFallback` handler configuration to ensure 100% agent operational uptime:
  * **PRIMARY_MODEL_ID (`qwen3.6-27b`):** Orchestrated over high-velocity Groq Cloud APIs for primary multi-step reasoning chains.
  * **FALLBACK_MODEL_ID (`minimax-m3:cloud`):** Deployed via local host Ollama instances (`:11434`) to automatically absorb execution traffic if upstream network constraints or API token ceilings are reached.
* **Database Analytics Expert:** Operates via an isolated sub-agent wrapped in a defensive `bindToolUserId` middleware decorator. It forces the injection of the active user session ID into tool fields to block context-hijacking. Tools include tracking follower sizes, compiling post trends, and running math-heavy aggregations to compute profile engagement rates.
* **Content Strategist Sub-Agent:** Drives copy creation with embedded system prompt policy controls. Enforces a strict VibeShare platform exclusivity rule, mandates a search-first image pipeline via the Unsplash API, and falls back to Pollinations AI text-to-image synthesis if no stock matches are found. Implements a Human-in-the-Loop policy requiring direct user consent before making any write commits.
* **Context Sliding & Optimization:** Employs an automated structural mapper that filters out chat histories, compressing operations down to a sliding window of the last 6 messages to stay safely within Groq cloud rate-limiting boundaries.

### 📝 Smart Conversational Summarizer
* **Transcript Structuring:** Pulls up to 50 chronological message records between discussion partners, mapping the text elements into an inline chat transcript schema.
* **Chain-of-Thought Filtering:** Runs a regular expression string replacement block (`/<think>[\s\S]*?<\/think>/gi`) to strip out raw `<think>` blocks output by deep reasoning models (`qwen3.6-27b`) before streaming clean markdown summaries to the user viewport.

### 🔐 Security & Rate Limiting
* **Middleware Pipeline Routing:** Uses customized matchers inside `proxy.ts` to cleanly segregate unauthenticated public routes from protected modules requiring active session validation.
* **Fixed-Window Rate Limiting:** Intercepts incoming network connections using a centralized Redis-backed incremental counter bucket (`ratelimit:<route>:<ip>`), safely falling open to guarantee absolute system availability if the cache cluster encounters network hiccups.

### 🐳 Containerized Deployment Footprint
* **Single-Command Orchestration:** Coordinates all multi-layered production runtime nodes seamlessly via integrated container configurations.
* **Host Machine Looping:** Implements advanced `extra_hosts` variable parameters inside your configuration layers, granting containerized code permission to bypass runtime network silos and loop back directly to Ollama endpoints running on the host OS.

---

## 📊 Verified Performance Engineering Benchmarks

The system was load-tested under a highly intensive, mixed-workload k6 simulation (concurrent feed scrollers, active content writers, and discovery searchers) to evaluate the threshold capacity of the underlying infrastructure:

### 1. Database Index Scan Optimization (`EXPLAIN ANALYZE`)
```sql
EXPLAIN ANALYZE SELECT * FROM "User" WHERE "clerkId" = 'user_35qP...';
```
* **Unoptimized Baseline (Sequential Scan):** **6.904 ms** execution window ($O(n)$ complexity over 100,002 rows, reading 1,923 memory pages).
* **Optimized Index Scan (B-Tree Key Tree):** **0.043 ms (43 Microseconds)** execution window ($O(\log n)$ tree traversal, reading only 4 memory pages and processing exactly 1 target row).

### 2. Cache-Aside Memory Throughput Scaling
* **Cache Miss / Database Latency Baseline:** ~2.3 seconds (attributed to Neon Free Tier compute cold start connection setup).
* **Redis Hot-Cache Memory Hit:** **21 ms – 37 ms** processing velocity.
* **Maximum Sustained Capacity (k6 Test):** Handled **13,413 total successful requests** under 150 concurrent client connections, maintaining an average throughput of **447.1 req/s** with **0% errors**.

### 3. Server Footprint Pooling Layer Configuration
To prevent thread starvation during concurrent write bursts, `lib/prisma.ts` enforces a strict global singleton wrapper with a fail-fast gateway:
* **`max: 10`**: Restricts the maximum open connection pool footprint per active server runtime instance.
* **`connectionTimeoutMillis: 5000`**: Drops stalled write connections within 5 seconds, keeping the Next.js event loop completely un-blocked to serve Redis memory requests smoothly under peak stress.

---

## 🛠️ High-Performance Tech Stack

* **Framework & Frontend:** Next.js 15 (App Router & Pages Router), React.js, Tailwind CSS, Redux Toolkit, Recharts
* **Language & Runtime:** TypeScript, Node.js environment
* **Database & ORM:** PostgreSQL (Neon DB Cloud Cluster), Prisma ORM
* **Caching & Rate Limiting:** Redis Memory Cache Engine
* **Real-Time Transport Layer:** Socket.io (Engineered Real-Time Event Rooms)
* **AI Framework & Models:** Vercel AI SDK, Qwen 2.5 / Qwen 3.6 (Groq), Ollama (Local), Tavily API
* **Infrastructure & Storage:** Docker Compose, AWS S3 Client Storage Service

---

## 🐳 Containerization & Deployment Setup

VibeShare is fully containerized to guarantee identical staging behaviors using a single-command deployment profile.

1. **Production Compilation Dockerfile:** Incorporates a single-stage `node:alpine` base image, packages all dependencies, triggers type-compilation via `npx prisma generate`, builds static production assets, and executes the runtime server.
2. **Multi-Service Docker Compose Topology:** Integrates the Next.js web application container node with an isolated `redis:alpine` service container mapped to host port 6380 to avoid network proxy overlap. It injects local `.env` variables and establishes `host.docker.internal` network pathways so the virtualized container can interface seamlessly with local Ollama AI models (`minimax-m3:cloud`) running on the host OS gateway.

```bash
# To spin up the complete production infrastructure stack:
docker compose up --build -d
```
