#!/bin/bash
# .garages3/setup.sh

set -e

CONTAINER_NAME="rms-garage-s3"
KEY_NAME="rms-key"
REGION="garage"

# Helper to run commands inside the container
garage_cmd() {
    docker exec $CONTAINER_NAME /garage "$@"
}

echo "🚀 Starting Garage S3 Setup..."

# 1. Wait for Garage
echo -n "⏳ Waiting for Garage to become ready..."
MAX_RETRIES=30
RETRY_COUNT=0
while ! docker exec $CONTAINER_NAME /garage status > /dev/null 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo " ❌ Failed (Timeout)"
        exit 1
    fi
    sleep 1
done
echo " ✅ Connected!"

# 2. Configure Node & Layout
echo -n "🏗️  Configuring Cluster Layout..."
NODE_ID=$(garage_cmd node id | grep -o '[a-f0-9]\{64\}' | head -n 1)

if [ -z "$NODE_ID" ]; then
    echo " ❌ Error: Could not extract Node ID"
    exit 1
fi

# Assign layout if not exists
if ! garage_cmd layout show | grep -q "dc1"; then
    garage_cmd layout assign -z dc1 -c 10G $NODE_ID > /dev/null 2>&1
    garage_cmd layout apply --version 1 > /dev/null 2>&1
fi
echo " ✅ Done"

# 3. Re-create Keys (To reveal Secret Key)
echo -n "🔑 Configuring Access Keys..."

# Delete existing key if it exists (so we can recreate and see the secret)
if garage_cmd key list | grep -q "$KEY_NAME"; then
    garage_cmd key delete "$KEY_NAME" > /dev/null 2>&1 || true
fi

# Create new key and capture the output immediately
KEY_INFO=$(garage_cmd key create "$KEY_NAME")
ACCESS_KEY=$(echo "$KEY_INFO" | grep "Key ID:" | awk '{print $3}')
SECRET_KEY=$(echo "$KEY_INFO" | grep "Secret key:" | awk '{print $3}')
echo " ✅ Done"

# 4. Create Buckets & Permissions
echo "🪣  Configuring Buckets..."
BUCKETS=("property-images" "user-avatars" "documents")

# Create CORS config file
cat <<EOF > /tmp/cors.json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag"]
    }
  ]
}
EOF

for BUCKET in "${BUCKETS[@]}"; do
    echo -n "   - $BUCKET: "

    # Create bucket
    if ! garage_cmd bucket list | grep -q "$BUCKET"; then
        garage_cmd bucket create $BUCKET > /dev/null 2>&1
        echo -n "Created, "
    else
        echo -n "Exists, "
    fi

    # Allow key access (Essential since we just recreated the key)
    garage_cmd bucket allow $BUCKET --read --write --key $KEY_NAME > /dev/null 2>&1

    # Enable website access
    garage_cmd bucket website --allow $BUCKET > /dev/null 2>&1
    echo -n "Public Access OK, "

    # Apply CORS
    if command -v aws &> /dev/null; then
        aws --endpoint-url http://localhost:3902 s3api put-bucket-cors --bucket $BUCKET --cors-configuration file:///tmp/cors.json > /dev/null 2>&1
        echo "CORS Applied ✅"
    else
        echo "CORS Skipped (aws-cli not found) ⚠️"
    fi
done

# 5. Output Configuration
echo ""
echo "✅ SETUP COMPLETE!"
echo ""
echo "👇 COPY THIS INTO YOUR .env FILE 👇"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "S3_ENDPOINT=\"http://localhost:3902\""
echo "S3_REGION=\"$REGION\""
echo "S3_ACCESS_KEY=\"$ACCESS_KEY\""
echo "S3_SECRET_KEY=\"$SECRET_KEY\""
echo ""
echo "# Buckets"
echo "S3_BUCKET_PROPERTY_IMAGES=\"property-images\""
echo "S3_BUCKET_USER_AVATARS=\"user-avatars\""
echo "S3_BUCKET_DOCUMENTS=\"documents\""
echo ""
echo "# Public URL (Subdomain style for local dev)"
echo "S3_PUBLIC_URL=\"http://property-images.localhost:3903\""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"