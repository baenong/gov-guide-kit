export interface SiteConfig {
  orgName: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  logoPath: string;
}

const siteConfig: SiteConfig = {
  orgName: '기관명',
  colors: {
    primary: '#1A2D65',
    secondary: '#018FD7',
    accent: '#7AC38E',
  },
  logoPath: '/assets/logo.svg',
};

export default siteConfig;
