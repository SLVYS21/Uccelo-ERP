import { Outlet, Link } from 'react-router-dom';
import { AppLogoIcon } from '@/components/AppLogoIcon';

export function AuthLayout() {
  return (
    <div className="bg-aurora flex min-h-screen flex-col items-center justify-center gap-6 p-6 md:p-10">
      <Link to="/" className="flex items-center gap-2 font-semibold">
        <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow-violet">
          <AppLogoIcon className="size-5 text-white" />
        </div>
        <span className="text-lg tracking-tight">
          Moonscale <span className="text-gradient">ERP</span>
        </span>
      </Link>
      <div className="w-full max-w-md">
        <div className="rounded-2xl border bg-card p-6 shadow-card sm:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
