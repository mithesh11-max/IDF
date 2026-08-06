/** Central business information — everything on the site reads from here. */
export const BUSINESS = {
  name: 'In Design Luxury Fabrics',
  legalName: 'IN DESIGN LUXURY FABRICS',
  tagline: 'Curators of Haute Couture',
  city: 'Bengaluru',

  phoneDisplay: '088848 53153',
  phoneRaw: '+918884853153',
  whatsappNumber: '918884853153',

  email: 'hello@indesignluxuryfabrics.com',

  addressLine1: 'Shop No. 32, Ibrahim Sahib Street',
  addressLine2: 'Parallel to Commercial Street, Shivaji Nagar',
  addressLine3: 'Bengaluru, Karnataka 560001',

  instagram: 'https://www.instagram.com/in_design_luxury_fabrics',
  instagramHandle: '@in_design_luxury_fabrics',

  mapsLink:
    'https://www.google.com/maps/search/?api=1&query=Shop+No.+32%2C+Ibrahim+Sahib+Street%2C+Shivaji+Nagar%2C+Bengaluru%2C+Karnataka+560001',
  mapsEmbed:
    'https://www.google.com/maps?q=Shop+No.+32,+Ibrahim+Sahib+Street,+Shivaji+Nagar,+Bengaluru,+Karnataka+560001&output=embed',

  hours: [
    { days: 'Monday – Saturday', time: '10:30 AM – 8:30 PM' },
    { days: 'Sunday', time: '11:00 AM – 7:00 PM' },
  ],
} as const;

/**
 * UPI payment settings.
 * IMPORTANT: replace `vpa` with the shop's real UPI ID before going live.
 * Any UPI ID works — GPay / PhonePe / Paytm / bank VPA.
 */
export const UPI = {
  vpa: 'indesignfabrics@okhdfcbank',
  payeeName: 'In Design Luxury Fabrics',
} as const;

/** Order settings. */
export const ORDER = {
  freeShippingAbove: 5000,
  shippingFlat: 149,
  wholesaleMinMetres: 20,
  wholesaleDiscount: 0.15, // 15% off at wholesale quantities
} as const;

export const waLink = (message: string) =>
  `https://wa.me/${BUSINESS.whatsappNumber}?text=${encodeURIComponent(message)}`;

export const WA_DEFAULT = waLink(
  'Hello In Design Luxury Fabrics! I would like to enquire about your couture fabrics.',
);

export const WA_VISIT = waLink(
  'Hello! I would like to plan a visit to your Commercial Street showroom.',
);

export const NAV_LINKS = [
  { href: '#collections', label: 'Collections' },
  { href: '#shop', label: 'Shop' },
  { href: '#atelier', label: 'Atelier' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#reviews', label: 'Reviews' },
  { href: '#visit', label: 'Visit' },
] as const;

export const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
