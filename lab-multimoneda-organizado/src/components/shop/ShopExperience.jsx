import React from "react";
import StoreProviders from "./StoreProviders.jsx";
import HeaderPro from "../header/Header.jsx";
import HeroPro from "../hero/HeroPro.jsx";
import ProductCatalog from "../catalog/ProductCatalog.jsx";
import Coaprincipal from "../coa/CompromisoTecnico.jsx";
import Flooter from "../footer/Footer.jsx";
import CartDrawer from "../cart/CartDrawer.jsx";
import AnnouncementBar from "../announcement/AnnouncementBar.jsx";
import { HomeFaq, OrderProcess } from "../home/HomeGuidance.jsx";

export default function ShopExperience({ products, productError }) {
  return (
    <StoreProviders>
      <AnnouncementBar />
      <HeaderPro />
      <main>
        <HeroPro />
        <ProductCatalog products={products} error={productError} />
        <OrderProcess />
        <Coaprincipal />
        <HomeFaq />
        <Flooter />
      </main>
      <CartDrawer />
    </StoreProviders>
  );
}
