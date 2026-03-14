 1. إنشاء قاعدة البيانات
CREATE DATABASE IF NOT EXISTS aafiya_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aafiya_store;

 2. جدول الأقسام 
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

 3. جدول المنتجات
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    category_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

 4. جدول الإعدادات (يشمل معلومات الاتصال وكلمة المرور)
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(50) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL
);

 5. جدول بانر العروض
CREATE TABLE IF NOT EXISTS promo_banners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image_url VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

