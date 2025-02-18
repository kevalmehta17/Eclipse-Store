/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"], // Include all necessary file types
  theme: {
    extend: {}, // Customize your theme here
  },
  plugins: [], // Add Tailwind plugins if needed
};

// module.exports = {
//   content: [
//     "./src/**/*.{js,jsx,ts,tsx}", // Include all JavaScript and TypeScript files in the src directory
//     "./public/index.html", // Include the index.html file
//   ],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// }