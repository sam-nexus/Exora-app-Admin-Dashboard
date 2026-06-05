-- Stores mock exam and exit exam results for students
CREATE TABLE IF NOT EXISTS exam_results (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id     UUID REFERENCES courses(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  exam_type     TEXT NOT NULL CHECK (exam_type IN ('mock', 'exit')),
  mode          TEXT NOT NULL CHECK (mode IN ('practice', 'test')),
  score         INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  total_count   INTEGER NOT NULL,
  is_passed     BOOLEAN NOT NULL,
  answers       JSONB,          -- { questionId: "A", ... }
  results       JSONB,          -- detailed per-question breakdown
  time_taken    INTEGER,        -- seconds spent (optional)
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookup by user
CREATE INDEX IF NOT EXISTS idx_exam_results_user_id ON exam_results(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_course_id ON exam_results(course_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_department_id ON exam_results(department_id);

-- RLS: users can only read their own results; admins can read all
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own exam results"
  ON exam_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access"
  ON exam_results FOR ALL
  USING (true);
