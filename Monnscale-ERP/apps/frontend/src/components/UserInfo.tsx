import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/initials';

interface UserInfoProps {
  user: { name: string; email?: string; avatar?: string | null };
  team?: { name: string } | null;
  showEmail?: boolean;
}

export function UserInfo({ user, team = null, showEmail = false }: UserInfoProps) {
  const hasAvatar = user.avatar && user.avatar !== '';
  return (
    <>
      <Avatar className="h-8 w-8 overflow-hidden rounded-lg">
        {hasAvatar && <AvatarImage src={user.avatar!} alt={user.name} />}
        <AvatarFallback className="rounded-lg text-black dark:text-white">
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{user.name}</span>
        {team ? (
          <span className="truncate text-xs text-muted-foreground">{team.name}</span>
        ) : showEmail && user.email ? (
          <span className="truncate text-xs text-muted-foreground">{user.email}</span>
        ) : null}
      </div>
    </>
  );
}
