export const convertToUSD = (amountInKSH: number, rate: number): number => {
  return amountInKSH / rate
}

export const convertToKSH = (amountInUSD: number, rate: number): number => {
  return amountInUSD * rate
}
