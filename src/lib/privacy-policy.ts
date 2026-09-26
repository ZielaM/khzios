/**
 * Facts in the privacy policy that the university has to confirm (ideally
 * with its data protection officer) before launch, and update when the site
 * starts storing or sending anything new.
 */
export const PRIVACY_POLICY = {
  lastUpdated: '2026-09-26',
  /** Registered address of the controller, Poznań University of Life Sciences */
  controllerAddress: 'ul. Wojska Polskiego 28, 60-637 Poznań',
  /** Data protection officer's e-mail; when empty the policy points to the university website */
  dpoEmail: '',
  universityUrl: 'https://www.up.poznan.pl/',
} as const;
