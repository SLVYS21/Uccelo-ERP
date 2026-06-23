import { AppLogoIcon } from './AppLogoIcon';

export function AppLogo() {
  return (
    <>
      <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow-violet">
        <AppLogoIcon className="size-5 text-white" />
      </div>
      <div className="ml-1 grid flex-1 text-left">
        <span className="truncate text-sm leading-tight font-semibold tracking-tight">
          Moonscale <span className="text-gradient">ERP</span>
        </span>
        <span className="truncate text-[11px] leading-tight text-muted-foreground">
          Sales workspace
        </span>
      </div>
    </>
  );
}
