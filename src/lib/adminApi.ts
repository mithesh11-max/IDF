import type { Item } from '../data/catalog';
import type { Review } from '../data/reviews';
import type { Offer } from './catalogSource';
import { adminAuthFunctionUrl, supabase } from './supabase';

/* ------------------------------------------------------------------ *
 * Admin login — talks to the admin-auth Edge Function. The real
 * password and the inbox that receives the code never reach this file;
 * they live only as secrets inside that function.
 * ------------------------------------------------------------------ */

async function callAdminAuth(body: Record<string, unknown>) {
  const res = await fetch(adminAuthFunctionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

export async function requestAdminCode(username: string, password: string): Promise<void> {
  await callAdminAuth({ step: 'request', username, password });
}

/** Verifies the code and leaves the Supabase client signed in as the admin. */
export async function verifyAdminCode(code: string): Promise<void> {
  if (!supabase) throw new Error('Accounts are not set up on this site yet.');
  const data = await callAdminAuth({ step: 'verify', code });
  const { error } = await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });
  if (error) throw error;
}

/** Is the currently signed-in Supabase user actually an admin? */
export async function checkIsAdmin(): Promise<boolean> {
  if (!supabase) return false;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return false;
  const { data } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', auth.user.id)
    .maybeSingle();
  return Boolean(data);
}

export async function adminSignOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/* ------------------------------------------------------------------ *
 * Products + offer — fetch and publish
 * ------------------------------------------------------------------ */

interface ProductRow {
  id: string;
  name: string;
  category: Item['category'];
  composition: string;
  width: string;
  price_per_metre: number;
  mrp: number | null;
  min_metres: number;
  stock: Item['stock'];
  tags: string[];
  image: string;
  gallery: string[];
  blurb: string;
  details: string;
}

const rowToItem = (r: ProductRow): Item => ({
  id: r.id,
  name: r.name,
  category: r.category,
  composition: r.composition,
  width: r.width,
  pricePerMetre: r.price_per_metre,
  ...(r.mrp && r.mrp > r.price_per_metre ? { mrp: r.mrp } : {}),
  minMetres: r.min_metres,
  stock: r.stock,
  tags: r.tags as Item['tags'],
  image: r.image,
  ...(r.gallery?.length ? { gallery: r.gallery } : {}),
  blurb: r.blurb,
  ...(r.details ? { details: r.details } : {}),
});

const itemToRow = (i: Item): ProductRow => ({
  id: i.id,
  name: i.name,
  category: i.category,
  composition: i.composition,
  width: i.width,
  price_per_metre: i.pricePerMetre,
  mrp: i.mrp ?? null,
  min_metres: i.minMetres,
  stock: i.stock,
  tags: i.tags,
  image: i.image,
  gallery: i.gallery ?? [],
  blurb: i.blurb,
  details: i.details ?? '',
});

export async function fetchProducts(): Promise<Item[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('products').select('*').order('name');
  if (error) throw error;
  return (data as ProductRow[]).map(rowToItem);
}

export async function fetchOffer(): Promise<Offer> {
  if (!supabase) return { active: false, headline: '', detail: '' };
  const { data, error } = await supabase
    .from('site_settings')
    .select('offer_active, offer_headline, offer_detail')
    .eq('id', true)
    .maybeSingle();
  if (error || !data) return { active: false, headline: '', detail: '' };
  return { active: data.offer_active, headline: data.offer_headline, detail: data.offer_detail };
}

/**
 * Publishes the whole edited catalog + offer in one go: upserts every current
 * item, deletes any that were removed in this session, and updates the offer
 * row. `originalIds` is the id set as it was when the editor loaded, so a
 * deletion can be told apart from an item that was simply never touched.
 */
export async function publishProducts(items: Item[], offer: Offer, originalIds: string[]): Promise<void> {
  if (!supabase) throw new Error('Accounts are not set up on this site yet.');

  const currentIds = new Set(items.map((i) => i.id));
  const removedIds = originalIds.filter((id) => !currentIds.has(id));

  if (removedIds.length) {
    const { error } = await supabase.from('products').delete().in('id', removedIds);
    if (error) throw error;
  }

  if (items.length) {
    const { error } = await supabase.from('products').upsert(items.map(itemToRow));
    if (error) throw error;
  }

  const { error: settingsError } = await supabase
    .from('site_settings')
    .update({
      offer_active: offer.active,
      offer_headline: offer.headline,
      offer_detail: offer.detail ?? '',
    })
    .eq('id', true);
  if (settingsError) throw settingsError;
}

/* ------------------------------------------------------------------ *
 * Reviews — moderation queue
 * ------------------------------------------------------------------ */

export interface AdminReviewRow {
  id: string;
  name: string;
  city: string;
  rating: number;
  text: string;
  date: string;
  status: 'pending' | 'published' | 'private';
  userEmail: string;
}

export async function fetchAllReviews(): Promise<AdminReviewRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('reviews')
    .select('id, name, city, rating, review_text, status, user_email, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map((r) => ({
    id: r.id,
    name: r.name,
    city: r.city,
    rating: r.rating,
    text: r.review_text,
    date: new Date(r.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
    status: r.status,
    userEmail: r.user_email,
  }));
}

export async function setReviewStatus(id: string, status: 'published' | 'private'): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('reviews').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteReview(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  if (error) throw error;
}

/** Admin adding a review directly — e.g. a good one collected before accounts existed. */
export async function addManualReview(review: Review): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('reviews').insert({
    user_id: null,
    user_email: '',
    name: review.name,
    city: review.city,
    rating: review.rating,
    review_text: review.text,
    status: 'published',
  });
  if (error) throw error;
}
