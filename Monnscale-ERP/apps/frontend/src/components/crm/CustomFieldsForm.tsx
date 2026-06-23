import { format, parse } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type {
  CustomFieldDefinition,
  CustomFieldValue,
  CustomFieldValues,
} from '@Moonscale/shared';
import { CustomFieldType } from '@Moonscale/shared';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface FormProps {
  definitions: CustomFieldDefinition[];
  values: CustomFieldValues;
  errors?: Record<string, string>;
  onChange: (values: CustomFieldValues) => void;
}

export function CustomFieldsForm({ definitions, values, errors, onChange }: FormProps) {
  if (!definitions.length) return null;

  const set = (key: string, value: unknown) =>
    onChange({ ...values, [key]: value as CustomFieldValue });

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {definitions.map((def) => (
        <CustomFieldRenderer
          key={def.id}
          definition={def}
          value={values[def.key]}
          error={errors?.[`customFields.${def.key}`]}
          onChange={(v) => set(def.key, v)}
        />
      ))}
    </div>
  );
}

interface RendererProps {
  definition: CustomFieldDefinition;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
  readonly?: boolean;
}

const SELECT_NONE = '__none__';

export function CustomFieldRenderer({
  definition: def,
  value,
  error,
  onChange,
  readonly,
}: RendererProps) {
  const id = `cf_${def.key}`;
  const choices = (def.options?.choices ?? []).map((c) => ({
    value: String(c.value),
    label: c.label,
  }));

  if (readonly) {
    return (
      <div className="space-y-0.5">
        <p className="text-xs text-muted-foreground">{def.label}</p>
        <p className="font-medium break-words">{displayValue(def, value)}</p>
      </div>
    );
  }

  const labelEl = (
    <Label htmlFor={id}>
      {def.label}
      {def.isRequired && <span className="text-destructive"> *</span>}
    </Label>
  );

  const helpEl = def.helpText && (
    <p className="text-xs text-muted-foreground">{def.helpText}</p>
  );

  const errorEl = error && <p className="text-xs text-destructive">{error}</p>;

  switch (def.type) {
    case CustomFieldType.Checkbox:
      return (
        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <Checkbox id={id} checked={Boolean(value)} onCheckedChange={(c) => onChange(Boolean(c))} />
            {labelEl}
          </div>
          {helpEl}
          {errorEl}
        </div>
      );

    case CustomFieldType.Textarea:
      return (
        <div className="grid gap-2">
          {labelEl}
          <Textarea id={id} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />
          {helpEl}
          {errorEl}
        </div>
      );

    case CustomFieldType.Select:
      return (
        <div className="grid gap-2">
          {labelEl}
          <Select
            value={value == null || value === '' ? SELECT_NONE : String(value)}
            onValueChange={(v) => onChange(v === SELECT_NONE ? null : v)}
          >
            <SelectTrigger id={id} className="w-full sm:max-w-sm">
              <SelectValue placeholder="Sélectionner…" />
            </SelectTrigger>
            <SelectContent>
              {!def.isRequired && <SelectItem value={SELECT_NONE}>—</SelectItem>}
              {choices.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {helpEl}
          {errorEl}
        </div>
      );

    case CustomFieldType.MultiSelect: {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="grid gap-2">
          {labelEl}
          <div className="flex flex-wrap gap-3">
            {choices.map((c) => (
              <label key={c.value} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={arr.includes(c.value)}
                  onCheckedChange={(checked) => {
                    const next = new Set(arr);
                    if (checked) next.add(c.value);
                    else next.delete(c.value);
                    onChange([...next]);
                  }}
                />
                {c.label}
              </label>
            ))}
          </div>
          {helpEl}
          {errorEl}
        </div>
      );
    }

    case CustomFieldType.Date: {
      const dateValue = value ? parse(String(value), 'yyyy-MM-dd', new Date()) : undefined;
      return (
        <div className="grid gap-2">
          {labelEl}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                id={id}
                className={cn('w-full justify-start text-left font-normal sm:max-w-sm', !dateValue && 'text-muted-foreground')}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateValue ? format(dateValue, 'dd/MM/yyyy') : 'Sélectionner…'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={(d) => onChange(d ? format(d, 'yyyy-MM-dd') : null)}
              />
            </PopoverContent>
          </Popover>
          {helpEl}
          {errorEl}
        </div>
      );
    }

    case CustomFieldType.Relation: {
      const num = value == null || value === '' ? SELECT_NONE : String(value);
      return (
        <div className="grid gap-2">
          {labelEl}
          <Select value={num} onValueChange={(v) => onChange(v === SELECT_NONE ? null : Number(v))}>
            <SelectTrigger id={id} className="w-full sm:max-w-sm">
              <SelectValue placeholder="Choisir une fiche" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SELECT_NONE}>—</SelectItem>
              {choices.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {helpEl}
          {errorEl}
        </div>
      );
    }

    default: {
      const inputType =
        def.type === CustomFieldType.Email
          ? 'email'
          : def.type === CustomFieldType.Url
            ? 'url'
            : def.type === CustomFieldType.Phone
              ? 'tel'
              : def.type === CustomFieldType.Number
                ? 'number'
                : 'text';
      return (
        <div className="grid gap-2">
          {labelEl}
          <Input
            id={id}
            type={inputType}
            value={(value as string | number) ?? ''}
            onChange={(e) => onChange(e.target.value)}
          />
          {helpEl}
          {errorEl}
        </div>
      );
    }
  }
}

function displayValue(def: CustomFieldDefinition, value: unknown): string {
  if (value == null || value === '') return '—';
  switch (def.type) {
    case CustomFieldType.Checkbox:
      return value ? 'Oui' : 'Non';
    case CustomFieldType.MultiSelect:
      return Array.isArray(value) && value.length ? value.join(', ') : '—';
    case CustomFieldType.Date:
      return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(String(value)));
    default:
      return String(value);
  }
}
