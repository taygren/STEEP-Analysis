#!/bin/bash
set -e

npm install --prefer-offline --no-audit --no-fund 2>&1 || npm install --no-audit --no-fund
