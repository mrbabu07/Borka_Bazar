import {
  createEmptyAddress,
  getAddressSummary,
  normalizeAddress,
  toAddressPayload,
} from "./bangladeshAddress";

describe("bangladeshAddress utilities", () => {
  test("normalizes legacy city and upzila fields", () => {
    const normalized = normalizeAddress({
      name: "Amina",
      city: "Dhaka",
      upzila: "Savar",
      postalCode: "1340",
    });

    expect(normalized.district).toBe("Dhaka");
    expect(normalized.upazila).toBe("Savar");
    expect(normalized.zipCode).toBe("1340");
  });

  test("builds API payload with district mirrored as city", () => {
    const payload = toAddressPayload(
      createEmptyAddress({
        name: " Amina ",
        phone: " 01700000000 ",
        address: " House 1 ",
        division: " Dhaka ",
        district: " Dhaka ",
        upazila: " Savar ",
        union: " Tetuljhora ",
        area: " Hemayetpur ",
        zipCode: " 1340 ",
        isDefault: true,
      }),
    );

    expect(payload).toMatchObject({
      name: "Amina",
      city: "Dhaka",
      district: "Dhaka",
      upazila: "Savar",
      union: "Tetuljhora",
      area: "Hemayetpur",
      isDefault: true,
    });
  });

  test("formats address summary from detailed Bangladesh fields", () => {
    expect(
      getAddressSummary({
        address: "House 1",
        area: "Hemayetpur",
        union: "Tetuljhora",
        upazila: "Savar",
        district: "Dhaka",
        division: "Dhaka",
      }),
    ).toBe("House 1, Hemayetpur, Tetuljhora, Savar, Dhaka, Dhaka");
  });
});
