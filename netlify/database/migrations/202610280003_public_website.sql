SET search_path TO babc_school, public;
CREATE TABLE website_submissions(id TEXT PRIMARY KEY,kind TEXT NOT NULL,name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL,payload TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'New' CHECK(status IN ('New','In review','Contacted','Closed')),created_at TEXT NOT NULL,fingerprint TEXT NOT NULL UNIQUE);
CREATE INDEX website_submission_email ON website_submissions(email,created_at);
CREATE TABLE website_events(id TEXT PRIMARY KEY,title TEXT NOT NULL,category TEXT NOT NULL,event_date TEXT NOT NULL DEFAULT '',description TEXT NOT NULL,location TEXT NOT NULL DEFAULT '',published INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL);
INSERT INTO website_events VALUES
('midterm','Midterm assessments','Academic calendar','','A checkpoint for learning and progress. The school will confirm the assessment dates and class arrangements.','',1,'2026-10-28T00:00:00Z'),
('examinations','End-of-term examinations','Academic calendar','','Preparation, revision and examination information for students and families. Dates will be published once approved.','',1,'2026-10-28T00:00:00Z'),
('career-day','Career Day conversations','Career Day','','Meet people, explore different professions and discover how today’s learning connects with tomorrow’s opportunities.','',1,'2026-10-28T00:00:00Z');
