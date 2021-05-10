#!/usr/bin/env sh

# abort on errors
set -e

# build
npm run build

git add .
read -p "Enter your commit message: " commitMessage
git commit -m "$commitMessage"
git push origin master

# navigate into the build output directory
cd ./docs

git init
git add -A
git commit -m 'Update and deploy'

git push git@github.com:lipohong/lipohong.github.io.git master:gh-pages

# back to previous directory
cd -