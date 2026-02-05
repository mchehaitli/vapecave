/// <reference types="vite/client" />

declare module '@/utils/cssOptimizer' {
  export function inlineCSS(css: string): void;
  export const criticalCSS: string;
  export function removeUnusedCSS(): void;
  export function deferCSS(href: string): void;
}

declare module '@/utils/imageOptimizer' {
  export function optimizeImage(src: string, options?: any): string;
  export function createSrcSet(src: string, widths?: number[]): string;
  export function lazyLoadImages(): void;
  export function supportsWebP(): boolean;
  export function getOptimalFormat(src: string): string;
  export function preloadImage(src: string): void;
}