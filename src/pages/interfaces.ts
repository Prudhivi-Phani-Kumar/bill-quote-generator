export interface IFlavourAPIData {
  [x: string]: IFlavourInfo[];
}

export interface IFlavourInfo {
  flavour: string;
  price: string;
  isChecked?: boolean;
}
