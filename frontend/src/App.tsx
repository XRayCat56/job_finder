import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ApplyPage } from "./pages/apply/apply-page";
import { HomePage } from "./pages/home/home-page";
import { PersonalInfoPage } from "./pages/personal-info/personal-info-page";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/personal-info" element={<PersonalInfoPage />} />
      </Routes>
    </BrowserRouter>
  );
}
