import { defineConfig } from 'astro/config';
export default defineConfig({site:'https://stack.menu',output:'static',trailingSlash:'always',build:{format:'directory'},publicDir:'./.generated/resources'});
