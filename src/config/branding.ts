// Centralized branding constants to avoid hard-coded strings across the app
export const APP_BRAND = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'Seruvo',
  tagline: 'Modern Image Hosting',
};

export const buildTitle = (page?: string) => page ? `${page} • ${APP_BRAND.name}` : APP_BRAND.name;
