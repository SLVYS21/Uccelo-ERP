import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Building2,
  CheckSquare,
  KanbanSquare,
  LayoutGrid,
  ListChecks,
  SlidersHorizontal,
  Users,
  Workflow,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { AppLogo } from './AppLogo';
import { TeamSwitcher } from './TeamSwitcher';
import { NavMain, type NavItem } from './NavMain';
import { NavUser } from './NavUser';
import { useAuthStore } from '@/lib/auth-store';

export function AppSidebar() {
  const { teamSlug: slugFromUrl } = useParams();
  const { user } = useAuthStore();
  const teamSlug = slugFromUrl ?? user?.currentTeam?.slug ?? null;

  const dashboardUrl = teamSlug ? `/${teamSlug}/dashboard` : '/';

  const platformItems = useMemo<NavItem[]>(() => {
    if (!teamSlug) return [];
    return [
      { title: 'Dashboard', href: `/${teamSlug}/dashboard`, icon: LayoutGrid },
      { title: 'Companies', href: `/${teamSlug}/companies`, icon: Building2 },
      { title: 'Contacts', href: `/${teamSlug}/contacts`, icon: Users },
      { title: 'Pipeline', href: `/${teamSlug}/pipeline`, icon: KanbanSquare },
      { title: 'Tasks', href: `/${teamSlug}/tasks`, icon: CheckSquare },
    ];
  }, [teamSlug]);

  const adminItems = useMemo<NavItem[]>(() => {
    if (!teamSlug) return [];
    return [
      { title: 'Custom fields', href: `/${teamSlug}/custom-fields`, icon: SlidersHorizontal },
      { title: 'Picklists', href: `/${teamSlug}/picklists`, icon: ListChecks },
      { title: 'Pipeline stages', href: `/${teamSlug}/pipeline-settings`, icon: Workflow },
    ];
  }, [teamSlug]);

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to={dashboardUrl}>
                <AppLogo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            <TeamSwitcher />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={platformItems} label="Platform" />
        {adminItems.length > 0 && <NavMain items={adminItems} label="Administration" />}
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
