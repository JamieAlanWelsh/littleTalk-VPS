import React from "react";
import ReactDOM from "react-dom/client";
import "../style.css";

const HelloExercise = () => (
    <div style={{ padding: "2rem" }}>Hello from React</div>
);

const mountElement = document.getElementById("root");

if (!mountElement) {
    console.error("Root element #root not found");
    document.body.innerHTML = `<div style="padding: 2rem; color: red;">Error loading demo: 'Root element #root not found'</div>`;
} else {
    const root = ReactDOM.createRoot(mountElement);
    root.render(
        <React.StrictMode>
            <HelloExercise />
        </React.StrictMode>,
    );
}
