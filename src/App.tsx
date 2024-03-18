import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PlaygroundDemo from "./pages/PlaygroundDemo.tsx";
import SponzaDemo from "./pages/SponzaDemo.tsx";
import PhysicsDemo from "./pages/PhysicsDemo.tsx";
import Menu from "./pages/Menu.tsx";
import Layout from "./pages/Layout.tsx";
import RapierDemo from "./pages/RapierDemo.tsx";
// import ExperimentDemo from "./pages/CreationExperimentDemo.tsx";
import ExperimentDemo from "./pages/KdopExperimentDemo.tsx";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Menu />} />
                    {/* <Route path="playground" element={<PlaygroundDemo />} /> */}
                    {/* <Route path="sponza" element={<SponzaDemo />} /> */}
                    {/* <Route path="physics" element={<PhysicsDemo />} /> */}
                    {/* <Route path="rapier" element={<RapierDemo />} /> */}
                    <Route path="experiment" element={<ExperimentDemo />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
