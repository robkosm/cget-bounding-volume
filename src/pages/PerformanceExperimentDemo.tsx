import React, { useCallback, useEffect, useRef } from "react";
import { mount } from "../scripts/performanceExperimentMain";

const ExperimentDemo: React.FC = () => {
    // useEffect(() => {
    //     // This code will be executed after the component is mounted
    //     import("../scripts/sponzaMain.ts")
    //         .then((module) => {
    //             // Access code from the imported module
    //             // This code will be executed when the module is imported
    //         })
    //         .catch((error) => {
    //             console.error("Failed to import TypeScript script:", error);
    //         });
    // }, []);

    // return <div>{/* Your component content */}</div>;

    const containerRef = useRef<HTMLDivElement>(null);

    const mountCallback = useCallback(() => {
        if (containerRef.current) {
            mount(containerRef.current);
        }
    }, []);

    useEffect(() => {
        mountCallback();
    }, [mountCallback]);

    return (
        <div
            className="container"
            ref={containerRef}
            style={{ width: "100vw", height: "100vh" }}
        ></div>
    );
};

export default ExperimentDemo;
