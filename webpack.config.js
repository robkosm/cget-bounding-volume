import path from "path";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";

export default {
    mode: "development",
    entry: {
        "examples/chess": "./src/examples/pages/chess/chessMain.ts",
        "examples/playground":
            "./src/examples/pages/playground/playgroundMain.ts",
        "examples/rapier": "./src/examples/pages/rapier/rapierMain.ts",
        "examples/sponza": "./src/examples/pages/sponza/sponzaMain.ts",
    },
    output: {
        filename: "[name].js",
        path: path.resolve(new URL(".", import.meta.url).pathname, "dist"),
        clean: true,
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: "examples/chess.html",
            template: "./src/examples/pages/chess/index.html",
            chunks: ["examples/chess"],
        }),
        new HtmlWebpackPlugin({
            filename: "examples/playground.html",
            template: "./src/examples/pages/playground/index.html",
            chunks: ["examples/playground"],
        }),
        new HtmlWebpackPlugin({
            filename: "examples/rapier.html",
            template: "./src/examples/pages/rapier/index.html",
            chunks: ["examples/rapier"],
        }),
        new HtmlWebpackPlugin({
            filename: "examples/sponza.html",
            template: "./src/examples/pages/sponza/index.html",
            chunks: ["examples/sponza"],
        }),
        new HtmlWebpackPlugin({
            filename: "examples/index.html",
            template: "./src/examples/index.html",
            chunks: [],
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: "src/examples/assets", to: "examples/assets" },
                {
                    from: "src/examples/screenshots",
                    to: "examples/screenshots",
                },
                {
                    from: "src/examples/files/main.css",
                    to: "files/main.css",
                },
                { from: "src/examples/files.json", to: "examples/files.json" },
                { from: "src/examples/tags.json", to: "examples/tags.json" },
            ],
        }),
    ],
};
