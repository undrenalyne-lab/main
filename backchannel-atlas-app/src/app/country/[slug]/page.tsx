import { AtlasApp } from "@/components/AtlasApp";
import { countries } from "@/lib/data";

export function generateStaticParams() {
  return countries.map((country) => ({ slug: country.slug }));
}

export default async function CountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <AtlasApp screen="country" countrySlug={slug} />;
}
