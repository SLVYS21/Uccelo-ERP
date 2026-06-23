import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Building2, Plus, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/crm/EmptyState';
import { InitialsAvatar } from '@/components/crm/InitialsAvatar';
import { Pagination } from '@/components/crm/Pagination';
import { CompaniesApi } from '@/api/crm.api';

const PAGE_SIZE = 25;

export function CompaniesIndexPage() {
  const { teamSlug = '' } = useParams<{ teamSlug: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setPage(1), [debouncedSearch]);

  const { data, isLoading } = useQuery({
    queryKey: ['companies', teamSlug, debouncedSearch, page],
    queryFn: () =>
      CompaniesApi.list(teamSlug, { page, pageSize: PAGE_SIZE, search: debouncedSearch || undefined }),
    enabled: !!teamSlug,
  });

  const total = data?.total ?? 0;
  const rows = data?.data ?? [];

  return (
    <div className="flex h-full flex-1 flex-col gap-5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="bg-brand-gradient shadow-glow-violet flex h-10 w-10 items-center justify-center rounded-xl text-white">
            <Building2 className="h-5 w-5" />
          </span>
          <div className="space-y-0.5">
            <h2 className="text-lg font-medium tracking-tight">Entreprises</h2>
            <p className="text-sm text-muted-foreground">Gérez les entreprises de votre portefeuille</p>
          </div>
          {total > 0 && (
            <Badge variant="secondary" className="tabular-nums">
              {total}
            </Badge>
          )}
        </div>

        <Button asChild>
          <Link to={`/${teamSlug}/companies/new`}>
            <Plus className="h-4 w-4" /> Nouvelle entreprise
          </Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Rechercher une entreprise…"
          className="pl-9"
          aria-label="Rechercher une entreprise"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Mobile: stacked cards */}
      <div className="space-y-2.5 md:hidden">
        {isLoading && <Skeleton className="h-16 w-full" />}
        {rows.map((company) => (
          <Link
            key={company.id}
            to={`/${teamSlug}/companies/${company.id}`}
            className="card-hover flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-card"
          >
            <InitialsAvatar name={company.name} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{company.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {[company.industry, company.city].filter(Boolean).join(' · ') || '—'}
              </p>
            </div>
            {company.owner && <InitialsAvatar name={company.owner.name} size="sm" />}
          </Link>
        ))}
        {!isLoading && rows.length === 0 && (
          <EmptyState
            icon={Building2}
            title="Aucune entreprise"
            description="Ajoutez votre première entreprise pour commencer."
          >
            <Button asChild>
              <Link to={`/${teamSlug}/companies/new`}>
                <Plus className="h-4 w-4" /> Nouvelle entreprise
              </Link>
            </Button>
          </EmptyState>
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-xl border border-border/70 bg-card shadow-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Nom</TableHead>
              <TableHead>Secteur</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Responsable</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((company) => (
              <TableRow
                key={company.id}
                className="group cursor-pointer"
                onClick={() => navigate(`/${teamSlug}/companies/${company.id}`)}
              >
                <TableCell>
                  <Link
                    to={`/${teamSlug}/companies/${company.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-3"
                  >
                    <InitialsAvatar name={company.name} />
                    <span className="font-medium group-hover:text-primary">{company.name}</span>
                  </Link>
                </TableCell>
                <TableCell>
                  {company.industry ? (
                    <Badge variant="secondary">{company.industry}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>{company.city ?? '—'}</TableCell>
                <TableCell className="tabular-nums">
                  {company.phone ? (
                    <a
                      href={`tel:${company.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="transition-colors hover:text-primary hover:underline"
                    >
                      {company.phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {company.owner ? (
                    <span className="flex items-center gap-2">
                      <InitialsAvatar name={company.owner.name} size="sm" />
                      <span className="text-sm">{company.owner.name}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {!isLoading && rows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="p-0">
                  <EmptyState
                    icon={Building2}
                    title="Aucune entreprise"
                    description="Ajoutez votre première entreprise pour démarrer votre portefeuille."
                  >
                    <Button asChild>
                      <Link to={`/${teamSlug}/companies/new`}>
                        <Plus className="h-4 w-4" /> Nouvelle entreprise
                      </Link>
                    </Button>
                  </EmptyState>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
    </div>
  );
}
