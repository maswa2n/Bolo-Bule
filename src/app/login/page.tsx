import { LandingPage } from "@/components/marketing/LandingPage";

type SearchParamValue = string | string[] | undefined;

type LoginPageProps = {
  searchParams?: Promise<Record<string, SearchParamValue>>;
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  return <LandingPage searchParams={searchParams} />;
}
