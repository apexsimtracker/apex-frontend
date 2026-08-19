#!/usr/bin/env node
/**
 * Live-reload wrapper for `cap run ios`.
 *
 * Capacitor's `-l` flag only rewrites `server.url` in the native config — it never starts the
 * dev server — so this script owns the Vite process and shuts it down when Capacitor exits.
 *
 * `--host localhost` matters: the Simulator shares the Mac's network, and the API only allows
 * `http://localhost:8080` as a CORS origin (a LAN IP would be rejected).
 *
 * Args:
 *   --mode <mode>          Vite mode (default "staging" → staging API)
 *   --target-name <name>   Simulator name (default "iPhone 15 Pro")
 *   --port <port>          Dev server port (default 8080; staging CORS only allows 8080 and 5173)
 *   --no-live-reload       Deploy the existing build instead of pointing at the dev server
 */

import { spawn } from "node:child_process";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DEFAULTS = { mode: "staging", targetName: "iPhone 15 Pro", port: "8080" };
const DEV_SERVER_TIMEOUT_MS = 60_000;

function parseArgs(argv) {
  const options = { ...DEFAULTS, liveReload: !argv.includes("--no-live-reload") };

  for (let i = 0; i < argv.length; i += 1) {
    const next = argv[i + 1];
    if (!next) continue;
    if (argv[i] === "--mode") options.mode = next;
    if (argv[i] === "--target-name") options.targetName = next;
    if (argv[i] === "--port") options.port = next;
  }

  return options;
}

/**
 * Children run in their own process group so signals can be delivered to the whole tree: both
 * `vite` and `cap` sit behind a `pnpm` wrapper that does not reliably forward them. stdin is
 * detached to match — a background process group reading the TTY would take SIGTTIN and stall.
 */
function run(command, args, extraEnv = {}) {
  return spawn(command, args, {
    cwd: ROOT,
    stdio: ["ignore", "inherit", "inherit"],
    detached: true,
    env: { ...process.env, ...extraEnv },
  });
}

function signalGroup(child, signal) {
  if (!child || child.exitCode !== null) return;
  try {
    process.kill(-child.pid, signal);
  } catch {
    // Already gone.
  }
}

async function isDevServerUp(port) {
  try {
    const response = await fetch(`http://localhost:${port}/`, {
      signal: AbortSignal.timeout(2_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForDevServer(port) {
  const deadline = Date.now() + DEV_SERVER_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (await isDevServerUp(port)) return;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  throw new Error(`Dev server did not respond at http://localhost:${port}/ within 60s`);
}

const options = parseArgs(process.argv.slice(2));

const capArgs = ["exec", "cap", "run", "ios", "--target-name", options.targetName];
if (options.liveReload) {
  capArgs.push("-l", "--host", "localhost", "--port", options.port);
}

let viteProcess = null;
let capProcess = null;
/** Shutdown has started, so children exiting from our own signals is expected, not a crash. */
let stopping = false;
let exiting = false;
let pendingExitCode = 0;

function stopVite() {
  signalGroup(viteProcess, "SIGTERM");
}

function exit(code) {
  if (exiting) return;
  exiting = true;
  stopVite();
  process.exit(code);
}

/**
 * Capacitor reverts `server.url` in the native config on its own SIGINT handler, so forward the
 * signal and wait for it — otherwise the app is left pointed at a dead dev server and the next
 * plain `cap run ios` loads nothing. Vite is killed first and its exit must not cut this short,
 * which is why `stopping` is set before any signal goes out.
 */
function requestShutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  pendingExitCode = code;
  stopVite();
  if (!capProcess || capProcess.exitCode !== null) {
    exit(code);
    return;
  }
  console.log("\n[run-ios] stopping — letting Capacitor restore the native config");
  signalGroup(capProcess, "SIGINT");
  setTimeout(() => exit(pendingExitCode), 15_000).unref();
}

process.on("SIGINT", () => requestShutdown(0));
process.on("SIGTERM", () => requestShutdown(0));

if (options.liveReload) {
  if (await isDevServerUp(options.port)) {
    // A `pnpm dev` you already have running is fine to reuse, but its own mode picks the API tier.
    console.log(
      `[run-ios] reusing dev server already on :${options.port} (its Vite mode decides the API tier, not --mode ${options.mode})`,
    );
  } else {
    console.log(`[run-ios] starting vite --mode ${options.mode} on :${options.port}`);
    viteProcess = run("pnpm", [
      "exec",
      "vite",
      "--mode",
      options.mode,
      "--port",
      options.port,
      "--strictPort",
    ]);
    viteProcess.on("exit", (code) => {
      if (stopping) return;
      // A real crash: still route through requestShutdown so Capacitor gets to restore its config.
      console.error(`[run-ios] vite exited (${code ?? "signal"}) — shutting down`);
      requestShutdown(code ?? 1);
    });

    try {
      await waitForDevServer(options.port);
    } catch (error) {
      console.error(`[run-ios] ${error.message}`);
      requestShutdown(1);
    }
  }
  console.log("[run-ios] dev server ready — launching simulator");
}

// CocoaPods needs a UTF-8 locale, same as the package.json cap scripts.
capProcess = run("pnpm", capArgs, { LANG: "en_US.UTF-8" });

capProcess.on("exit", (code) => {
  // Capacitor has finished restoring the native config by now; only Vite is left to clean up.
  exit(stopping ? pendingExitCode : (code ?? 0));
});
