import collegeLogo from '../assets/college-logo.png';

/**
 * ===================================================================
 * CENTRALIZED COLLEGE BRANDING & LOGO ASSET CONFIGURATION
 * ===================================================================
 * 
 * To replace the college logo at any time without modifying application code:
 * Simply replace the image file at:
 *   frontend/src/assets/college-logo.png
 *
 * All pages, login, registration, dashboards, navigation headers,
 * modals, receipts, and certificates reference this single asset!
 */
export const BRANDING = {
  INSTITUTE_NAME: 'JB Institute of Technology',
  INSTITUTE_SHORT: 'JBIT',
  ADDRESS: '23 Milestone, NH-07, Chakrata Rd, Shankarpur, Uttarakhand 248197',
  LOGO: collegeLogo,
  LOGO_ALT: 'JB Institute of Technology'
};

export { collegeLogo };
export default BRANDING;
