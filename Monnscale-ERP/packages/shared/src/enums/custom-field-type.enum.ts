/**
 * Supported data types for team-scoped custom field definitions. The values
 * match what the backend stores in `CustomFieldDefinition.type`.
 */
export const CustomFieldType = {
  Text: 'text',
  Textarea: 'textarea',
  Number: 'number',
  Date: 'date',
  Select: 'select',
  MultiSelect: 'multiselect',
  Checkbox: 'checkbox',
  Email: 'email',
  Url: 'url',
  Phone: 'phone',
  Relation: 'relation',
} as const;

export type CustomFieldType = typeof CustomFieldType[keyof typeof CustomFieldType];

/**
 * `true` for field types whose value must be picked from a finite list
 * (`options.choices`). Used by the validation layer to enforce that
 * incoming values exist among the declared choices.
 */
export function customFieldHasChoices(type: CustomFieldType): boolean {
  return type === CustomFieldType.Select || type === CustomFieldType.MultiSelect;
}

/**
 * `true` for field types that carry an array of values rather than a scalar.
 */
export function customFieldIsMultiple(type: CustomFieldType): boolean {
  return type === CustomFieldType.MultiSelect;
}
