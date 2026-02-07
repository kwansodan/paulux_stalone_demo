# Find nginx-proxy Network

Run this command on your VPS to find the network name:

```bash
docker network ls
```

Look for the network that nginx-proxy is using. It might be named differently.

Then inspect the nginx-proxy container to see what network it's on:

```bash
docker inspect nginx-proxy | grep -A 10 Networks
```

Once you find the network name, update docker-compose.yml line 96 to use that network name instead of "nginx-proxy".

## Alternative: Don't use external network

If you can't find the network, you can simply remove the nginx-proxy network reference and nginx-proxy will still work by detecting containers via Docker socket. Just remove these lines from docker-compose.yml:

**Remove from app service (line ~45):**
```yaml
      - nginx-proxy  # Connect to nginx-proxy network
```

**Remove from networks section (line ~96):**
```yaml
  nginx-proxy:
    external: true
```

Then the app will only use the `polaris_network` and nginx-proxy will still detect it via the VIRTUAL_HOST environment variable.
