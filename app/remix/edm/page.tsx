"use client"

import { EdmRemixStudio } from "@/components/edm-remix-studio"

export default function EdmRemixPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Professional EDM Remix Studio</h1>
      <p className="text-zinc-400 mb-8 text-center max-w-2xl mx-auto">
        Transform your audio into high-quality EDM tracks with professional sound design, 
        mastering, and effects. Create club-ready remixes with just a few clicks.
      </p>
      
      <EdmRemixStudio />
      
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="bg-zinc-900/50 p-6 rounded-lg">
          <h3 className="text-xl font-medium mb-2">Professional Quality</h3>
          <p className="text-zinc-400">
            Studio-grade mastering with proper EQ, compression, and limiting to -1dB peak.
            Output in high-quality WAV or 320kbps MP3 format.
          </p>
        </div>
        
        <div className="bg-zinc-900/50 p-6 rounded-lg">
          <h3 className="text-xl font-medium mb-2">Advanced Effects</h3>
          <p className="text-zinc-400">
            Sidechain compression, punchy kicks, deep basslines, dynamic buildups, 
            and signature EDM effects like risers and vocal chops.
          </p>
        </div>
        
        <div className="bg-zinc-900/50 p-6 rounded-lg">
          <h3 className="text-xl font-medium mb-2">Multiple Styles</h3>
          <p className="text-zinc-400">
            Choose from popular EDM subgenres like Progressive House, Future Bass, 
            Bass House, Tropical House, and Dubstep.
          </p>
        </div>
      </div>
    </div>
  )
}
