import StoreProviders from "./StoreProviders.jsx";
import AnnouncementBar from "../announcement/AnnouncementBar.jsx";
import CartDrawer from "../cart/CartDrawer.jsx";
import CheckoutResult from "../checkout/CheckoutResult.jsx";
import Flooter from "../footer/Footer.jsx";
import HeaderPro from "../header/Header.jsx";

export default function CheckoutResultExperience() {
  return (
    <StoreProviders>
      <AnnouncementBar />
      <HeaderPro />
      <CheckoutResult />
      <Flooter />
      <CartDrawer />
    </StoreProviders>
  );
}
