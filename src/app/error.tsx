"use client";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="standalone" id="main-content"><h1>The workspace could not be loaded.</h1><p>Check the database connection and school configuration, then try again. Contact your administrator if this continues.</p><button className="button primary" onClick={reset}>Try again</button></main>;
}
