/**
 * Database Reset Script
 * 
 * This script will:
 * 1. Clear all existing data (employees, wishlists, sessions, magic links, settings)
 * 2. Reset settings to default values
 * 3. Seed two admin accounts
 * 
 * WARNING: This will DELETE ALL DATA. Use with caution!
 */

const { db } = require('../src/config/database');

function resetDatabase() {
  console.log('\n🚨 DATABASE RESET SCRIPT 🚨\n');
  console.log('This will DELETE ALL DATA and start fresh.\n');
  
  try {
    // Start transaction
    const transaction = db.transaction(() => {
      console.log('Step 1: Deleting all employees...');
      const deletedEmployees = db.prepare('DELETE FROM employees').run();
      console.log(`✓ Deleted ${deletedEmployees.changes} employees`);

      console.log('\nStep 2: Deleting all wishlists...');
      const deletedWishlists = db.prepare('DELETE FROM wishlists').run();
      console.log(`✓ Deleted ${deletedWishlists.changes} wishlists`);

      console.log('\nStep 3: Deleting all magic links...');
      const deletedMagicLinks = db.prepare('DELETE FROM magic_links').run();
      console.log(`✓ Deleted ${deletedMagicLinks.changes} magic links`);

      console.log('\nStep 4: Deleting all sessions...');
      const deletedSessions = db.prepare('DELETE FROM sessions').run();
      console.log(`✓ Deleted ${deletedSessions.changes} sessions`);

      console.log('\nStep 5: Resetting settings to defaults...');
      db.prepare("UPDATE settings SET value = '0' WHERE key = 'assignment_completed'").run();
      db.prepare("UPDATE settings SET value = '' WHERE key = 'wishlist_deadline'").run();
      db.prepare("UPDATE settings SET value = '0' WHERE key = 'show_all_wishlists'").run();
      console.log('✓ Settings reset to defaults');

      console.log('\nStep 6: Seeding admin accounts...');
      console.log('(Admins are excluded from Secret Santa assignments)');
      
      const insertAdmin = db.prepare(`
        INSERT INTO employees (name, email, is_admin, is_super_admin, recipient_id)
        VALUES (?, ?, 1, 1, NULL)
      `);

      // Admin 1: Charles (is_admin=1 excludes from assignments)
      insertAdmin.run('Charles Admin', 'charles.daitol+admin@infosoft.com.ph');
      console.log('✓ Added: Charles Admin (charles.daitol+admin@infosoft.com.ph)');

      // Admin 2: Jamaica (is_admin=1 excludes from assignments)
      insertAdmin.run('Jamaica Admin', 'jamaica.rodriguez+admin@infosoft.com.ph');
      console.log('✓ Added: Jamaica Admin (jamaica.rodriguez+admin@infosoft.com.ph)');

      console.log('\n✅ Database reset completed successfully!\n');
    });

    // Execute transaction
    transaction();

    // Verify final state
    console.log('Final database state:');
    const employeeCount = db.prepare('SELECT COUNT(*) as count FROM employees').get();
    const adminCount = db.prepare('SELECT COUNT(*) as count FROM employees WHERE is_admin = 1').get();
    const nonAdminCount = db.prepare('SELECT COUNT(*) as count FROM employees WHERE is_admin = 0').get();
    const wishlistCount = db.prepare('SELECT COUNT(*) as count FROM wishlists').get();
    const sessionCount = db.prepare('SELECT COUNT(*) as count FROM sessions').get();
    
    console.log(`- Total employees: ${employeeCount.count}`);
    console.log(`- Admin accounts: ${adminCount.count} (excluded from assignments)`);
    console.log(`- Regular employees: ${nonAdminCount.count} (will participate in Secret Santa)`);
    console.log(`- Wishlists: ${wishlistCount.count}`);
    console.log(`- Active sessions: ${sessionCount.count}`);
    
    console.log('\n📋 Admin accounts ready:');
    const admins = db.prepare('SELECT id, name, email FROM employees WHERE is_admin = 1').all();
    admins.forEach(admin => {
      console.log(`   - ${admin.name} (${admin.email})`);
    });
    
    console.log('\n🎯 Next steps:');
    console.log('   1. Upload employee list via Admin Panel');
    console.log('      (Only non-admin employees will participate in Secret Santa)');
    console.log('   2. Set wishlist deadline (optional)');
    console.log('   3. Generate Secret Santa assignments');
    console.log('      (Admins are automatically excluded)');
    console.log('   4. Send assignment notifications\n');

  } catch (error) {
    console.error('\n❌ Error during database reset:', error.message);
    process.exit(1);
  }
}

// Run the reset
console.log('Starting database reset in 3 seconds...');
console.log('Press Ctrl+C to cancel.\n');

setTimeout(() => {
  resetDatabase();
}, 3000);
