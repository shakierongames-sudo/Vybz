import { UserCheck, UserX } from "lucide-react";

type BlockButtonProps = {
  isBlocked: boolean;
  onToggle: () => void;
};

export function BlockButton({ isBlocked, onToggle }: BlockButtonProps) {
  const Icon = isBlocked ? UserCheck : UserX;

  return (
    <button type="button" className="ghost-button" onClick={onToggle}>
      <Icon size={18} aria-hidden="true" />
      {isBlocked ? "Unblock" : "Block"}
    </button>
  );
}
