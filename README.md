# Galetaire Umbrel Community App Store

An [umbrelOS community app store](https://github.com/getumbrel/umbrel-community-app-store) with one app:

- **Bob LearnHNS** (`galetaire-bob-wallet`): the [Bob LearnHNS](https://github.com/shadstoneofficial/bob-wallet) Handshake wallet and full node. It runs in a desktop you open in your browser, served by linuxserver's KasmVNC base image.

## How it works

Bob is an Electron desktop app with no web UI. The image in `docker/` takes the official Linux AppImage, checks it against the release's `SHA256SUMS.txt`, extracts it, and runs it in a KasmVNC desktop on port 3000. Umbrel's `app_proxy` puts that desktop behind your Umbrel login on port **8337**.

The KasmVNC base is used instead of linuxserver's newer Selkies base on purpose: Selkies only works over HTTPS, and Umbrel serves apps over plain HTTP on your LAN. Umbrel disabled its own Chromium app for the same reason.

Both **amd64** and **arm64** (Raspberry Pi) are supported. On amd64 the image uses the official AppImage. Bob publishes no ARM Linux build, so on arm64 the image compiles Bob from the same release tag, on GitHub's native ARM runners.

## Repository layout

```
umbrel-app-store.yml           store id + name
galetaire-bob-wallet/          the Umbrel app (manifest + compose)
docker/                        image source (Dockerfile + overlay files)
.github/workflows/build-image.yml  builds and pushes ghcr.io/<owner>/bob-learnhns
```

## Setup

1. Push this repo to GitHub as `galetaire/bob-umbrel`.
2. Under **Actions**, run **Build Bob LearnHNS image** (or push a change under `docker/`).
3. Make the image public: GitHub profile → **Packages** → `bob-learnhns` → **Package settings** → **Change visibility** → Public. Umbrel can't pull private images.
4. In umbrelOS go to **App Store** → **⋯** → **Community App Stores**, paste `https://github.com/galetaire/bob-umbrel` and install **Bob LearnHNS**.

## Updating Bob

1. Run the workflow with the new version number, for example `2.3.14`. It downloads the release checksum by itself.
2. Change `version:` in `galetaire-bob-wallet/umbrel-app.yml` and the image tag in `galetaire-bob-wallet/docker-compose.yml` to match, then commit. Optionally also update `ARG BOB_VERSION`/`BOB_SHA256` in the Dockerfile.
3. Umbrel will show the update in the app store.

## Data and backups

All of Bob's data, including wallets and the Handshake chain, is stored in `~/umbrel/app-data/galetaire-bob-wallet/data/config` on the Umbrel. Uninstalling the app deletes it, so **write down your seed phrase** before you uninstall or test anything.

## Tips

- Copy and paste between your PC and Bob through the KasmVNC side panel: click the small tab on the left edge, then **Clipboard**.
- If you close Bob's window it reopens after a few seconds. You can also right-click the desktop to get a menu.
