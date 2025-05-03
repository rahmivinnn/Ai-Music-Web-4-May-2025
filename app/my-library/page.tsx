"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Share2, Trash2, Search, Music, Wand2, Play } from "lucide-react"

export default function MyLibraryPage() {
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const savedItems = [
    {
      id: 1,
      title: "Neon Dreams (EDM Remix)",
      original: "Dreams by Sarah Chen",
      date: "2024-03-14",
      duration: "02:20",
      type: "remix",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/placeholder-ob7miW3mUreePYfXdVwkpFWHthzoR5.svg?height=60&width=60&query=colorful+abstract+face+with+headphones",
    },
    {
      id: 2,
      title: "Bass Overdrive",
      original: "Original Creation",
      date: "2024-03-12",
      duration: "01:45",
      type: "generated",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/placeholder-ob7miW3mUreePYfXdVwkpFWHthzoR5.svg?height=60&width=60&query=abstract+colorful+music+art",
    },
    {
      id: 3,
      title: "Midnight Cypher",
      original: "Hip-Hop Beat",
      date: "2024-03-10",
      duration: "03:15",
      type: "remix",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/placeholder-ob7miW3mUreePYfXdVwkpFWHthzoR5.svg?height=60&width=60&query=dark+night+city+neon",
    },
    {
      id: 4,
      title: "Ambient Soundscape",
      original: "Text Prompt",
      date: "2024-03-08",
      duration: "04:30",
      type: "generated",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/placeholder-ob7miW3mUreePYfXdVwkpFWHthzoR5.svg?height=60&width=60&query=abstract+ambient+waves",
    },
  ]

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Library</h1>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              type="search"
              placeholder="Search library"
              className="w-[250px] bg-zinc-900 pl-9 text-sm text-zinc-400 focus:ring-cyan-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px] border-zinc-700 bg-zinc-900">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent className="border-zinc-700 bg-zinc-900">
              <SelectItem value="all">All items</SelectItem>
              <SelectItem value="recent">Recently added</SelectItem>
              <SelectItem value="remixes">Remixes only</SelectItem>
              <SelectItem value="generated">Generated only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="all" className="text-lg py-3">
            All Items
          </TabsTrigger>
          <TabsTrigger value="remixes" className="text-lg py-3">
            <Music className="h-4 w-4 mr-2" />
            Remixes
          </TabsTrigger>
          <TabsTrigger value="generated" className="text-lg py-3">
            <Wand2 className="h-4 w-4 mr-2" />
            Generated Audio
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <div className="space-y-4">
            {savedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.title}
                      className="h-12 w-12 rounded-md object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 hover:opacity-100 transition-opacity rounded-md">
                      <Play className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium flex items-center">
                      {item.title}
                      {item.type === "remix" ? (
                        <Music className="h-4 w-4 ml-2 text-cyan-400" />
                      ) : (
                        <Wand2 className="h-4 w-4 ml-2 text-purple-400" />
                      )}
                    </h3>
                    <p className="text-sm text-zinc-500">{item.original}</p>
                    <div className="mt-1 flex items-center gap-4 text-xs text-zinc-600">
                      <span>{item.date}</span>
                      <span>{item.duration}</span>
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
        </TabsContent>

        <TabsContent value="remixes" className="mt-0">
          <div className="space-y-4">
            {savedItems
              .filter((item) => item.type === "remix")
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.title}
                        className="h-12 w-12 rounded-md object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 hover:opacity-100 transition-opacity rounded-md">
                        <Play className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium flex items-center">
                        {item.title}
                        <Music className="h-4 w-4 ml-2 text-cyan-400" />
                      </h3>
                      <p className="text-sm text-zinc-500">{item.original}</p>
                      <div className="mt-1 flex items-center gap-4 text-xs text-zinc-600">
                        <span>{item.date}</span>
                        <span>{item.duration}</span>
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
        </TabsContent>

        <TabsContent value="generated" className="mt-0">
          <div className="space-y-4">
            {savedItems
              .filter((item) => item.type === "generated")
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.title}
                        className="h-12 w-12 rounded-md object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 hover:opacity-100 transition-opacity rounded-md">
                        <Play className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium flex items-center">
                        {item.title}
                        <Wand2 className="h-4 w-4 ml-2 text-purple-400" />
                      </h3>
                      <p className="text-sm text-zinc-500">{item.original}</p>
                      <div className="mt-1 flex items-center gap-4 text-xs text-zinc-600">
                        <span>{item.date}</span>
                        <span>{item.duration}</span>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
