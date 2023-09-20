import { ReactNode } from 'react';

export const metadata = {
  title: 'jonghyeonleee portfolio',
  description: 'jonghyeonleee portfolio nextJs page',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
