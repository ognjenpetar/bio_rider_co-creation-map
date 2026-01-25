declare module 'react-leaflet-cluster' {
  import { FC } from 'react';
  import { MarkerClusterGroupOptions } from 'leaflet';

  interface MarkerClusterGroupProps extends MarkerClusterGroupOptions {
    children?: React.ReactNode;
    chunkedLoading?: boolean;
    spiderfyOnMaxZoom?: boolean;
    showCoverageOnHover?: boolean;
    zoomToBoundsOnClick?: boolean;
    maxClusterRadius?: number | ((zoom: number) => number);
    iconCreateFunction?: (cluster: L.MarkerCluster) => L.DivIcon;
  }

  const MarkerClusterGroup: FC<MarkerClusterGroupProps>;
  export default MarkerClusterGroup;
}
