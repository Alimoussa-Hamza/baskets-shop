// Pages légales : BROUILLONS. Les textes (mentions légales, CGV, confidentialité, cookies, médiateur, livraison
// et retours) dépendent du statut juridique et doivent être rédigés puis relus par un professionnel.
export function LegalDraft({ title }: { title: string }) {
  return (
    <article className="max-w-2xl">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p role="note" className="mt-6 rounded-[8px] border border-line bg-white p-4 text-sm text-muted">
        Brouillon : ce texte reste à rédiger et à faire relire par un professionnel avant l'ouverture du site.
        Il dépend notamment du statut juridique, qui n'est pas encore choisi.
      </p>
    </article>
  )
}
