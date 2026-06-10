#!/bin/sh
set -eu

NODE_BIN="node"

if [ -x ".tools/bin/node" ]; then
  NODE_BIN=".tools/bin/node"
fi

exec "$NODE_BIN" node_modules/@tailwindcss/cli/dist/index.mjs \
  -i ./src/css/archive.css \
  -o ./_site/css/archive.css \
  "$@"
