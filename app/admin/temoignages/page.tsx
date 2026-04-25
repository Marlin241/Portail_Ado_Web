import { ComingSoonModule } from "@/components/admin/coming-soon-module"

export default function AdminTemoignagesPage() {
  return (
    <ComingSoonModule
      title="Modération des témoignages"
      description="Validez ou refusez les témoignages soumis par les jeunes avant publication dans l'app."
      features={[
        "Liste des témoignages en attente de modération",
        "Aperçu texte + média joint",
        "Approbation / refus avec motif",
        "Historique des témoignages publiés",
        "Signalements communautaires à traiter",
      ]}
      backendStatus="Les endpoints /temoignages (soumission côté user + modération côté admin) ne sont pas encore livrés. Ce module sera activé dès qu'ils seront disponibles."
      sprint="Sprint 2 - module Témoignages"
    />
  )
}
