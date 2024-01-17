import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Test',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta property="version" content={process.env.commit} />
        <link
          href="http://fonts.googleapis.com/css?family=Roboto"
          rel="stylesheet"
          type="text/css"
        ></link>
      </head>
      <body>{children}</body>
    </html>
  );
}
