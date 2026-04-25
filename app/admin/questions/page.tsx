import { ComingSoonModule } from "@/components/admin/coming-soon-module"

export default function AdminQuestionsPage() {
  return (
    <ComingSoonModule
      title="Questions anonymes"
      description="Traitez les questions posées anonymement par les jeunes et publiez les réponses validées."
      features={[
        "Boîte de réception des questions anonymes",
        "Affectation à un pasteur ou mentor",
        "Rédaction + validation de la réponse",
        "Publication dans la rubrique Q&R de l'app",
        "Catégorisation par thème (foi, relations, identité...)",
      ]}
      backendStatus="Les endpoints /questions (soumission anonyme, file de modération, réponses) ne sont pas encore livrés. Ce module sera activé dès qu'ils seront disponibles."
      sprint="Sprint 3 - module Questions & Réponses"
    />
  )
}
