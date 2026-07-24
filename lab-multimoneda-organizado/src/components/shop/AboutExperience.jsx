import StoreProviders from "./StoreProviders.jsx";
import AnnouncementBar from "../announcement/AnnouncementBar.jsx";
import AboutStory from "../about/AboutStory.jsx";
import CartDrawer from "../cart/CartDrawer.jsx";
import Flooter from "../footer/Footer.jsx";
import HeaderPro from "../header/Header.jsx";

export default function AboutExperience() {
  return (
    <StoreProviders>
      <AnnouncementBar />
      <HeaderPro />
      <AboutStory />
      <Flooter />
      <CartDrawer />
    </StoreProviders>
  );
}
