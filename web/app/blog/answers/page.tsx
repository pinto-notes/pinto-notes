import { AnswersIndex, answersMetadata } from "@/lib/BlogIndex";

export const dynamic = "force-static";
export const metadata = answersMetadata();

export default function Page() {
  return <AnswersIndex />;
}
