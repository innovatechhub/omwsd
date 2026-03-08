export type PandanBarangay = {
  code: string;
  name: string;
};

export type PandanAddressApiResponse = {
  province: string;
  municipality: string;
  country: string;
  barangays: PandanBarangay[];
};

const PANDAN_ADDRESS_API_PATH = "/api/locations/pandan-antique.json";

export async function getPandanAddressData(): Promise<PandanAddressApiResponse> {
  const response = await fetch(PANDAN_ADDRESS_API_PATH);

  if (!response.ok) {
    throw new Error("Unable to load Pandan address data.");
  }

  return (await response.json()) as PandanAddressApiResponse;
}
