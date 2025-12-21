# Java MCQ Quiz

A modern, production-ready Java MCQ Quiz application with an admin panel for managing questions and viewing results.

## Features

- 🎮 Modern quiz interface with animations
- 📊 Progress tracking and statistics
- 📝 Answer review after completion
- 🔄 Progress persistence (survives page refresh)
- ⚙️ Admin panel with Question & Results managers
- 🤖 AI-powered question generation (optional)
- 🔐 Admin authentication

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your values
```

### 3. Run the server
```bash
npm start
```

### 4. Open in browser
```
http://localhost:8080
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 8080) |
| `ADMIN_USERNAME` | Yes | Admin login username |
| `ADMIN_PASSWORD` | Yes | Admin login password |
| `GITHUB_TOKEN` | No | GitHub token for AI features |

## Admin Panel

Access the admin panel at `/login.html`:
- **Question Manager**: Add, edit, delete questions
- **Results Manager**: View statistics and all quiz results

## Project Structure

```
├── index.html      # Main quiz page
├── login.html      # Admin login page
├── admin.html      # Admin panel
├── script.js       # Quiz logic
├── color.css       # Styling
├── server.js       # Node.js backend
├── questions.json  # Quiz questions
├── results.json    # Quiz results
└── package.json    # Dependencies
```

## Production Deployment

1. Set secure values in `.env`
2. Use a process manager like PM2: `pm2 start server.js`
3. Configure reverse proxy (nginx/apache)
4. Enable HTTPS

## License

MIT
