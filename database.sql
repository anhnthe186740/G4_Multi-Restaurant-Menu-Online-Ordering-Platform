-- 1. Tạo Database
CREATE DATABASE IF NOT EXISTS multi_restaurant_db;
USE multi_restaurant_db;

-- 2. Bảng Vai trò (Roles)
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) NOT NULL UNIQUE -- Admin, Owner, Staff, Customer
);

-- 3. Bảng Người dùng (Users)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role_id INT,
    status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- 4. Bảng Nhà hàng (Restaurants)
CREATE TABLE restaurants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    owner_id INT,
    name VARCHAR(150) NOT NULL,
    address TEXT,
    logo VARCHAR(255),
    cover_image VARCHAR(255),
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    status ENUM('pending', 'active', 'closed', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. Bảng Gói tài khoản (Subscription Plans)
CREATE TABLE subscription_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    plan_name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    duration_days INT NOT NULL, -- Số ngày hiệu lực (30, 90, 365)
    description TEXT
);

-- 6. Bảng Đăng ký gói của nhà hàng (Subscriptions)
CREATE TABLE subscriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    restaurant_id INT,
    plan_id INT,
    start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_date DATETIME NOT NULL,
    status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
);

-- 7. Bảng Danh mục món ăn (Categories)
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    restaurant_id INT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- 8. Bảng Món ăn (Products)
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT,
    name VARCHAR(150) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    image VARCHAR(255),
    is_available BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 9. Bảng Mã giảm giá (Discounts)
CREATE TABLE discounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    restaurant_id INT, 
    code VARCHAR(20) NOT NULL UNIQUE,
    percentage INT NOT NULL,
    start_date DATE,
    end_date DATE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- 10. Bảng Đơn hàng (Orders)
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT,
    restaurant_id INT,
    total_amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    final_amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('cash', 'card', 'e-wallet') DEFAULT 'cash',
    status ENUM('pending', 'preparing', 'delivering', 'completed', 'cancelled') DEFAULT 'pending',
    delivery_address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);

-- 11. Bảng Chi tiết món ăn trong đơn hàng (Order Items)
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT,
    product_id INT,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL, -- Lưu giá lúc mua để tránh sai lệch khi món ăn đổi giá
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 12. Bảng Đánh giá (Reviews)
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT UNIQUE,
    customer_id INT,
    restaurant_id INT,
    rating TINYINT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);

-- 13. CHÈN DỮ LIỆU CẤU HÌNH BAN ĐẦU
INSERT INTO roles (role_name) VALUES ('Admin'), ('Owner'), ('Staff'), ('Customer');

INSERT INTO subscription_plans (plan_name, price, duration_days, description) VALUES 
('Gói Cơ Bản', 200000.00, 30, 'Dùng thử hệ thống trong 1 tháng'),
('Gói Tiết Kiệm', 1000000.00, 180, 'Gói 6 tháng tiết kiệm 20%'),
('Gói Chuyên Nghiệp', 1800000.00, 365, 'Gói 1 năm đầy đủ tính năng');
