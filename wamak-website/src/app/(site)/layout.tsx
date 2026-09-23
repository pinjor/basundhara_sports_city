import { Attribution } from "@/components/layout/Attribution";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { StickyMobileCTA } from "@/components/layout/StickyMobileCTA";
import { RfqDrawer } from "@/components/product/RfqDrawer";
import { Toast } from "@/components/ui/Toast";

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Attribution />
      <Header />
      <main id="main">
        {children}
      </main>
      <Footer />
      {/* Room for the sticky mobile action bar so it never covers the footer. */}
      <div aria-hidden="true" className="h-[73px] bg-navy-950 xl:hidden" />
      <StickyMobileCTA />
      <Toast />
      <RfqDrawer />
    </>
  );
}
