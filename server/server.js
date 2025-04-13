// server.js - A simple Express server with Auth0 authentication for BananaPrep
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { auth } = require('express-openid-connect');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Auth0 Configuration
// IMPORTANT: Replace these with your own Auth0 credentials
const auth0Config = {
  authRequired: false,
  auth0Logout: true,
  secret: 'T_l_j5sH36W19NX4N7ApTSI6_vaF0_mKiUoa4VaEp1FdZkfJ838o3dJ88rDNd23y',
  baseURL: 'http://localhost:3000',
  clientID: 'L8JkJ6ayIp6izQbtduXo0mLPrGy1LK0a',
  issuerBaseURL: 'https://dev-q56oefqulqq0pvyb.us.auth0.com',
  routes: {
    login: '/api/login',
    callback: '/api/callback',
    logout: '/api/logout'
  }
};

// Middleware
app.use(cors({
  origin: '*',  // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(auth(auth0Config));

// Serve the client files
app.use(express.static(path.join(__dirname, '../client')));

// Serve index.html for the root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Add a specific route for problems.json
app.get('/data/problems.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'data', 'problems.json'));
});

// Initialize database
const db = new sqlite3.Database('./BananaPrep.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the BananaPrep database.');
    initDatabase();
  }
});

// Initialize database tables
function initDatabase() {
  db.serialize(() => {
    // Users table - simplified schema for Auth0
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      auth0_id TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      date_joined TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login TEXT
    )`);

    // User progress table
    db.run(`CREATE TABLE IF NOT EXISTS user_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      problem_id INTEGER NOT NULL,
      status TEXT DEFAULT 'attempted', 
      attempts INTEGER DEFAULT 1,
      last_attempt_date TEXT DEFAULT CURRENT_TIMESTAMP,
      solution_code TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // User session stats
    db.run(`CREATE TABLE IF NOT EXISTS user_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      easy_solved INTEGER DEFAULT 0,
      medium_solved INTEGER DEFAULT 0,
      hard_solved INTEGER DEFAULT 0,
      total_time_spent INTEGER DEFAULT 0,
      last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    console.log('Database tables initialized');
  });
}

// Load problems data
let problemsData = [];
try {
  const problemsFilePath = path.join(__dirname, 'public', 'data', 'problems.json');
  const problemsJson = fs.readFileSync(problemsFilePath, 'utf8');
  problemsData = JSON.parse(problemsJson);
  console.log(`Loaded ${problemsData.length} problems from problems.json`);
} catch (error) {
  console.error('Error loading problems data:', error);
}

// Auth0 User Profile Route
app.get('/api/user/profile', (req, res) => {
  if (!req.oidc.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const auth0Id = req.oidc.user.sub;
  
  // Find or create user in our database
  db.get('SELECT * FROM users WHERE auth0_id = ?', [auth0Id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (user) {
      // Update last login time
      db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
      
      return res.json({
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        date_joined: user.date_joined,
        last_login: user.last_login
      });
    } else {
      // Create new user record
      const userData = {
        auth0_id: auth0Id,
        full_name: req.oidc.user.name || 'BananaPrep User',
        email: req.oidc.user.email || 'user@example.com'
      };
      
      db.run('INSERT INTO users (auth0_id, full_name, email) VALUES (?, ?, ?)',
        [userData.auth0_id, userData.full_name, userData.email],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          // Create initial stats record for the user
          db.run('INSERT INTO user_stats (user_id) VALUES (?)', [this.lastID]);
          
          return res.json({
            id: this.lastID,
            full_name: userData.full_name,
            email: userData.email,
            date_joined: new Date().toISOString(),
            last_login: new Date().toISOString()
          });
        }
      );
    }
  });
});

// Authentication middleware
function requiresAuth(req, res, next) {
  if (!req.oidc.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Get user from database
  db.get('SELECT id FROM users WHERE auth0_id = ?', [req.oidc.user.sub], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'User not found in database' });
    }
    
    // Add user ID to request object
    req.userId = user.id;
    next();
  });
}

// User stats route
app.get('/api/user/stats', requiresAuth, (req, res) => {
  db.get('SELECT * FROM user_stats WHERE user_id = ?', 
    [req.userId], 
    (err, stats) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!stats) {
        return res.status(404).json({ error: 'Stats not found' });
      }
      
      res.json(stats);
    }
  );
});

// Validate answer endpoint
app.post('/api/validate-answer', requiresAuth, (req, res) => {
  try {
    const { problemId, userAnswer } = req.body;
    
    if (problemId === undefined || userAnswer === undefined) {
      return res.status(400).json({ error: 'Problem ID and user answer are required' });
    }
    
    // Get the problem from our loaded data
    const problem = problemsData[problemId];
    
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }
    
    // Check if the problem has a defined answer
    if (!problem.answer) {
      return res.status(400).json({ error: 'This problem does not have a defined answer' });
    }
    
    // Normalize both answers for comparison
    const normalizedUserAnswer = String(userAnswer).trim().toLowerCase();
    const normalizedCorrectAnswer = String(problem.answer).trim().toLowerCase();
    
    // Check if the answer is correct
    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
    
    // Update user progress based on answer correctness
    const status = isCorrect ? 'solved' : 'attempted';
    
    // Update progress in database
    db.get('SELECT * FROM user_progress WHERE user_id = ? AND problem_id = ?',
      [req.userId, problemId],
      (err, progress) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (progress) {
          // Update existing progress
          db.run(`UPDATE user_progress 
                 SET status = ?, attempts = attempts + 1, 
                     last_attempt_date = CURRENT_TIMESTAMP
                 WHERE user_id = ? AND problem_id = ?`,
            [status, req.userId, problemId],
            function(err) {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              
              // If answer is correct, update user stats
              if (isCorrect) {
                updateUserStats(req.userId, problem.difficulty);
              }
              
              res.json({ 
                isCorrect,
                message: isCorrect ? 'Correct answer!' : 'Incorrect answer. Try again.'
              });
            }
          );
        } else {
          // Create new progress entry
          db.run(`INSERT INTO user_progress (user_id, problem_id, status)
                  VALUES (?, ?, ?)`,
            [req.userId, problemId, status],
            function(err) {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              
              // If answer is correct, update user stats
              if (isCorrect) {
                updateUserStats(req.userId, problem.difficulty);
              }
              
              res.json({ 
                isCorrect,
                message: isCorrect ? 'Correct answer!' : 'Incorrect answer. Try again.'
              });
            }
          );
        }
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Problem progress tracking
app.post('/api/progress/update', requiresAuth, (req, res) => {
  try {
    const { problemId, status, solutionCode } = req.body;
    
    // Check if progress exists
    db.get('SELECT * FROM user_progress WHERE user_id = ? AND problem_id = ?', 
      [req.userId, problemId], 
      (err, progress) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (progress) {
          // Update existing progress
          db.run(`UPDATE user_progress 
                  SET status = ?, attempts = attempts + 1, 
                      last_attempt_date = CURRENT_TIMESTAMP, 
                      solution_code = ?
                  WHERE user_id = ? AND problem_id = ?`,
            [status, solutionCode, req.userId, problemId],
            function(err) {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              
              // Update user stats if problem is solved
              if (status === 'solved') {
                if (problemsData[problemId]) {
                  updateUserStats(req.userId, problemsData[problemId].difficulty);
                }
              }
              
              res.json({ message: 'Progress updated successfully' });
            }
          );
        } else {
          // Create new progress
          db.run(`INSERT INTO user_progress (user_id, problem_id, status, solution_code)
                  VALUES (?, ?, ?, ?)`,
            [req.userId, problemId, status, solutionCode],
            function(err) {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              
              // Update user stats if problem is solved
              if (status === 'solved') {
                if (problemsData[problemId]) {
                  updateUserStats(req.userId, problemsData[problemId].difficulty);
                }
              }
              
              res.json({ message: 'Progress created successfully' });
            }
          );
        }
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific problem progress
app.get('/api/progress/:problemId', requiresAuth, (req, res) => {
  try {
    const { problemId } = req.params;
    
    db.get('SELECT * FROM user_progress WHERE user_id = ? AND problem_id = ?',
      [req.userId, problemId],
      (err, progress) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (!progress) {
          return res.status(404).json({ error: 'No progress found for this problem' });
        }
        
        // Add problem data for reference (without exposing the answer)
        const problem = problemsData[problemId];
        if (problem) {
          // Create a copy without the answer field
          const { answer, ...problemWithoutAnswer } = problem;
          progress.problemData = problemWithoutAnswer;
        }
        
        res.json(progress);
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all user progress
app.get('/api/progress/all', requiresAuth, (req, res) => {
  try {
    db.all('SELECT * FROM user_progress WHERE user_id = ?',
      [req.userId],
      (err, progress) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (!progress || progress.length === 0) {
          return res.status(404).json({ error: 'No progress found' });
        }
        
        res.json(progress);
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to execute Octave code
app.post('/api/run-octave', requiresAuth, (req, res) => {
  const { code, input } = req.body;
  const userId = req.userId;
  
  // Create unique filenames for this execution
  const timestamp = Date.now();
  const filename = `octave_${userId}_${timestamp}.m`;
  const filepath = path.join('/tmp', filename);
  const plotPath = path.join('/tmp', 'octave_plot.png');
  
  // Prepare the code with input handling
  let fullCode = code;
  if (input) {
    fullCode = `input_value = ${input};\n${code}`;
  }
  
  // Save the code to a temporary file
  fs.writeFileSync(filepath, fullCode);
  
  // Execute the code with Octave
  exec(`octave --no-gui --quiet ${filepath}`, (error, stdout, stderr) => {
    // Clean up the temporary file
    fs.unlinkSync(filepath);
    
    if (error) {
      return res.status(400).json({
        success: false,
        output: stderr || error.message
      });
    }
    
    // Check if a plot image was generated
    if (fs.existsSync(plotPath)) {
      // Read the file as base64
      const imageData = fs.readFileSync(plotPath, {encoding: 'base64'});
      
      // Clean up the image file
      fs.unlinkSync(plotPath);
      
      // Return both the text output and the image data
      res.json({
        success: true,
        output: stdout,
        hasImage: true,
        imageData: `data:image/png;base64,${imageData}`
      });
    } else {
      // No image, just text output
      res.json({
        success: true,
        output: stdout,
        hasImage: false
      });
    }
  });
});

// Update user stats based on difficulty
function updateUserStats(userId, difficulty) {
  // Normalize difficulty to lowercase
  const difficultyLower = (difficulty || 'easy').toLowerCase();
  
  // Determine which field to update
  let field;
  switch (difficultyLower) {
    case 'easy':
      field = 'easy_solved';
      break;
    case 'medium':
      field = 'medium_solved';
      break;
    case 'hard':
      field = 'hard_solved';
      break;
    default:
      field = 'easy_solved'; // Default to easy if difficulty not recognized
  }
  
  // Update the appropriate counter
  db.run(`UPDATE user_stats SET ${field} = ${field} + 1, 
          last_updated = CURRENT_TIMESTAMP WHERE user_id = ?`,
    [userId],
    (err) => {
      if (err) {
        console.error('Error updating user stats:', err.message);
      }
    }
  );
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Auth0 integration enabled. Login at: http://localhost:${PORT}/api/login`);
});