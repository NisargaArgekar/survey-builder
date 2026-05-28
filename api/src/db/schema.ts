/**
 * Database schema - define all tables
 * Run these SQL statements in D1 during setup
 */

export const SCHEMA = {
  // Users table - for authentication
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      password_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  // Surveys table - stores survey metadata
  surveys: `
    CREATE TABLE IF NOT EXISTS surveys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      primary_color TEXT DEFAULT '#007BFF',
      logo_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `,

  // Questions table - stores survey questions
  questions: `
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      survey_id TEXT NOT NULL,
      type TEXT NOT NULL,
      label TEXT NOT NULL,
      description TEXT,
      order_index INTEGER NOT NULL,
      is_required BOOLEAN DEFAULT 1,
      options TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (survey_id) REFERENCES surveys(id)
    )
  `,

  // Responses table - stores survey responses
  responses: `
    CREATE TABLE IF NOT EXISTS responses (
      id TEXT PRIMARY KEY,
      survey_id TEXT NOT NULL,
      respondent_id TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (survey_id) REFERENCES surveys(id)
    )
  `,

  // Answers table - individual question answers
  answers: `
    CREATE TABLE IF NOT EXISTS answers (
      id TEXT PRIMARY KEY,
      response_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      answer_value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (response_id) REFERENCES responses(id),
      FOREIGN KEY (question_id) REFERENCES questions(id)
    )
  `,
}

// Initialize all tables
export async function initializeDatabase(db: D1Database) {
  for (const [tableName, sql] of Object.entries(SCHEMA)) {
    try {
      await db.exec(sql)
      console.log(`✓ Table '${tableName}' initialized`)
    } catch (error) {
      console.error(`✗ Error creating table '${tableName}':`, error)
    }
  }
}
