import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
            manifest: {
                name: "QuickChat App",
                short_name: "QuickChat",
                description: "A simple chat application",
                theme_color: "#121212",
                background_color: "#121212",
                display: "standalone",
                start_url: "/",
                icons: [
                    {
                        src: "/vite.svg",
                        sizes: "192x192",
                        type: "image/svg+xml",
                    },
                    {
                        src: "/vite.svg",
                        sizes: "512x512",
                        type: "image/svg+xml",
                    },
                ],
            },
        }),
    ],
    server: {
        port: 5173,
        proxy: {
            "/api": {
                target: "http://localhost:5000",
                changeOrigin: true,
            },
        },
    },
});
