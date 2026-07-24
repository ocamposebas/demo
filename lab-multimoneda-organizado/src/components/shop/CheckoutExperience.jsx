import StoreProviders from "./StoreProviders.jsx";
import AnnouncementBar from "../announcement/AnnouncementBar.jsx";
import CartDrawer from "../cart/CartDrawer.jsx";
import Checkout from "../checkout/Checkout.jsx";
import Flooter from "../footer/Footer.jsx";
import HeaderPro from "../header/Header.jsx";

export default function CheckoutExperience() {
  return (
    <StoreProviders>
      <AnnouncementBar />
      <HeaderPro />
      <Checkout />
      <Flooter />
      <CartDrawer />
    </StoreProviders>
  );
}
