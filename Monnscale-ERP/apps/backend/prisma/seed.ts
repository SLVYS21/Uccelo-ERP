import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { PICKLIST_DEFAULTS, Picklist, TeamRole } from '@Moonscale/shared';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash('123456789');

  const owner = await prisma.user.upsert({
    where: { email: 'sylvanusboni21@gmail.com' },
    update: {},
    create: {
      name: 'Admin Test',
      email: 'sylvanusboni21@gmail.com',
      password: passwordHash,
      emailVerifiedAt: new Date(),
      locale: 'fr',
    },
  });

  const team = await prisma.team.upsert({
    where: { slug: 'Moonscale' },
    update: {},
    create: { name: 'Moonscale', slug: 'Moonscale', isPersonal: false },
  });

  await prisma.membership.upsert({
    where: { teamId_userId: { teamId: team.id, userId: owner.id } },
    update: { role: TeamRole.Owner },
    create: { teamId: team.id, userId: owner.id, role: TeamRole.Owner },
  });

  await prisma.user.update({
    where: { id: owner.id },
    data: { currentTeamId: team.id },
  });

  // Default pipeline + stages
  const existingPipeline = await prisma.pipeline.findFirst({ where: { teamId: team.id } });
  if (!existingPipeline) {
    const pipeline = await prisma.pipeline.create({
      data: { teamId: team.id, name: 'Ventes', isDefault: true, position: 0 },
    });
    for (const [idx, s] of [
      { name: 'Prospection', key: 'prospecting', color: '#94a3b8', isWon: false, isLost: false },
      { name: 'Qualification', key: 'qualified', color: '#06b6d4', isWon: false, isLost: false },
      { name: 'Proposition', key: 'proposal', color: '#2740e0', isWon: false, isLost: false },
      { name: 'Gagné', key: 'won', color: '#10b981', isWon: true, isLost: false },
      { name: 'Perdu', key: 'lost', color: '#f43f5e', isWon: false, isLost: true },
    ].entries()) {
      await prisma.pipelineStage.create({ data: { pipelineId: pipeline.id, ...s, position: idx } });
    }
  }

  // Picklists defaults
  for (const list of Object.values(Picklist)) {
    const count = await prisma.picklistOption.count({ where: { teamId: team.id, picklist: list } });
    if (count > 0) continue;
    await prisma.picklistOption.createMany({
      data: PICKLIST_DEFAULTS[list].map((d, idx) => ({
        teamId: team.id,
        picklist: list,
        value: d.value,
        label: d.label,
        color: d.color,
        isSystem: d.isSystem,
        position: idx,
      })),
    });
  }

  // eslint-disable-next-line no-console
  console.log('Seed complete: sylvanusboni21@gmail.com / password');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
