import { Outlet } from "react-router-dom";
import Nav from "./Nav";

const Layout = () => {
    return (
        <>
            <Nav></Nav>

            <Outlet />
        </>
    );
};

export default Layout;
