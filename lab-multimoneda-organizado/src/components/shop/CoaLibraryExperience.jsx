import StoreProviders from "./StoreProviders.jsx";
import AnnouncementBar from "../announcement/AnnouncementBar.jsx";
import HeaderPro from "../header/Header.jsx";
import CoaLibrary from "../coa/CoaLibrary.jsx";
import Footer from "../footer/Footer.jsx";

export default function CoaLibraryExperience() {
  return <StoreProviders><AnnouncementBar /><HeaderPro /><CoaLibrary /><Footer /></StoreProviders>;
}
