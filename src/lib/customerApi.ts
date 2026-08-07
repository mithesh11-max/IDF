import type { Item } from '../data/catalog';
import { supabase } from './supabase';

export interface CustomerProfile {
  name: string;
  phone: string;
  email: string;
  city: string;
  signup_method: string;
}

const EMPTY_PROFILE: CustomerProfile = { name: '', phone: '', email: '', city: '', signup_method: '' };

export async function fetchProfile(): Promise<CustomerProfile | null> {
  if (!supabase) return null;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data } = await supabase
    .from('customers')
    .select('name, phone, email, city, signup_method')
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (data) return data as CustomerProfile;

  // First time we've seen this account — seed a row so future updates have
  // something to attach to, using whatever Supabase Auth already knows.
  const seed: CustomerProfile = {
    ...EMPTY_PROFILE,
    email: auth.user.email ?? '',
    phone: auth.user.phone ?? '',
  };
  await supabase.from('customers').insert({ user_id: auth.user.id, ...seed });
  return seed;
}

export async function upsertProfile(fields: Partial<CustomerProfile>): Promise<CustomerProfile | null> {
  if (!supabase) return null;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data, error } = await supabase
    .from('customers')
    .upsert({ user_id: auth.user.id, ...fields }, { onConflict: 'user_id' })
    .select('name, phone, email, city, signup_method')
    .single();

  if (error) return null;
  return data as CustomerProfile;
}

/* ------------------------------------------------------------------ *
 * Orders
 * ------------------------------------------------------------------ */

export interface OrderRecord {
  orderCode: string;
  items: { item: Item; metres: number; lineTotal: number }[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  requirement: string;
  fulfilment: 'delivery' | 'pickup';
  address: string;
  city: string;
  pincode: string;
  paymentMethod: string;
  paid: boolean;
  paymentReference: string;
}

export async function saveOrder(order: OrderRecord): Promise<void> {
  if (!supabase) return;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;

  await supabase.from('orders').insert({
    order_code: order.orderCode,
    customer_id: auth.user.id,
    items: order.items.map((l) => ({
      id: l.item.id,
      name: l.item.name,
      pricePerMetre: l.item.pricePerMetre,
      metres: l.metres,
      lineTotal: l.lineTotal,
    })),
    subtotal: order.subtotal,
    discount: order.discount,
    shipping: order.shipping,
    total: order.total,
    requirement: order.requirement,
    fulfilment: order.fulfilment,
    address: order.address,
    city: order.city,
    pincode: order.pincode,
    payment_method: order.paymentMethod,
    paid: order.paid,
    payment_reference: order.paymentReference,
  });
}

export interface OrderHistoryRow {
  id: string;
  orderCode: string;
  itemNames: string;
  total: number;
  paid: boolean;
  createdAt: string;
}

export async function fetchMyOrders(): Promise<OrderHistoryRow[]> {
  if (!supabase) return [];
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];

  const { data } = await supabase
    .from('orders')
    .select('id, order_code, items, total, paid, created_at')
    .eq('customer_id', auth.user.id)
    .order('created_at', { ascending: false });

  return (data ?? []).map((r) => ({
    id: r.id,
    orderCode: r.order_code,
    itemNames: Array.isArray(r.items) ? r.items.map((i: { name: string }) => i.name).join(', ') : '',
    total: r.total,
    paid: r.paid,
    createdAt: new Date(r.created_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
  }));
}

/* ------------------------------------------------------------------ *
 * Wishlist
 * ------------------------------------------------------------------ */

export async function fetchWishlistIds(): Promise<Set<string>> {
  if (!supabase) return new Set();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new Set();

  const { data } = await supabase.from('wishlist').select('product_id').eq('user_id', auth.user.id);
  return new Set((data ?? []).map((r) => r.product_id as string));
}

export async function toggleWishlist(productId: string, on: boolean): Promise<void> {
  if (!supabase) return;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;

  if (on) {
    await supabase.from('wishlist').upsert({ user_id: auth.user.id, product_id: productId });
  } else {
    await supabase.from('wishlist').delete().eq('user_id', auth.user.id).eq('product_id', productId);
  }
}
