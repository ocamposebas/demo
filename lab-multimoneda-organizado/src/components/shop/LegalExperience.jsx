import StoreProviders from "./StoreProviders.jsx";
import AnnouncementBar from "../announcement/AnnouncementBar.jsx";
import CartDrawer from "../cart/CartDrawer.jsx";
import Flooter from "../footer/Footer.jsx";
import HeaderPro from "../header/Header.jsx";
import LegalDocument from "../legal/LegalDocument.jsx";

export default function LegalExperience({ documentType }) {
  return (
    <StoreProviders>
      <AnnouncementBar />
      <HeaderPro />
      <LegalDocument documentType={documentType} />
      <Flooter />
      <CartDrawer />
    </StoreProviders>
  );
}
