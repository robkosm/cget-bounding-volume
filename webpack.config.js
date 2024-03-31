const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const exampleNames = [
    "chess_gltf",
    "playground_intersection",
    "rapier_physics",
    "sponza_gltf",
];

module.exports = {
    mode: "development",
    entry: exampleNames.reduce((entries, name) => {
        entries[`examples/${name}`] = `./src/examples/pages/${name}/main.ts`;
        return entries;
    }, {}),
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "dist"),
        clean: true,
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
    experiments: {
        asyncWebAssembly: true,
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.wasm$/,
                type: "webassembly/async", // Set module type for WebAssembly files
            },
        ],
    },
    plugins: [
        ...exampleNames.map(
            (name) =>
                new HtmlWebpackPlugin({
                    filename: `examples/kdop_${name}.html`,
                    template: `./src/examples/pages/${name}/index.html`,
                    chunks: [`examples/${name}`],
                })
        ),
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
                    from: "src/examples/files",
                    to: "examples/files",
                },
                {
                    from: "src/files",
                    to: "files",
                },
                { from: "src/examples/files.json", to: "examples/files.json" },
                { from: "src/examples/tags.json", to: "examples/tags.json" },
            ],
        }),
    ],
};
