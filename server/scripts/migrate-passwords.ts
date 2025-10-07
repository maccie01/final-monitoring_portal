import bcrypt from 'bcrypt';
import { getDb, initializeDatabase } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const SALT_ROUNDS = 12;

export async function migratePasswordsToHash() {
  console.log('🔐 Starting password migration to bcrypt...');
  console.log(`   Using ${SALT_ROUNDS} salt rounds`);

  const db = getDb();
  const allUsers = await db.select().from(users);

  console.log(`   Found ${allUsers.length} users to process`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const user of allUsers) {
    try {
      // Check if password is already hashed (bcrypt hashes start with $2b$)
      if (user.password && !user.password.startsWith('$2b$')) {
        console.log(`   Hashing password for user: ${user.username}`);

        const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);

        await db.update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, user.id));

        migrated++;
      } else {
        console.log(`   Skipping ${user.username} (already hashed)`);
        skipped++;
      }
    } catch (error) {
      console.error(`   ❌ Failed to migrate user ${user.username}:`, error);
      errors++;
    }
  }

  console.log('\n✅ Migration complete!');
  console.log(`   - Migrated: ${migrated} passwords`);
  console.log(`   - Skipped: ${skipped} passwords (already hashed)`);
  console.log(`   - Errors: ${errors}`);

  if (errors > 0) {
    console.warn('\n⚠️  Some passwords failed to migrate. Check errors above.');
  }

  return { migrated, skipped, errors };
}

// Run if called directly (ES modules)
async function main() {
  // Initialize database connection first
  await initializeDatabase();

  // Run migration
  await migratePasswordsToHash();

  console.log('\n✨ Password migration successful!');
  process.exit(0);
}

main().catch(err => {
  console.error('\n💥 Password migration failed:', err);
  process.exit(1);
});
