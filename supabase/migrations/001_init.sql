-- CS2 match tracker schema

CREATE TABLE cs2_teams (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  logo_url TEXT,
  grid_team_id BIGINT,
  accent_color TEXT
);

CREATE TABLE cs2_matches (
  id SERIAL PRIMARY KEY,
  team1_id INT NOT NULL REFERENCES cs2_teams(id),
  team2_id INT NOT NULL REFERENCES cs2_teams(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  format TEXT NOT NULL DEFAULT 'BO3',
  stage TEXT NOT NULL DEFAULT 'Quarterfinal',
  event_name TEXT NOT NULL DEFAULT 'IEM Cologne 2026',
  status TEXT NOT NULL DEFAULT 'upcoming',
  grid_series_id TEXT,
  series_score_1 INT NOT NULL DEFAULT 0,
  series_score_2 INT NOT NULL DEFAULT 0,
  winner_team INT REFERENCES cs2_teams(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cs2_player_seeds (
  id SERIAL PRIMARY KEY,
  team_id INT NOT NULL REFERENCES cs2_teams(id),
  player_name TEXT NOT NULL,
  steam64_id TEXT NOT NULL UNIQUE
);

-- RLS (service role bypasses these; API routes use service role for writes)
ALTER TABLE cs2_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs2_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs2_player_seeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON cs2_teams FOR SELECT USING (true);
CREATE POLICY "Public read" ON cs2_matches FOR SELECT USING (true);
CREATE POLICY "Public read" ON cs2_player_seeds FOR SELECT USING (true);

-- Enable realtime on matches so the client list refreshes automatically
ALTER PUBLICATION supabase_realtime ADD TABLE cs2_matches;

-- Seed teams
INSERT INTO cs2_teams (name, short_name, grid_team_id) VALUES
  ('Aurora',        'AUR', NULL),
  ('BetBoom',       'BB',  52232),
  ('9z Team',       '9z',  51864),
  ('FURIA',         'FUR', NULL),
  ('G2 Esports',    'G2',  51822),
  ('Team Spirit',   'SPR', 49586),
  ('Falcons',       'FAL', NULL),
  ('Team Vitality', 'VIT', NULL);

-- Seed matches (times in UTC; matches are 06:45 and 10:00 CEST = 04:45 and 08:00 UTC)
INSERT INTO cs2_matches (team1_id, team2_id, scheduled_at, format, stage, event_name) VALUES
  (
    (SELECT id FROM cs2_teams WHERE short_name = 'AUR'),
    (SELECT id FROM cs2_teams WHERE short_name = 'BB'),
    '2026-06-18 04:45:00+00', 'BO3', 'Quarterfinal', 'IEM Cologne 2026'
  ),
  (
    (SELECT id FROM cs2_teams WHERE short_name = '9z'),
    (SELECT id FROM cs2_teams WHERE short_name = 'FUR'),
    '2026-06-18 08:00:00+00', 'BO3', 'Quarterfinal', 'IEM Cologne 2026'
  ),
  (
    (SELECT id FROM cs2_teams WHERE short_name = 'G2'),
    (SELECT id FROM cs2_teams WHERE short_name = 'SPR'),
    '2026-06-19 04:45:00+00', 'BO3', 'Quarterfinal', 'IEM Cologne 2026'
  ),
  (
    (SELECT id FROM cs2_teams WHERE short_name = 'FAL'),
    (SELECT id FROM cs2_teams WHERE short_name = 'VIT'),
    '2026-06-19 08:00:00+00', 'BO3', 'Quarterfinal', 'IEM Cologne 2026'
  );

-- Known player Steam64 IDs for auto-discovery
-- Aurora, BetBoom, FURIA, Falcons: add when rosters are confirmed
INSERT INTO cs2_player_seeds (team_id, player_name, steam64_id) VALUES
  ((SELECT id FROM cs2_teams WHERE short_name = 'SPR'), 'sh1ro',  '76561198081484775'),
  ((SELECT id FROM cs2_teams WHERE short_name = 'SPR'), 'donk',   '76561198386265483'),
  ((SELECT id FROM cs2_teams WHERE short_name = '9z'),  'meyern', '76561198195642865'),
  ((SELECT id FROM cs2_teams WHERE short_name = '9z'),  'dgt',    '76561198216891576'),
  ((SELECT id FROM cs2_teams WHERE short_name = 'VIT'), 'ZywOo',  '76561197999449861'),
  ((SELECT id FROM cs2_teams WHERE short_name = 'VIT'), 'apEX',   '76561198040541053');
