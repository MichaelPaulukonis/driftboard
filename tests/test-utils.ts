import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { prisma } from '../src/backend/services/database';
import serviceAccount from '../src/backend/firebase-service-account.json' assert { type: 'json' };

// Initialize Firebase Admin SDK only if it hasn't been already
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export async function createUser({ email, password }) {
  try {
    const auth = getAuth();
    const userRecord = await auth.createUser({
      email,
      password,
      emailVerified: true,
    });
    
    // Also create user in our own DB
    await prisma.user.create({
      data: {
        userId: userRecord.uid,
        email: userRecord.email,
        name: 'E2E Test User',
      },
    });

    return userRecord;
  } catch (error) {
    console.error('Error creating Firebase user:', error);
    throw error;
  }
}

export async function deleteUser(email: string) {
  try {
    const auth = getAuth();
    const user = await auth.getUserByEmail(email);
    await auth.deleteUser(user.uid);
    
    // The database user will be deleted by cascade constraint if set up,
    // otherwise, we should delete it here.
    await prisma.user.delete({ where: { email } });
  } catch (error) {
    // Ignore "user not found" errors during cleanup
    if (error.code !== 'auth/user-not-found') {
      console.error('Error deleting Firebase user:', error);
      throw error;
    }
  }
}
