# Quick Start Guide

Get up and running in under 5 minutes!

## Prerequisites

- Docker & Docker Compose installed
- Port 3000 and 5432 available

## Alternative: Manual Setup

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Start services
docker-compose up -d

# 3. Wait for database (10 seconds)
sleep 10

# 4. Generate Prisma Client and run migrations
docker-compose exec app npx prisma generate
docker-compose exec app npx prisma migrate deploy

# 5. Seed database
docker-compose exec app npm run seed
```

## Test It Works

### Get User IDs

After seeding, note the user IDs printed in the console. You'll need them for API requests.

### Make Your First Request

```bash
# Create a draft (replace <editor-uuid> with the actual ID)
curl -X POST http://localhost:3000/content \
  -H "Content-Type: application/json" \
  -H "x-user-id: <editor-uuid>" \
  -d '{
    "title": "My First Article",
    "body": "This is my first article content",
    "sector": "Technology"
  }'
```

### Complete the Workflow

1. **Create Draft** (as Editor) ✍️

   ```bash
   curl -X POST http://localhost:3000/content \
     -H "Content-Type: application/json" \
     -H "x-user-id: <editor-uuid>" \
     -d '{"title": "Test", "body": "Content", "sector": "Tech"}'
   ```

   Copy the `id` from the response.

2. **Submit for Review** (as Editor) 📤

   ```bash
   curl -X PATCH http://localhost:3000/content/<content-id>/submit-for-review \
     -H "x-user-id: <editor-uuid>"
   ```

3. **Approve** (as Reviewer) ✅

   ```bash
   curl -X PATCH http://localhost:3000/content/<content-id>/approve \
     -H "x-user-id: <reviewer-uuid>"
   ```

4. **List Published Content** 📋
   ```bash
   curl http://localhost:3000/content?status=published
   ```

## View Logs

```bash
# Follow application logs
docker-compose logs -f app

# You'll see async notifications like:
# [NotificationService] [ASYNC] Content xyz status changed...
```

## Troubleshooting

### Port Already in Use

```bash
# Change ports in docker-compose.yml
ports:
  - "3001:3000"  # Change 3001 to any available port
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart services
docker-compose restart
```

### Seed Script Errors

```bash
# Reset database
docker-compose down -v
docker-compose up -d
sleep 10
docker-compose exec app npm run seed
```

## Next Steps

- 📖 Read the full [README.md](README.md) for detailed documentation
- 📝 Check [API_EXAMPLES.md](API_EXAMPLES.md) for more request examples
- 🧪 Run tests: `docker-compose exec app npm test`
- 🔍 Explore the code structure in `src/`

## Stop Everything

```bash
# Stop containers (keeps data)
docker-compose down

# Stop and remove all data
docker-compose down -v
```

## Tips

1. **Save User IDs**: After seeding, save the user IDs somewhere handy
2. **Use Postman**: Import the requests from API_EXAMPLES.md for easier testing
3. **Watch Logs**: Keep logs open to see async notifications in real-time
4. **Test Permissions**: Try operations with different user roles to see permission enforcement
5. **Use Swagger**: `/docs` it available when use app in `development` mode `NODE_ENV="development"`

Happy coding! 🚀
