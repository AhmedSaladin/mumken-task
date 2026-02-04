# Sample API Requests

This file contains example API requests you can use to test the system.
Replace `<user-uuid>` with actual user IDs from the seed script output.

## Setup

After running the seed script, you'll have three users. Note their IDs from the console output:
- Admin User ID: `<admin-uuid>`
- Editor User ID: `<editor-uuid>`
- Reviewer User ID: `<reviewer-uuid>`

## Complete Workflow Example

### 1. Create a Draft (as Editor)

```bash
curl -X POST http://localhost:3000/content \
  -H "Content-Type: application/json" \
  -H "x-user-id: <editor-uuid>" \
  -d '{
    "title": "Understanding Machine Learning",
    "body": "Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. This article explores fundamental concepts and applications.",
    "sector": "Technology"
  }'
```

### 2. Update the Draft (as Editor)

```bash
curl -X PUT http://localhost:3000/content/<content-uuid> \
  -H "Content-Type: application/json" \
  -H "x-user-id: <editor-uuid>" \
  -d '{
    "title": "Understanding Machine Learning - Updated",
    "body": "Machine learning is a subset of artificial intelligence... [updated content]"
  }'
```

### 3. Submit for Review (as Editor)

```bash
curl -X PATCH http://localhost:3000/content/<content-uuid>/submit-for-review \
  -H "x-user-id: <editor-uuid>"
```

**Console Output (Async):**
```
[NotificationService] [ASYNC] Content <content-uuid> status changed from draft to in_review by user <editor-uuid>
```

### 4. Approve and Publish (as Reviewer)

```bash
curl -X PATCH http://localhost:3000/content/<content-uuid>/approve \
  -H "x-user-id: <reviewer-uuid>"
```

### 5. List All Content

```bash
# List all content
curl http://localhost:3000/content

# Filter by status
curl http://localhost:3000/content?status=published

# Filter by sector
curl http://localhost:3000/content?sector=Technology

# Combine filters
curl http://localhost:3000/content?status=draft&sector=Healthcare
```

## Testing Permission Scenarios

### Try to Create Content as Reviewer (Should Fail)

```bash
curl -X POST http://localhost:3000/content \
  -H "Content-Type: application/json" \
  -H "x-user-id: <reviewer-uuid>" \
  -d '{
    "title": "Test Article",
    "body": "This should fail",
    "sector": "Technology"
  }'
```

**Expected Response:**
```json
{
  "success": "false",
  "message": "You are lost @_@"
}
```

### Try to Approve as Editor (Should Fail)

```bash
curl -X PATCH http://localhost:3000/content/<content-uuid>/approve \
  -H "x-user-id: <editor-uuid>"
```

**Expected Response:**
```json
{
  "success": "false",
  "message": "You are lost @_@"
}
```

### Try to Edit Another Editor's Content (Should Fail)

```bash
# First, create content as editor1
curl -X POST http://localhost:3000/content \
  -H "Content-Type: application/json" \
  -H "x-user-id: <editor1-uuid>" \
  -d '{
    "title": "Editor 1 Article",
    "body": "Content by editor 1",
    "sector": "Technology"
  }'

# Then try to edit as different editor (should fail)
curl -X PUT http://localhost:3000/content/<content-uuid> \
  -H "Content-Type: application/json" \
  -H "x-user-id: <editor2-uuid>" \
  -d '{
    "title": "Trying to edit"
  }'
```

**Expected Response:**
```json
{
  "success": "false",
  "message": "This action is not allowed"
}
```

### Admin Can Do Everything

```bash
# Admin can create
curl -X POST http://localhost:3000/content \
  -H "Content-Type: application/json" \
  -H "x-user-id: <admin-uuid>" \
  -d '{
    "title": "Admin Article",
    "body": "Content created by admin",
    "sector": "Healthcare"
  }'

# Admin can edit anyone's content
curl -X PUT http://localhost:3000/content/<any-content-uuid> \
  -H "Content-Type: application/json" \
  -H "x-user-id: <admin-uuid>" \
  -d '{
    "title": "Admin Updated This"
  }'

# Admin can approve
curl -X PATCH http://localhost:3000/content/<content-uuid>/approve \
  -H "x-user-id: <admin-uuid>"
```

## Multiple Content Items Example

### Create Several Content Items

```bash
# Article 1 - Technology
curl -X POST http://localhost:3000/content \
  -H "Content-Type: application/json" \
  -H "x-user-id: <editor-uuid>" \
  -d '{
    "title": "Cloud Computing Trends 2024",
    "body": "Exploring the latest trends in cloud computing...",
    "sector": "Technology"
  }'

# Article 2 - Healthcare
curl -X POST http://localhost:3000/content \
  -H "Content-Type: application/json" \
  -H "x-user-id: <editor-uuid>" \
  -d '{
    "title": "Telemedicine Revolution",
    "body": "How telemedicine is changing healthcare delivery...",
    "sector": "Healthcare"
  }'

# Article 3 - Finance
curl -X POST http://localhost:3000/content \
  -H "Content-Type: application/json" \
  -H "x-user-id: <editor-uuid>" \
  -d '{
    "title": "Cryptocurrency Market Analysis",
    "body": "A comprehensive look at cryptocurrency markets...",
    "sector": "Finance"
  }'
```

### Test Filtering

```bash
# Get all drafts
curl http://localhost:3000/content?status=draft

# Get all Technology articles
curl http://localhost:3000/content?sector=Technology

# Get published Healthcare articles
curl http://localhost:3000/content?status=published&sector=Healthcare
```

## Error Scenarios

### Invalid Status Transition

```bash
# Try to approve a draft (must be in_review first)
curl -X PATCH http://localhost:3000/content/<draft-content-uuid>/approve \
  -H "x-user-id: <reviewer-uuid>"
```

**Expected Response:**
```json
{
  "success": "false",
  "message": "Only in review content can be approved"
}
```

### Content Not Found

```bash
curl http://localhost:3000/content/non-existent-uuid
```

**Expected Response:**
```json
{
  "success": "false",
  "message": "Content not found"
}
```

### Missing Authentication

```bash
curl -X POST http://localhost:3000/content \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "body": "Test body",
    "sector": "Technology"
  }'
```

**Expected Response:**
```json
{
  "success": "false",
  "message": "The user not exist, please contact the administrator"
}
```

### Invalid Data

```bash
curl -X POST http://localhost:3000/content \
  -H "Content-Type: application/json" \
  -H "x-user-id: <editor-uuid>" \
  -d '{
    "title": "",
    "sector": "Technology"
  }'
```

**Expected Response:**
```json
{
  "statusCode": 400,
  "message": [
    "title should not be empty",
    "body should not be empty",
    "body must be a string"
  ]
}
```

## Using Postman or Insomnia

Import these as a collection:

### Base URL
```
http://localhost:3000
```

### Headers
```
Content-Type: application/json
x-user-id: {{user_id}}
```

### Environment Variables
```
editor_id: <paste-from-seed-output>
reviewer_id: <paste-from-seed-output>
admin_id: <paste-from-seed-output>
```

## Observing Async Behavior

Watch the application logs to see async operations:

```bash
# If using Docker
docker-compose logs -f app

# If running locally
# Check console output
```

You'll see messages like:
```
[NotificationService] [ASYNC] Content abc-123 status changed from draft to in_review by user xyz-456
[NotificationService] [ASYNC ANALYTICS] Action: CREATE_DRAFT, Content: abc-123, User: xyz-456, Timestamp: 2024-02-03T10:00:00.000Z
```

## Quick Test Script

Create a file `test-workflow.sh`:

```bash
#!/bin/bash

EDITOR_ID="<your-editor-uuid>"
REVIEWER_ID="<your-reviewer-uuid>"
BASE_URL="http://localhost:3000"

echo "1. Creating draft..."
CONTENT=$(curl -s -X POST $BASE_URL/content \
  -H "Content-Type: application/json" \
  -H "x-user-id: $EDITOR_ID" \
  -d '{
    "title": "Test Article",
    "body": "Test content",
    "sector": "Technology"
  }')

CONTENT_ID=$(echo $CONTENT | jq -r '.id')
echo "Created content: $CONTENT_ID"

echo "2. Submitting for review..."
curl -s -X PATCH $BASE_URL/content/$CONTENT_ID/submit-for-review \
  -H "x-user-id: $EDITOR_ID" | jq

echo "3. Approving and publishing..."
curl -s -X PATCH $BASE_URL/content/$CONTENT_ID/approve \
  -H "x-user-id: $REVIEWER_ID" | jq

echo "4. Fetching final content..."
curl -s $BASE_URL/content/$CONTENT_ID | jq
```

Run with: `chmod +x test-workflow.sh && ./test-workflow.sh`
