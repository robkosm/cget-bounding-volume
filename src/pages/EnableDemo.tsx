import React, { useCallback } from "react";
import { mount } from "../scripts/enableMain";

const EnableDemo: React.FC = () => {
    const containerRef = useCallback(mount, []);
    return (
        <div
            className="container"
            ref={containerRef}
            style={{ width: "100vw", height: "100vh" }}
        ></div>
    );
};

export default EnableDemo;
