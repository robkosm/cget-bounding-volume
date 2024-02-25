import React, { useEffect } from "react";

const SponzaDemo: React.FC = () => {
    useEffect(() => {
        // This code will be executed after the component is mounted
        import("../scripts/sponzaMain.ts")
            .then((module) => {
                // Access code from the imported module
                // This code will be executed when the module is imported
            })
            .catch((error) => {
                console.error("Failed to import TypeScript script:", error);
            });
    }, []);

    return <div>{/* Your component content */}</div>;
};

export default SponzaDemo;