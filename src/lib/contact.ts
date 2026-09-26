/** The department office, shown in the footer and the accessibility statement. */
export const DEPARTMENT_CONTACT = {
  email: 'khz@up.poznan.pl',
  phone: '+48 61 848 72 45',
} as const;

/** tel: link for a phone number written with spaces. */
export function telHref(phone: string) {
  return `tel:${phone.replace(/\s/g, '')}`;
}
