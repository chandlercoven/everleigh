declare module 'formidable' {
  export interface File {
    filepath: string;
    originalFilename: string;
    mimetype: string;
    size: number;
  }

  export interface Files {
    [key: string]: File[];
  }

  export interface Fields {
    [key: string]: string[];
  }

  export interface Options {
    maxFileSize?: number;
    maxFields?: number;
    allowEmptyFiles?: boolean;
    keepExtensions?: boolean;
  }

  export default function(options?: Options): {
    parse: (req: any) => Promise<[Fields, Files]>;
  };
} 