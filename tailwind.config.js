/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  // v4 handles theme in CSS, but scanning is still needed.
  // However, in v4, 'content' is often auto-detected if not specified but good to keep for safety.
  // The theme section is empty as we moved it to CSS.
  theme: {
    extend: {},
  },
  plugins: [],
};
