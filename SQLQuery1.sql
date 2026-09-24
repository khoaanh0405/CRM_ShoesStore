Create database test;

-- =========================================================================
-- 1. TẠO CÁC BẢNG ĐỘC LẬP (KHÔNG CÓ KHÓA NGOẠI)
-- =========================================================================

CREATE TABLE roles (
    role_id INT IDENTITY(1,1) PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NULL
);

CREATE TABLE suppliers (
    supplier_id INT IDENTITY(1,1) PRIMARY KEY,
    supplier_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(100) NULL,
    address VARCHAR(255) NULL
);

CREATE TABLE surveys (
    survey_id INT IDENTITY(1,1) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BIT NOT NULL DEFAULT 1
);

-- =========================================================================
-- 2. TẠO CÁC BẢNG CÓ KHÓA NGOẠI CẤP 1
-- =========================================================================

CREATE TABLE accounts (
    account_id INT IDENTITY(1,1) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    is_locked BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_accounts_roles FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

CREATE TABLE products (
    product_id INT IDENTITY(1,1) PRIMARY KEY,
    supplier_id INT NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NULL,
    brand VARCHAR(50) NULL,
    size VARCHAR(10) NULL,
    color VARCHAR(30) NULL,
    material VARCHAR(50) NULL,
    price DECIMAL(18, 2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    is_active BIT NOT NULL DEFAULT 1,
    image_url VARCHAR(500) NULL,
    CONSTRAINT fk_products_suppliers FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
);

CREATE TABLE survey_questions (
    question_id INT IDENTITY(1,1) PRIMARY KEY,
    survey_id INT NOT NULL,
    question_content VARCHAR(MAX) NOT NULL,
    question_type VARCHAR(20) NOT NULL,
    CONSTRAINT fk_sq_surveys FOREIGN KEY (survey_id) REFERENCES surveys(survey_id) ON DELETE CASCADE
);

-- =========================================================================
-- 3. TẠO CÁC BẢNG CÓ KHÓA NGOẠI CẤP 2 VÀ CÁC BẢNG LIÊN KẾT
-- =========================================================================

CREATE TABLE customers (
    -- Customer ID không dùng IDENTITY vì nó link 1-1 với Account ID theo Prisma Schema
    customer_id INT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NULL,
    phone VARCHAR(20) NULL,
    address VARCHAR(255) NULL,
    is_deleted BIT NOT NULL DEFAULT 0,
    deleted_at DATETIME2 NULL,
    CONSTRAINT fk_customers_accounts FOREIGN KEY (customer_id) REFERENCES accounts(account_id) ON DELETE CASCADE
);

CREATE TABLE survey_question_options (
    option_id INT IDENTITY(1,1) PRIMARY KEY,
    question_id INT NOT NULL,
    option_text VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_sqo_questions FOREIGN KEY (question_id) REFERENCES survey_questions(question_id) ON DELETE CASCADE
);

-- =========================================================================
-- 4. TẠO CÁC BẢNG NGHIỆP VỤ LIÊN QUAN ĐẾN KHÁCH HÀNG (CẤP 3)
-- =========================================================================

CREATE TABLE customer_preferences (
    preference_id INT IDENTITY(1,1) PRIMARY KEY,
    customer_id INT NOT NULL,
    preference_tag VARCHAR(100) NOT NULL,
    CONSTRAINT fk_cp_customers FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

CREATE TABLE feedbacks (
    feedback_id INT IDENTITY(1,1) PRIMARY KEY,
    customer_id INT NOT NULL,
    product_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    content VARCHAR(MAX) NOT NULL,
    rating INT NOT NULL,
    image_url VARCHAR(500) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    created_at DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Ràng buộc CHECK(rating BETWEEN 1 AND 5) được thêm bằng raw SQL như file Prisma mô tả
    CONSTRAINT chk_feedbacks_rating CHECK (rating >= 1 AND rating <= 5),
    CONSTRAINT fk_feedbacks_customers FOREIGN KEY (customer_id) REFERENCES customers(customer_id), -- RESTRICT/NO ACTION default
    CONSTRAINT fk_feedbacks_products FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE survey_targets (
    survey_id INT NOT NULL,
    customer_id INT NOT NULL,
    is_completed BIT NOT NULL DEFAULT 0,
    PRIMARY KEY (survey_id, customer_id),
    CONSTRAINT fk_st_surveys FOREIGN KEY (survey_id) REFERENCES surveys(survey_id) ON DELETE CASCADE,
    CONSTRAINT fk_st_customers FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

CREATE TABLE survey_responses (
    response_id INT IDENTITY(1,1) PRIMARY KEY,
    survey_id INT NOT NULL,
    customer_id INT NOT NULL,
    submitted_at DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Ràng buộc duy nhất: Một khách hàng chỉ được nộp 1 lần cho mỗi khảo sát
    CONSTRAINT uq_survey_response_customer UNIQUE (survey_id, customer_id),
    CONSTRAINT fk_sr_surveys FOREIGN KEY (survey_id) REFERENCES surveys(survey_id),
    CONSTRAINT fk_sr_customers FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

CREATE TABLE notifications (
    notification_id INT IDENTITY(1,1) PRIMARY KEY,
    customer_id INT NOT NULL,
    type VARCHAR(30) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message VARCHAR(MAX) NOT NULL,
    ref_type VARCHAR(20) NULL,
    ref_id INT NULL,
    is_read BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_customers FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

-- =========================================================================
-- 5. TẠO BẢNG CẤP CUỐI (Phụ thuộc vào Survey Responses)
-- =========================================================================

CREATE TABLE survey_answers (
    answer_id INT IDENTITY(1,1) PRIMARY KEY,
    response_id INT NOT NULL,
    question_id INT NOT NULL,
    answer_value VARCHAR(MAX) NOT NULL,
    option_id INT NULL,
    CONSTRAINT fk_sa_responses FOREIGN KEY (response_id) REFERENCES survey_responses(response_id) ON DELETE CASCADE,
    CONSTRAINT fk_sa_questions FOREIGN KEY (question_id) REFERENCES survey_questions(question_id),
    CONSTRAINT fk_sa_options FOREIGN KEY (option_id) REFERENCES survey_question_options(option_id)
);

-- =========================================================================
-- 6. TẠO CÁC CHỈ MỤC (INDEXES) ĐỂ TỐI ƯU TRUY VẤN
-- =========================================================================

-- Products
CREATE INDEX idx_products_supplier_id ON products(supplier_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);

-- Customers
CREATE INDEX idx_customers_is_deleted ON customers(is_deleted);

-- Feedbacks
CREATE INDEX idx_feedbacks_customer_id ON feedbacks(customer_id);
CREATE INDEX idx_feedbacks_product_id ON feedbacks(product_id);
CREATE INDEX idx_feedbacks_status ON feedbacks(status);

-- Survey Questions & Options
CREATE INDEX idx_sq_survey_id ON survey_questions(survey_id);
CREATE INDEX idx_sqo_question_id ON survey_question_options(question_id);

-- Survey Responses & Answers
CREATE INDEX idx_sr_customer_id ON survey_responses(customer_id);
CREATE INDEX idx_sa_question_id ON survey_answers(question_id);
CREATE INDEX idx_sa_option_id ON survey_answers(option_id);

-- Notifications
CREATE INDEX idx_notifications_customer_id ON notifications(customer_id);
CREATE INDEX idx_notifications_customer_read ON notifications(customer_id, is_read);