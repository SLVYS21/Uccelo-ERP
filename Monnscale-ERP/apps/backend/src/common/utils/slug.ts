import slugify from 'slugify';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export async function generateUniqueTeamSlug(prisma: PrismaService, name: string, excludeId?: string): Promise<string> {
  const base = slugify(name, { lower: true, strict: true }) || 'team';
  let candidate = base;
  let suffix = 0;
  while (true) {
    const existing = await prisma.team.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}
