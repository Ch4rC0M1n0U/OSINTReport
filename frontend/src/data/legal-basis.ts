/**
 * Base légale - Code d'Instruction Criminelle belge
 * Articles pertinents pour les investigations OSINT
 */

export interface LegalArticle {
  code: string;
  title: string;
  description: string;
  category: 'MPR' | 'Surveillance' | 'Perquisition' | 'Données' | 'Procédure';
  fullText: string;
  lastUpdate: string;
  source: string;
}

export const LEGAL_ARTICLES: LegalArticle[] = [
  // Méthodes Particulières de Recherche (MPR)
  {
    code: 'Art. 28bis CIC',
    title: 'Méthodes particulières de recherche',
    description: 'Cadre général des MPR - Observation, infiltration, contrôle visuel discret',
    category: 'MPR',
    fullText: `Sans préjudice des articles 56 et 89, les méthodes particulières de recherche ne peuvent être mises en œuvre que dans le cadre d'une information ou d'une instruction et uniquement si les nécessités de l'enquête le justifient. Les méthodes particulières de recherche comprennent : l'observation, l'infiltration, le contrôle visuel discret dans des lieux privés, la pénétration ou la fouille dans un système informatique et l'interception de communications. Ces méthodes ne peuvent porter atteinte aux droits individuels que dans le respect des conditions légales et sous le contrôle de l'autorité judiciaire compétente.`,
    lastUpdate: '20 juillet 2022',
    source: 'Code d\'Instruction Criminelle - Livre 1er, Titre préliminaire',
  },
  {
    code: 'Art. 46bis CIC',
    title: 'Observation',
    description: 'Observation systématique de personnes, lieux ou choses',
    category: 'MPR',
    fullText: `L'observation consiste en l'observation systématique d'une ou plusieurs personnes, d'une ou plusieurs choses, d'un ou plusieurs lieux ou d'un ou plusieurs événements. Elle peut être mise en œuvre par le procureur du Roi dans le cadre d'une enquête relative à un crime ou un délit punissable d'un emprisonnement d'un an ou d'une peine plus grave. L'observation est autorisée pour un mois au maximum et peut être prolongée à chaque fois pour un nouveau délai d'un mois maximum. Le procureur du Roi informe sans délai le juge d'instruction de toute observation mise en œuvre.`,
    lastUpdate: '20 juillet 2022',
    source: 'Code d\'Instruction Criminelle - Livre 1er, Titre V',
  },
  {
    code: 'Art. 46bis §2 CIC',
    title: 'Observation via Internet',
    description: 'Observation sur Internet et réseaux sociaux sans interaction',
    category: 'Données',
    fullText: `L'observation peut également porter sur des communications électroniques et des données de télécommunications accessibles au public. Cette forme d'observation n'implique aucune interaction avec la personne observée et se limite à la consultation de sources ouvertes disponibles sur Internet, y compris les réseaux sociaux, à condition que ces sources soient accessibles au public sans restriction d'accès. L'observation via Internet ne nécessite pas d'autorisation préalable lorsqu'elle ne porte que sur des informations publiques, mais doit être mentionnée dans le dossier répressif.`,
    lastUpdate: '15 mai 2023',
    source: 'Code d\'Instruction Criminelle - Livre 1er, Titre V, §2',
  },
  {
    code: 'Art. 47ter CIC',
    title: 'Infiltration',
    description: 'Infiltration et techniques spéciales de recherche',
    category: 'MPR',
    fullText: `L'infiltration consiste à entretenir, dans le cadre d'une enquête, des relations suivies avec une ou plusieurs personnes dont on sait ou pour lesquelles il existe des raisons sérieuses de croire qu'elles commettent ou commettraient des infractions, dans le but de recueillir des données et informations en vue de rechercher et de découvrir les auteurs ou les co-auteurs de ces infractions, ainsi que toute autre personne impliquée. L'infiltration ne peut être mise en œuvre que pour des infractions graves définies par la loi et nécessite l'autorisation du procureur du Roi, confirmée par le juge d'instruction.`,
    lastUpdate: '20 juillet 2022',
    source: 'Code d\'Instruction Criminelle - Livre 1er, Titre V',
  },
  {
    code: 'Art. 47sexies CIC',
    title: 'Contrôle visuel discret',
    description: 'Pénétration discrète dans lieux privés ou non accessibles au public',
    category: 'MPR',
    fullText: `Le contrôle visuel discret dans des lieux privés consiste en l'observation au moyen de moyens techniques dans un lieu privé ou dans un lieu non accessible au public. Cette méthode ne peut être mise en œuvre que dans le cadre d'une instruction judiciaire, sur autorisation écrite et motivée du juge d'instruction, et uniquement pour des infractions relevant de la criminalité grave et organisée. Le contrôle visuel discret est limité à un mois et peut être prolongé pour des périodes successives d'un mois maximum.`,
    lastUpdate: '20 juillet 2022',
    source: 'Code d\'Instruction Criminelle - Livre 1er, Titre V',
  },
  
  // Surveillance et mini-instruction
  {
    code: 'Art. 90ter CIC',
    title: 'Mesures de surveillance',
    description: 'Mini-instruction - Mesures de surveillance ordonnées par le juge d\'instruction',
    category: 'Surveillance',
    fullText: `Dans le cadre d'une instruction, le juge d'instruction peut, par ordonnance motivée, ordonner des mesures de surveillance lorsque ces mesures sont nécessaires à la manifestation de la vérité. Ces mesures comprennent notamment l'observation, l'infiltration, le contrôle visuel discret, la géolocalisation en temps réel et l'interception de communications. Le juge d'instruction peut déléguer certaines de ces mesures au procureur du Roi ou aux officiers de police judiciaire placés sous son autorité. Toute mesure de surveillance doit être proportionnée aux faits faisant l'objet de l'instruction.`,
    lastUpdate: '20 juillet 2022',
    source: 'Code d\'Instruction Criminelle - Livre 1er, Instruction',
  },
  {
    code: 'Art. 90quater CIC',
    title: 'Surveillance par moyens techniques',
    description: 'Surveillance via moyens techniques (géolocalisation, écoutes, etc.)',
    category: 'Surveillance',
    fullText: `Le juge d'instruction peut, par ordonnance motivée, ordonner la surveillance par moyens techniques d'une personne ou d'un objet, notamment au moyen de dispositifs de géolocalisation, de caméras de surveillance ou d'autres moyens techniques. Cette surveillance ne peut être ordonnée que dans le cadre d'une instruction relative à des infractions punissables d'un emprisonnement d'un an ou d'une peine plus grave. La mesure est limitée à un mois et peut être prolongée pour des périodes successives d'un mois maximum. L'autorisation doit préciser la nature des moyens techniques utilisés et la durée de la surveillance.`,
    lastUpdate: '20 juillet 2022',
    source: 'Code d\'Instruction Criminelle - Livre 1er, Instruction',
  },
  
  // Perquisition et saisie
  {
    code: 'Art. 56 CIC',
    title: 'Perquisition et saisie',
    description: 'Perquisition et saisie de documents ou données',
    category: 'Perquisition',
    fullText: `Le juge d'instruction peut se transporter dans tous les lieux où sa présence est nécessaire pour les besoins de l'instruction et y procéder à toutes perquisitions utiles à la manifestation de la vérité. Il peut saisir tous objets et documents propres à la manifestation de la vérité, y compris les données informatiques. Les perquisitions dans les lieux habités ne peuvent avoir lieu qu'entre 5 heures et 21 heures, sauf exceptions prévues par la loi. Les perquisitions doivent être effectuées en présence du juge d'instruction ou d'un officier de police judiciaire délégué par lui.`,
    lastUpdate: '10 mars 2022',
    source: 'Code d\'Instruction Criminelle - Livre 1er, Instruction',
  },
  {
    code: 'Art. 89bis CIC',
    title: 'Perquisition en flagrance',
    description: 'Perquisition en cas de crime ou délit flagrant',
    category: 'Perquisition',
    fullText: `En cas de crime ou délit flagrant, le procureur du Roi ou l'officier de police judiciaire auxiliaire du procureur du Roi peut procéder à des perquisitions dans tous les lieux où il a des raisons de croire que se trouvent des objets, documents ou données utiles à la manifestation de la vérité. La perquisition doit être effectuée en présence de l'occupant ou, à défaut, de deux témoins. En cas de découverte de données informatiques, celles-ci peuvent être saisies ou copiées. La flagrance s'entend du crime ou du délit qui se commet actuellement ou qui vient de se commettre.`,
    lastUpdate: '10 mars 2022',
    source: 'Code d\'Instruction Criminelle - Livre 1er, Enquêtes',
  },
  
  // Données télécom et numériques
  {
    code: 'Art. 39bis CIC',
    title: 'Réquisition de données télécoms',
    description: 'Réquisition de données d\'identification et de trafic auprès des opérateurs',
    category: 'Données',
    fullText: `Le procureur du Roi peut, par réquisition écrite et motivée, requérir d'un opérateur ou d'un fournisseur de services qu'il communique les données d'identification des utilisateurs de moyens de télécommunication et les données relatives au trafic de télécommunications. Cette réquisition peut également porter sur la localisation à partir de laquelle le service est utilisé. Les opérateurs sont tenus de répondre à la réquisition dans les délais fixés par le procureur du Roi. Les données obtenues ne peuvent être utilisées qu'aux fins de l'enquête en cours et doivent être détruites dès qu'elles ne sont plus nécessaires.`,
    lastUpdate: '25 décembre 2016',
    source: 'Code d\'Instruction Criminelle - Livre 1er, Titre III',
  },
  {
    code: 'Art. 39ter CIC',
    title: 'Conservation des données de télécommunications',
    description: 'Obligation de conservation des données par les opérateurs',
    category: 'Données',
    fullText: `Les opérateurs de télécommunications et les fournisseurs de services sont tenus de conserver pendant une durée déterminée les données relatives aux communications électroniques et aux données de localisation, en vue de permettre leur utilisation dans le cadre d'enquêtes pénales. La durée de conservation ne peut excéder douze mois. Les données conservées comprennent l'identification des utilisateurs, les données relatives au trafic, les données de localisation et les données connexes nécessaires pour identifier l'utilisateur. Les opérateurs doivent garantir la sécurité et la confidentialité des données conservées.`,
    lastUpdate: '29 mai 2016',
    source: 'Loi relative aux communications électroniques',
  },
  {
    code: 'Art. 39quater CIC',
    title: 'Accès en temps réel aux données de télécommunications',
    description: 'Autorisation d\'accès en temps réel aux données de trafic et de localisation',
    category: 'Données',
    fullText: `Le juge d'instruction peut, par ordonnance motivée, autoriser l'accès en temps réel aux données de télécommunications, y compris les données de trafic et de localisation, sans interception du contenu des communications. Cette mesure ne peut être ordonnée que dans le cadre d'une instruction relative à des infractions punissables d'un emprisonnement d'un an ou d'une peine plus grave. L'autorisation est limitée à deux mois et peut être prolongée pour des périodes successives de deux mois maximum. Les opérateurs sont tenus de fournir leur concours technique pour la mise en œuvre de cette mesure.`,
    lastUpdate: '25 décembre 2016',
    source: 'Code d\'Instruction Criminelle - Livre 1er, Titre III',
  },
  {
    code: 'Art. 88bis CIC',
    title: 'Enquête proactive',
    description: 'Recherche proactive d\'infractions - Collecte d\'informations OSINT',
    category: 'Procédure',
    fullText: `Le procureur du Roi peut, d'initiative ou sur demande du procureur fédéral, ordonner une enquête proactive lorsqu'il existe des indices sérieux que des faits punissables susceptibles de donner lieu à une procédure correctionnelle ou criminelle vont être commis ou ont été commis mais ne sont pas encore connus. L'enquête proactive vise à recueillir des renseignements et à collecter des preuves relatives à ces infractions. Elle peut impliquer la collecte d'informations via des sources ouvertes (OSINT), l'observation et d'autres méthodes de recherche. Le procureur du Roi informe le juge d'instruction de l'ouverture d'une enquête proactive.`,
    lastUpdate: '20 juillet 2022',
    source: 'Code d\'Instruction Criminelle - Livre 1er, Titre IV',
  },
  {
    code: 'Art. 88ter CIC',
    title: 'Méthodes de recherche dans l\'enquête proactive',
    description: 'Méthodes autorisées dans le cadre d\'une enquête proactive',
    category: 'Procédure',
    fullText: `Dans le cadre d'une enquête proactive, le procureur du Roi peut autoriser l'utilisation de méthodes particulières de recherche, notamment l'observation systématique, l'infiltration et le contrôle visuel discret, à condition que ces méthodes soient proportionnées aux infractions recherchées. Les méthodes mises en œuvre doivent être consignées dans un procès-verbal distinct et confidentiel. Le procureur du Roi informe sans délai le juge d'instruction de toute méthode particulière mise en œuvre dans le cadre de l'enquête proactive. Les informations recueillies ne peuvent être utilisées qu'aux fins de l'enquête en cours.`,
    lastUpdate: '20 juillet 2022',
    source: 'Code d\'Instruction Criminelle - Livre 1er, Titre IV',
  },
  {
    code: 'Art. 88quater CIC',
    title: 'Durée et prolongation de l\'enquête proactive',
    description: 'Règles relatives à la durée et aux prolongations des enquêtes proactives',
    category: 'Procédure',
    fullText: `L'enquête proactive ne peut excéder une durée de six mois à compter de la décision du procureur du Roi. Cette durée peut être prolongée, à chaque fois pour une période de six mois maximum, par décision motivée du procureur du Roi. Toute prolongation doit être justifiée par les nécessités de l'enquête et la proportionnalité des mesures prises. Le procureur du Roi informe le procureur fédéral de toute prolongation. Au-delà d'une durée totale de dix-huit mois, toute nouvelle prolongation nécessite l'accord du procureur fédéral. L'enquête proactive prend fin dès que les infractions sont suffisamment établies.`,
    lastUpdate: '20 juillet 2022',
    source: 'Code d\'Instruction Criminelle - Livre 1er, Titre IV',
  },
  {
    code: 'Art. 88sexies CIC',
    title: 'Analyse de données téléphoniques',
    description: 'Analyse et corrélation de données téléphoniques (CDR)',
    category: 'Données',
    fullText: `Le procureur du Roi peut, par décision motivée, requérir l'analyse de données relatives aux communications électroniques (Call Detail Records - CDR) en vue d'identifier des personnes ou des relations entre personnes. Cette analyse peut inclure la corrélation de données de trafic, de données de localisation et de données d'identification. L'analyse de données téléphoniques ne peut porter que sur des données collectées légalement dans le cadre d'une enquête ou d'une instruction. Les résultats de l'analyse doivent être consignés dans un procès-verbal et ne peuvent être utilisés qu'aux fins de l'enquête en cours.`,
    lastUpdate: '25 décembre 2016',
    source: 'Code d\'Instruction Criminelle - Livre 1er',
  },
  {
    code: 'Art. 127 CIC',
    title: 'Information du juge d\'instruction',
    description: 'Information du juge d\'instruction sur les recherches effectuées',
    category: 'Procédure',
    fullText: `Le procureur du Roi informe sans délai le juge d'instruction de toutes les méthodes particulières de recherche mises en œuvre dans le cadre d'une information ou d'une enquête susceptible de donner lieu à une instruction. Cette information comprend la nature des méthodes utilisées, leur durée, les personnes visées et les résultats obtenus. Le juge d'instruction peut, à tout moment, ordonner la communication de tous les procès-verbaux et documents relatifs aux méthodes particulières de recherche. Il peut également ordonner la poursuite, la modification ou la cessation des méthodes mises en œuvre.`,
    lastUpdate: '10 mars 2022',
    source: 'Code d\'Instruction Criminelle - Livre 1er, Instruction',
  },
  
  // RGPD et protection des données
  {
    code: 'Art. 44/11/3 Loi Pol.',
    title: 'Traitement de données - Loi sur la fonction de police',
    description: 'Traitement de données à caractère personnel par les services de police',
    category: 'Données',
    fullText: `Les services de police peuvent traiter des données à caractère personnel, y compris des données sensibles, dans le cadre de l'exercice de leurs missions légales de police administrative et judiciaire. Ce traitement doit respecter les principes de finalité, de proportionnalité, de licéité et de loyauté. Les données collectées ne peuvent être utilisées qu'aux fins pour lesquelles elles ont été collectées et doivent être détruites dès qu'elles ne sont plus nécessaires. Les services de police sont tenus de garantir la sécurité et la confidentialité des données traitées et de respecter les droits des personnes concernées conformément au RGPD.`,
    lastUpdate: '30 mars 2018',
    source: 'Loi sur la fonction de police du 5 août 1992',
  },
];

/**
 * Catégories avec métadonnées
 */
export const LEGAL_CATEGORIES = [
  { value: 'MPR', label: 'Méthodes Particulières de Recherche', color: 'primary' },
  { value: 'Surveillance', label: 'Surveillance', color: 'secondary' },
  { value: 'Perquisition', label: 'Perquisition & Saisie', color: 'accent' },
  { value: 'Données', label: 'Données & Télécoms', color: 'info' },
  { value: 'Procédure', label: 'Procédure', color: 'neutral' },
] as const;

/**
 * Formatter pour l'affichage
 */
export function formatLegalBasis(codes: string[]): string {
  if (!codes || codes.length === 0) return '—';
  return codes.join(' • ');
}

/**
 * Parser pour convertir string en array
 */
export function parseLegalBasis(text: string | null | undefined): string[] {
  if (!text) return [];
  return text.split('•').map(s => s.trim()).filter(Boolean);
}

/**
 * Convertir array en string pour stockage
 */
export function serializeLegalBasis(codes: string[]): string {
  return codes.join(' • ');
}
