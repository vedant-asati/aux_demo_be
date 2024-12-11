-- seeds/00_users.sql
-- Password for admin@auctions.com is: Admin@123
-- Hash generated using bcrypt with salt 10
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES 
  (501, 'admin@auctions.com', '$2a$10$XHGUPaZlRCprHwqMRHsRs.xH0ntiB9h0Y6TlgAzHPgNsOQelKRXY.', 'Admin User', 'ADMIN', NOW(), NOW());

-- Password for sarah.smith@example.com is: Sarah@123
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES
  (502, 'sarah.smith@example.com', '$2a$10$KHCstKl9VQxUo4kYCaEJ7.CKbBUWJXmWRgVcVtqcJ1VDQkrhg4k8.', 'Sarah Smith', 'SELLER', NOW(), NOW());

-- Password for john.doe@example.com is: John@123
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES
  (503, 'john.doe@example.com', '$2a$10$2R.Z8UbNq6Ry1bx2p9lHn.esCbAUqqH7QUy8qCXBz3yNHVTNIrCFG', 'John Doe', 'SELLER', NOW(), NOW());

-- Password for alice.wong@example.com is: Alice@123
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES
  (101, 'alice.wong@example.com', '$2a$10$qK1P0pB5YNzqB1JyKUJXZe6D7wqXcJ2y.fBqXf4QUK3wNsMwVyEm.', 'Alice Wong', 'USER', NOW(), NOW());

-- Password for bob.johnson@example.com is: Bob@123
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES
  (102, 'bob.johnson@example.com', '$2a$10$8KzaNdKIMyOkGur0YSIQBOPp0w0rjQ6.U2Bj.6XCZsIPqX/NqzxjO', 'Bob Johnson', 'USER', NOW(), NOW());

-- Password for carlos.garcia@example.com is: Carlos@123
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES
  (103, 'carlos.garcia@example.com', '$2a$10$LXQUn6ZKzWZ5N6.P.ZW8P.U9qT9RLH5hkHI.DTiJEv4y.D0H7jrY.', 'Carlos Garcia', 'USER', NOW(), NOW());

-- Password for diana.miller@example.com is: Diana@123
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES
  (104, 'diana.miller@example.com', '$2a$10$vX4yv3MgP8qKxJ0yxeH.QewvnIE.klwJKrdnQCVpxhU5tpqV9D2Vy', 'Diana Miller', 'USER', NOW(), NOW());

-- Password for eric.chen@example.com is: Eric@123
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES
  (105, 'eric.chen@example.com', '$2a$10$KcF1jXHnCn7xYUfN4WbyzOrGxFiXQM3E0nD0rENMG/1ExsGxpFpK.', 'Eric Chen', 'USER', NOW(), NOW());