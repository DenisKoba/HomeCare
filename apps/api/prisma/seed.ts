import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const templates = [
  {
    slug: 'kitchen-surfaces',
    title: 'Протерти робочі поверхні',
    roomType: 'kitchen' as const,
    estimatedMinutes: 10,
    effort: 'low' as const,
    priority: 'normal' as const,
    recurrence: { type: 'interval', every: 2, unit: 'day' },
  },
  {
    slug: 'bathroom-fixtures',
    title: 'Помити сантехніку',
    roomType: 'bathroom' as const,
    estimatedMinutes: 15,
    effort: 'normal' as const,
    priority: 'high' as const,
    recurrence: { type: 'weekly', daysOfWeek: [6] },
  },
  {
    slug: 'vacuum-floor',
    title: 'Пропилососити',
    roomType: 'living_room' as const,
    estimatedMinutes: 20,
    effort: 'normal' as const,
    priority: 'normal' as const,
    recurrence: { type: 'interval', every: 1, unit: 'week' },
  },
  {
    slug: 'change-bedding',
    title: 'Змінити постіль',
    roomType: 'bedroom' as const,
    estimatedMinutes: 15,
    effort: 'normal' as const,
    priority: 'normal' as const,
    recurrence: { type: 'interval', every: 2, unit: 'week' },
  },
];

async function main() {
  for (const template of templates) {
    await prisma.taskTemplate.upsert({
      where: { slug: template.slug },
      create: template,
      update: template,
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
