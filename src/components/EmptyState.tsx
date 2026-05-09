import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

type EmptyStateProps = {
  title: string;
  body: string;
  action?: ReactNode;
};

export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <section className="empty-state">
      <Sparkles size={28} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{body}</p>
      {action}
    </section>
  );
}
