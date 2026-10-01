import type { ReactNode } from 'react';
import { Breadcrumb } from './Breadcrumb';
import { SiteFooter } from './SiteFooter';
import { TabBar } from './TabBar';

/** Khung chung: Header + Breadcrumb (luôn sát lề) + nội dung (có thể thu hẹp) + Footer. */
export function SiteLayout({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) {
  return (
    <>
      <TabBar />
      <main className="container">
        <Breadcrumb />
        {narrow ? <div className="narrow-body">{children}</div> : children}
      </main>
      <SiteFooter />
    </>
  );
}
