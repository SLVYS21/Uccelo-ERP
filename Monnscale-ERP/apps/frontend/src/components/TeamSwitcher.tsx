import { Check, ChevronsUpDown, Plus, Users } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import type { TeamRef } from '@Moonscale/shared';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TeamsApi } from '@/api/teams.api';
import { AuthApi } from '@/api/auth.api';
import { useAuthStore } from '@/lib/auth-store';

interface TeamSwitcherProps {
  inHeader?: boolean;
}

export function TeamSwitcher({ inHeader = false }: TeamSwitcherProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const qc = useQueryClient();
  const { user, setUser } = useAuthStore();

  const teams = useQuery({ queryKey: ['teams'], queryFn: () => TeamsApi.list() });
  const currentTeam = user?.currentTeam ?? null;

  const switchTeam = useMutation({
    mutationFn: async (team: TeamRef) => {
      await TeamsApi.switch(team.id);
      const me = await AuthApi.me();
      return { team, me };
    },
    onSuccess: ({ team, me }) => {
      setUser(me);
      qc.invalidateQueries();
      const previousSlug = currentTeam?.slug;
      if (previousSlug && pathname.includes(`/${previousSlug}`)) {
        navigate(pathname.replace(`/${previousSlug}`, `/${team.slug}`), { replace: true });
      } else {
        navigate(`/${team.slug}/dashboard`);
      }
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={
            inHeader
              ? 'h-8 gap-1 px-2'
              : 'w-full justify-start px-2 has-[>svg]:px-2 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
          }
        >
          <Users
            className={
              inHeader
                ? 'hidden'
                : 'hidden size-4 shrink-0 group-data-[collapsible=icon]:block'
            }
          />
          <div
            className={
              inHeader
                ? 'grid flex-1 text-left text-sm leading-tight'
                : 'grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden'
            }
          >
            <span
              className={
                inHeader
                  ? 'max-w-[120px] truncate font-medium'
                  : 'truncate font-semibold'
              }
            >
              {currentTeam?.name ?? 'Select team'}
            </span>
          </div>
          <ChevronsUpDown
            className={
              inHeader
                ? 'size-4 opacity-50'
                : 'ml-auto group-data-[collapsible=icon]:hidden'
            }
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className={inHeader ? 'w-56' : 'w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'}
        align={inHeader ? 'end' : 'start'}
        sideOffset={inHeader ? undefined : 4}
        side={inHeader ? undefined : 'right'}
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">Teams</DropdownMenuLabel>
        {teams.data?.map((team) => (
          <DropdownMenuItem
            key={team.id}
            className="cursor-pointer gap-2 p-2"
            onClick={() => switchTeam.mutate(team)}
          >
            {team.name}
            {currentTeam?.id === team.id && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer gap-2 p-2" onClick={() => navigate('/teams/new')}>
          <Plus className="h-4 w-4" />
          <span className="text-muted-foreground">New team</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
