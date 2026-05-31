-- ============================================================
-- SkillSwap X — Complete MySQL Database Schema & Mock Data
-- ============================================================

-- Clean database (optional during development)
DROP DATABASE IF EXISTS skillswapx;

CREATE DATABASE skillswapx
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE skillswapx;

-- ------------------------------------------------------------
-- USER SETUP
-- ------------------------------------------------------------

DROP USER IF EXISTS 'amogh'@'localhost';

CREATE USER 'root'@'localhost'
IDENTIFIED BY 'skillswapx'; -- Note: If your .env has DB_PASS=skillswapx, adjust accordingly.

GRANT ALL PRIVILEGES
ON skillswapx.*
TO 'amogh'@'localhost';

FLUSH PRIVILEGES;

-- ------------------------------------------------------------
-- USERS TABLE
-- ------------------------------------------------------------

CREATE TABLE users (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(100) NOT NULL,
    username            VARCHAR(50) NOT NULL UNIQUE,
    email               VARCHAR(150) NOT NULL UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    bio                 TEXT,
    location            VARCHAR(100),
    latitude            DECIMAL(10,8),
    longitude           DECIMAL(11,8),
    avatar_url          VARCHAR(255),

    trust_score         DECIMAL(5,2) NOT NULL DEFAULT 50.00,

    trust_tier ENUM(
        'Bronze',
        'Silver',
        'Gold',
        'Mentor Elite'
    ) NOT NULL DEFAULT 'Bronze',

    credits             INT NOT NULL DEFAULT 10,

    verification_status ENUM(
        'none',
        'pending',
        'verified'
    ) NOT NULL DEFAULT 'none',

    role ENUM(
        'user',
        'admin'
    ) NOT NULL DEFAULT 'user',

    token_version       INT NOT NULL DEFAULT 0,

    oauth_provider      VARCHAR(30),
    oauth_id            VARCHAR(100),

    is_active           TINYINT(1) NOT NULL DEFAULT 1,

    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_email (email),
    INDEX idx_location (latitude, longitude),
    INDEX idx_trust_tier (trust_tier),

    UNIQUE KEY uq_oauth_identity (
        oauth_provider,
        oauth_id
    )
);

-- ------------------------------------------------------------
-- SKILL CATEGORIES TABLE
-- ------------------------------------------------------------

CREATE TABLE skill_categories (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,
    icon        VARCHAR(50),
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- SKILLS MASTER LIST TABLE
-- ------------------------------------------------------------

CREATE TABLE skills (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    skill_name  VARCHAR(100) NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    description TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category_id),
    FOREIGN KEY (category_id) REFERENCES skill_categories(id) ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- USER SKILLS TABLE
-- ------------------------------------------------------------

CREATE TABLE user_skills (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NOT NULL,
    skill_id        INT UNSIGNED NOT NULL,
    type            ENUM('teach','learn') NOT NULL,
    proficiency     ENUM('Beginner','Intermediate','Advanced') NOT NULL DEFAULT 'Beginner',
    credit_rate     INT NOT NULL DEFAULT 5,
    session_format  ENUM('online','offline','both') NOT NULL DEFAULT 'online',
    description     TEXT,
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_skill_type (user_id, skill_id, type),
    INDEX idx_user   (user_id),
    INDEX idx_skill  (skill_id),
    FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- SWAP REQUESTS TABLE
-- ------------------------------------------------------------

CREATE TABLE swap_requests (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sender_id           INT UNSIGNED NOT NULL,
    receiver_id         INT UNSIGNED NOT NULL,
    skill_requested_id  INT UNSIGNED NOT NULL,
    skill_offered_id    INT UNSIGNED DEFAULT NULL, -- Nullable to support direct bookings and video pitches
    status              ENUM('pending','accepted','rejected','completed','cancelled') NOT NULL DEFAULT 'pending',
    credits_locked      INT NOT NULL DEFAULT 0,
    message             TEXT,
    video_url           VARCHAR(255) DEFAULT NULL, -- Added to support Video Pitch requirements
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sender   (sender_id),
    INDEX idx_receiver (receiver_id),
    INDEX idx_status   (status),
    FOREIGN KEY (sender_id)          REFERENCES users(id)       ON DELETE CASCADE,
    FOREIGN KEY (receiver_id)        REFERENCES users(id)       ON DELETE CASCADE,
    FOREIGN KEY (skill_requested_id) REFERENCES skills(id)      ON DELETE RESTRICT,
    FOREIGN KEY (skill_offered_id)   REFERENCES skills(id)      ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- CREDIT ESCROW TABLE
-- ------------------------------------------------------------

CREATE TABLE credit_escrow (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    swap_request_id INT UNSIGNED NOT NULL UNIQUE,
    amount          INT NOT NULL,
    status          ENUM('held','released','refunded') NOT NULL DEFAULT 'held',
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at     TIMESTAMP NULL,
    FOREIGN KEY (swap_request_id) REFERENCES swap_requests(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- SESSIONS TABLE
-- ------------------------------------------------------------

CREATE TABLE sessions (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    swap_request_id  INT UNSIGNED NOT NULL,
    mentor_id        INT UNSIGNED NOT NULL,
    learner_id       INT UNSIGNED NOT NULL,
    start_time       DATETIME NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 60,
    attendance       ENUM('scheduled','completed','no_show','cancelled') NOT NULL DEFAULT 'scheduled',
    feedback_score   TINYINT UNSIGNED,
    feedback_text    TEXT,
    recording_url    VARCHAR(255),
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_mentor  (mentor_id),
    INDEX idx_learner (learner_id),
    INDEX idx_swap    (swap_request_id),
    FOREIGN KEY (swap_request_id) REFERENCES swap_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (mentor_id)       REFERENCES users(id)         ON DELETE CASCADE,
    FOREIGN KEY (learner_id)      REFERENCES users(id)         ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- CREDIT TRANSACTIONS TABLE
-- ------------------------------------------------------------

CREATE TABLE credit_transactions (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED NOT NULL,
    amount      INT NOT NULL,
    type        ENUM('earn','spend','lock','release','refund','welcome','admin') NOT NULL,
    reference   VARCHAR(100),
    balance     INT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- SKILL CIRCLES TABLE
-- ------------------------------------------------------------

CREATE TABLE skill_circles (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    location        VARCHAR(100),
    latitude        DECIMAL(10,8),
    longitude       DECIMAL(11,8),
    topic           VARCHAR(100) NOT NULL,
    weekly_schedule VARCHAR(100),
    max_members     INT NOT NULL DEFAULT 15,
    created_by      INT UNSIGNED NOT NULL,
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_creator  (created_by),
    INDEX idx_location (latitude, longitude),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- CIRCLE MEMBERS TABLE
-- ------------------------------------------------------------

CREATE TABLE circle_members (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    circle_id   INT UNSIGNED NOT NULL,
    user_id     INT UNSIGNED NOT NULL,
    role        ENUM('member','mentor','admin') NOT NULL DEFAULT 'member',
    joined_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_circle_user (circle_id, user_id),
    FOREIGN KEY (circle_id) REFERENCES skill_circles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)   REFERENCES users(id)         ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- NOTIFICATIONS TABLE
-- ------------------------------------------------------------

CREATE TABLE notifications (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED NOT NULL,
    type        VARCHAR(50)  NOT NULL,
    title       VARCHAR(150) NOT NULL,
    body        TEXT,
    is_read     TINYINT(1)   NOT NULL DEFAULT 0,
    reference   VARCHAR(100),
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_unread (user_id, is_read),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- TRUST SCORE EVENTS TABLE
-- ------------------------------------------------------------

CREATE TABLE trust_events (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED NOT NULL,
    event_type  VARCHAR(60)  NOT NULL,
    delta       DECIMAL(5,2) NOT NULL,
    new_score   DECIMAL(5,2) NOT NULL,
    reference   VARCHAR(100),
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- REFRESH TOKENS TABLE
-- ------------------------------------------------------------

CREATE TABLE refresh_tokens (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED NOT NULL,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    expires_at  DATETIME     NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- ============================================================
-- DATA SEEDING
-- ============================================================

-- 1. Seed Skill Categories
INSERT INTO skill_categories (id, name, icon) VALUES
(1, 'Technology', 'code'),
(2, 'Arts & Design', 'palette'),
(3, 'Languages', 'globe'),
(4, 'Business', 'briefcase'),
(5, 'Health & Fitness', 'heart'),
(6, 'Music', 'music'),
(7, 'Cooking', 'chef-hat'),
(8, 'Science', 'flask'),
(9, 'Academics', 'book'),
(10, 'Soft Skills', 'users');

-- 2. Seed Skills (Master List)
INSERT INTO skills (id, skill_name, category_id, description) VALUES
(1, 'React', 1, 'Frontend JavaScript library for building component-based user interfaces.'),
(2, 'Python', 1, 'High-level programming language suitable for data science, web dev, and automation.'),
(3, 'Design', 2, 'UI/UX layout, typography, design systems, and visual communication.'),
(4, 'Mandarin', 3, 'Conversational Chinese speech, grammar structure, and writing characters.'),
(5, 'French', 3, 'Conversational French speech, vocabulary, and grammar rules.'),
(6, 'Jazz Piano', 6, 'Jazz chord voicings, scale modes, progression styles, and improvisation.'),
(7, 'Yoga', 5, 'Asanas, alignments, breathing techniques, and posture flow layouts.'),
(8, 'Photography', 2, 'Composition, manual camera operations, exposure rules, and digital development.'),
(9, 'Writing', 10, 'Creative storytelling, technical copywriting, and structural editing.'),
(10, 'Marketing', 4, 'Growth marketing strategies, social search networks, and campaign metrics.'),
(11, 'Finance', 4, 'Financial modeling, valuation analysis, spreadsheets, and budgeting systems.'),
(12, 'Ceramics', 2, 'Wheel-throwing, clay preparation, hand-building, glazing, and kiln processes.'),
(13, 'Data Viz', 1, 'Mapping numbers to charts, dashboards, and storytelling layouts.'),
(14, 'Rust', 1, 'Systems language targeting performance, memory guarantees, and safe concurrency.'),
(15, 'AI/ML', 1, 'Large language models, prompt engineering, vectors, and fine-tuning pipelines.');

-- 3. Seed Users
-- Password hash is bcrypt for 'password123'
INSERT INTO users (id, name, username, email, password_hash, bio, location, latitude, longitude, avatar_url, trust_score, trust_tier, credits, verification_status, role) VALUES
(1, 'Amogh S Y', 'sy23amogh', 'sy23amogh@gmail.com', '$2y$12$3L8.tfBkwdeEL4kpA/6JPOgl/kty2fiYYL6DQGAw88Fu5l8HT.EMa', 'Fullstack developer & designer. Teaching React, Rust & AI/ML. Learning Mandarin & French.', 'Bengaluru, IN', 12.97160000, 77.59460000, 'https://api.dicebear.com/9.x/glass/svg?seed=Amogh&backgroundColor=3b82f6,8b5cf6,06b6d4', 92.50, 'Gold', 184, 'verified', 'user'),
(2, 'Maya Lin', 'mayalin', 'maya@example.com', '$2y$12$3L8.tfBkwdeEL4kpA/6JPOgl/kty2fiYYL6DQGAw88Fu5l8HT.EMa', 'Senior product designer @ Linear. Loves design systems, type & motion.', 'Berlin, DE', 52.52000000, 13.40500000, 'https://api.dicebear.com/9.x/glass/svg?seed=Maya&backgroundColor=3b82f6,8b5cf6,06b6d4', 96.00, 'Mentor Elite', 320, 'verified', 'user'),
(3, 'Diego Alvarez', 'diego', 'diego@example.com', '$2y$12$3L8.tfBkwdeEL4kpA/6JPOgl/kty2fiYYL6DQGAw88Fu5l8HT.EMa', 'ML Engineer · ex-Meta. Building agentic RAG systems and LLMs.', 'Mexico City, MX', 19.43260000, -99.13320000, 'https://api.dicebear.com/9.x/glass/svg?seed=Diego&backgroundColor=3b82f6,8b5cf6,06b6d4', 91.00, 'Gold', 410, 'verified', 'user'),
(4, 'Sara Okafor', 'sara', 'sara@example.com', '$2y$12$3L8.tfBkwdeEL4kpA/6JPOgl/kty2fiYYL6DQGAw88Fu5l8HT.EMa', 'Polyglot language tutor. Teaching French, Mandarin & Spanish.', 'Lagos, NG', 6.52440000, 3.37920000, 'https://api.dicebear.com/9.x/glass/svg?seed=Sara&backgroundColor=3b82f6,8b5cf6,06b6d4', 88.00, 'Silver', 220, 'verified', 'user'),
(5, 'Kenji Watanabe', 'kenji', 'kenji@example.com', '$2y$12$3L8.tfBkwdeEL4kpA/6JPOgl/kty2fiYYL6DQGAw88Fu5l8HT.EMa', 'Jazz pianist & arranger. Berklee alumni. Teaching improvisation & music theory.', 'Tokyo, JP', 35.67620000, 139.65030000, 'https://api.dicebear.com/9.x/glass/svg?seed=Kenji&backgroundColor=3b82f6,8b5cf6,06b6d4', 84.00, 'Bronze', 150, 'none', 'user'),
(6, 'Hana Park', 'hana', 'hana@example.com', '$2y$12$3L8.tfBkwdeEL4kpA/6JPOgl/kty2fiYYL6DQGAw88Fu5l8HT.EMa', 'Yoga instructor & breathwork coach. Focus on posture and mindfulness.', 'Seoul, KR', 37.56650000, 126.97800000, 'https://api.dicebear.com/9.x/glass/svg?seed=Hana&backgroundColor=3b82f6,8b5cf6,06b6d4', 90.00, 'Gold', 240, 'verified', 'user');

-- 4. Seed User Skills
INSERT INTO user_skills (user_id, skill_id, type, proficiency, credit_rate, session_format, description) VALUES
(1, 1, 'teach', 'Advanced', 12, 'both', 'Can teach React, Hooks, state management & Next.js.'),
(1, 14, 'teach', 'Advanced', 15, 'online', 'Systems programming in Rust, memory safety & concurrency.'),
(1, 4, 'learn', 'Beginner', 5, 'online', 'Looking to learn conversational Mandarin.'),
(1, 3, 'learn', 'Intermediate', 8, 'both', 'Improve my design systems skills.'),

(2, 3, 'teach', 'Advanced', 14, 'both', 'Teaching Design Systems from scratch, token architecture, and Figma best practices.'),
(2, 8, 'teach', 'Advanced', 12, 'both', 'Visual composition, framing, and lightroom editing techniques.'),
(2, 4, 'learn', 'Beginner', 5, 'online', 'Wants to learn basic Mandarin.'),

(3, 15, 'teach', 'Advanced', 18, 'online', 'RAG systems, fine-tuning LLMs, vector search & agentic workflows.'),
(3, 2, 'teach', 'Advanced', 10, 'online', 'Python backend architecture, FastAPI, and data engineering pipelines.'),
(3, 6, 'learn', 'Beginner', 6, 'online', 'Loves Jazz Piano and wants to learn voicings.'),

(4, 5, 'teach', 'Advanced', 8, 'online', 'Fluent French speaker teaching conversational French, vocabulary, and grammar.'),
(4, 4, 'teach', 'Advanced', 9, 'online', 'Native Mandarin speaker teaching tones, conversations, and writing.'),

(5, 6, 'teach', 'Advanced', 10, 'both', 'Jazz piano improvisations, chord progressions & scales.'),

(6, 7, 'teach', 'Advanced', 7, 'both', 'Hatha & Vinyasa yoga sessions focused on mindfulness & breathwork.');

-- 5. Seed Skill Circles
INSERT INTO skill_circles (id, name, description, location, topic, weekly_schedule, max_members, created_by) VALUES
(1, 'Frontend Forge', 'A small group focused on React performance, rendering patterns, design systems, and token structures.', 'Online · Global', 'React, performance, design systems', 'Weekly · Thu 7pm', 30, 1),
(2, 'Polyglots Café', 'Informal conversations and language swaps in 12+ languages. Join anytime!', 'Online · Global', 'Language exchange · 12 languages', 'Daily standup', 50, 4),
(3, 'Bengaluru Builders', 'Local group for indie hackers and developers building in Bengaluru. Real-life meetups, demo nights, and coffee.', 'Bengaluru, IN', 'Indie hackers IRL meetup', 'Bi-weekly · Sat', 15, 1),
(4, 'AI Research Reading', 'Reading and discussing recent papers on large language models, agent frameworks, and diffusion models.', 'Online', 'Weekly paper club', 'Wed 9pm UTC', 25, 3);

-- 6. Seed Circle Members
INSERT INTO circle_members (circle_id, user_id, role) VALUES
(1, 1, 'admin'),
(1, 2, 'mentor'),
(1, 3, 'member'),
(2, 4, 'admin'),
(2, 1, 'member'),
(2, 2, 'member'),
(3, 1, 'admin'),
(4, 3, 'admin'),
(4, 1, 'member');

-- 7. Seed Swap Requests
INSERT INTO swap_requests (id, sender_id, receiver_id, skill_requested_id, skill_offered_id, status, credits_locked, message, video_url) VALUES
(1, 1, 2, 3, 1, 'accepted', 12, 'Hey Maya, would love to learn token management from you. I can teach you advanced React patterns!', NULL),
(2, 1, 4, 4, 1, 'pending', 8, 'Hi Sara, let us swap React and Mandarin lessons!', NULL);

-- 8. Seed Credit Escrows (tied to swap requests)
INSERT INTO credit_escrow (id, swap_request_id, amount, status) VALUES
(1, 1, 12, 'held'),
(2, 2, 8, 'held');

-- 9. Seed Sessions
INSERT INTO sessions (id, swap_request_id, mentor_id, learner_id, start_time, duration_minutes, attendance, feedback_score, feedback_text, recording_url) VALUES
(1, 1, 2, 1, DATE_ADD(NOW(), INTERVAL 2 HOUR), 60, 'scheduled', NULL, NULL, NULL),
(2, 1, 1, 2, DATE_SUB(NOW(), INTERVAL 1 DAY), 60, 'completed', 5, 'Amogh explained hooks and performance optimization extremely well. Highly recommended!', NULL);

-- 10. Seed Notifications
INSERT INTO notifications (user_id, type, title, body, is_read, reference) VALUES
(1, 'swap_request', 'Swap accepted', 'Maya Lin accepted your Design Systems swap.', 0, 'swap:1'),
(1, 'credit_earn', '+12 credits', 'Completed: React Patterns session with Maya.', 0, 'session:2'),
(1, 'session_reminder', 'Session starting soon', 'Conversational French in 45 min.', 0, 'session:1'),
(1, 'circle_live', 'Frontend Forge is live', '5 mentors online now.', 1, 'circle:1');

-- 11. Seed Credit Transactions
INSERT INTO credit_transactions (user_id, amount, type, reference, balance) VALUES
(1, 10, 'welcome', 'welcome_bonus', 10),
(1, 120, 'earn', 'session:completed', 130),
(1, 54, 'earn', 'session:completed', 184);

-- 12. Seed Trust Events
-- Matching events explaining Amogh's Gold status (trust score: 92.50) from starting 50.00 base score
INSERT INTO trust_events (user_id, event_type, delta, new_score, reference) VALUES
(1, 'session_completed', 5.00, 89.50, 'session:2'),
(1, 'session_completed_feedback', 3.00, 92.50, 'session:2');
