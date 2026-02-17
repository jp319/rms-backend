# 🪣 Garage S3 – Local Object Storage

Local S3-compatible storage for development using [Garage](https://garagehq.deuxfleurs.fr/).

## 🚀 First Time Setup

```bash
# 1. Start Garage
bun run s3:start

# 2. Run setup script
bun run s3:setup

# 3. Copy credentials from output to your .env file
```

**Add to `.env`:**

```env
S3_ENDPOINT="http://localhost:3902"
S3_REGION="garage"
S3_ACCESS_KEY="GK..."  # From setup output
S3_SECRET_KEY="..."    # From setup output
S3_BUCKET_PROPERTY_IMAGES="property-images"
S3_PUBLIC_URL="http://property-images.localhost:3903"
```

## 💼 Daily Usage

```bash
bun run s3:start   # Start Garage
bun run s3:stop    # Stop Garage
bun run s3:logs    # View logs
bun run s3:reset   # Complete reset (deletes all data)
```

## ✅ Verify Setup

```bash
# Check container is running
docker ps | grep garage

# Test with curl
curl http://localhost:3902
# Should return 404 (this is OK - means it's running)

# List buckets
docker exec rms-garage-s3 garage bucket list
```

## 🧪 Test Upload (Yaak/Postman)

**Step 1: Get upload URL**

```http
POST http://localhost:3000/api/properties/1/images/upload
Content-Type: application/json

{
  "filename": "test.jpg",
  "contentType": "image/jpeg"
}
```

**Step 2: Upload file**

```http
PUT <uploadUrl from response>
Content-Type: image/jpeg

[Select file in Body tab]
```

**Step 3: Access file**

```
http://localhost:3903/property-images/<filename>
```

## 🐛 Troubleshooting

**Container won't start:**

```bash
docker logs rms-garage-s3
```

**Lost credentials:**

```bash
docker exec rms-garage-s3 garage key info rms-key
```

**Permission errors:**

```bash
bun run s3:reset
```

**Can't access uploaded files:**

```bash
docker exec rms-garage-s3 garage bucket website --allow property-images
```

## 🔌 Endpoints

- **S3 API:** `http://localhost:3902` (for SDK)
- **Public Files:** `http://localhost:3903` (browser access)

## 📁 Directory Structure

```
.garages3/
├── data/              # Storage (gitignored)
├── meta/              # Metadata (gitignored)
├── docker-compose.yml
├── garage.toml
└── setup.sh
```

---

**Need to reset everything?** → `bun run s3:reset`
