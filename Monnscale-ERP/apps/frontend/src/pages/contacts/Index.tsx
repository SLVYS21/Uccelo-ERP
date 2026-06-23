import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus, Search, Users } from 'lucide-react';
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
import { ContactsApi } from '@/api/crm.api';

const PAGE_SIZE = 25;

export function ContactsIndexPage() {
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
    queryKey: ['contacts', teamSlug, debouncedSearch, page],
    queryFn: () =>
      ContactsApi.list(teamSlug, { page, pageSize: PAGE_SIZE, search: debouncedSearch || undefined }),
    enabled: !!teamSlug,
  });

  const total = data?.total ?? 0;
  const rows = data?.data ?? [];

  return (
    <div className="flex h-full flex-1 flex-col gap-5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="bg-brand-gradient shadow-glow-violet flex h-10 w-10 items-center justify-center rounded-xl text-white">
            <Users className="h-5 w-5" />
          </span>
          <div className="space-y-0.5">
            <h2 className="text-lg font-medium tracking-tight">Contacts</h2>
            <p className="text-sm text-muted-foreground">Gérez les personnes de vos comptes</p>
          </div>
          {total > 0 && (
            <Badge variant="secondary" className="tabular-nums">
              {total}
            </Badge>
          )}
        </div>

        <Button asChild>
          <Link to={`/${teamSlug}/contacts/new`}>
            <Plus className="h-4 w-4" /> Nouveau contact
          </Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Rechercher un contact…"
          className="pl-9"
          aria-label="Rechercher un contact"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Mobile */}
      <div className="space-y-2.5 md:hidden">
        {isLoading && <Skeleton className="h-16 w-full" />}
        {rows.map((contact) => (
          <Link
            key={contact.id}
            to={`/${teamSlug}/contacts/${contact.id}`}
            className="card-hover flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-card"
          >
            <InitialsAvatar name={contact.fullName} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{contact.fullName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {[contact.jobTitle, contact.company?.name].filter(Boolean).join(' · ') || '—'}
              </p>
            </div>
          </Link>
        ))}
        {!isLoading && rows.length === 0 && (
          <EmptyState
            icon={Users}
            title="Aucun contact"
            description="Ajoutez vos contacts pour suivre vos échanges."
          >
            <Button asChild>
              <Link to={`/${teamSlug}/contacts/new`}>
                <Plus className="h-4 w-4" /> Nouveau contact
              </Link>
            </Button>
          </EmptyState>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-xl border border-border/70 bg-card shadow-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Nom</TableHead>
              <TableHead>Fonction</TableHead>
              <TableHead>Entreprise</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((contact) => (
              <TableRow
                key={contact.id}
                className="group cursor-pointer"
                onClick={() => navigate(`/${teamSlug}/contacts/${contact.id}`)}
              >
                <TableCell>
                  <Link
                    to={`/${teamSlug}/contacts/${contact.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-3"
                  >
                    <InitialsAvatar name={contact.fullName} />
                    <span className="font-medium group-hover:text-primary">{contact.fullName}</span>
                  </Link>
                </TableCell>
                <TableCell>{contact.jobTitle ?? '—'}</TableCell>
                <TableCell>
                  {contact.company ? (
                    <Link
                      to={`/${teamSlug}/companies/${contact.company.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="transition-colors hover:text-primary hover:underline"
                    >
                      {contact.company.name}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {contact.email ? (
                    <a
                      href={`mailto:${contact.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="transition-colors hover:text-primary hover:underline"
                    >
                      {contact.email}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="tabular-nums">
                  {contact.phone ? (
                    <a
                      href={`tel:${contact.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="transition-colors hover:text-primary hover:underline"
                    >
                      {contact.phone}
                    </a>
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
                    icon={Users}
                    title="Aucun contact"
                    description="Ajoutez vos contacts pour suivre vos échanges."
                  >
                    <Button asChild>
                      <Link to={`/${teamSlug}/contacts/new`}>
                        <Plus className="h-4 w-4" /> Nouveau contact
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
