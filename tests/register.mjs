// Lets Node's built-in test runner import the app's extensionless TS imports
// (e.g. './constants') using Node's native type stripping. No dependencies.
import { register } from 'node:module'
register('./resolve-ts.mjs', import.meta.url)
