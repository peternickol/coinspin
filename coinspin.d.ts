export const version: string;
export const STYLE_ID: string;

export interface CoinSpinOptions {
  folder?: string;
  filename?: string;
  /** Cloudimage alias for `filename`. */
  filenameX?: string;
  amount?: number;
  /** Cloudimage alias for `amount`. */
  amountX?: number;
  reverse?: boolean;
  bottomCircle?: boolean;
  poster?: string;
  label?: string;
  maxHeight?: string;
}

export interface CoinSpinSettings {
  folder: string;
  filename: string;
  amount: number;
  reverse: boolean;
  bottomCircle: boolean;
  poster: string;
  label: string;
  maxHeight: string;
}

export class CoinSpin {
  constructor(target: Element | string, options?: CoinSpinOptions);
  readonly el: Element;
  readonly options: CoinSpinSettings;
  index: number;
  readonly ready: boolean;
  destroy(): void;
}

/** Bind one viewer. Frames stay unloaded until the poster is clicked. */
export function coinspin(target: Element | string, options?: CoinSpinOptions): CoinSpin;

/** Bind every `.coinspin` element under `root` that has frame data. */
export function start(root?: ParentNode): CoinSpin[];

export default CoinSpin;
