<?php
// seed.php — Seed realistic data into the database for testing

declare(strict_types=1);

require_once __DIR__ . '/config/database.php';

$db = Database::getInstance();

echo "Starting database seeding...\n";

// Automatically execute schema creation to make sure the database structure is set up
try {
    $schemaFile = __DIR__ . '/migrations/002_schema.sql';
    if (file_exists($schemaFile)) {
        echo "Checking database schema and creating tables if missing...\n";
        $sql = file_get_contents($schemaFile);
        
        // Remove local privilege commands to prevent permission errors on varied environments
        $sql = preg_replace('/CREATE USER.*/i', '', $sql);
        $sql = preg_replace('/GRANT ALL.*/i', '', $sql);
        $sql = preg_replace('/FLUSH PRIVILEGES.*/i', '', $sql);
        
        $db->exec($sql);
        echo "Database schema verified/created successfully.\n";
    }
} catch (Exception $e) {
    echo "Note: Schema check skipped or database already exists. Details: " . $e->getMessage() . "\n";
}

// Disable foreign key checks for clean seeding
$db->exec('SET FOREIGN_KEY_CHECKS = 0');

// Clear existing data
$tablesToClear = [
    'refresh_tokens',
    'circle_members',
    'skill_circles',
    'notifications',
    'credit_transactions',
    'sessions',
    'credit_escrow',
    'swap_requests',
    'user_skills',
    'users'
];

foreach ($tablesToClear as $table) {
    $db->exec("TRUNCATE TABLE {$table}");
    echo "Cleared table: {$table}\n";
}

$db->exec('SET FOREIGN_KEY_CHECKS = 1');

// Password hash for 'password123'
$pwHash = '$2y$12$3L8.tfBkwdeEL4kpA/6JPOgl/kty2fiYYL6DQGAw88Fu5l8HT.EMa';

// 1. Seed Users
$usersData = [
    [
        'id' => 1,
        'name' => 'Amogh S Y',
        'username' => 'sy23amogh',
        'email' => 'sy23amogh@gmail.com',
        'password_hash' => $pwHash,
        'bio' => 'Fullstack developer & designer. Teaching React, Rust & AI/ML. Learning Mandarin & French.',
        'location' => 'Bengaluru, IN',
        'latitude' => 12.9716,
        'longitude' => 77.5946,
        'avatar_url' => 'https://api.dicebear.com/9.x/glass/svg?seed=Amogh&backgroundColor=3b82f6,8b5cf6,06b6d4',
        'trust_score' => 92.50,
        'trust_tier' => 'Gold',
        'credits' => 184,
        'verification_status' => 'verified',
        'role' => 'user'
    ],
    [
        'id' => 2,
        'name' => 'Maya Lin',
        'username' => 'mayalin',
        'email' => 'maya@example.com',
        'password_hash' => $pwHash,
        'bio' => 'Senior product designer @ Linear. Loves design systems, type & motion.',
        'location' => 'Berlin, DE',
        'latitude' => 52.5200,
        'longitude' => 13.4050,
        'avatar_url' => 'https://api.dicebear.com/9.x/glass/svg?seed=Maya&backgroundColor=3b82f6,8b5cf6,06b6d4',
        'trust_score' => 96.00,
        'trust_tier' => 'Mentor Elite',
        'credits' => 320,
        'verification_status' => 'verified',
        'role' => 'user'
    ],
    [
        'id' => 3,
        'name' => 'Diego Alvarez',
        'username' => 'diego',
        'email' => 'diego@example.com',
        'password_hash' => $pwHash,
        'bio' => 'ML Engineer · ex-Meta. Building agentic RAG systems and LLMs.',
        'location' => 'Mexico City, MX',
        'latitude' => 19.4326,
        'longitude' => -99.1332,
        'avatar_url' => 'https://api.dicebear.com/9.x/glass/svg?seed=Diego&backgroundColor=3b82f6,8b5cf6,06b6d4',
        'trust_score' => 91.00,
        'trust_tier' => 'Gold',
        'credits' => 410,
        'verification_status' => 'verified',
        'role' => 'user'
    ],
    [
        'id' => 4,
        'name' => 'Sara Okafor',
        'username' => 'sara',
        'email' => 'sara@example.com',
        'password_hash' => $pwHash,
        'bio' => 'Polyglot language tutor. Teaching French, Mandarin & Spanish.',
        'location' => 'Lagos, NG',
        'latitude' => 6.5244,
        'longitude' => 3.3792,
        'avatar_url' => 'https://api.dicebear.com/9.x/glass/svg?seed=Sara&backgroundColor=3b82f6,8b5cf6,06b6d4',
        'trust_score' => 88.00,
        'trust_tier' => 'Silver',
        'credits' => 220,
        'verification_status' => 'verified',
        'role' => 'user'
    ],
    [
        'id' => 5,
        'name' => 'Kenji Watanabe',
        'username' => 'kenji',
        'email' => 'kenji@example.com',
        'password_hash' => $pwHash,
        'bio' => 'Jazz pianist & arranger. Berklee alumni. Teaching improvisation & music theory.',
        'location' => 'Tokyo, JP',
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'avatar_url' => 'https://api.dicebear.com/9.x/glass/svg?seed=Kenji&backgroundColor=3b82f6,8b5cf6,06b6d4',
        'trust_score' => 84.00,
        'trust_tier' => 'Bronze',
        'credits' => 150,
        'verification_status' => 'none',
        'role' => 'user'
    ],
    [
        'id' => 6,
        'name' => 'Hana Park',
        'username' => 'hana',
        'email' => 'hana@example.com',
        'password_hash' => $pwHash,
        'bio' => 'Yoga instructor & breathwork coach. Focus on posture and mindfulness.',
        'location' => 'Seoul, KR',
        'latitude' => 37.5665,
        'longitude' => 126.9780,
        'avatar_url' => 'https://api.dicebear.com/9.x/glass/svg?seed=Hana&backgroundColor=3b82f6,8b5cf6,06b6d4',
        'trust_score' => 90.00,
        'trust_tier' => 'Gold',
        'credits' => 240,
        'verification_status' => 'verified',
        'role' => 'user'
    ]
];

$stmt = $db->prepare('INSERT INTO users (id, name, username, email, password_hash, bio, location, latitude, longitude, avatar_url, trust_score, trust_tier, credits, verification_status, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

foreach ($usersData as $u) {
    $stmt->execute([
        $u['id'],
        $u['name'],
        $u['username'],
        $u['email'],
        $u['password_hash'],
        $u['bio'],
        $u['location'],
        $u['latitude'],
        $u['longitude'],
        $u['avatar_url'],
        $u['trust_score'],
        $u['trust_tier'],
        $u['credits'],
        $u['verification_status'],
        $u['role']
    ]);
}
echo "Seeded users.\n";

// 2. Seed User Skills (skills a user teaches/learns)
// Master skill list:
// 1 = React (Technology)
// 2 = Python (Technology)
// 3 = Design (Arts & Design)
// 4 = Mandarin (Languages)
// 5 = French (Languages)
// 6 = Jazz Piano (Music)
// 7 = Yoga (Health & Fitness)
// 8 = Photography (Arts & Design)
// 9 = Writing (Soft Skills)
// 10 = Marketing (Business)
// 11 = Finance (Business)
// 12 = Ceramics (Arts & Design)
// 13 = Data Viz (Technology)
// 14 = Rust (Technology)
// 15 = AI/ML (Technology)

$userSkillsData = [
    // Amogh (User 1)
    ['user_id' => 1, 'skill_id' => 1, 'type' => 'teach', 'proficiency' => 'Advanced', 'credit_rate' => 12, 'format' => 'both', 'desc' => 'Can teach React, Hooks, state management & Next.js.'],
    ['user_id' => 1, 'skill_id' => 14, 'type' => 'teach', 'proficiency' => 'Advanced', 'credit_rate' => 15, 'format' => 'online', 'desc' => 'Systems programming in Rust, memory safety & concurrency.'],
    ['user_id' => 1, 'skill_id' => 4, 'type' => 'learn', 'proficiency' => 'Beginner', 'credit_rate' => 5, 'format' => 'online', 'desc' => 'Looking to learn conversational Mandarin.'],
    ['user_id' => 1, 'skill_id' => 3, 'type' => 'learn', 'proficiency' => 'Intermediate', 'credit_rate' => 8, 'format' => 'both', 'desc' => 'Improve my design systems skills.'],
    
    // Maya Lin (User 2)
    ['user_id' => 2, 'skill_id' => 3, 'type' => 'teach', 'proficiency' => 'Advanced', 'credit_rate' => 14, 'format' => 'both', 'desc' => 'Teaching Design Systems from scratch, token architecture, and Figma best practices.'],
    ['user_id' => 2, 'skill_id' => 8, 'type' => 'teach', 'proficiency' => 'Advanced', 'credit_rate' => 12, 'format' => 'both', 'desc' => 'Visual composition, framing, and lightroom editing techniques.'],
    ['user_id' => 2, 'skill_id' => 4, 'type' => 'learn', 'proficiency' => 'Beginner', 'credit_rate' => 5, 'format' => 'online', 'desc' => 'Wants to learn basic Mandarin.'],

    // Diego Alvarez (User 3)
    ['user_id' => 3, 'skill_id' => 15, 'type' => 'teach', 'proficiency' => 'Advanced', 'credit_rate' => 18, 'format' => 'online', 'desc' => 'RAG systems, fine-tuning LLMs, vector search & agentic workflows.'],
    ['user_id' => 3, 'skill_id' => 2, 'type' => 'teach', 'proficiency' => 'Advanced', 'credit_rate' => 10, 'format' => 'online', 'desc' => 'Python backend architecture, FastAPI, and data engineering pipelines.'],
    ['user_id' => 3, 'skill_id' => 6, 'type' => 'learn', 'proficiency' => 'Beginner', 'credit_rate' => 6, 'format' => 'online', 'desc' => 'Loves Jazz Piano and wants to learn voicings.'],

    // Sara Okafor (User 4)
    ['user_id' => 4, 'skill_id' => 5, 'type' => 'teach', 'proficiency' => 'Advanced', 'credit_rate' => 8, 'format' => 'online', 'desc' => 'Fluent French speaker teaching conversational French, vocabulary, and grammar.'],
    ['user_id' => 4, 'skill_id' => 4, 'type' => 'teach', 'proficiency' => 'Advanced', 'credit_rate' => 9, 'format' => 'online', 'desc' => 'Native Mandarin speaker teaching tones, conversations, and writing.'],

    // Kenji Watanabe (User 5)
    ['user_id' => 5, 'skill_id' => 6, 'type' => 'teach', 'proficiency' => 'Advanced', 'credit_rate' => 10, 'format' => 'both', 'desc' => 'Jazz piano improvisations, chord progressions & scales.'],

    // Hana Park (User 6)
    ['user_id' => 6, 'skill_id' => 7, 'type' => 'teach', 'proficiency' => 'Advanced', 'credit_rate' => 7, 'format' => 'both', 'desc' => 'Hatha & Vinyasa yoga sessions focused on mindfulness & breathwork.']
];

$stmt = $db->prepare('INSERT INTO user_skills (user_id, skill_id, type, proficiency, credit_rate, session_format, description) VALUES (?, ?, ?, ?, ?, ?, ?)');
foreach ($userSkillsData as $us) {
    $stmt->execute([
        $us['user_id'],
        $us['skill_id'],
        $us['type'],
        $us['proficiency'],
        $us['credit_rate'],
        $us['format'],
        $us['desc']
    ]);
}
echo "Seeded user skills.\n";

// 3. Seed Skill Circles
$circlesData = [
    [
        'id' => 1,
        'name' => 'Frontend Forge',
        'description' => 'A small group focused on React performance, rendering patterns, design systems, and token structures.',
        'location' => 'Online · Global',
        'topic' => 'React, performance, design systems',
        'weekly_schedule' => 'Weekly · Thu 7pm',
        'max_members' => 30,
        'created_by' => 1
    ],
    [
        'id' => 2,
        'name' => 'Polyglots Café',
        'description' => 'Informal conversations and language swaps in 12+ languages. Join anytime!',
        'location' => 'Online · Global',
        'topic' => 'Language exchange · 12 languages',
        'weekly_schedule' => 'Daily standup',
        'max_members' => 50,
        'created_by' => 4
    ],
    [
        'id' => 3,
        'name' => 'Bengaluru Builders',
        'description' => 'Local group for indie hackers and developers building in Bengaluru. Real-life meetups, demo nights, and coffee.',
        'location' => 'Bengaluru, IN',
        'topic' => 'Indie hackers IRL meetup',
        'weekly_schedule' => 'Bi-weekly · Sat',
        'max_members' => 15,
        'created_by' => 1
    ],
    [
        'id' => 4,
        'name' => 'AI Research Reading',
        'description' => 'Reading and discussing recent papers on large language models, agent frameworks, and diffusion models.',
        'location' => 'Online',
        'topic' => 'Weekly paper club',
        'weekly_schedule' => 'Wed 9pm UTC',
        'max_members' => 25,
        'created_by' => 3
    ]
];

$stmt = $db->prepare('INSERT INTO skill_circles (id, name, description, location, topic, weekly_schedule, max_members, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
foreach ($circlesData as $c) {
    $stmt->execute([
        $c['id'],
        $c['name'],
        $c['description'],
        $c['location'],
        $c['topic'],
        $c['weekly_schedule'],
        $c['max_members'],
        $c['created_by']
    ]);
}
echo "Seeded skill circles.\n";

// 4. Circle Members
$circleMembersData = [
    // Frontend Forge
    ['circle_id' => 1, 'user_id' => 1, 'role' => 'admin'],
    ['circle_id' => 1, 'user_id' => 2, 'role' => 'mentor'],
    ['circle_id' => 1, 'user_id' => 3, 'role' => 'member'],
    // Polyglots Café
    ['circle_id' => 2, 'user_id' => 4, 'role' => 'admin'],
    ['circle_id' => 2, 'user_id' => 1, 'role' => 'member'],
    ['circle_id' => 2, 'user_id' => 2, 'role' => 'member'],
    // Bengaluru Builders
    ['circle_id' => 3, 'user_id' => 1, 'role' => 'admin'],
    // AI Research Reading
    ['circle_id' => 4, 'user_id' => 3, 'role' => 'admin'],
    ['circle_id' => 4, 'user_id' => 1, 'role' => 'member']
];

$stmt = $db->prepare('INSERT INTO circle_members (circle_id, user_id, role) VALUES (?, ?, ?)');
foreach ($circleMembersData as $cm) {
    $stmt->execute([
        $cm['circle_id'],
        $cm['user_id'],
        $cm['role']
    ]);
}
echo "Seeded circle members.\n";

// 5. Swap Requests
$swapsData = [
    [
        'id' => 1,
        'sender_id' => 1,
        'receiver_id' => 2,
        'skill_requested_id' => 3, // Design
        'skill_offered_id' => 1,   // React
        'status' => 'accepted',
        'credits_locked' => 12,
        'message' => 'Hey Maya, would love to learn token management from you. I can teach you advanced React patterns!'
    ],
    [
        'id' => 2,
        'sender_id' => 1,
        'receiver_id' => 4,
        'skill_requested_id' => 4, // Mandarin
        'skill_offered_id' => 1,   // React
        'status' => 'pending',
        'credits_locked' => 8,
        'message' => 'Hi Sara, let us swap React and Mandarin lessons!'
    ]
];

$stmt = $db->prepare('INSERT INTO swap_requests (id, sender_id, receiver_id, skill_requested_id, skill_offered_id, status, credits_locked, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
foreach ($swapsData as $sw) {
    $stmt->execute([
        $sw['id'],
        $sw['sender_id'],
        $sw['receiver_id'],
        $sw['skill_requested_id'],
        $sw['skill_offered_id'],
        $sw['status'],
        $sw['credits_locked'],
        $sw['message']
    ]);
}
echo "Seeded swap requests.\n";

// 6. Sessions
$sessionsData = [
    [
        'swap_request_id' => 1,
        'mentor_id' => 2,
        'learner_id' => 1,
        'start_time' => date('Y-m-d H:i:s', strtotime('+2 hours')),
        'duration_minutes' => 60,
        'attendance' => 'scheduled',
        'feedback_score' => null,
        'feedback_text' => null
    ],
    [
        'swap_request_id' => 1,
        'mentor_id' => 1,
        'learner_id' => 2,
        'start_time' => date('Y-m-d H:i:s', strtotime('-1 day')),
        'duration_minutes' => 60,
        'attendance' => 'completed',
        'feedback_score' => 5,
        'feedback_text' => 'Amogh explained hooks and performance optimization extremely well. Highly recommended!'
    ]
];

$stmt = $db->prepare('INSERT INTO sessions (swap_request_id, mentor_id, learner_id, start_time, duration_minutes, attendance, feedback_score, feedback_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
foreach ($sessionsData as $s) {
    $stmt->execute([
        $s['swap_request_id'],
        $s['mentor_id'],
        $s['learner_id'],
        $s['start_time'],
        $s['duration_minutes'],
        $s['attendance'],
        $s['feedback_score'],
        $s['feedback_text']
    ]);
}
echo "Seeded sessions.\n";

// 7. Notifications
$notificationsData = [
    ['user_id' => 1, 'type' => 'swap_request', 'title' => 'Swap accepted', 'body' => 'Maya Lin accepted your Design Systems swap.', 'is_read' => 0, 'reference' => 'swap:1'],
    ['user_id' => 1, 'type' => 'credit_earn', 'title' => '+12 credits', 'body' => 'Completed: React Patterns session with Maya.', 'is_read' => 0, 'reference' => 'session:2'],
    ['user_id' => 1, 'type' => 'session_reminder', 'title' => 'Session starting soon', 'body' => 'Conversational French in 45 min.', 'is_read' => 0, 'reference' => 'session:1'],
    ['user_id' => 1, 'type' => 'circle_live', 'title' => 'Frontend Forge is live', 'body' => '5 mentors online now.', 'is_read' => 1, 'reference' => 'circle:1']
];

$stmt = $db->prepare('INSERT INTO notifications (user_id, type, title, body, is_read, reference) VALUES (?, ?, ?, ?, ?, ?)');
foreach ($notificationsData as $n) {
    $stmt->execute([
        $n['user_id'],
        $n['type'],
        $n['title'],
        $n['body'],
        $n['is_read'],
        $n['reference']
    ]);
}
echo "Seeded notifications.\n";

// 8. Credit Transactions
$txnsData = [
    ['user_id' => 1, 'amount' => 10, 'type' => 'welcome', 'ref' => 'welcome_bonus', 'bal' => 10],
    ['user_id' => 1, 'amount' => 120, 'type' => 'earn', 'ref' => 'session:completed', 'bal' => 130],
    ['user_id' => 1, 'amount' => 54, 'type' => 'earn', 'ref' => 'session:completed', 'bal' => 184]
];

$stmt = $db->prepare('INSERT INTO credit_transactions (user_id, amount, type, reference, balance) VALUES (?, ?, ?, ?, ?)');
foreach ($txnsData as $t) {
    $stmt->execute([
        $t['user_id'],
        $t['amount'],
        $t['type'],
        $t['ref'],
        $t['bal']
    ]);
}
echo "Seeded credit transactions.\n";

echo "Database seeding finished successfully!\n";
