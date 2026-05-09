type CategoryPillProps = {
  label: string;
};

export function CategoryPill({ label }: CategoryPillProps) {
  return <span className="category-pill">{label}</span>;
}
