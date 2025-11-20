import './globals.css';

export const metadata = {
  title: 'Star Wars Watchlist · API edition',
  description: 'React + React Router UI backed by Next.js API routes, Mongo persistence, and a sprinkle of SWAPI data.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
          rel="stylesheet"
          integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-dark text-light">{children}</body>
    </html>
  );
}
