-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Questions Table
create table questions (
  id uuid default uuid_generate_v4() primary key,
  question text not null,
  options jsonb not null, -- Stores { "A": "...", "B": "..." }
  answer text not null, -- Stores "A", "B", "C", or "D"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Results Table
create table results (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  score integer not null,
  total integer not null,
  percentage numeric(5,2) not null,
  date text not null, -- Storing as text to match existing format (YYYY-MM-DD)
  time text not null, -- Storing as text (HH:MM:SS)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Settings Table (Key-Value store)
create table settings (
  key text primary key,
  value jsonb not null
);

-- Insert default settings
insert into settings (key, value) values ('quiz_duration', '{"duration": 10}');

-- Insert default questions
insert into questions (question, options, answer) values
('Which keyword is used to create a class in Java?', '{"A": "class", "B": "new", "C": "object", "D": "create"}', 'A'),
('What is the entry point method of a Java program?', '{"A": "start()", "B": "run()", "C": "main()", "D": "init()"}', 'C'),
('What is the size of int in Java (in bits)?', '{"A": "8", "B": "16", "C": "32", "D": "64"}', 'C'),
('Which of the following is NOT a primitive data type in Java?', '{"A": "int", "B": "float", "C": "String", "D": "boolean"}', 'C'),
('Which keyword is used to create an object in Java?', '{"A": "class", "B": "new", "C": "this", "D": "object"}', 'B');
