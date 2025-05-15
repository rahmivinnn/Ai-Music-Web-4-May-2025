import { Metadata } from "next"
import Link from "next/link"
import { PremiumRemixStudio } from "@/components/premium-remix-studio"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"

export const metadata: Metadata = {
  title: "Premium EDM Remix Studio",
  description: "Create professional-quality EDM remixes with advanced audio processing",
}

export default function PremiumRemixPage() {
  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Premium EDM Remix Studio</h1>
          <p className="text-muted-foreground">
            Create professional-quality EDM remixes with advanced audio processing and mastering
          </p>
        </div>
        <Link href="/home">
          <Button variant="outline" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      <PremiumRemixStudio />
    </div>
  )
}
