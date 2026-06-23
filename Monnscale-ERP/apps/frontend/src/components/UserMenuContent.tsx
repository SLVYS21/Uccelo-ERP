import { LogOut, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from './UserInfo';
import { useAuthStore } from '@/lib/auth-store';
import { AuthApi } from '@/api/auth.api';

interface UserMenuContentProps {
  user: { name: string; email?: string; avatar?: string | null };
}

export function UserMenuContent({ user }: UserMenuContentProps) {
  const navigate = useNavigate();
  const { tokens, clear } = useAuthStore();

  const handleLogout = async () => {
    try {
      if (tokens?.refreshToken) await AuthApi.logout(tokens.refreshToken);
    } catch {
      // ignore
    }
    clear();
    navigate('/login');
  };

  return (
    <>
      <DropdownMenuLabel className="p-0 font-normal">
        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
          <UserInfo user={user} showEmail />
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link to="/settings/profile" className="block w-full cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
        <LogOut className="mr-2 h-4 w-4" />
        Log out
      </DropdownMenuItem>
    </>
  );
}
