#!/bin/sh
set -eu

cat > /usr/share/nginx/html/runtime-config.js <<EOF
window.__RUNTIME_CONFIG__ = Object.assign({}, window.__RUNTIME_CONFIG__, {
  KAKAO_MAP_APP_KEY: "${KAKAO_MAP_APP_KEY:-}",
});
EOF
