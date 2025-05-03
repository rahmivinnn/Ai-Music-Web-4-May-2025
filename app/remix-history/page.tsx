"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Share2, Trash2, Search } from "lucide-react"

export default function RemixHistoryPage() {
  const [filter, setFilter] = useState("all")

  const remixes = [
    {
      id: 1,
      title: "Neon Dreams (EDM Remix)",
      original: "Dreams by Sarah Chen",
      date: "2024-03-14",
      duration: "02:20",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/placeholder-ob7miW3mUreePYfXdVwkpFWHthzoR5.svg?height=60&width=60&query=colorful+abstract+face+with+headphones",
    },
    {
      id: 2,
      title: "Neon Dreams (EDM Remix)",
      original: "Dreams by Sarah Chen",
      date: "2024-03-14",
      duration: "02:20",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/placeholder-ob7miW3mUreePYfXdVwkpFWHthzoR5.svg?height=60&width=60&query=abstract+colorful+music+art",
    },
    {
      id: 3,
      title: "Neon Dreams (EDM Remix)",
      original: "Dreams by Sarah Chen",
      date: "2024-03-14",
      duration: "02:20",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/placeholder-ob7miW3mUreePYfXdVwkpFWHthzoR5.svg?height=60&width=60&query=colorful+abstract+face+with+headphones",
    },
    {
      id: 4,
      title: "Neon Dreams (EDM Remix)",
      original: "Dreams by Sarah Chen",
      date: "2024-03-14",
      duration: "02:20",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/placeholder-ob7miW3mUreePYfXdVwkpFWHthzoR5.svg?height=60&width=60&query=abstract+colorful+music+art",
    },
  ]

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Remix History</h1>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              type="search"
              placeholder="Search remixes"
              className="w-[250px] bg-zinc-900 pl-9 text-sm text-zinc-400 focus:ring-cyan-500"
            />
          </div>

          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px] border-zinc-700 bg-zinc-900">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent className="border-zinc-700 bg-zinc-900">
              <SelectItem value="all">All remixes</SelectItem>
              <SelectItem value="recent">Recent remixes</SelectItem>
              <SelectItem value="oldest">Oldest remixes</SelectItem>
              <SelectItem value="a-z">A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto">
        <Button
          className={`rounded-full px-4 ${filter === "all" ? "bg-cyan-500 text-black" : "bg-zinc-800 text-zinc-300"}`}
        >
          All
        </Button>
        <Button className="rounded-full bg-zinc-800 px-4 text-zinc-300 hover:bg-zinc-700">Most played</Button>
        <Button className="rounded-full bg-zinc-800 px-4 text-zinc-300 hover:bg-zinc-700">Instrumental</Button>
        <Button className="rounded-full bg-zinc-800 px-4 text-zinc-300 hover:bg-zinc-700">EDM</Button>
        <Button className="rounded-full bg-zinc-800 px-4 text-zinc-300 hover:bg-zinc-700">Trap</Button>
      </div>

      <h2 className="mb-6 text-2xl font-bold">Recent Remixes</h2>

      <div className="space-y-4">
        {remixes.map((remix) => (
          <div
            key={remix.id}
            className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-4"
          >
            <div className="flex items-center gap-4">
              <img
                src={remix.image || "/placeholder.svg"}
                alt={remix.title}
                className="h-12 w-12 rounded-md object-cover"
              />
              <div>
                <h3 className="font-medium">{remix.title}</h3>
                <p className="text-sm text-zinc-500">Original: {remix.original}</p>
                <div className="mt-1 flex items-center gap-4 text-xs text-zinc-600">
                  <span>{remix.date}</span>
                  <span>{remix.duration}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-cyan-400">
                <Download className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-cyan-400">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-red-400">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mb-6 mt-12 text-2xl font-bold">Most Played Remixes</h2>

      <div className="space-y-4">
        {remixes.map((remix) => (
          <div
            key={`most-played-${remix.id}`}
            className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-4"
          >
            <div className="flex items-center gap-4">
              <img
                src={remix.image || "/placeholder.svg"}
                alt={remix.title}
                className="h-12 w-12 rounded-md object-cover"
              />
              <div>
                <h3 className="font-medium">{remix.title}</h3>
                <p className="text-sm text-zinc-500">Original: {remix.original}</p>
                <div className="mt-1 flex items-center gap-4 text-xs text-zinc-600">
                  <span>{remix.date}</span>
                  <span>{remix.duration}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-cyan-400">
                <Download className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-cyan-400">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-red-400">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
