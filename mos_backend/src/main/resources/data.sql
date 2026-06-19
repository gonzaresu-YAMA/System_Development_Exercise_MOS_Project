-- ============================================================
-- MOS — 初期データ (居酒屋みどり亭)
-- ============================================================

-- カテゴリ
INSERT INTO categories (id, name, display_name, sort_order) VALUES
    (1, 'free',     '無料備品',   1),
    (2, 'yakitori', '焼き鳥',     2),
    (3, 'rice',     'ごはんもの', 3),
    (4, 'speed',    'スピード',   4),
    (5, 'drink',    'ドリンク',   5),
    (6, 'dessert',  'デザート',   6);

-- メニュー商品
-- 無料備品 (category_id=1)
INSERT INTO menu_items (id, category_id, name, price, is_sold_out, drink_plan_excluded, sort_order) VALUES
    (1,  1, 'おしぼり', 0, FALSE, FALSE, 1),
    (2,  1, '小皿',     0, FALSE, FALSE, 2),
    (3,  1, 'グラス',   0, FALSE, FALSE, 3),
    (4,  1, '割り箸',   0, FALSE, FALSE, 4),
    (5,  1, 'お冷',     0, TRUE,  FALSE, 5);

-- 焼き鳥 (category_id=2)
INSERT INTO menu_items (id, category_id, name, price, is_sold_out, drink_plan_excluded, sort_order) VALUES
    (9,  2, 'ねぎま',   180, FALSE, FALSE, 1),
    (10, 2, 'もも',     180, FALSE, FALSE, 2),
    (11, 2, 'かわ',     160, FALSE, FALSE, 3),
    (12, 2, 'つくね',   200, FALSE, FALSE, 4),
    (13, 2, 'ぼんじり', 190, FALSE, FALSE, 5);

-- ごはんもの (category_id=3)
INSERT INTO menu_items (id, category_id, name, price, is_sold_out, drink_plan_excluded, sort_order) VALUES
    (14, 3, '焼きおにぎり', 260, FALSE, FALSE, 1),
    (15, 3, '鶏雑炊',       420, FALSE, FALSE, 2),
    (16, 3, '鶏そぼろ丼',   480, FALSE, FALSE, 3),
    (17, 3, '親子丼',       520, FALSE, FALSE, 4),
    (18, 3, '明太ごはん',   380, FALSE, FALSE, 5);

-- スピード (category_id=4)
INSERT INTO menu_items (id, category_id, name, price, is_sold_out, drink_plan_excluded, sort_order) VALUES
    (19, 4, '枝豆',           280, FALSE, FALSE, 1),
    (20, 4, '冷奴',           260, FALSE, FALSE, 2),
    (21, 4, '漬けキュウリ',   300, FALSE, FALSE, 3),
    (22, 4, 'やみつきキャベツ', 280, FALSE, FALSE, 4),
    (23, 4, 'もやしのナムル', 280, FALSE, FALSE, 5);

-- ドリンク (category_id=5)
INSERT INTO menu_items (id, category_id, name, price, is_sold_out, drink_plan_excluded, sort_order) VALUES
    (24, 5, '生ビール（中）', 520, FALSE, TRUE,  1),
    (25, 5, 'ハイボール',     480, FALSE, FALSE, 2),
    (26, 5, 'レモンサワー',   480, FALSE, FALSE, 3),
    (27, 5, 'ウーロン茶',     300, FALSE, FALSE, 4),
    (28, 5, 'コーラ',         300, FALSE, FALSE, 5);

-- デザート (category_id=6)
INSERT INTO menu_items (id, category_id, name, price, is_sold_out, drink_plan_excluded, sort_order) VALUES
    (29, 6, 'バニラアイス',       320, FALSE, FALSE, 1),
    (30, 6, '抹茶アイス',         320, FALSE, FALSE, 2),
    (31, 6, '黒蜜きなこアイス',   380, FALSE, FALSE, 3),
    (32, 6, 'みたらし団子',       360, FALSE, FALSE, 4),
    (33, 6, '杏仁豆腐',           360, FALSE, FALSE, 5);

-- 座席
INSERT INTO seats (id, seat_number, floor, status, qr_code) VALUES
    (1,  'A1', 1, 'EMPTY', 'QR-A1'),
    (2,  'A2', 1, 'EMPTY', 'QR-A2'),
    (3,  'A3', 1, 'EMPTY', 'QR-A3'),
    (4,  'A4', 1, 'EMPTY', 'QR-A4'),
    (5,  'B1', 1, 'EMPTY', 'QR-B1'),
    (6,  'B2', 1, 'EMPTY', 'QR-B2'),
    (7,  'B3', 1, 'EMPTY', 'QR-B3'),
    (8,  'B4', 1, 'EMPTY', 'QR-B4'),
    (9,  'C1', 2, 'EMPTY', 'QR-C1'),
    (10, 'C2', 2, 'EMPTY', 'QR-C2'),
    (11, 'C3', 2, 'EMPTY', 'QR-C3'),
    (12, 'C4', 2, 'EMPTY', 'QR-C4');
