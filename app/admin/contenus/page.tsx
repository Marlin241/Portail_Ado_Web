import { redirect } from "next/navigation"

// L'espace Contenus s'ouvre sur l'onglet Livres.
export default function ContenusPage() {
  redirect("/admin/livres")
}
