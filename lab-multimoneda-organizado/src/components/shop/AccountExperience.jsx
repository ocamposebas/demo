import StoreProviders from "./StoreProviders.jsx";
import AnnouncementBar from "../announcement/AnnouncementBar.jsx";
import Account from "../account/Account.jsx";
import CartDrawer from "../cart/CartDrawer.jsx";
import Flooter from "../footer/Footer.jsx";
import HeaderPro from "../header/Header.jsx";

export default function AccountExperience() {
  return (
    <StoreProviders>
      <AnnouncementBar />
      <HeaderPro />
      <Account />
      <Flooter />
      <CartDrawer />
    </StoreProviders>
  );
}
