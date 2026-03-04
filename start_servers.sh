#!/bin/bash
cd /Volumes/Crucial\ X9/alaire/admin
npm run dev -- -p 3001 &
ADMIN_PID=$!

cd /Volumes/Crucial\ X9/alaire/user
npm run dev -- -p 3000 &
USER_PID=$!

echo "Admin PID: $ADMIN_PID, User PID: $USER_PID"
wait
