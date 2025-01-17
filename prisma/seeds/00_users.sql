-- seeds/00_users.sql
-- Password for admin@auctions.com is: Admin@123
-- Hash generated using bcrypt with salt 10
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES 
  (1008, 'admin@auctions.com', '$2b$10$R8jAbfeuBXljFg0zxe4Fbe3CeDzIasvMuDuEmPecsnaytX4ysrlj6', 'Admin User', 'ADMIN', NOW(), NOW());

-- Password for sarah.smith@example.com is: Sarah@123
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES
  (502, 'sarah.smith@example.com', '$2b$10$uLsGg4vFDPPR1a8oaYCZXu3rOS2c96xpsuVAZpuPQ6i1FS9eUOZJ2', 'Sarah Smith', 'SELLER', NOW(), NOW());

-- Password for john.doe@example.com is: John@123
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES
  (503, 'john.doe@example.com', '$2b$10$6GyMIhxRP2O2RJByL0K.TewqBb9NyLBfr.zLtDnPZ38HV8k2Nx9uG', 'John Doe', 'SELLER', NOW(), NOW());

-- Password for alice.wong@example.com is: Alice@123
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES
  (101, 'alice.wong@example.com', '$2b$10$m0RRc40z2Cem/kiYr6gFluVqxx4zqsP9CRS0Yy7bshUUjusnXNau.', 'Alice Wong', 'USER', NOW(), NOW());

-- Password for bob.johnson@example.com is: Bob@123
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES
  (102, 'bob.johnson@example.com', '$2b$10$apFhoAJZWTgh2CJLfs64..ZRqoHmeACWR3d.7KJjIf6YUgaihT/c2','Bob Johnson', 'USER', NOW(), NOW());

-- Password for carlos.garcia@example.com is: Carlos@123
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES
  (103, 'carlos.garcia@example.com', '$2b$10$5sXD8MJ05O6DcOb10eJlh.vrGKgr0VkKq5LQwo0gffKrMmpWXfjJG', 'Carlos Garcia', 'USER', NOW(), NOW());

-- Password for diana.miller@example.com is: Diana@123
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES
  (104, 'diana.miller@example.com', '$2b$10$9wZXpCiK84E51/K3Qw48aOk3YR3KEp/gXax2m7U/EvJ.yVPTrNwJm', 'Diana Miller', 'USER', NOW(), NOW());

-- Password for eric.chen@example.com is: Eric@123
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES
  (105, 'eric.chen@example.com', '$2b$10$LMtCbs3xOckzWcX6b7hKcOk0oCY6yoHsgSdaltrms0vs6wTaVjlCO', 'Eric Chen', 'USER', NOW(), NOW());

-- Password for intruder@gmail.com is: Eric@123
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES
  (1, 'intruder@gmail.com', '$2b$10$2bcE5uIYl8rDl31fiTetn..L1Kkdn0EfwlLUzjNU8QyGFQVYwFP1e', 'Intruder', 'ADMIN', NOW(), NOW());