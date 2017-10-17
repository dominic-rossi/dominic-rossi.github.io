#!/bin/bash
set -e

npm run build
rm -rf /tmp/dist
cp -r ./dist /tmp
git checkout master
# TODO: this stuff is a litlle weird because of untracked files that exist in
# the repo. If there were no untracked files, then switching branches
# and deleting files would be no problem. So I need to figure out how to
# have the data be ignored on both branches, without checking it in.
# Ideally all of the data will be incorporated into tests. So there won't
# be a need for anything other than what is checked in.
rm -rf ./dist
rm -rf ./static
cp -r /tmp/dist/index.html ./
cp -r /tmp/dist/static ./static