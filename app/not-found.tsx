import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl">404</h1>
        <h2 className="mt-2 text-lg">Page not found</h2>
        <p className="mt-2 text-sm text-text-muted">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-text-primary px-4 py-2 text-sm font-medium text-text-inverse"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
