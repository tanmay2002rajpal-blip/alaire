#!/bin/bash
cd /home/omrajpal/clawd/alaire/admin
npm run dev -- -p 3001 &
ADMIN_PID=$!

cd /home/omrajpal/clawd/alaire/user
npm run dev -- -p 3000 &
USER_PID=$!

echo "Admin PID: $ADMIN_PID, User PID: $USER_PID"
wait
