export default function LoadingSpinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2 text-sm text-icc-gray-500">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-icc-blue border-t-transparent" />
      {label}
    </div>
  );
}
