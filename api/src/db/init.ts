/**
 * Database initialization
 * Creates tables on first run
 */

export async function initializeDb(db: D1Database): Promise<void> {
  try {
    // Users table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        password_hash TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Surveys table
    await db.exec(`
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
    `)

    // Questions table
    await db.exec(`
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
    `)

    // Responses table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS responses (
        id TEXT PRIMARY KEY,
        survey_id TEXT NOT NULL,
        respondent_id TEXT,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (survey_id) REFERENCES surveys(id)
      )
    `)

    // Answers table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS answers (
        id TEXT PRIMARY KEY,
        response_id TEXT NOT NULL,
        question_id TEXT NOT NULL,
        answer_value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (response_id) REFERENCES responses(id),
        FOREIGN KEY (question_id) REFERENCES questions(id)
      )
    `)

    console.log('✓ Database initialized successfully')
  } catch (error) {
    // Tables might already exist, which is fine
    if (!(error instanceof Error && error.message.includes('already exists'))) {
      console.error('Error initializing database:', error)
    }
  }
}
