import StoreProviders from "./StoreProviders.jsx";
import AnnouncementBar from "../announcement/AnnouncementBar.jsx";
import CartDrawer from "../cart/CartDrawer.jsx";
import Flooter from "../footer/Footer.jsx";
import HeaderPro from "../header/Header.jsx";
import ProductDetail from "../product/ProductDetail.jsx";

export default function ProductDetailExperience({ product, variations, featuredProducts, pageStatus }) {
  return (
    <StoreProviders>
      <AnnouncementBar />
      <HeaderPro />
      <ProductDetail product={product} variations={variations} featuredProducts={featuredProducts} pageStatus={pageStatus} />
      <Flooter />
      <CartDrawer />
    </StoreProviders>
  );
}
