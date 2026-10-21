import {
  useSEOManager,
  SEOManagerOptions,
} from '@/hooks/useSEOManager';

export const SEORuntime = (props: SEOManagerOptions) => {
  useSEOManager(props);
  return null;
};

export default SEORuntime;
