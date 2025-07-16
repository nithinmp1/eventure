import { PrismaClient } from '@prisma/client';
import 'dotenv/config'; // Load environment variables

const prisma = new PrismaClient();

const MOCK_USERS = [
  { id: 'user1', name: 'Alice', email: 'alice@example.com', password: 'password123' },
  { id: 'user2', name: 'Bob', email: 'bob@example.com', password: 'password123' },
];

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Delete existing data to ensure a clean slate for seeding (optional)
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();
    console.log('Cleared existing data.');

    // Seed Users
    for (const userData of MOCK_USERS) {
      await prisma.user.create({ data: userData });
      console.log(`Created user: ${userData.name}`);
    }

    // Seed Events
    const alice = await prisma.user.findUnique({ where: { email: 'alice@example.com' } });
    const bob = await prisma.user.findUnique({ where: { email: 'bob@example.com' } });

    if (alice && bob) {
      await prisma.event.create({
        data: {
          name: 'Eventure Launch Party',
          location: 'Virtual Auditorium',
          startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          attendees: {
            connect: { id: alice.id }, // Alice joins by default
          },
        },
      });
      console.log('Created Eventure Launch Party.');

      await prisma.event.create({
        data: {
          name: 'Community Meetup',
          location: 'Local Cafe',
          startTime: new Date(Date.now() + 2 * 86400000).toISOString(), // Day after tomorrow
          attendees: {
            connect: { id: bob.id }, // Bob joins by default
          },
        },
      });
      console.log('Created Community Meetup.');

      await prisma.event.create({
        data: {
          name: 'GraphQL Deep Dive',
          location: 'Online Webinar',
          startTime: new Date(Date.now() + 3 * 86400000).toISOString(), // 3 days from now
        },
      });
      console.log('Created GraphQL Deep Dive.');

    } else {
      console.error('Could not find mock users for seeding events. Ensure users are created first.');
    }

    console.log('Database seeding complete.');
  } catch (e) {
    console.error('Error during database seeding:', e);
    process.exit(1); // Exit with error code
  } finally {
    await prisma.$disconnect(); // Disconnect Prisma client
  }
}

seedDatabase();
