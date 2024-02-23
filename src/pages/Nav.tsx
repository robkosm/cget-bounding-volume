import { Link } from "react-router-dom";
import "./Nav.css";

function Nav() {
    return (
        <nav>
            <Link to={"./physics"} className="bg-slate-800	">
                PhysicsDemo
            </Link>
        </nav>
    );
}

export default Nav;
