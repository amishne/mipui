# Mipui Style Guide

This document outlines the coding style and conventions for the Mipui project.

## General Principles

* **Vanilla JS**: No frameworks (React, Vue, etc.), no transpilers (Babel, TypeScript), no build step.
* **Minimal Dependencies**: Avoid adding new external libraries.
* **Firebase**: Use Firebase for backend/database.

## Javascript

* **Indentation**: 2 spaces.
* **Line Length**: Generally 80 characters, but not strictly enforced if readability suffers.
* **Naming Conventions**:
    * **Variables/Functions**: camelCase (e.g., `myVariable`, `doSomething`).
    * **Classes**: PascalCase (e.g., `OperationCenter`).
    * **Private Members**: camelCase with trailing underscore (e.g., `myPrivateField_`).
    * **Constants**: camelCase or UPPER_CASE depending on usage (existing code uses `ck` (content keys), `pk` (property keys),  `ct` (content types) namespaces).
* **Formatting**:
    * Space before opening brace: `if (condition) {`
    * For single-line function bodies that require braces, space inside the braces: `if (condition) { body }`.
    * For single-line values inside object braces, no space inside the braces: `{key: value}`.
    * `const` and `let` over `var`.
    * Arrow functions => preferred for callbacks.
* **Comments**:
    * Document complex logic.
    * No need for JSDoc-style parameter documentation for every function.
    * Use `//` for single line comments.
* **EOF**: Files end with a single newline.

## CSS

* **Naming**: Kebab-case for class names (e.g., `.grid-cell`, `.tile-map`).
* **Structure**: Group related styles (e.g., all `.tile` related styles together).
* **Formatting**: 2 spaces indentation.

## HTML

* **Semantic HTML**: Use proper tags (`<article>`, `<section>`, etc.).
* **Indentation**: 2 spaces.

## Testing

* **Framework**: Use `test/harness.js` for lightweight unit tests.
* **Manual Testing**: Heavy reliance on manual testing and visual inspection.
