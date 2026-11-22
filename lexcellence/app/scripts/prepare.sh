#!/usr/bin/env bash
# Copies the L'Excellence website (../index.html and its files) into www/ for Capacitor.
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf www && mkdir -p www/canettes
S=..
cp $S/index.html $S/manifest.webmanifest $S/icon-192.png $S/icon-512.png $S/icon-maskable-512.png $S/apple-touch-icon.png \
   $S/page-bg.jpg $S/boisson-bg.jpg $S/intro.mp4 $S/intro.webm www/
cp -r $S/bx www/bx
cp $S/canettes/index.html $S/canettes/cans.jpg $S/canettes/logo.png www/canettes/
# inside the app the service worker is not needed
echo "www ready: $(du -sh www | cut -f1)"
