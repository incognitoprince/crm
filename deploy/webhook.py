#!/usr/bin/env python3
"""Small authenticated deployment webhook. Bind to localhost only."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import hmac
import os
import subprocess
import threading

TOKEN = os.environ.get("DEPLOY_WEBHOOK_TOKEN", "")
DEPLOY_COMMAND = os.environ.get("DEPLOY_COMMAND", "/usr/local/bin/tailorshopcrm-deploy")
HOST = "127.0.0.1"
PORT = int(os.environ.get("DEPLOY_WEBHOOK_PORT", "8765"))
ALLOWED = {"/frontend": "frontend", "/backend": "backend", "/all": "all"}
lock = threading.Lock()

if len(TOKEN) < 32:
    raise SystemExit("DEPLOY_WEBHOOK_TOKEN must be at least 32 characters")

class Handler(BaseHTTPRequestHandler):
    server_version = "TailorCRMDeployWebhook"

    def log_message(self, fmt, *args):
        # Avoid logging authorization headers or request bodies.
        print("deploy-webhook:", fmt % args)

    def do_GET(self):
        self.send_error(405, "Use authenticated POST")

    def do_POST(self):
        action = ALLOWED.get(self.path)
        supplied = self.headers.get("Authorization", "")
        expected = "Bearer " + TOKEN
        if not hmac.compare_digest(supplied, expected):
            self.send_error(401, "Unauthorized")
            return
        if action is None:
            self.send_error(404, "Unknown deployment target")
            return
        if self.headers.get("Content-Length", "0") not in ("", "0"):
            self.send_error(400, "Request body must be empty")
            return
        if not lock.acquire(blocking=False):
            self.send_error(409, "Deployment already running")
            return
        try:
            result = subprocess.run(
                [DEPLOY_COMMAND, action],
                stdin=subprocess.DEVNULL,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                timeout=1800,
                check=False,
                env={"PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"},
            )
            status = 200 if result.returncode == 0 else 500
            # Return only a short tail; never expose environment or secrets.
            output = (result.stdout or "")[-4000:]
            body = (("Deployment completed" if status == 200 else "Deployment failed") + "\n" + output).encode()
            self.send_response(status)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except subprocess.TimeoutExpired:
            self.send_error(504, "Deployment timed out; inspect server logs")
        finally:
            lock.release()

ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
