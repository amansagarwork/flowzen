const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test 1: Count users
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${userCount}`);
    
    // Test 2: Get all users
    const allUsers = await prisma.user.findMany();
    console.log('👥 All users:', JSON.stringify(allUsers, null, 2));
    
    // Test 3: Create a test user directly
    if (userCount === 0) {
      console.log('➕ Creating test user directly...');
      const testUser = await prisma.user.create({
        data: {
          username: 'direct_test_user',
          email: 'direct@test.com',
          password: 'hashed_password'
        }
      });
      console.log('✅ Created test user:', testUser);
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
