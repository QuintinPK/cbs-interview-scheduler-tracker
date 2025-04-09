
import { ReactNode, ComponentType } from "react";

export type ChartConfig = {
  [k in string]: {
    label?: ReactNode
    icon?: ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<"light" | "dark", string> }
  )
}

export interface ChartTooltipContentProps {
  active?: boolean;
  payload?: any[];
  hideLabel?: boolean;
  hideIndicator?: boolean;
  indicator?: "line" | "dot" | "dashed";
  nameKey?: string;
  labelKey?: string;
  label?: any;
  labelFormatter?: (label: any, payload: any[]) => ReactNode;
  labelClassName?: string;
  formatter?: (value: any, name: string, item: any, index: number, payload: any) => ReactNode;
  color?: string;
}

export interface ChartLegendContentProps {
  payload?: any[];
  verticalAlign?: "top" | "bottom" | "middle";
  hideIcon?: boolean;
  nameKey?: string;
}
