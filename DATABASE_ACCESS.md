# Connecting to the Production Database via pgAdmin

This guide explains how to securely connect to the remote PostgreSQL database running inside a Docker container on the VPS, using pgAdmin and SSH Tunneling.

## Prerequisites

- **pgAdmin 4** installed on your local machine.
- SSH access to your VPS (`ubuntu@51.255.200.48`).
- An SSH Key or password for the `ubuntu` user.

## Step 1: Find the internal Docker IP

The Postgres database runs inside a Docker container, so we need to connect to its internal Docker IP address.

1. SSH into the VPS:
   ```bash
   ssh ubuntu@51.255.200.48
   ```
2. Run this command to find the internal IP address of the `polaris_db` container:
   ```bash
   docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' polaris_db
   ```
   *(Output to use: `172.18.0.6`)*

## Step 2: Configure pgAdmin SSH Tunnel

This step establishes a secure connection to your VPS.

1. Open pgAdmin.
2. Right-click on **Servers** > **Register** > **Server...**
3. In the **General** tab, name it something like `Polaris Production DB`.
4. Go to the **SSH Tunnel** tab and configure:
   - **Use SSH tunneling:** `Yes`
   - **Tunnel host:** `51.255.200.48`
   - **Tunnel port:** `22`
   - **Username:** `ubuntu`
   - **Authentication:** Choose **Identity file** if you use an SSH key file (`.pem` or `.pub`), otherwise choose **Password**.

## Step 3: Configure Database Connection

This step connects pgAdmin to the internal Docker container *through* the SSH Tunnel.

1. Go back to the **Connection** tab.
2. Configure using the details found in Step 1 and your `.env` file:
   - **Host name/address:** Enter the IP from Step 1 (e.g., `172.18.0.6`)
   - **Port:** `5432`
   - **Maintenance database:** `polaris`
   - **Username:** The `DB_USER` from your VPS `.env` file
   - **Password:** The `DATABASE_PASSWORD` from your VPS `.env` file
   - **Save password:** `Yes`
3. Click **Save** to connect.

> **Why this works:** The SSH tunnel logs you into the VPS securely, and then pgAdmin acts as if it is inside the VPS trying to reach the internal Docker container IP. This prevents you from having to expose port 5432 to the open internet!
