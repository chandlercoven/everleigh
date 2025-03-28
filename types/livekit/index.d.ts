// Temporary type declarations for LiveKit components
declare module '@livekit/components-react' {
  import * as React from 'react';
  
  export interface LiveKitRoomProps {
    token: string;
    serverUrl: string;
    options?: {
      publishDefaults?: {
        simulcast?: boolean;
        videoSimulcastLayers?: any[];
      };
      adaptiveStream?: boolean;
      dynacast?: boolean;
      [key: string]: any;
    };
    children?: React.ReactNode;
  }
  
  export const LiveKitRoom: React.FC<LiveKitRoomProps>;
  export const VideoConference: React.FC<any>;
}
