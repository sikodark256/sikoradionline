import { RadioPlayer } from "@/components/radio-player"
import { RecentTracks } from "@/components/recent-tracks"

export default function Page() {
  return (
    <main className="min-h-dvh w-full px-4 py-6 sm:px-6 sm:py-10 lg:px-10 lg:py-12 xl:px-16 2xl:px-24">
      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-8 lg:gap-10">
        {/* Layout principal:
            - Móvil/Tablet: todo apilado verticalmente
            - Desktop/TV: reproductor a la izquierda (fijo), recientes a la derecha (crece)
        */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-10 xl:grid-cols-[minmax(0,480px)_1fr] xl:gap-12 2xl:grid-cols-[minmax(0,520px)_1fr]">
          {/* Columna izquierda: Reproductor */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <RadioPlayer />
          </div>

          {/* Columna derecha: Canciones recientes */}
          <div className="min-w-0">
            <RecentTracks />
          </div>
        </div>

        <footer className="pt-2 text-center font-mono text-xs text-muted-foreground sm:text-sm">
          sikodark radio — PWA responsiva para celular, PC y TV
        </footer>
      </div>
    </main>
  )
}
