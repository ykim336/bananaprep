// server.js - A simple Express server to handle BananaPrep authentication and database operations
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const jwt = require('jsonwebtoken');
const fs = require('fs');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

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
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
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

// Secret key for JWT
const JWT_SECRET = 'BananaPrep-secret-key-change-in-production';

// Authentication routes
app.post('/api/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    
    // Validate inputs
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Check if user already exists
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (user) {
        return res.status(400).json({ error: 'User already exists with this email' });
      }
      
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Insert new user
      db.run('INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)',
        [fullName, email, hashedPassword],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          // Create initial stats record for the user
          db.run('INSERT INTO user_stats (user_id) VALUES (?)', [this.lastID]);
          
          // Generate JWT token
          const token = jwt.sign({ id: this.lastID, email }, JWT_SECRET, { expiresIn: '24h' });
          
          res.status(201).json({
            message: 'User registered successfully',
            token,
            userId: this.lastID
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // Compare password
      const passwordMatch = await bcrypt.compare(password, user.password);
      
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // Update last login
      db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
      
      // Generate JWT token
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
      
      res.json({
        message: 'Login successful',
        token,
        userId: user.id,
        fullName: user.full_name
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware to authenticate token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication token is required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    req.user = user;
    next();
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

// Protected user routes
app.get('/api/user/profile', authenticateToken, (req, res) => {
  db.get('SELECT id, full_name, email, date_joined, last_login FROM users WHERE id = ?', 
    [req.user.id], 
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    }
  );
});

app.get('/api/user/stats', authenticateToken, (req, res) => {
  db.get('SELECT * FROM user_stats WHERE user_id = ?', 
    [req.user.id], 
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

// NEW: Validate answer endpoint
app.post('/api/validate-answer', authenticateToken, (req, res) => {
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
    
    // Normalize both answers for comparison (convert to string, trim whitespace, lowercase)
    const normalizedUserAnswer = String(userAnswer).trim().toLowerCase();
    const normalizedCorrectAnswer = String(problem.answer).trim().toLowerCase();
    
    // Check if the answer is correct
    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
    
    // Update user progress based on answer correctness
    const status = isCorrect ? 'solved' : 'attempted';
    
    // Update progress in database
    db.get('SELECT * FROM user_progress WHERE user_id = ? AND problem_id = ?',
      [req.user.id, problemId],
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
            [status, req.user.id, problemId],
            function(err) {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              
              // If answer is correct, update user stats
              if (isCorrect) {
                updateUserStats(req.user.id, problem.difficulty);
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
            [req.user.id, problemId, status],
            function(err) {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              
              // If answer is correct, update user stats
              if (isCorrect) {
                updateUserStats(req.user.id, problem.difficulty);
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
app.post('/api/progress/update', authenticateToken, (req, res) => {
  try {
    const { problemId, status, solutionCode } = req.body;
    
    // Check if progress exists
    db.get('SELECT * FROM user_progress WHERE user_id = ? AND problem_id = ?', 
      [req.user.id, problemId], 
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
            [status, solutionCode, req.user.id, problemId],
            function(err) {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              
              // Update user stats if problem is solved
              if (status === 'solved') {
                if (problemsData[problemId]) {
                  updateUserStats(req.user.id, problemsData[problemId].difficulty);
                }
              }
              
              res.json({ message: 'Progress updated successfully' });
            }
          );
        } else {
          // Create new progress
          db.run(`INSERT INTO user_progress (user_id, problem_id, status, solution_code)
                  VALUES (?, ?, ?, ?)`,
            [req.user.id, problemId, status, solutionCode],
            function(err) {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              
              // Update user stats if problem is solved
              if (status === 'solved') {
                if (problemsData[problemId]) {
                  updateUserStats(req.user.id, problemsData[problemId].difficulty);
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
app.get('/api/progress/:problemId', authenticateToken, (req, res) => {
  try {
    const { problemId } = req.params;
    
    db.get('SELECT * FROM user_progress WHERE user_id = ? AND problem_id = ?',
      [req.user.id, problemId],
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
app.get('/api/progress/all', authenticateToken, (req, res) => {
  try {
    db.all('SELECT * FROM user_progress WHERE user_id = ?',
      [req.user.id],
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

// In your server.js file, add a new endpoint:
const { exec } = require('child_process');
// const fs = require('fs');
// const path = require('path');

// Endpoint to execute Octave code
app.post('/api/run-octave', authenticateToken, (req, res) => {
  const { code, input } = req.body;
  const userId = req.user.id;
  
  // Create unique filenames
  const timestamp = Date.now();
  const filename = `octave_${userId}_${timestamp}.m`;
  const filepath = path.join('/tmp', filename);
  const plotPath = path.join('/tmp', `plot_${userId}_${timestamp}.png`);
  
  // Add code to save plot to a file
  let fullCode = code.replace(/print\(['"](\/tmp\/plot\.png)['"]/, 
                             `print('${plotPath}'`);
  
  if (input) {
    fullCode = `input_value = ${input};\n${fullCode}`;
  }
  
  // Save the code to a temporary file
  fs.writeFileSync(filepath, fullCode);
  
  // Execute the code with Octave
  exec(`octave --no-gui --quiet ${filepath}`, (error, stdout, stderr) => {
    // Clean up the code file
    fs.unlinkSync(filepath);
    
    if (error) {
      return res.status(400).json({
        success: false,
        output: stderr || error.message
      });
    }
    
    // Check if an image was generated
    if (fs.existsSync(plotPath)) {
      // Read the image file
      const imageData = fs.readFileSync(plotPath);
      // Clean up the image file
      fs.unlinkSync(plotPath);
      
      // Send the image data
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': imageData.length
      });
      res.end(imageData);
    } else {
      // No image, just return the text output
      res.json({
        success: true,
        output: stdout
      });
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});