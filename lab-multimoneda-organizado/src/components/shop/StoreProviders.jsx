import { CartProvider } from "../cart/CartContext.jsx";
import { CurrencyProvider } from "../../currency/CurrencyContext.jsx";
import { LanguageProvider } from "../../i18n/LanguageContext.jsx";
import RewardsSignupPopup from "../marketing/RewardsSignupPopup.jsx";

export default function StoreProviders({ children }) {
  return (
    <LanguageProvider>
      <CurrencyProvider>
        <CartProvider>
          {children}
          <RewardsSignupPopup />
        </CartProvider>
      </CurrencyProvider>
    </LanguageProvider>
  );
}
