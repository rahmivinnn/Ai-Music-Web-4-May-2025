import { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI Music Web - EDM Remix Studio",
  description: "Create professional EDM remixes with AI-powered audio processing",
}

export default function EdmRemixLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex-1">
      {children}
    </div>
  )
}
