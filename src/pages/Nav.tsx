import { Link } from "react-router-dom";
import "./Nav.css";

function Nav() {
    return (
        <nav className="font-sans bg-gray-100 text-slate-100 py-6 px-3 rounded-md shadow-[rgba(13,_38,_76,_0.19)_0px_9px_20px]">
            <ul className="space-y-6 lg:space-y-2 border-l border-slate-300">
                <li>
                    <Link
                        to={"./"}
                        className="block border-l pl-4 -ml-px border-transparent hover:border-slate-400 dark:hover:border-slate-500 text-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300"
                    >
                        Main Menu
                    </Link>
                </li>

                <li>
                    <Link
                        to={"./playground"}
                        className="block border-l pl-4 -ml-px border-transparent hover:border-slate-400 text-slate-600 hover:text-slate-900"
                    >
                        Playground
                    </Link>
                </li>

                <li>
                    <Link
                        to={"./sponza"}
                        className="block border-l pl-4 -ml-px border-transparent hover:border-slate-400 text-slate-600 hover:text-slate-900"
                    >
                        Sponza Demo
                    </Link>
                </li>

                <li>
                    <Link
                        to={"./physics"}
                        className="block border-l pl-4 -ml-px border-transparent hover:border-slate-400 text-gray-600 hover:text-gray-900"
                    >
                        Physics Demo
                    </Link>

                    <Link
                        to={"./rapier"}
                        className="block border-l pl-4 -ml-px border-transparent hover:border-slate-400 text-gray-600 hover:text-gray-900"
                    >
                        Rapier 3D Demo
                    </Link>
                </li>
            </ul>
        </nav>
    );
}

export default Nav;
