#!/bin/bash
# Install version-appropriate test dependencies based on Node.js version
# mocha 11+ requires Node 18+, nock 14+ requires Node 18+

NODE_MAJOR=$(node -e "console.log(process.versions.node.split('.')[0])")
echo "Detected Node.js major version: $NODE_MAJOR"

if [ "$NODE_MAJOR" -le 10 ]; then
  echo "Installing test deps for Node 8-10"
  npm install --save-dev mocha@7 nock@10 should@13
elif [ "$NODE_MAJOR" -le 16 ]; then
  echo "Installing test deps for Node 12-16"
  npm install --save-dev mocha@9 nock@13 should@13
else
  echo "Installing test deps for Node 18+"
  npm install
fi
