import React from 'react';

export default function DashboardLayout({
  children, //는 페이지 또는 중첩 레이아웃이 됩니다.
}: {
  children: React.ReactNode;
}) {
  return (
    <section>
      layout
      {/* 헤더 또는 사이드바 등 공유 UI를 여기에 포함*/}
      <nav></nav>
      {children}
      layout
    </section>
  );
}
