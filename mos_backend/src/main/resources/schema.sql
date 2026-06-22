-- Active: 1782089465452@@127.0.0.1@3306@mos_backend
-- ============================================================
-- MOS (Menu Order System) — DDL Schema
-- 対応DB: H2 (テスト用インメモリ) / MariaDB (本番)
-- ============================================================

-- カテゴリ
CREATE TABLE IF NOT EXISTS categories (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    sort_order   INT          NOT NULL DEFAULT 0,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- メニュー商品
CREATE TABLE IF NOT EXISTS menu_items (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id         BIGINT       NOT NULL,
    name                VARCHAR(200) NOT NULL,
    price               INT          NOT NULL DEFAULT 0,
    is_sold_out         BOOLEAN      NOT NULL DEFAULT FALSE,
    drink_plan_excluded BOOLEAN      NOT NULL DEFAULT FALSE,
    image_url           VARCHAR(500),
    sort_order          INT          NOT NULL DEFAULT 0,
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_menu_category FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 座席 / テーブル
CREATE TABLE IF NOT EXISTS seats (
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    seat_number        VARCHAR(20)  NOT NULL UNIQUE,
    floor              INT          NOT NULL DEFAULT 1,
    status             VARCHAR(20)  NOT NULL DEFAULT 'EMPTY',
    customer_count     INT          NOT NULL DEFAULT 0,
    qr_code            VARCHAR(200),
    session_started_at TIMESTAMP,
    created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 注文
CREATE TABLE IF NOT EXISTS orders (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    seat_id      BIGINT,
    table_number VARCHAR(20),
    status       VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    total_amount INT          NOT NULL DEFAULT 0,
    course_type  VARCHAR(50),
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ordered_at   TIMESTAMP,
    confirmed_at TIMESTAMP,
    completed_at TIMESTAMP,
    CONSTRAINT fk_order_seat FOREIGN KEY (seat_id) REFERENCES seats(id)
);

-- 注文明細
CREATE TABLE IF NOT EXISTS order_items (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id     BIGINT       NOT NULL,
    menu_item_id BIGINT       NOT NULL,
    item_name    VARCHAR(200) NOT NULL,
    unit_price   INT          NOT NULL,
    quantity     INT          NOT NULL DEFAULT 1,
    status       VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_item_order    FOREIGN KEY (order_id)     REFERENCES orders(id),
    CONSTRAINT fk_item_menuitem FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

-- Spring Session (JDBC)
CREATE TABLE IF NOT EXISTS SPRING_SESSION (
    PRIMARY_ID            CHAR(36)     NOT NULL,
    SESSION_ID            CHAR(36)     NOT NULL,
    CREATION_TIME         BIGINT       NOT NULL,
    LAST_ACCESS_TIME      BIGINT       NOT NULL,
    MAX_INACTIVE_INTERVAL INT          NOT NULL,
    EXPIRY_TIME           BIGINT       NOT NULL,
    PRINCIPAL_NAME        VARCHAR(100),
    CONSTRAINT PK_SPRING_SESSION       PRIMARY KEY (PRIMARY_ID),
    CONSTRAINT UK_SPRING_SESSION_ID    UNIQUE (SESSION_ID)
);

CREATE INDEX IF NOT EXISTS IDX_SPRING_SESSION_EXPIRY ON SPRING_SESSION (EXPIRY_TIME);
CREATE INDEX IF NOT EXISTS IDX_SPRING_SESSION_PRINCIPAL ON SPRING_SESSION (PRINCIPAL_NAME);

CREATE TABLE IF NOT EXISTS SPRING_SESSION_ATTRIBUTES (
    SESSION_PRIMARY_ID CHAR(36)     NOT NULL,
    ATTRIBUTE_NAME     VARCHAR(200) NOT NULL,
    ATTRIBUTE_BYTES    BLOB         NOT NULL,
    CONSTRAINT PK_SPRING_SESSION_ATTR PRIMARY KEY (SESSION_PRIMARY_ID, ATTRIBUTE_NAME),
    CONSTRAINT FK_SPRING_SESSION_ATTR FOREIGN KEY (SESSION_PRIMARY_ID)
        REFERENCES SPRING_SESSION (PRIMARY_ID) ON DELETE CASCADE
);
