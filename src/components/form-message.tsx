type SearchParams = {
  error?: string | string[];
  message?: string | string[];
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function FormMessage({ searchParams }: { searchParams: SearchParams }) {
  const error = firstValue(searchParams.error);
  const message = firstValue(searchParams.message);

  if (!error && !message) {
    return null;
  }

  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
        error
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-pitch-100 bg-pitch-50 text-pitch-700"
      }`}
    >
      {error ?? message}
    </div>
  );
}
