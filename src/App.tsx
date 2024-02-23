import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PlaygroundDemo from "./pages/PlaygroundDemo.tsx";
import SponzaDemo from "./pages/SponzaDemo.tsx";
import PhysicsDemo from "./pages/PhysicsDemo.tsx";
import Menu from "./pages/Menu.tsx";
import Layout from "./pages/Layout.tsx";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Menu />} />
                    <Route path="playground" element={<PlaygroundDemo />} />
                    <Route path="sponza" element={<SponzaDemo />} />
                    <Route path="physics" element={<PhysicsDemo />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
