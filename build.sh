#!/usr/bin/env bash

echo "Removing old distribution assets..." && \
rm -r dist && \
echo "Copying distribution assets..." && \
cp -r public dist && \
echo "Building scripts..." && \
pnpm build
