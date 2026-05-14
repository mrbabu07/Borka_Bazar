export const BANGLADESH_DIVISIONS = [
  "Barishal",
  "Chattogram",
  "Dhaka",
  "Khulna",
  "Mymensingh",
  "Rajshahi",
  "Rangpur",
  "Sylhet",
];

export const createEmptyAddress = (overrides = {}) => ({
  name: "",
  phone: "",
  address: "",
  division: "",
  district: "",
  upazila: "",
  union: "",
  area: "",
  zipCode: "",
  isDefault: false,
  ...overrides,
});

export const normalizeAddress = (address = {}) =>
  createEmptyAddress({
    ...address,
    name: address.name || address.fullName || "",
    phone: address.phone || "",
    address: address.address || address.street || "",
    division: address.division || "",
    district: address.district || address.city || "",
    upazila: address.upazila || address.upzila || "",
    union: address.union || "",
    area: address.area || "",
    zipCode: address.zipCode || address.postalCode || "",
    isDefault: Boolean(address.isDefault),
  });

export const toAddressPayload = (address = {}) => {
  const normalized = normalizeAddress(address);

  return {
    name: normalized.name.trim(),
    phone: normalized.phone.trim(),
    address: normalized.address.trim(),
    division: normalized.division.trim(),
    district: normalized.district.trim(),
    upazila: normalized.upazila.trim(),
    union: normalized.union.trim(),
    area: normalized.area.trim(),
    city: normalized.district.trim(),
    zipCode: normalized.zipCode.trim(),
    isDefault: Boolean(normalized.isDefault),
  };
};

export const getAddressSummary = (address = {}) => {
  const normalized = normalizeAddress(address);
  return [
    normalized.address,
    normalized.area,
    normalized.union,
    normalized.upazila,
    normalized.district,
    normalized.division,
  ]
    .filter(Boolean)
    .join(", ");
};
