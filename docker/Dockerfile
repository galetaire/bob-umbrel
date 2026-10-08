# Bob LearnHNS in a browser-accessible desktop.
# Uses the KasmVNC base (not Selkies) because it works over plain HTTP,
# which is how umbrelOS serves apps on the local network.

ARG BOB_VERSION=2.3.12
ARG TARGETARCH

# ---- amd64: use the official release AppImage ----
FROM debian:bookworm-slim AS bob-amd64
ARG BOB_VERSION
ARG BOB_SHA256=44f1b57e12832148077cfefa7e652102870d3a34909f8abcfe1a5024e832411d
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl
WORKDIR /tmp
RUN \
  curl -fsSL -o bob.AppImage \
    "https://github.com/shadstoneofficial/bob-wallet/releases/download/v${BOB_VERSION}/Bob.LearnHNS-${BOB_VERSION}.AppImage" && \
  echo "${BOB_SHA256}  bob.AppImage" | sha256sum -c - && \
  chmod +x bob.AppImage && \
  ./bob.AppImage --appimage-extract > /dev/null && \
  mv squashfs-root /opt/bob

# ---- arm64: no official Linux build exists, so build it from the release tag ----
FROM node:22-bookworm AS bob-arm64
ARG BOB_VERSION
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libudev-dev \
    libusb-1.0-0-dev \
    python3
WORKDIR /src
RUN git clone --depth 1 --branch "v${BOB_VERSION}" \
    https://github.com/shadstoneofficial/bob-wallet.git .
# npm ci also runs postinstall, which rebuilds native modules for Electron
RUN npm ci
RUN \
  npm run build && \
  node scripts/force-goosig-mini-gmp.js && \
  npx electron-builder build --linux dir --arm64 --publish never && \
  mv release/linux-arm64-unpacked /opt/bob && \
  mkdir -p /opt/bob/usr/share/icons/hicolor/512x512/apps && \
  cp resources/icons/512x512.png /opt/bob/usr/share/icons/hicolor/512x512/apps/bob-wallet.png

# ---- pick the build for the target platform ----
FROM bob-${TARGETARCH} AS bob

# ---- final image ----
FROM ghcr.io/linuxserver/baseimage-kasmvnc:debianbookworm

ARG BOB_VERSION
LABEL org.opencontainers.image.title="Bob LearnHNS" \
      org.opencontainers.image.description="Bob LearnHNS Handshake wallet packaged for umbrelOS" \
      org.opencontainers.image.version="${BOB_VERSION}"

ENV TITLE="Bob LearnHNS" \
    NO_DECOR=true

RUN \
  echo "**** install electron runtime deps ****" && \
  apt-get update && \
  DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnotify4 \
    libnss3 \
    libsecret-1-0 \
    libusb-1.0-0 \
    libxss1 \
    libxtst6 \
    xdg-utils && \
  echo "**** cleanup ****" && \
  apt-get autoclean && \
  rm -rf \
    /config/.cache \
    /var/lib/apt/lists/* \
    /var/tmp/* \
    /tmp/*

COPY --from=bob /opt/bob /opt/bob

RUN \
  echo "**** add icon ****" && \
  chmod -R a+rX /opt/bob && \
  ICON=$(find /opt/bob/usr/share/icons -name '*.png' -path '*512x512*' | head -n1) && \
  if [ -n "$ICON" ]; then \
    mkdir -p /usr/share/icons/hicolor/512x512/apps && \
    cp "$ICON" /usr/share/icons/hicolor/512x512/apps/bob.png && \
    if [ -d /kclient/public ]; then cp "$ICON" /kclient/public/icon.png; fi; \
  fi

COPY /root /

EXPOSE 3000
VOLUME /config
