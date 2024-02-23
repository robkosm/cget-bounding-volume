import { Link } from "react-router-dom";
import "./Nav.css";

function Nav() {
    return (
        <nav className="bg-slate-800">
            <Link to={"./"}>Main Menu</Link>

            <Link to={"./playground"}>Playground Demo</Link>

            <Link to={"./sponza"}>Sponza Demo</Link>

            <Link to={"./physics"}>Physics Demo</Link>
        </nav>
    );
}

export default Nav;
