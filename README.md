# BananaPrep Database Server Setup Guide

This guide will walk you through setting up the database server for the BananaPrep platform. The server handles user authentication, progress tracking, and problem management.

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- Basic knowledge of terminal/command line interface

## Step 1: Project Directory

```bash
cd server
```

## Step 2: Initialize Node.js Project

```bash
npm init -y
```

This creates a default `package.json` file.

## Step 3: Install Required Dependencies

```bash
npm install express sqlite3 bcrypt cors body-parser jsonwebtoken axios
```

This installs:
- **express**: Web application framework
- **sqlite3**: Database driver for SQLite
- **bcrypt**: Library for password hashing
- **cors**: Middleware for handling Cross-Origin Resource Sharing
- **body-parser**: Middleware for parsing request bodies
- **jsonwebtoken**: Library for generating and verifying JWT tokens

## Step 4: Create Server File

Create a file named `server.js` in your project directory and copy the provided server code into it.

## Step 5: Start the Server

```bash
node server.js
```

You should see messages like:
- "Connected to the BananaPrep database"
- "Database tables initialized"
- "Server running on port 3000"

## Step 6: Test the Server

The server should now be running at `http://localhost:3000`. You can test it with:

```bash
curl http://localhost:3000
```

or by opening the URL in a web browser. (Note that most endpoints require authentication)

## Server Configuration Details

### Port Configuration

The server runs on port 3000 by default. You can change this by setting the PORT environment variable:

```bash
PORT=8080 node server.js
```

### Database File

The server creates a SQLite database file called `BananaPrep.db` in the same directory. This file contains all user data and problem progress.

### JWT Secret Key

For production, you should change the JWT secret key in the server.js file:

```javascript
// Find this line in server.js:
const JWT_SECRET = 'BananaPrep-secret-key-change-in-production';
// Replace with a strong, unique secret
```

## API Endpoints

The server provides the following API endpoints:

### Authentication

- `POST /api/register`: Create a new user account
  - Body: `{ "fullName": "User Name", "email": "user@example.com", "password": "password123" }`
- `POST /api/login`: Sign in to an existing account
  - Body: `{ "email": "user@example.com", "password": "password123" }`

### User Data

- `GET /api/user/profile`: Get current user profile (requires auth)
- `GET /api/user/stats`: Get user statistics (requires auth)

### Problem Progress

- `POST /api/progress/update`: Update problem progress (requires auth)
  - Body: `{ "problemId": 1, "status": "solved", "solutionCode": "function solution() {...}" }`
- `GET /api/progress/all`: Get all user progress (requires auth)

## Connecting Client to Server

In your client HTML files (login.html, problem.html, database.html), update the API_URL variable:

```javascript
const API_URL = 'http://localhost:3000/api';
```

If you deploy the server to a different URL or port, update this value accordingly.

## Database Schema

The server creates the following database tables:

1. **users**: Stores user account information
   - id, full_name, email, password, date_joined, last_login

2. **user_progress**: Tracks problem attempts and solutions
   - id, user_id, problem_id, status, attempts, last_attempt_date, solution_code

3. **user_stats**: Stores aggregated user statistics
   - id, user_id, easy_solved, medium_solved, hard_solved, total_time_spent

## Running in Production

For production deployment:

1. Set a strong JWT secret key
2. Configure proper CORS settings for your domain
3. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name BananaPrep-server
   ```

## Troubleshooting

### Module Not Found Errors

If you see "Cannot find module" errors, make sure you've installed all dependencies:

```bash
npm install
```

### Database Errors

If you encounter database errors, you might need to delete the BananaPrep.db file and restart the server to recreate it:

```bash
rm BananaPrep.db
node server.js
```

### CORS Issues

If client pages can't connect to the server due to CORS issues, ensure your server CORS configuration matches your client origin:

```javascript
app.use(cors({
  origin: 'http://your-client-domain.com',
  // or for development:
  // origin: '*',
  credentials: true
}));
```

# Debugging
Make sure the server is running on your local host port 
```
python -m http.server 8000
```
and
```
https://localhost:8000
```
# For docker

```bash
chmod +x build-and-run.sh
```
and 
```
./build-and-run.sh
```


run all docker stuff in one command:
```
docker stop bananaprep-app && docker rm bananaprep-app && docker build -t bananaprep . && docker run -p 3000:3000 -d --name bananaprep-app bananaprep && docker image prune -f
```