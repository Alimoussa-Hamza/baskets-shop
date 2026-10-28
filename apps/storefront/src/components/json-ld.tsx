/** Injecte du JSON-LD ; "<" est échappé pour empêcher toute sortie de la balise <script>. */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
}
