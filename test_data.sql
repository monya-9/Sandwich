-- 테스트 유저 10명 추가
INSERT INTO users (email, password, username, role, is_deleted, is_profile_set, is_verified, provider, created_at, updated_at)
VALUES 
('test1@sandwich.com', '1234', '테스트유저1', 'ROLE_USER', false, true, true, 'LOCAL', NOW(), NOW()),
('test2@sandwich.com', '1234', '테스트유저2', 'ROLE_USER', false, true, true, 'LOCAL', NOW(), NOW()),
('test3@sandwich.com', '1234', '테스트유저3', 'ROLE_USER', false, true, true, 'LOCAL', NOW(), NOW()),
('test4@sandwich.com', '1234', '테스트유저4', 'ROLE_USER', false, true, true, 'LOCAL', NOW(), NOW()),
('test5@sandwich.com', '1234', '테스트유저5', 'ROLE_USER', false, true, true, 'LOCAL', NOW(), NOW()),
('test6@sandwich.com', '1234', '테스트유저6', 'ROLE_USER', false, true, true, 'LOCAL', NOW(), NOW()),
('test7@sandwich.com', '1234', '테스트유저7', 'ROLE_USER', false, true, true, 'LOCAL', NOW(), NOW()),
('test8@sandwich.com', '1234', '테스트유저8', 'ROLE_USER', false, true, true, 'LOCAL', NOW(), NOW()),
('test9@sandwich.com', '1234', '테스트유저9', 'ROLE_USER', false, true, true, 'LOCAL', NOW(), NOW()),
('test10@sandwich.com', '1234', '테스트유저10', 'ROLE_USER', false, true, true, 'LOCAL', NOW(), NOW());

-- 댓글에 좋아요 추가 (댓글 ID 1번에 테스트 유저들이 좋아요)
INSERT INTO likes (user_id, target_id, target_type, created_at, updated_at)
SELECT id, 1, 'COMMENT', NOW(), NOW()
FROM users
WHERE email LIKE 'test%@sandwich.com';

-- 댓글 ID 2번에도 좋아요 추가 (페이징 테스트용)
INSERT INTO likes (user_id, target_id, target_type, created_at, updated_at)
SELECT id, 2, 'COMMENT', NOW(), NOW()
FROM users
WHERE email LIKE 'test%@sandwich.com' AND id <= 5; 