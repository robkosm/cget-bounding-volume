import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PhysicsDemo from "./pages/PhysicsDemo.tsx";
import Menu from "./pages/Menu.tsx";
import Layout from "./pages/Layout.tsx";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Menu />} />
                    <Route path="physics" element={<PhysicsDemo />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
