"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, BookOpen, BookOpenCheck, Crown, Loader2, Medal, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getAdoDuMois,
  getClassementBibliqueActuel,
  getThemeBibliqueActuel,
  listChapitresBibliques,
  listLivresBibliques,
  listQuizBibliques,
  listTraductionsBibliques,
  listVersetsBibliques,
} from "@/lib/api/biblique"
import {
  bibleTranslationOptions,
  findBibleTranslation,
  formatBibleTranslation,
} from "@/lib/bible-translations"
import type {
  AdoMisEnAvant,
  ClassementBiblique,
  LivreBiblique,
  QuizBiblique,
  ThemeBiblique,
  TraductionBiblique,
  VersetBiblique,
} from "@/lib/api/types"

export default function BibliquePage() {
  const [theme, setTheme] = useState<ThemeBiblique | null>(null)
  const [quiz, setQuiz] = useState<QuizBiblique[]>([])
  const [classement, setClassement] = useState<ClassementBiblique | null>(null)
  const [ado, setAdo] = useState<AdoMisEnAvant | null>(null)
  const [traductions, setTraductions] = useState<TraductionBiblique[]>([])
  const [livres, setLivres] = useState<LivreBiblique[]>([])
  const [chapters, setChapters] = useState<number[]>([])
  const [selectedLivreId, setSelectedLivreId] = useState("")
  const [selectedChapter, setSelectedChapter] = useState("")
  const [selectedTraduction, setSelectedTraduction] = useState("LSG")
  const [versets, setVersets] = useState<VersetBiblique[]>([])
  const [readerLoading, setReaderLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  const selectedBook = useMemo(
    () => livres.find((livre) => livre.id === selectedLivreId) ?? null,
    [livres, selectedLivreId],
  )
  const selectedTraductionInfo = useMemo(
    () => findBibleTranslation(traductions, selectedTraduction),
    [selectedTraduction, traductions],
  )

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      const [themeRes, classementRes, adoRes, traductionsRes] = await Promise.all([
        getThemeBibliqueActuel().catch(() => null),
        getClassementBibliqueActuel().catch(() => null),
        getAdoDuMois().catch(() => null),
        listTraductionsBibliques().catch(() => [] as TraductionBiblique[]),
      ])
      const quizRes = await listQuizBibliques(themeRes?.id).catch(() => [] as QuizBiblique[])
      if (!active) return
      setTheme(themeRes)
      setClassement(classementRes)
      setAdo(adoRes)
      setTraductions(traductionsRes)
      setSelectedTraduction(traductionsRes[0]?.code ?? "LSG")
      setQuiz(quizRes)
      setLoading(false)
    }
    load()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!selectedTraduction) return

    let active = true
    setLivres([])
    setChapters([])
    setVersets([])
    setSelectedLivreId("")
    setSelectedChapter("")

    listLivresBibliques(selectedTraduction)
      .then((items) => {
        if (!active) return
        setLivres(items)
        setSelectedLivreId(items[0]?.id ?? "")
      })
      .catch(() => {
        if (active) setLivres([])
      })

    return () => {
      active = false
    }
  }, [selectedTraduction])

  useEffect(() => {
    if (!selectedLivreId || !selectedTraduction) {
      setChapters([])
      setSelectedChapter("")
      return
    }

    let active = true
    setChapters([])
    setVersets([])
    setSelectedChapter("")

    listChapitresBibliques({ livreId: selectedLivreId, traduction: selectedTraduction })
      .then((items) => {
        if (!active) return
        setChapters(items)
        setSelectedChapter(items[0] ? String(items[0]) : "")
      })
      .catch(() => {
        if (active) setChapters([])
      })

    return () => {
      active = false
    }
  }, [selectedLivreId, selectedTraduction])

  useEffect(() => {
    if (!selectedLivreId || !selectedChapter || !selectedTraduction) {
      setVersets([])
      return
    }

    let active = true
    setReaderLoading(true)
    listVersetsBibliques({
      livreId: selectedLivreId,
      chapitre: Number(selectedChapter),
      traduction: selectedTraduction,
    })
      .then((items) => {
        if (active) setVersets(items)
      })
      .catch(() => {
        if (active) setVersets([])
      })
      .finally(() => {
        if (active) setReaderLoading(false)
      })

    return () => {
      active = false
    }
  }, [selectedLivreId, selectedChapter, selectedTraduction])

  return (
    <div className="px-6 pb-8 pt-6">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sprint 4</p>
        <h1 className="mt-1 text-2xl font-bold">Biblique etendu</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Challenge mensuel, quiz bibliques et classement base sur les meilleurs scores.
        </p>
      </header>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="space-y-6">
            <Card className="border-border/70">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <BookOpenCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Theme du mois
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">{theme?.titre ?? "Aucun theme actif"}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {theme?.description ?? "L'equipe admin peut publier un theme pour activer le challenge mensuel."}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {traductions.map((trad) => (
                        <Badge key={trad.code} variant="secondary">{formatBibleTranslation(trad)}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardContent className="p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <h2 className="font-semibold">Lecture biblique</h2>
                  </div>
                  <Badge variant="outline">{formatBibleTranslation(selectedTraductionInfo)}</Badge>
                </div>
                <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
                  <Select value={selectedTraduction} onValueChange={setSelectedTraduction}>
                    <SelectTrigger>
                      <SelectValue placeholder="Version" />
                    </SelectTrigger>
                    <SelectContent>
                      {bibleTranslationOptions(traductions).map((trad) => (
                        <SelectItem key={trad.code} value={trad.code}>
                          {formatBibleTranslation(trad)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedLivreId}
                    onValueChange={(value) => {
                      setSelectedLivreId(value)
                    }}
                    disabled={!selectedTraduction || livres.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Livre" />
                    </SelectTrigger>
                    <SelectContent>
                      {livres.map((livre) => (
                        <SelectItem key={livre.id} value={livre.id}>
                          {livre.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedChapter} onValueChange={setSelectedChapter} disabled={!selectedBook || chapters.length === 0}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chapitre" />
                    </SelectTrigger>
                    <SelectContent>
                      {chapters.map((chapter) => (
                        <SelectItem key={chapter} value={String(chapter)}>
                          Chapitre {chapter}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="mt-5 rounded-lg border border-border/70 bg-muted/20 p-4">
                  {readerLoading ? (
                    <div className="flex h-32 items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  ) : versets.length > 0 ? (
                    <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                      {versets.map((verset) => (
                        <p key={verset.id} className="text-sm leading-7">
                          <sup className="mr-2 rounded bg-background px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                            {verset.numero}
                          </sup>
                          {verset.texte}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                      Aucun verset disponible pour cette selection.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                <Trophy className="h-4 w-4 text-primary" />
                Quiz du challenge
              </h2>
              {quiz.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center text-sm text-muted-foreground">
                    Aucun quiz publie pour ce theme.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {quiz.map((item) => (
                    <Link
                      key={item.id}
                      href={`/biblique/quiz/${item.id}`}
                      className="group rounded-lg border border-border bg-card p-5 transition-colors hover:bg-muted/40"
                    >
                      <Badge variant="secondary">Quiz biblique</Badge>
                      <h3 className="mt-3 line-clamp-2 font-semibold">{item.titre}</h3>
                      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                        {item.description ?? "Reponds au QCM et ameliore ton meilleur score."}
                      </p>
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                        Commencer <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <Card className="border-border/70">
              <CardContent className="p-5">
                <h2 className="mb-4 flex items-center gap-2 font-semibold">
                  <Medal className="h-4 w-4 text-primary" />
                  Classement
                </h2>
                {classement ? (
                  <div className="space-y-3">
                    {classement.entrees.slice(0, 10).map((entry) => (
                      <div key={entry.user_id} className="flex items-center gap-3 rounded-lg border border-border/70 p-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-bold">
                          {entry.rang}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">@{entry.username}</p>
                          <p className="text-xs text-muted-foreground">
                            {entry.score_total} pts - {entry.nb_quiz_completes} quiz
                          </p>
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Ton rang: {classement.mon_rang ?? "pas encore classe"}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Classement indisponible sans theme actif.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardContent className="p-5">
                <h2 className="mb-4 flex items-center gap-2 font-semibold">
                  <Crown className="h-4 w-4 text-primary" />
                  Ado mis en avant
                </h2>
                {ado ? (
                  <div className="space-y-2">
                    <p className="font-semibold">@{ado.username}</p>
                    <p className="text-sm leading-6 text-muted-foreground">{ado.description}</p>
                    <Badge variant="secondary">{ado.mois}/{ado.annee}</Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun ado mis en avant ce mois-ci.</p>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
    </div>
  )
}
