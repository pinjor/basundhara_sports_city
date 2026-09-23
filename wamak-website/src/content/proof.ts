/**
 * Social proof and editorial content. ALL ARRAYS ARE EMPTY ON PURPOSE.
 * Nothing here may be invented. Components render nothing, and routes 404,
 * until verified entries are added (with the client's written approval).
 */

export type Testimonial = { quote: string; name: string; role: string; company: string; country: string };
export type ClientLogo = { name: string; src: string; width: number; height: number };
export type Metric = { value: string; label: string; source: string };
export type Article = { slug: string; title: string; summary: string; date: string; body: string[] };
export type CaseStudy = { slug: string; title: string; client: string; category: string; summary: string; body: string[] };

export const testimonials: Testimonial[] = [];
export const clientLogos: ClientLogo[] = [];
export const metrics: Metric[] = [];
export const insights: Article[] = [];
export const caseStudies: CaseStudy[] = [];
