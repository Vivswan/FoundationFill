/**
 * Custom TypeScript declarations
 */

// Allow importing YAML files
declare module '*.yaml' {
    const content: any;
    export default content;
}