# Inventory System — API Testing Guide (curl)

Base URL for local dev: `http://localhost:3306`

Tip: install `jq` for pretty-printed JSON output — `sudo apt install jq` — then pipe any command below through `| jq`.

---

## Health Check

Confirms the server is up.

```bash
curl -s http://localhost:3306/health
```

**Expected response:**
```json
{"status":"ok"}
```

---

## Items

### Create an item

```bash
curl -s -X POST http://localhost:3306/items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dell Laptop",
    "category": "Electronics",
    "serial_number": "SN12345"
  }'
```

**Expected response:** `201 Created` with the new item, including its generated `id`.

```json
{
  "id": 1,
  "name": "Dell Laptop",
  "category": "Electronics",
  "serial_number": "SN12345",
  "image_url": "",
  "status": "available",
  "created_at": "2026-07-02T00:00:00Z"
}
```

---

### List all items

```bash
curl -s http://localhost:3306/items
```

### Filter items by name

Partial, case-insensitive match on the `name` field.

```bash
curl -s "http://localhost:3306/items?name=laptop"
```

---

### Get a single item by ID

Replace `1` with a real item ID from a previous create/list call.

```bash
curl -s http://localhost:3306/items/1
```

**If not found:** `404 Not Found`
```json
{"error":"item not found"}
```

---

### Update an item

```bash
curl -s -X PUT http://localhost:3306/items/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dell Laptop Updated",
    "category": "Electronics",
    "serial_number": "SN12345",
    "status": "available"
  }'
```

---

### Delete an item

```bash
curl -s -X DELETE http://localhost:3306/items/1
```

**Expected response:** `204 No Content` (empty body, that's normal for a successful delete)

To check the status code explicitly:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X DELETE http://localhost:3306/items/1
```

---

## Image Upload (Cloudinary)

### Upload an image

The field name must be exactly `image`.

```bash
curl -s -X POST http://localhost:3306/upload \
  -F "image=@/home/infinity/test.jpg"
```

**Expected response:**
```json
{"image_url": "https://res.cloudinary.com/your_cloud_name/image/upload/v.../inventory-items/xxxxx.jpg"}
```

### Full flow: upload an image, then create an item with it

```bash
# 1. Upload and capture the URL
IMAGE_URL=$(curl -s -X POST http://localhost:3306/upload \
  -F "image=@/home/infinity/test.jpg" | jq -r '.image_url')

echo "Uploaded: $IMAGE_URL"

# 2. Create the item using that URL
curl -s -X POST http://localhost:3306/items \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Dell Laptop\",\"category\":\"Electronics\",\"serial_number\":\"SN12345\",\"image_url\":\"$IMAGE_URL\"}"
```

This requires `jq` to be installed, since it extracts `image_url` from the JSON response automatically.

---

## Debugging tips

**See the full request/response exchange (headers included):**
```bash
curl -v http://localhost:3306/items
```

**See just the HTTP status code:**
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3306/items
```

**Common status codes you'll see in this API:**
| Code | Meaning |
|---|---|
| 200 | OK — successful GET/PUT |
| 201 | Created — successful POST |
| 204 | No Content — successful DELETE |
| 400 | Bad Request — malformed JSON, missing required field, invalid ID |
| 404 | Not Found — item doesn't exist |
| 500 | Server Error — usually a DB or Cloudinary connection issue; check terminal logs |

---

## Changelog

- **2026-07-02** — Items CRUD + name filter, Cloudinary image upload added.
