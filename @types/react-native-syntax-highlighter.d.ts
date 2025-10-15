declare module 'react-native-syntax-highlighter' {
    import { ReactNode } from 'react';
    
    export interface SyntaxHighlighterProps {
      language?: string;
      style?: any;
      customStyle?: any;
      codeTagProps?: any;
      useInlineStyles?: boolean;
      showLineNumbers?: boolean;
      startingLineNumber?: number;
      lineNumberStyle?: any;
      wrapLines?: boolean;
      lineProps?: any;
      renderer?: any;
      PreTag?: any;
      CodeTag?: any;
      code?: string;
      children?: string | ReactNode;
      [key: string]: any;
    }
    
    export const Prism: React.FC<SyntaxHighlighterProps>;
    export const Light: React.FC<SyntaxHighlighterProps>;
  }
  
  declare module 'react-native-syntax-highlighter/dist/esm/styles/prism' {
    export const dracula: any;
    export const dark: any;
    export const tomorrow: any;
    export const prism: any;
    export const okaidia: any;
    export const twilight: any;
    export const coy: any;
    export const solarizedlight: any;
    export const funky: any;
  }
  