import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Locale = 'fr' | 'en';

const STORAGE_KEY = 'Moonscale-locale';

export function LanguagePage() {
  const [locale, setLocale] = useState<Locale>(() => {
    const v = (typeof localStorage !== 'undefined' && (localStorage.getItem(STORAGE_KEY) as Locale | null)) || 'fr';
    return v;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.setAttribute('lang', locale);
  }, [locale]);

  return (
    <div className="space-y-6">
      <h1 className="sr-only">Paramètres de langue</h1>

      <div className="space-y-0.5">
        <h2 className="text-lg font-medium tracking-tight">Paramètres de langue</h2>
        <p className="text-sm text-muted-foreground">
          Choisissez la langue utilisée dans toute l'application.
        </p>
      </div>

      <div className="space-y-3">
        <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fr">Français</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">Votre choix est enregistré dans votre profil.</p>
      </div>
    </div>
  );
}
