import { PromptShell } from "@/app/components/prompt-shell";

export default function PromptLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PromptShell>{children}</PromptShell>;
}

