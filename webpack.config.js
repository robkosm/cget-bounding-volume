import path from "path";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";

const exampleNames = ["chess", "playground", "rapier", "sponza"];

export default {
    mode: "development",
    entry: Object.fromEntries(
        exampleNames.map((name) => [
            `examples/${name}`,
            `./src/examples/pages/${name}/${name}Main.ts`,
        ])
    ),
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
