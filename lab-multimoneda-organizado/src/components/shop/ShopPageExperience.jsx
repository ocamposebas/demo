import StoreProviders from "./StoreProviders.jsx";
import AnnouncementBar from "../announcement/AnnouncementBar.jsx";
import HeaderPro from "../header/Header.jsx";
import CartDrawer from "../cart/CartDrawer.jsx";
import Flooter from "../footer/Footer.jsx";
import ShopProductGrid from "../catalog/ShopProductGrid.jsx";

export default function ShopPageExperience({ products, productError }) {
  return (
    <StoreProviders>
      <AnnouncementBar />
      <HeaderPro />
      <main>
        <ShopProductGrid products={products} error={productError} />
        <Flooter />
      </main>
      <CartDrawer />
    </StoreProviders>
  );
}
