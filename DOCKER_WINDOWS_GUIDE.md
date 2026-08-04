# Docker Guide for Windows Users (Next Paulux)

This guide helps Windows users set up and manage the Paulux development and production environments using Docker.

## 1. Prerequisites

- **Docker Desktop**: [Download and Install](https://www.docker.com/products/docker-desktop/)
- **WSL 2 (Required)**: Ensure "Use the WSL 2 based engine" is checked in Docker Desktop Settings -> General.
- **Git for Windows**: [Download and Install](https://gitforwindows.org/)

---

## 2. Environment Setup

### A. Clone & Variables
1. Open PowerShell or Terminal.
2. Clone the repo and navigate to the directory.
3. Copy the environment file:
   ```powershell
   cp example.env .env
   ```
4. **Important**: Open `.env` and set your credentials. 
   - *Note*: Ensure your editor saves files with `LF` (Unix-style) line endings to avoid issues inside the Linux containers.

---

## 3. Running the Environments

### 💻 Development Mode (Hot-reloading)
Use this while coding. Changes you save in `next_paulux/src` will update the app instantly.
```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

### 🚀 Production Mode (Optimized)
Use this to simulate the live server environment.
```powershell
docker compose up -d --build
```

---

## 4. Pre-Push Verification (Crucial)

Before you `git push`, you **must** verify that the production build succeeds. This prevents broken builds in GitHub Actions.

**Run this command while the Dev container is running:**
```powershell
docker compose exec app npm run build
```

If you see `Compiled successfully`, you are safe to push!

---

## 5. Common Windows Troubleshooting

- **Port 3000 Busy**: If you get a "Port already in use" error, check if you have a local `npm run dev` running outside of Docker.
- **WSL Memory Usage**: If Docker is slow, create a `.wslconfig` file in your User folder (`%USERPROFILE%`) to limit RAM usage.
- **File Syncing**: If hot-reloading doesn't work, ensure your project is located inside the WSL file system (e.g., `\\wsl$\Ubuntu\home\...`) rather than on the Windows C: drive for maximum performance.

---

## 6. Useful Commands Summary

| Task | Command |
| :--- | :--- |
| **Start Dev** | `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build` |
| **Stop All** | `docker compose down` |
| **Check Logs** | `docker compose logs -f app` |
| **Verify Build** | `docker compose exec app npm run build` |
| **Reset DB** | `docker compose down -v` (CAUTION: Deletes all data) |
