-- ============================================================
-- SkillSwap X — MySQL Database Schema
-- Run: mysql -u root -p skillswapx < 001_schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS skillswapx CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE skillswapx;
-- Create user restricted to localhost
CREATE USER 'amogh'@'localhost' IDENTIFIED BY 'skillswapx';

-- Grant permissions only to skillswapx database
GRANT ALL PRIVILEGES ON skillswapx.* TO 'amogh'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;
-- ─── USERS ───────────────────────────────────────────────────
CREATE TABLE users (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(100)  NOT NULL,
    username            VARCHAR(50)   NOT NULL UNIQUE,
    email               VARCHAR(150)  NOT NULL UNIQUE,
    password_hash       VARCHAR(255)  NOT NULL,
    bio                 TEXT,
    location            VARCHAR(100),
    latitude            DECIMAL(10,8),
    longitude           DECIMAL(11,8),
    avatar_url          VARCHAR(255),
    trust_score         DECIMAL(5,2)  NOT NULL DEFAULT 50.00,
    trust_tier          ENUM('Bronze','Silver','Gold','Mentor Elite') NOT NULL DEFAULT 'Bronze',
    credits             INT           NOT NULL DEFAULT 10,
    verification_status ENUM('none','pending','verified') NOT NULL DEFAULT 'none',
    role                ENUM('user','admin') NOT NULL DEFAULT 'user',
    token_version       INT           NOT NULL DEFAULT 0,  -- for JWT invalidation on pw change
    oauth_provider      VARCHAR(30),
    oauth_id            VARCHAR(100),
    is_active           TINYINT(1)    NOT NULL DEFAULT 1,
    created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email      (email),
    UNIQUE KEY uq_oauth_identity (oauth_provider, oauth_id),
    INDEX idx_location   (latitude, longitude),
    INDEX idx_trust_tier (trust_tier)
);

-- ─── SKILL CATEGORIES ────────────────────────────────────────
CREATE TABLE skill_categories (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,
    icon        VARCHAR(50),
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO skill_categories (name, icon) VALUES
  ('Technology', 'code'),
  ('Arts & Design', 'palette'),
  ('Languages', 'globe'),
  ('Business', 'briefcase'),
  ('Health & Fitness', 'heart'),
  ('Music', 'music'),
  ('Cooking', 'chef-hat'),
  ('Science', 'flask'),
  ('Academics', 'book'),
  ('Soft Skills', 'users');

-- ─── SKILLS MASTER LIST ──────────────────────────────────────
CREATE TABLE skills (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    skill_name  VARCHAR(100) NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    description TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category_id),
    FOREIGN KEY (category_id) REFERENCES skill_categories(id) ON DELETE RESTRICT
);

-- ─── USER SKILLS (skills a user can teach or wants to learn) ─
CREATE TABLE user_skills (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NOT NULL,
    skill_id        INT UNSIGNED NOT NULL,
    type            ENUM('teach','learn') NOT NULL,
    proficiency     ENUM('Beginner','Intermediate','Advanced') NOT NULL DEFAULT 'Beginner',
    credit_rate     INT NOT NULL DEFAULT 5,       -- credits per session
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

-- ─── SWAP REQUESTS ───────────────────────────────────────────
CREATE TABLE swap_requests (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sender_id           INT UNSIGNED NOT NULL,
    receiver_id         INT UNSIGNED NOT NULL,
    skill_requested_id  INT UNSIGNED NOT NULL,  -- skill sender wants to learn
    skill_offered_id    INT UNSIGNED NOT NULL,  -- skill sender will teach
    status              ENUM('pending','accepted','rejected','completed','cancelled') NOT NULL DEFAULT 'pending',
    credits_locked      INT NOT NULL DEFAULT 0,
    message             TEXT,
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

-- ─── CREDIT ESCROW ───────────────────────────────────────────
CREATE TABLE credit_escrow (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    swap_request_id INT UNSIGNED NOT NULL UNIQUE,
    amount          INT NOT NULL,
    status          ENUM('held','released','refunded') NOT NULL DEFAULT 'held',
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at     TIMESTAMP NULL,
    FOREIGN KEY (swap_request_id) REFERENCES swap_requests(id) ON DELETE CASCADE
);

-- ─── SESSIONS ────────────────────────────────────────────────
CREATE TABLE sessions (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    swap_request_id  INT UNSIGNED NOT NULL,
    mentor_id        INT UNSIGNED NOT NULL,
    learner_id       INT UNSIGNED NOT NULL,
    start_time       DATETIME NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 60,
    attendance       ENUM('scheduled','completed','no_show','cancelled') NOT NULL DEFAULT 'scheduled',
    feedback_score   TINYINT UNSIGNED,           -- 1-5
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

-- ─── CREDIT TRANSACTIONS ─────────────────────────────────────
CREATE TABLE credit_transactions (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED NOT NULL,
    amount      INT NOT NULL,             -- positive = earned, negative = spent
    type        ENUM('earn','spend','lock','release','refund','welcome','admin') NOT NULL,
    reference   VARCHAR(100),             -- e.g. "session:42" or "swap:17"
    balance     INT NOT NULL,             -- running balance after this txn
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── SKILL CIRCLES ───────────────────────────────────────────
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

-- ─── NOTIFICATIONS ───────────────────────────────────────────
CREATE TABLE notifications (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED NOT NULL,
    type        VARCHAR(50)  NOT NULL,   -- e.g. 'swap_request', 'session_reminder'
    title       VARCHAR(150) NOT NULL,
    body        TEXT,
    is_read     TINYINT(1)   NOT NULL DEFAULT 0,
    reference   VARCHAR(100),            -- e.g. "swap:17"
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_unread (user_id, is_read),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── TRUST SCORE EVENTS ──────────────────────────────────────
CREATE TABLE trust_events (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED NOT NULL,
    event_type  VARCHAR(60)  NOT NULL,   -- 'session_completed', 'no_show', etc.
    delta       DECIMAL(5,2) NOT NULL,   -- change applied
    new_score   DECIMAL(5,2) NOT NULL,
    reference   VARCHAR(100),
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── REFRESH TOKENS ──────────────────────────────────────────
CREATE TABLE refresh_tokens (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED NOT NULL,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    expires_at  DATETIME     NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
