interface Props {
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  className?: string;
  style?: React.CSSProperties;
}

export const AdBanner = (_props: Props) => {
  return null;
};

export const AdBannerHorizontal = (_props: { className?: string }) => null;
export const AdBannerRect = (_props: { className?: string }) => null;
export const AdBannerFluid = (_props: { className?: string }) => null;

