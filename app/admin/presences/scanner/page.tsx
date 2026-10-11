"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import useSWR from "swr"
import { BarcodeDetector, prepareZXingModule } from "barcode-detector/ponyfill"
import { ArrowLeft, Check, Search, VideoOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  chercherAdos,
  cocherAdo,
  estErreurReseau,
  messageErreurPresence,
  reunionAujourdhui,
  scannerCode,
  type EnregistrementPresence,
} from "@/lib/api/presences"
import { cn } from "@/lib/utils"

type Bandeau = { type: "ok" | "deja" | "erreur"; texte: string }

// Lecteur ZXing C++ (WebAssembly) servi par l'app elle-même : pas de CDN externe, et il lit
// des QR que la version JavaScript de ZXing rate (constaté sur ~1 code sur 30).
prepareZXingModule({
  overrides: {
    locateFile: (chemin: string, prefixe: string) =>
      chemin.endsWith(".wasm") ? `/zxing/${chemin}` : prefixe + chemin,
  },
})

const INTERVALLE_LECTURE_MS = 150

const DELAI_MEME_CODE_MS = 3000
const DUREE_BANDEAU_MS = 2000

function accord(prenom: string, nom: string) {
  return `${prenom} ${nom}`
}

function messageCamera(err: unknown): string {
  if (typeof navigator !== "undefined" && !navigator.mediaDevices) {
    return "La caméra n'est disponible que sur une adresse sécurisée (https). Vous pouvez chercher l'ado par son nom."
  }
  const nom = (err as { name?: string } | undefined)?.name
  if (nom === "NotAllowedError") {
    return "L'accès à la caméra est refusé. Autorisez la caméra pour ce site dans les réglages du navigateur, ou cherchez l'ado par son nom."
  }
  if (nom === "NotFoundError" || nom === "OverconstrainedError") {
    return "Aucune caméra trouvée sur cet appareil. Vous pouvez chercher l'ado par son nom."
  }
  return "Impossible d'ouvrir la caméra. Vous pouvez chercher l'ado par son nom."
}

export default function ScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const dernierCode = useRef<{ code: string; a: number } | null>(null)
  const occupe = useRef(false)
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [bandeau, setBandeau] = useState<Bandeau | null>(null)
  const [nbPresents, setNbPresents] = useState<number | null>(null)
  const [reunionId, setReunionId] = useState<string | null>(null)
  const [erreurCamera, setErreurCamera] = useState<string | null>(null)
  const [rechercheOuverte, setRechercheOuverte] = useState(false)
  const [q, setQ] = useState("")
  const [qDiffere, setQDiffere] = useState("")

  const { data: aujourdhui } = useSWR("presences-aujourdhui", reunionAujourdhui)
  const total = nbPresents ?? aujourdhui?.nb_presents ?? 0
  const idReunion = reunionId ?? aujourdhui?.id ?? null

  const { data: resultats, mutate: rafraichirResultats } = useSWR(
    rechercheOuverte && qDiffere.trim().length >= 2 ? ["presences-ados", qDiffere] : null,
    () => chercherAdos(qDiffere),
  )

  useEffect(() => {
    const t = setTimeout(() => setQDiffere(q), 250)
    return () => clearTimeout(t)
  }, [q])

  function afficher(b: Bandeau) {
    setBandeau(b)
    if (minuteur.current) clearTimeout(minuteur.current)
    minuteur.current = setTimeout(() => setBandeau(null), DUREE_BANDEAU_MS)
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(b.type === "ok" ? 80 : [60, 60, 60])
    }
  }

  function afficherResultat(r: EnregistrementPresence) {
    setNbPresents(r.reunion.nb_presents)
    setReunionId(r.reunion.id)
    const nom = accord(r.ado.prenom, r.ado.nom)
    afficher(
      r.statut === "present"
        ? { type: "ok", texte: `✓ ${nom}, présent(e)` }
        : { type: "deja", texte: `${nom} est déjà marqué(e) présent(e)` },
    )
  }

  async function traiterCode(code: string) {
    const maintenant = Date.now()
    const dernier = dernierCode.current
    if (occupe.current) return
    if (dernier && dernier.code === code && maintenant - dernier.a < DELAI_MEME_CODE_MS) return
    dernierCode.current = { code, a: maintenant }
    occupe.current = true
    try {
      afficherResultat(await scannerCode(code))
    } catch (err) {
      // Sur une coupure réseau, on autorise à rescanner tout de suite le même code.
      if (estErreurReseau(err)) dernierCode.current = null
      afficher({ type: "erreur", texte: messageErreurPresence(err) })
    } finally {
      occupe.current = false
    }
  }

  // La boucle de lecture garde la première version de traiterCode : on passe par une ref.
  const traiterCodeRef = useRef(traiterCode)
  traiterCodeRef.current = traiterCode

  // Démarrages et arrêts de la caméra enchaînés : un lecteur précédent (effet relancé par
  // React) doit être totalement arrêté avant d'ouvrir la caméra sur le même élément vidéo,
  // sinon son arrêt tardif met la vidéo en pause et plus rien n'est lu.
  const fileCamera = useRef<Promise<void>>(Promise.resolve())

  useEffect(() => {
    let annule = false
    let flux: MediaStream | null = null
    let prochaineLecture: ReturnType<typeof setTimeout> | null = null
    const video = videoRef.current
    if (!video) return
    const detecteur = new BarcodeDetector({ formats: ["qr_code"] })

    const cameraActive = () =>
      !!flux && flux.getVideoTracks().some((piste) => piste.readyState === "live")

    const ouvrirCamera = async () => {
      if (annule) return
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("camera-indisponible")
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        })
        if (annule) {
          s.getTracks().forEach((piste) => piste.stop())
          return
        }
        flux?.getTracks().forEach((piste) => piste.stop())
        flux = s
        // Écran verrouillé, autre appli… : Chrome coupe la caméra. On la relance au retour.
        s.getVideoTracks().forEach((piste) => {
          piste.onended = () => {
            if (!annule && document.visibilityState === "visible") relancer()
          }
        })
        video.srcObject = s
        await video.play()
        setErreurCamera(null)
      } catch (err) {
        if (!annule) setErreurCamera(messageCamera(err))
      }
    }

    const relancer = () => {
      fileCamera.current = fileCamera.current.then(ouvrirCamera)
    }

    const auRetour = () => {
      if (document.visibilityState === "visible" && !cameraActive()) relancer()
    }

    const lire = async () => {
      if (annule) return
      if (cameraActive() && video.readyState >= 2) {
        try {
          const texte = (await detecteur.detect(video))[0]?.rawValue
          if (texte) void traiterCodeRef.current(texte)
        } catch {
          // Image illisible ou lecteur en cours de chargement : on réessaie au tour suivant.
        }
      }
      prochaineLecture = setTimeout(lire, INTERVALLE_LECTURE_MS)
    }

    relancer()
    void lire()
    document.addEventListener("visibilitychange", auRetour)
    return () => {
      annule = true
      document.removeEventListener("visibilitychange", auRetour)
      if (prochaineLecture) clearTimeout(prochaineLecture)
      flux?.getTracks().forEach((piste) => piste.stop())
      if (minuteur.current) clearTimeout(minuteur.current)
    }
  }, [])

  async function cocher(userId: string) {
    try {
      afficherResultat(await cocherAdo(userId))
      await rafraichirResultats()
    } catch (err) {
      afficher({ type: "erreur", texte: messageErreurPresence(err) })
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-4">
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/presences">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Présences
          </Link>
        </Button>
        <span className="text-sm font-semibold" aria-live="polite">
          {total} présent{total > 1 ? "s" : ""}
        </span>
      </div>

      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-black">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
          aria-label="Caméra du scanner"
        />
        {erreurCamera ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-neutral-900 p-6 text-center text-sm text-white">
            <VideoOff className="h-8 w-8" />
            <p>{erreurCamera}</p>
          </div>
        ) : (
          <div className="pointer-events-none absolute inset-[18%] rounded-2xl border-2 border-white/80" />
        )}
        {bandeau ? (
          <div
            role="status"
            className={cn(
              "absolute inset-x-3 top-3 rounded-xl px-4 py-3 text-center text-base font-semibold shadow-lg",
              bandeau.type === "ok" && "bg-emerald-600 text-white",
              bandeau.type === "deja" && "bg-amber-400 text-amber-950",
              bandeau.type === "erreur" && "bg-red-600 text-white",
            )}
          >
            {bandeau.texte}
          </div>
        ) : null}
      </div>

      <p className="text-muted-foreground text-center text-sm">
        Visez le QR de l&apos;ado : il est enregistré tout seul, passez au suivant.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant={rechercheOuverte ? "secondary" : "outline"}
          size="lg"
          onClick={() => setRechercheOuverte((o) => !o)}
        >
          <Search className="mr-2 h-4 w-4" />
          Chercher un ado
        </Button>
        <Button asChild size="lg">
          <Link href={idReunion ? `/admin/presences/${idReunion}` : "/admin/presences"}>
            Terminer
          </Link>
        </Button>
      </div>

      {rechercheOuverte ? (
        <div className="flex flex-col gap-3 rounded-2xl border p-3">
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Prénom ou nom (ex. : Lea, Fall)"
            aria-label="Chercher un ado par son nom"
          />
          {qDiffere.trim().length < 2 ? (
            <p className="text-muted-foreground px-1 text-sm">Tapez au moins 2 lettres.</p>
          ) : resultats && resultats.length === 0 ? (
            <p className="text-muted-foreground px-1 text-sm">Aucun ado trouvé.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {(resultats ?? []).map((ado) => (
                <li key={ado.id} className="flex items-center gap-3 rounded-xl border px-3 py-2">
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{accord(ado.prenom, ado.nom)}</span>
                    <span className="text-muted-foreground truncate text-xs">@{ado.username}</span>
                  </span>
                  {ado.deja_present ? (
                    <span className="flex items-center gap-1 text-sm font-medium text-emerald-700">
                      <Check className="h-4 w-4" /> Présent(e)
                    </span>
                  ) : (
                    <Button size="sm" onClick={() => void cocher(ado.id)}>
                      Marquer présent
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
