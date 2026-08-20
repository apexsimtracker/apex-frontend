export type CatalogPickerOption = {
  id: string;
  name: string;
};

export function catalogSearchKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function filterCatalogOptions(
  options: CatalogPickerOption[],
  query: string,
): CatalogPickerOption[] {
  const needle = catalogSearchKey(query);
  if (!needle) return options;
  return options.filter((option) =>
    `${catalogSearchKey(option.name)} ${catalogSearchKey(option.id)}`.includes(
      needle,
    ),
  );
}
