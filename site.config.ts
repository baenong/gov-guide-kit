import data from './site.config.json';

export interface SiteConfig {
  orgName: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  logoPath: string;
  logoBackground?: boolean;
}

export default data as SiteConfig;
