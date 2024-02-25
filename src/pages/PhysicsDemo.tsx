import React, { useCallback } from "react";
import { mount } from "../scripts/physicsMain";

const PhysicsDemo: React.FC = () => {
    // useEffect(() => {
    //     // This code will be executed after the component is mounted
    //     import("../scripts/physicsMain.ts")
    //         .then((module) => {
    //             // Access code from the imported module
    //             // This code will be executed when the module is imported
    //         })
    //         .catch((error) => {
    //             console.error("Failed to import TypeScript script:", error);
    //         });
    // }, []);

    // return <div>{/* Your component content */}</div>;

    const containerRef = useCallback(mount, []);
    return (
        <div
            className="container"
            ref={containerRef}
            style={{ width: "100vw", height: "100vh" }}
        ></div>
    );
};

export default PhysicsDemo;
