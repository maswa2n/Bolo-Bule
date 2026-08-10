import { LandingPage } from "@/components/marketing/LandingPage";

type SearchParamValue = string | string[] | undefined;

type MarketingPageProps = {
  searchParams?: Promise<Record<string, SearchParamValue>>;
};

export default function MarketingPage({ searchParams }: MarketingPageProps) {
  return <LandingPage searchParams={searchParams} />;
}
