import { getValidAccessTokenBySlackUserId } from './slackTokenManager';
import dbConnect from './dbConnect';
import User from '../models/UserModel';

async function testTokenRefresh() {
  try {
    await dbConnect();
    
    const users = await User.find({});
    console.log(`Found ${users.length} users in database`);
    
    for (const user of users) {
      console.log(`\nTesting token refresh for user: ${user.slackUserId}`);
      console.log(`Email: ${user.email}`);
      console.log(`Token expires at: ${user.tokenExpiresAt}`);
      console.log(`Has refresh token: ${!!user.slackRefreshToken}`);
      
      try {
        const validToken = await getValidAccessTokenBySlackUserId(user.slackUserId);
        if (validToken) {
          console.log('✅ Token refresh successful');
        } else {
          console.log('❌ Token refresh failed');
        }
      } catch (error) {
        console.log('❌ Error during token refresh:', error);
      }
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

if (require.main === module) {
  testTokenRefresh().then(() => {
    console.log('\nTest completed');
    process.exit(0);
  }).catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

export { testTokenRefresh }; 