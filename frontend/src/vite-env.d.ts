/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />

declare module "*.module.css" {
    const classes: { [key: string]: string };
    export default classes;
}
