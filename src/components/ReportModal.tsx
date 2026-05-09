import { FormEvent, useState } from "react";
import { Flag, X } from "lucide-react";

type ReportModalProps = {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => void;
};

const reasons = ["Spam", "Harassment", "Unsafe content", "Impersonation", "Other"];

export function ReportModal({ isOpen, title = "Report moment", onClose, onSubmit }: ReportModalProps) {
  const [reason, setReason] = useState(reasons[0]);
  const [details, setDetails] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(reason, details);
    setReason(reasons[0]);
    setDetails("");
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-card__header">
          <div>
            <p className="eyebrow">Moderation</p>
            <h2 id="report-title">{title}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close report form">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form className="stack" onSubmit={handleSubmit}>
          <label className="field">
            <span>Reason</span>
            <select value={reason} onChange={(event) => setReason(event.target.value)}>
              {reasons.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Details</span>
            <textarea
              rows={4}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Add context for the moderation team"
            />
          </label>
          <button className="danger-button" type="submit">
            <Flag size={18} aria-hidden="true" />
            Send report
          </button>
        </form>
      </section>
    </div>
  );
}
