import StoreProviders from "./StoreProviders.jsx";
import AnnouncementBar from "../announcement/AnnouncementBar.jsx";
import Header from "../header/Header.jsx";
import ResourcePage from "../info/ResourcePage.jsx";
import Footer from "../footer/Footer.jsx";
import CartDrawer from "../cart/CartDrawer.jsx";

export default function ResourceExperience({ page }) {
  return <StoreProviders><AnnouncementBar/><Header/><ResourcePage page={page}/><Footer/><CartDrawer/></StoreProviders>;
}
