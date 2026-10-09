# Galetaire Umbrel Community App Store

An [umbrelOS community app store](https://github.com/getumbrel/umbrel-community-app-store) with one app:

- **Bob LearnHNS** (`galetaire-bob-wallet`): the [Bob LearnHNS](https://github.com/shadstoneofficial/bob-wallet) Handshake wallet and full node, running on your Umbrel as a web app.

## How it works

Bob is an Electron desktop app, but it is split cleanly in two:

- a **main process** (wallet, hsd node, background services) that is plain Node code, and
- a **React UI** that is already built as a web bundle and talks to the main process only through one bridge object, `window.bobElectron`, through Bob's JSON-RPC style IPC.

This image runs both without Electron:

| File | Role |
| --- | --- |
| `docker/web/server.js` | Runs Bob's compiled `main.js` under Node, serves the UI bundle over HTTP, and carries IPC messages over a WebSocket. |
| `docker/web/electron-shim.js` | A stand-in for the `electron` module (`app`, `ipcMain`, `BrowserWindow`, …). The "main window" is every connected browser. |
| `docker/web/bridge.js` | The browser's `window.bobElectron`. Saving a file downloads it, opening a file uses the browser's file picker, and links open in a new tab. |

Bob is built from its release tag for both **amd64** and **arm64** (Raspberry Pi), on GitHub's native runners. Umbrel's `app_proxy` puts the app behind your Umbrel login on port **8337**. The WebSocket also requires a per-start session token embedded in the page, so other websites can't drive the wallet through your browser.

Not supported in the web version: Ledger hardware wallets (no USB access) and `bob://` deep links. Folder pickers (wallet DB backup, moving the node's data folder) ask for a folder path on the Umbrel instead.

## Repository layout

```
umbrel-app-store.yml               store id + name
galetaire-bob-wallet/              the Umbrel app (manifest + compose)
docker/Dockerfile                  builds Bob from source and the web server
docker/web/                        web server, Electron stand-in, browser bridge
.github/workflows/build-image.yml  builds and pushes ghcr.io/<owner>/bob-learnhns
```

## Installing

In umbrelOS go to **App Store** → **⋯** → **Community App Stores**, paste `https://github.com/galetaire/bob-umbrel` and install **Bob LearnHNS**.

## Releasing an update

1. To move to a new Bob release, change `ARG BOB_VERSION` in `docker/Dockerfile`.
2. Bump `version:` in `galetaire-bob-wallet/umbrel-app.yml` (for example `2.3.14-web.1`) and set the same tag on the image in `galetaire-bob-wallet/docker-compose.yml`.
3. Push. The workflow builds both architectures and tags the image with the app version, and Umbrel then offers the update.

## Data and backups

All of Bob's data, including wallets and the Handshake chain, is stored in `~/umbrel/app-data/galetaire-bob-wallet/data/config` on the Umbrel (`/data` in the container). It's the same folder the earlier KasmVNC version used, so updating keeps your data. Uninstalling the app deletes it, so **write down your seed phrase** before you uninstall or test anything.
