import { Outlet } from "react-router-dom";
import NavbarPremium from "../components/NavbarPremium";
import FooterPremium from "../components/FooterPremium";
import ScrollToTop from "../components/ScrollToTop";
import LiveChat from "../components/LiveChat";

export default function PremiumLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <NavbarPremium />
      <main className="flex-1">
        <Outlet />
      </main>
      <FooterPremium />
      <ScrollToTop />
      <LiveChat />
    </div>
  );
}
