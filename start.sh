#!/bin/sh
cd /home/container || exit 1

if [ -d .git ] && [ "${AUTO_UPDATE}" = "1" ]; then
    git fetch origin
    git reset --hard origin/main
fi

if [ -n "${NODE_PACKAGES}" ]; then
    npm install ${NODE_PACKAGES}
fi

if [ -n "${UNNODE_PACKAGES}" ]; then
    npm uninstall ${UNNODE_PACKAGES}
fi

if [ -f package.json ]; then
    npm install
fi

npm run start