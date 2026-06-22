-- テスト用初期データ

INSERT INTO categories (id, name, display_name, sort_order) VALUES
    (1, 'yakitori', '焼き鳥',   1),
    (2, 'drink',    'ドリンク', 2);

INSERT INTO menu_items (id, category_id, name, price, is_sold_out, drink_plan_excluded, sort_order) VALUES
    (1, 1, 'ねぎま',         180, FALSE, FALSE, 1),
    (2, 1, 'もも',           180, FALSE, FALSE, 2),
    (3, 1, 'かわ',           160, TRUE,  FALSE, 3),
    (4, 2, '生ビール（中）', 520, FALSE, TRUE,  1),
    (5, 2, 'ハイボール',     480, FALSE, FALSE, 2);

INSERT INTO seats (id, seat_number, floor, status, qr_code) VALUES
    (1, 'T1', 1, 'EMPTY', 'QR-T1'),
    (2, 'T2', 1, 'USING', 'QR-T2');

INSERT INTO staff (id, name, role, active, password, allowed_use_cases) VALUES
    ('S000001', 'テスト店長', 'manager', TRUE, '1111', 'hall,kitchen,admin');
