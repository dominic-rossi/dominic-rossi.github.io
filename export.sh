#!/bin/bash
set -e

npm run build
cp -r ./dist /tmp
git checkout master
cp -r /tmp/dist ./