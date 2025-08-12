declare module "react-colorful" {
  import * as React from "react";

  export interface HexColorPickerProps {
    color: string;
    onChange: (color: string) => void;
    className?: string;
    style?: React.CSSProperties;
  }

  export const HexColorPicker: React.FC<HexColorPickerProps>;

  export interface HexColorInputProps {
    color: string;
    onChange: (color: string) => void;
    prefixed?: boolean;
    className?: string;
    style?: React.CSSProperties;
  }

  export const HexColorInput: React.FC<HexColorInputProps>;
} 