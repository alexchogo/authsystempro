// Panda CSS config placed at the project root so editor tooling can detect it.
// Keep this file in sync with your design tokens if you start using Panda.

const config = {
  // Files to scan for style usage.
  include: ["./src/**/*.{ts,tsx,js,jsx}", "./app/**/*.{ts,tsx,js,jsx}", "./components/**/*.{ts,tsx,js,jsx}"],
  exclude: ["./node_modules/**/*"],

  // Enable base styles if you adopt Panda; safe default to keep disabled for now.
  preflight: false,

  // Placeholder theme extension hook.
  theme: {
    extend: {},
  },
};

export default config;
