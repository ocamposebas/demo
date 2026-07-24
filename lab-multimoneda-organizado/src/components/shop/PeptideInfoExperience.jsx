import StoreProviders from "./StoreProviders.jsx";
import AnnouncementBar from "../announcement/AnnouncementBar.jsx";
import CartDrawer from "../cart/CartDrawer.jsx";
import Flooter from "../footer/Footer.jsx";
import HeaderPro from "../header/Header.jsx";
import PeptideInfo from "../peptides/PeptideInfo.jsx";

export default function PeptideInfoExperience() {
  return (
    <StoreProviders>
      <AnnouncementBar />
      <HeaderPro />
      <PeptideInfo />
      <Flooter />
      <CartDrawer />
    </StoreProviders>
  );
}
