// Currency hook - Fixed to BDT only
// All prices are stored in BDT in database (no conversion needed)

const BDT_SYMBOL = "৳";

export function useCurrency() {
  // Always return BDT - no currency switching
  const currency = "BDT";

  const convertPrice = (priceInBDT) => {
    if (!priceInBDT && priceInBDT !== 0) return 0;
    // No conversion needed - prices are already in BDT
    return priceInBDT;
  };

  const formatPrice = (priceInBDT) => {
    if (!priceInBDT && priceInBDT !== 0) return `${BDT_SYMBOL}0`;
    // Format with comma separators for BDT (no decimals)
    return `${BDT_SYMBOL}${Math.round(priceInBDT).toLocaleString()}`;
  };

  return {
    currency,
    convertPrice,
    formatPrice,
  };
}

export default useCurrency;
