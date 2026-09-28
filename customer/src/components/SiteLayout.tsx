import type { ReactNode } from 'react';
import { Breadcrumb } from './Breadcrumb';
import { SiteFooter } from './SiteFooter';
import { TabBar } from './TabBar';

/** Khung chung cho mọi trang chính: Header (TabBar) + Breadcrumb + nội dung + Footer. */
export function SiteLayout({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) {
  return (
    <>
      <TabBar />
      <main className={`container${narrow ? ' narrow' : ''}`}>
        <Breadcrumb />
        {children}
      </main>
      <SiteFooter />
    </>
  );
}