declare module 'topojson-client' {
  import { FeatureCollection, GeometryObject } from 'geojson';
  
  export interface Topology {
    type: 'Topology';
    objects: {
      [key: string]: GeometryObject;
    };
    arcs: number[][][];
    bbox?: number[];
    transform?: {
      scale: [number, number];
      translate: [number, number];
    };
  }
  
  export function feature(topology: Topology, object: GeometryObject): FeatureCollection;
  export function merge(topology: Topology, objects: GeometryObject[]): FeatureCollection;
  export function mergeArcs(topology: Topology, objects: GeometryObject[]): FeatureCollection;
  export function neighbors(objects: GeometryObject[]): number[][];
}
