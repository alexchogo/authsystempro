import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from "../src/generated/prisma";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });  // REQUIRED in Prisma 7

/**
 * Idempotent, incremental seed script
 * Run via: npx ts-node prisma/seed.ts
 */

async function main() {
  console.log('🌱 Seeding database...');

  // ===============================
  // 1️⃣ PERMISSIONS (canonical keys)
  // ===============================
  const permissions = [
    // Authentication & Session
    { name: 'session.read', description: 'Read sessions' },
    { name: 'session.read.own', description: 'Read own sessions' },
    { name: 'session.read.all', description: 'Read all users sessions' },
    { name: 'session.write', description: 'Create/update sessions' },
    { name: 'session.terminate', description: 'Terminate sessions' },
    { name: 'session.terminate.own', description: 'Terminate own sessions' },
    { name: 'session.terminate.all', description: 'Terminate any user sessions' },
    { name: 'auth.login', description: 'Login capability' },
    { name: 'auth.logout', description: 'Logout capability' },
    { name: 'auth.mfa', description: 'Use multi-factor authentication' },

    // User Management
    { name: 'user.read', description: 'Read users' },
    { name: 'user.read.own', description: 'Read own profile' },
    { name: 'user.read.all', description: 'Read all user profiles' },
    { name: 'user.create', description: 'Create users' },
    { name: 'user.update', description: 'Update users' },
    { name: 'user.update.own', description: 'Update own profile' },
    { name: 'user.delete', description: 'Delete users' },
    { name: 'user.assign-role', description: 'Assign role to user' },
    { name: 'user.view-sensitive', description: 'View sensitive user data' },
    { name: 'user.impersonate', description: 'Impersonate other users' },
    { name: 'user.lock', description: 'Lock/unlock user accounts' },
    { name: 'user.export', description: 'Export user data' },

    // Role & Permission Management
    { name: 'role.read', description: 'Read roles' },
    { name: 'role.create', description: 'Create roles' },
    { name: 'role.update', description: 'Update roles' },
    { name: 'role.delete', description: 'Delete roles' },
    { name: 'permission.read', description: 'Read permissions' },
    { name: 'permission.assign', description: 'Assign permissions to roles' },
    { name: 'permission.manage', description: 'Manage permissions' },

    // System Settings & Security
    { name: 'system.read', description: 'Read system settings' },
    { name: 'system.update', description: 'Update system settings' },
    { name: 'system.reset', description: 'Reset system settings' },
    { name: 'system.audit', description: 'View audit logs' },
    { name: 'system.security', description: 'Manage security settings' },
    { name: 'system.backup', description: 'Perform system backups' },

    // Content / Resource Management
    { name: 'content.read', description: 'Read content' },
    { name: 'content.read.own', description: 'Read own content' },
    { name: 'content.read.all', description: 'Read all content' },
    { name: 'content.create', description: 'Create content' },
    { name: 'content.update', description: 'Update content' },
    { name: 'content.update.own', description: 'Update own content' },
    { name: 'content.delete', description: 'Delete content' },
    { name: 'content.delete.own', description: 'Delete own content' },
    { name: 'content.publish', description: 'Publish content' },
    { name: 'content.moderate', description: 'Moderate content' },
    { name: 'media.upload', description: 'Upload media' },
    { name: 'media.delete', description: 'Delete media' },
    { name: 'media.delete.own', description: 'Delete own media' },

    // Custom profile permissions
    { name: 'profile.update', description: 'Update own profile' },
    { name: 'profile.view', description: 'View own profile' },
    { name: 'profile.avatar', description: 'Update profile avatar' },
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: {},
      create: p,
    });
  }

  console.log('✔ Permissions seeded.');

  // ===============================
  // 2️⃣ ROLES
  // ===============================
  const roles = [
    { name: 'SUPER_ADMIN', description: 'Highest-level role — full system control' },
    { name: 'ADMIN', description: 'System Administrator (platform-level)' },
    { name: 'SECURITY_ADMIN', description: 'Security and audit administrator' },
    { name: 'MANAGER', description: 'Operational manager' },
    { name: 'MODERATOR', description: 'Content moderator' },
    { name: 'EDITOR', description: 'Content editor' },
    { name: 'SUPPORT', description: 'Support staff' },
    { name: 'CONTRIBUTOR', description: 'Content contributor' },
    { name: 'USER', description: 'Regular user' },
    { name: 'GUEST', description: 'Guest user with limited access' },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
  }

  console.log('✔ Roles seeded.');

  // ===============================
  // 3️⃣ FETCH ROLES
  // ===============================
  const superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  const securityAdminRole = await prisma.role.findUnique({ where: { name: 'SECURITY_ADMIN' } });
  const managerRole = await prisma.role.findUnique({ where: { name: 'MANAGER' } });
  const moderatorRole = await prisma.role.findUnique({ where: { name: 'MODERATOR' } });
  const editorRole = await prisma.role.findUnique({ where: { name: 'EDITOR' } });
  const supportRole = await prisma.role.findUnique({ where: { name: 'SUPPORT' } });
  const contributorRole = await prisma.role.findUnique({ where: { name: 'CONTRIBUTOR' } });
  const userRole = await prisma.role.findUnique({ where: { name: 'USER' } });
  const guestRole = await prisma.role.findUnique({ where: { name: 'GUEST' } });

  if (!superAdminRole || !adminRole) throw new Error('❌ Required roles missing. Seed aborted.');

  console.log('✔ Roles loaded.');

  // ===============================
  // 4️⃣ ROLE → PERMISSION ASSIGNMENTS
  // ===============================
  async function assignPermission(roleId: string, permName: string) {
    const perm = await prisma.permission.findUnique({ where: { name: permName } });
    if (!perm) return console.warn(`⚠ Permission missing: ${permName}`);

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId: perm.id,
        },
      },
      update: {},
      create: { roleId, permissionId: perm.id },
    });
  }

  // SUPER_ADMIN → ALL PERMISSIONS
  if (superAdminRole) {
    for (const p of permissions) {
      await assignPermission(superAdminRole.id, p.name);
    }
  }

  // ADMIN → Broad permissions (excluding some system security)
  if (adminRole) {
    const adminPerms = [
      'session.read.all', 'session.terminate.all', 'session.write',
      'user.read.all', 'user.create', 'user.update', 'user.delete', 
      'user.assign-role', 'user.view-sensitive', 'user.lock', 'user.export',
      'role.read', 'role.create', 'role.update', 'role.delete',
      'permission.read', 'permission.assign',
      'content.read.all', 'content.create', 'content.update', 'content.delete',
      'content.publish', 'content.moderate',
      'media.upload', 'media.delete',
      'system.read', 'system.update', 'system.audit',
    ];
    for (const p of adminPerms) await assignPermission(adminRole.id, p);
  }

  // SECURITY_ADMIN → Security, audit, and session management
  if (securityAdminRole) {
    const securityPerms = [
      'session.read.all', 'session.terminate.all',
      'user.read.all', 'user.view-sensitive', 'user.lock', 'user.export',
      'system.read', 'system.audit', 'system.security', 'system.backup',
      'auth.mfa',
    ];
    for (const p of securityPerms) await assignPermission(securityAdminRole.id, p);
  }

  // MANAGER → User and content management
  if (managerRole) {
    const managerPerms = [
      'session.read.all',
      'user.read.all', 'user.update', 'user.lock',
      'content.read.all', 'content.create', 'content.update', 'content.delete',
      'content.publish', 'content.moderate',
      'media.upload', 'media.delete',
      'system.read',
    ];
    for (const p of managerPerms) await assignPermission(managerRole.id, p);
  }

  // MODERATOR → Content moderation
  if (moderatorRole) {
    const moderatorPerms = [
      'content.read.all', 'content.update', 'content.delete',
      'content.moderate',
      'user.read.all', 'user.lock',
      'media.delete',
    ];
    for (const p of moderatorPerms) await assignPermission(moderatorRole.id, p);
  }

  // EDITOR → Content creation and editing
  if (editorRole) {
    const editorPerms = [
      'content.read.all', 'content.create', 'content.update', 'content.update.own',
      'content.publish',
      'media.upload', 'media.delete.own',
      'profile.update', 'profile.view', 'profile.avatar',
    ];
    for (const p of editorPerms) await assignPermission(editorRole.id, p);
  }

  // SUPPORT → Help users, view content
  if (supportRole) {
    const supportPerms = [
      'user.read.all', 'user.update',
      'content.read.all', 'content.create', 'content.update',
      'media.upload',
      'session.read.own', 'session.terminate.own',
    ];
    for (const p of supportPerms) await assignPermission(supportRole.id, p);
  }

  // CONTRIBUTOR → Create and manage own content
  if (contributorRole) {
    const contributorPerms = [
      'content.read.own', 'content.create', 'content.update.own', 'content.delete.own',
      'media.upload', 'media.delete.own',
      'session.read.own', 'session.terminate.own',
      'profile.update', 'profile.view', 'profile.avatar',
    ];
    for (const p of contributorPerms) await assignPermission(contributorRole.id, p);
  }

  // USER → Basic user permissions
  if (userRole) {
    const userPerms = [
      'content.read', 'content.read.own',
      'media.upload', 'media.delete.own',
      'session.read.own', 'session.terminate.own',
      'profile.update', 'profile.view', 'profile.avatar',
      'user.read.own', 'user.update.own',
    ];
    for (const p of userPerms) await assignPermission(userRole.id, p);
  }

  // GUEST → Very limited read-only access
  if (guestRole) {
    const guestPerms = [
      'content.read',
      'profile.view',
    ];
    for (const p of guestPerms) await assignPermission(guestRole.id, p);
  }

  console.log('✔ Role-permission assignments complete.');

  // ===============================
  // 5️⃣ DEFAULT ADMIN USER
  // ===============================
  // Load admin credentials from environment variables
  const {
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    ADMIN_PHONE,
    ADMIN_FULLNAME,
    ADMIN_USERNAME,
    BCRYPT_SALT_ROUNDS,
  } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Missing required environment variables: ADMIN_EMAIL and ADMIN_PASSWORD');
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (!existingAdmin) {
    const saltRounds = parseInt(BCRYPT_SALT_ROUNDS || '10', 10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);

    const newAdmin = await prisma.user.create({
      data: {
        fullName: ADMIN_FULLNAME || 'Alex Chogo',
        username: ADMIN_USERNAME || 'alexchogo',
        email: ADMIN_EMAIL,
        phone: ADMIN_PHONE || '+254728931154',
        password: hashedPassword,
        emailVerified: true,
      },
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: newAdmin.id,
          roleId: superAdminRole!.id,
        },
      },
      update: {},
      create: {
        userId: newAdmin.id,
        roleId: superAdminRole!.id,
      },
    });
    console.log(`👑 Created default SUPER_ADMIN: ${ADMIN_EMAIL}`);
  } else {
    console.log(`Admin already exists: ${ADMIN_EMAIL}`);
  }

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
