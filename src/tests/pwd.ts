const bcrypt = require('bcrypt');

const users = [
    {
        email: 'intruder@gmail.com',
        plaintextPassword: 'Intruder@123',
        hashedPassword: '$2b$10$2bcE5uIYl8rDl31fiTetn..L1Kkdn0EfwlLUzjNU8QyGFQVYwFP1e'
    },
    {
        email: 'admin@auctions.com',
        plaintextPassword: 'Admin@123',
        hashedPassword: '$2b$10$R8jAbfeuBXljFg0zxe4Fbe3CeDzIasvMuDuEmPecsnaytX4ysrlj6'
    },
    {
        email: 'sarah.smith@example.com',
        plaintextPassword: 'Sarah@123',
        hashedPassword: '$2b$10$uLsGg4vFDPPR1a8oaYCZXu3rOS2c96xpsuVAZpuPQ6i1FS9eUOZJ2'
    },
    {
        email: 'john.doe@example.com',
        plaintextPassword: 'John@123',
        hashedPassword: '$2b$10$6GyMIhxRP2O2RJByL0K.TewqBb9NyLBfr.zLtDnPZ38HV8k2Nx9uG'
    },
    {
        email: 'alice.wong@example.com',
        plaintextPassword: 'Alice@123',
        hashedPassword: '$2b$10$m0RRc40z2Cem/kiYr6gFluVqxx4zqsP9CRS0Yy7bshUUjusnXNau.'
    },
    {
        email: 'bob.johnson@example.com',
        plaintextPassword: 'Bob@123',
        hashedPassword: '$2b$10$apFhoAJZWTgh2CJLfs64..ZRqoHmeACWR3d.7KJjIf6YUgaihT/c2'
    },
    {
        email: 'carlos.garcia@example.com',
        plaintextPassword: 'Carlos@123',
        hashedPassword: '$2b$10$5sXD8MJ05O6DcOb10eJlh.vrGKgr0VkKq5LQwo0gffKrMmpWXfjJG'
    },
    {
        email: 'diana.miller@example.com',
        plaintextPassword: 'Diana@123',
        hashedPassword: '$2b$10$9wZXpCiK84E51/K3Qw48aOk3YR3KEp/gXax2m7U/EvJ.yVPTrNwJm'
    },
    {
        email: 'eric.chen@example.com',
        plaintextPassword: 'Eric@123',
        hashedPassword: '$2b$10$LMtCbs3xOckzWcX6b7hKcOk0oCY6yoHsgSdaltrms0vs6wTaVjlCO'
    }
];

// Function to verify passwords
async function verifyPasswords(users: any) {
    for (const user of users) {
        const isMatch = await bcrypt.compare(user.plaintextPassword, user.hashedPassword);
        console.log(`Password verification for ${user.email}: ${isMatch ? 'Success' : 'Failure'}`);
        // const hashedPassword = await bcrypt.hash(user.plaintextPassword, 10);
        // user.hashedPassword = hashedPassword;
    }
    console.log("users: ", users);
}

verifyPasswords(users).catch(err => console.error('Error verifying passwords:', err));
