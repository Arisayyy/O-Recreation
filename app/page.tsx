import { Prompt } from "@/app/components/prompt";

export default function Home() {
  return (
    <div className="relative flex w-full flex-col items-center overflow-x-hidden pb-16 pt-[25vh]">
      <div className="mx-auto flex w-full max-w-2xl flex-col px-5">
        <Prompt />
      </div>
    </div>
  );
}
