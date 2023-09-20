import React from 'react';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div>
      template
      {children}
      template
    </div>
  );
}
