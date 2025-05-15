import { Metadata } from "next"
import { PremiumRemixStudio } from "@/components/premium-remix-studio"

export const metadata: Metadata = {
  title: "Premium EDM Remix Studio",
  description: "Create professional-quality EDM remixes with advanced audio processing",
}

export default function PremiumRemixPage() {
  return (
    <div className="container py-6">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Premium EDM Remix Studio</h1>
        <p className="text-muted-foreground">
          Create professional-quality EDM remixes with advanced audio processing and mastering
        </p>
      </div>
      
      <PremiumRemixStudio />
    </div>
  )
}
