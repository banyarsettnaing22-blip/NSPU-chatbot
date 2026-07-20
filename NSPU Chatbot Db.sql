-- 1. Database အသစ်ဆောက်ခြင်း
CREATE DATABASE IF NOT EXISTS nspu_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nspu_db;

-- 2. Comments Table (ကျောင်းသား/မိဘ/ဧည့်သည်များထံမှ Feedback သိမ်းရန်)
CREATE TABLE IF NOT EXISTS comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_role VARCHAR(50) NOT NULL,            -- Student, Parent, Visitor
    comment_text TEXT NOT NULL,                -- User ပေးတဲ့ feedback စာသား
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. ABSA Results Table (AI က ခွဲခြားပေးလိုက်တဲ့ Aspect နဲ့ Sentiment သိမ်းရန်)
CREATE TABLE IF NOT EXISTS absa_results (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    comment_id BIGINT NOT NULL,
    aspect VARCHAR(100) NOT NULL,              -- e.g., Canteen, Teaching, Facility
    sentiment VARCHAR(20) NOT NULL,            -- Positive, Negative, Neutral
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
