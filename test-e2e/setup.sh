#!/bin/bash
# Start Tuwunel and register test users for ODIN E2EE testing
#
# Usage: ./setup.sh
#
# After setup:
#   - Alice: @alice:odin.battlefield / password: Alice
#   - Bob:   @bob:odin.battlefield   / password: Bob
#   - Server: http://localhost:8008

set -e
HOMESERVER="http://localhost:8008"

echo "Starting Tuwunel..."
docker compose up -d

echo "Waiting for homeserver..."
for i in $(seq 1 30); do
  if curl -sf "$HOMESERVER/_matrix/client/versions" > /dev/null 2>&1; then
    echo "Homeserver ready!"
    break
  fi
  sleep 1
done

# Check if homeserver is up
if ! curl -sf "$HOMESERVER/_matrix/client/versions" > /dev/null 2>&1; then
  echo "ERROR: Homeserver failed to start"
  docker compose logs
  exit 1
fi

echo ""
echo "Registering Alice..."
ALICE=$(curl -sf -X POST "$HOMESERVER/_matrix/client/v3/register" \
  -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"Alice","auth":{"type":"m.login.dummy"}}' 2>&1) || true

if echo "$ALICE" | grep -q "user_id"; then
  echo "  ✓ @alice:odin.battlefield"
elif echo "$ALICE" | grep -q "M_USER_IN_USE"; then
  echo "  ✓ @alice:odin.battlefield (already exists)"
else
  echo "  ✗ Failed: $ALICE"
fi

echo "Registering Bob..."
BOB=$(curl -sf -X POST "$HOMESERVER/_matrix/client/v3/register" \
  -H 'Content-Type: application/json' \
  -d '{"username":"bob","password":"Bob","auth":{"type":"m.login.dummy"}}' 2>&1) || true

if echo "$BOB" | grep -q "user_id"; then
  echo "  ✓ @bob:odin.battlefield"
elif echo "$BOB" | grep -q "M_USER_IN_USE"; then
  echo "  ✓ @bob:odin.battlefield (already exists)"
else
  echo "  ✗ Failed: $BOB"
fi

echo ""
echo "=== ODIN E2EE Test Environment Ready ==="
echo ""
echo "  Homeserver:  $HOMESERVER"
echo "  Server name: odin.battlefield"
echo ""
echo "  Alice:  @alice:odin.battlefield  /  Alice"
echo "  Bob:    @bob:odin.battlefield    /  Bob"
echo ""
echo "  In ODIN's login dialog:"
echo "    Homeserver URL: $HOMESERVER"
echo "    Username:       @alice:odin.battlefield"
echo "    Password:       Alice"
echo ""
echo "To stop: cd test-e2e && docker compose down -v"
