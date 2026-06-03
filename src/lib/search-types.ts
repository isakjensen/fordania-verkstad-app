/** Delad typ för den globala söken (används av server-action + klientkomponent). */
export type SearchGroup = "vehicle" | "customer" | "job";

export interface SearchHit {
  id: string;
  group: SearchGroup;
  /** Primär etikett, t.ex. reg.nr eller kundnamn. */
  title: string;
  /** Sekundär rad, t.ex. märke/modell eller telefonnummer. */
  subtitle: string;
  /** Vart träffen leder. */
  href: string;
}
