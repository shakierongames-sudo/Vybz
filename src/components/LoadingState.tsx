type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Loading Vybz" }: LoadingStateProps) {
  return (
    <div className="loading-state" role="status">
      <span className="loading-state__pulse" />
      <span>{label}</span>
    </div>
  );
}
