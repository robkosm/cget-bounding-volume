import { Link } from "react-router-dom";
import "./Nav.css";

function Nav() {
    return (
        <nav>
            <Link to={"./physics"}>PhysicsDemo</Link>
        </nav>
    );
}

export default Nav;
