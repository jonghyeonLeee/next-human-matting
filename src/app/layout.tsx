import { ReactNode } from 'react';

export const metadata = {
  title: 'jonghyeonleee portfolio',
  description: 'jonghyeonleee portfolio nextJs page',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
