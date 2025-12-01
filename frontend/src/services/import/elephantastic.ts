/**
 * 🐘 Service d'import Elephantastic
 * 
 * Convertit les exports JSON d'Elephantastic en Findings
 * pour les modules PlatformAnalysis.
 */

import type { Finding, Source, ConfidenceLevel } from '../api/reports';

// ============================================================================
// TYPES ELEPHANTASTIC
// ============================================================================

/**
 * Structure générique d'un enregistrement Elephantastic
 */
export interface ElephantasticRecord {
  schema: string; // "UserAccount", "CallerID", etc.
  collection: string; // "Snapchat", "Google", "HLRLookup", "Eyecon", etc.
  label: string;
  created_at: string;
  category_id?: string; // "social", "personal", "technical", "threat"
  identifiers?: string[];
  phones?: string[];
  emails?: string[];
  names?: string[];
  usernames?: string[];
  countries?: string[];
  urls?: string[];
  hostnames?: string[]; // Pour les breaches (domaines)
  passphrases?: string[]; // Pour les breaches (mots de passe exposés)
  date?: {
    last_update?: string[];
  };
  original?: Record<string, any>; // Données brutes de la plateforme
}

/**
 * Données Snapchat spécifiques
 */
export interface SnapchatOriginal {
  user_id: string; // UUID Snapchat (snapid)
  username: string;
  mutable_username?: string;
  display_name?: string;
  bitmoji_avatar_id?: string;
  bitmoji_selfie_id?: string;
  tier?: number;
  encoded_avatar_metadata?: string;
}

/**
 * Données Google spécifiques
 */
export interface GoogleOriginal {
  gaiaid: string; // Google Account ID
  email: string;
  username?: string;
  profile_pic_url?: string;
  result?: {
    PROFILE_CONTAINER?: {
      profile?: {
        personId?: string;
        emails?: Record<string, { value: string }>;
        profilePhotos?: Record<string, { url: string; isDefault: boolean }>;
        coverPhotos?: Record<string, { url: string; isDefault: boolean }>;
        profileInfos?: Record<string, { userTypes: string[] }>;
        sourceIds?: Record<string, { lastUpdated: string }>;
        extendedData?: {
          gplusData?: { isEntrepriseUser: boolean };
          dynamiteData?: { entityType: string; dndState: string; presence: string };
        };
      };
    };
  };
}

/**
 * Données Facebook spécifiques
 */
export interface FacebookOriginal {
  uid?: string;
  id?: string;
  name?: string;
  username?: string;
  profile_url?: string;
  profile_pic?: string;
  cover_photo?: string;
  gender?: string;
  locale?: string;
  birthday?: string;
  location?: string;
  hometown?: string;
  work?: any[];
  education?: any[];
  relationship_status?: string;
}

/**
 * Données Instagram spécifiques
 */
export interface InstagramOriginal {
  pk?: string; // Instagram user ID
  username?: string;
  full_name?: string;
  biography?: string;
  profile_pic_url?: string;
  is_private?: boolean;
  is_verified?: boolean;
  follower_count?: number;
  following_count?: number;
  media_count?: number;
  external_url?: string;
}

/**
 * Données Twitter/X spécifiques
 */
export interface TwitterOriginal {
  id_str?: string;
  screen_name?: string;
  name?: string;
  description?: string;
  profile_image_url_https?: string;
  profile_banner_url?: string;
  verified?: boolean;
  followers_count?: number;
  friends_count?: number;
  statuses_count?: number;
  created_at?: string;
  location?: string;
  url?: string;
}

/**
 * Données LinkedIn spécifiques
 */
export interface LinkedInOriginal {
  public_id?: string;
  urn_id?: string;
  first_name?: string;
  last_name?: string;
  headline?: string;
  summary?: string;
  profile_picture_url?: string;
  location?: string;
  industry?: string;
  connections?: number;
}

/**
 * Données Telegram spécifiques
 */
export interface TelegramOriginal {
  user_id?: number | string;
  username?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  photo_url?: string;
  is_bot?: boolean;
  is_premium?: boolean;
}

/**
 * Données HLR Lookup spécifiques
 */
export interface HLROriginal {
  phone?: string;
  detected_telephone_number?: string;
  telephone_number_type?: string; // "MOBILE", "LANDLINE", etc.
  live_status?: string; // "DEAD", "LIVE", "UNKNOWN"
  is_ported?: string; // "YES", "NO"
  ported_date?: string;
  error?: string;
  timestamp?: string; // Date de vérification
  version?: number;
  current_network?: string; // "AVAILABLE", "NOT_AVAILABLE"
  original_network?: string;
  current_network_details?: {
    mccmnc?: string;
    country_prefix?: string;
    country_name?: string;
    country_iso3?: string;
    name?: string; // Nom de l'opérateur
    area?: string;
  };
  original_network_details?: {
    mccmnc?: string;
    country_prefix?: string;
    country_name?: string;
    country_iso3?: string;
    name?: string;
    area?: string;
  };
}

/**
 * Données CallerID (Eyecon, CallApp, TrueCaller, etc.)
 */
export interface CallerIDOriginal {
  phone?: string;
  dial_number?: string;
  dial_code?: string;
  country?: string;
  country_name?: string;
  signature?: string;
  user?: {
    name?: string;
    picture?: string;
    PACKAGE?: string;
    VERSION?: string;
    target?: string;
  };
  name?: string;
  priority?: number;
}

/**
 * Données WhatsApp spécifiques
 */
export interface WhatsAppOriginal {
  phone?: string;
  status?: string; // Statut texte du profil
  status_set_at?: string;
  numberExists?: boolean;
  profile_pic_url?: string;
  picture?: string; // Variante du nom du champ pour l'image de profil
  about?: string;
}

/**
 * Données de breach / credential leak
 */
export interface BreachOriginal {
  email?: string;
  password?: string;
  hash?: string;
  username?: string;
  name?: string;
  phone?: string;
  ip?: string;
  address?: string;
  dob?: string;
  breach_name?: string;
  breach_date?: string;
}

// ============================================================================
// MAPPING PLATEFORMES
// ============================================================================

const COLLECTION_TO_PLATFORM: Record<string, string> = {
  // Réseaux sociaux
  'snapchat': 'snapchat',
  'google': 'other',
  'facebook': 'facebook',
  'instagram': 'instagram',
  'twitter': 'twitter',
  'x': 'twitter',
  'linkedin': 'linkedin',
  'tiktok': 'tiktok',
  'telegram': 'telegram',
  'whatsapp': 'whatsapp',
  'youtube': 'youtube',
  'reddit': 'reddit',
  'discord': 'discord',
  // HLR / Téléphonie
  'hlrlookup': 'hlr',
  'hlr': 'hlr',
  'hlr lookup': 'hlr',
  // CallerID
  'eyecon': 'callerid',
  'callapp': 'callerid',
  'truecaller': 'callerid',
  'sync.me': 'callerid',
  'hiya': 'callerid',
  'getcontact': 'callerid',
  // Breaches / Leaks
  'netease': 'breach',
  'netease (2015)': 'breach',
  'linkedin leak': 'breach',
  'adobe leak': 'breach',
  'haveibeenpwned': 'breach',
};

// ============================================================================
// FONCTIONS D'EXTRACTION
// ============================================================================

/**
 * Extrait le Snap ID (user_id) des données Snapchat
 */
function extractSnapchatId(record: ElephantasticRecord): string | undefined {
  const original = record.original as SnapchatOriginal | undefined;
  if (original?.user_id) {
    return original.user_id;
  }
  // Chercher dans les identifiers
  const snapIdent = record.identifiers?.find(id => id.startsWith('snapchatid:'));
  if (snapIdent) {
    return snapIdent.replace('snapchatid:', '');
  }
  return undefined;
}

/**
 * Extrait le Google Account ID (gaiaid) des données Google
 */
function extractGoogleId(record: ElephantasticRecord): string | undefined {
  const original = record.original as GoogleOriginal | undefined;
  if (original?.gaiaid) {
    return original.gaiaid;
  }
  const gaiaIdent = record.identifiers?.find(id => id.startsWith('gaiaid:'));
  if (gaiaIdent) {
    return gaiaIdent.replace('gaiaid:', '');
  }
  return undefined;
}

/**
 * Extrait les données HLR d'un enregistrement
 */
export interface HLRData {
  phone: string;
  liveStatus: 'live' | 'dead' | 'unknown';
  lineType: string; // MOBILE, LANDLINE, etc.
  isPorted: boolean;
  portedDate?: string;
  verificationDate?: string;
  currentOperator?: string;
  currentCountry?: string;
  currentCountryCode?: string;
  currentMccMnc?: string;
  originalOperator?: string;
  originalCountry?: string;
  error?: string;
}

function extractHLRData(record: ElephantasticRecord): HLRData | undefined {
  const original = record.original as HLROriginal | undefined;
  if (!original) return undefined;
  
  const phone = original.phone || original.detected_telephone_number || record.phones?.[0] || '';
  if (!phone) return undefined;
  
  // Déterminer le statut de la ligne
  let liveStatus: 'live' | 'dead' | 'unknown' = 'unknown';
  if (original.live_status) {
    const status = original.live_status.toUpperCase();
    if (status === 'LIVE' || status === 'ACTIVE') liveStatus = 'live';
    else if (status === 'DEAD' || status === 'INACTIVE') liveStatus = 'dead';
  }
  
  return {
    phone,
    liveStatus,
    lineType: original.telephone_number_type || 'UNKNOWN',
    isPorted: original.is_ported?.toUpperCase() === 'YES',
    portedDate: original.ported_date !== 'NOT_APPLICABLE' ? original.ported_date : undefined,
    verificationDate: original.timestamp,
    currentOperator: original.current_network_details?.name,
    currentCountry: original.current_network_details?.country_name,
    currentCountryCode: original.current_network_details?.country_iso3,
    currentMccMnc: original.current_network_details?.mccmnc,
    originalOperator: original.original_network_details?.name,
    originalCountry: original.original_network_details?.country_name,
    error: original.error !== 'NONE' ? original.error : undefined,
  };
}

/**
 * Extrait les données CallerID d'un enregistrement
 */
export interface CallerIDData {
  phone: string;
  callerName?: string;
  callerPicture?: string;
  country?: string;
  countryCode?: string;
  source: string; // Eyecon, CallApp, TrueCaller, etc.
}

function extractCallerIDData(record: ElephantasticRecord): CallerIDData | undefined {
  const original = record.original as CallerIDOriginal | undefined;
  if (!original) return undefined;
  
  const phone = original.phone || record.phones?.[0] || '';
  if (!phone) return undefined;
  
  return {
    phone,
    callerName: original.user?.name || original.name || record.names?.[0],
    callerPicture: original.user?.picture,
    country: original.country_name || original.country,
    countryCode: original.country,
    source: record.collection,
  };
}

/**
 * Extrait les données WhatsApp d'un enregistrement
 */
export interface WhatsAppData {
  phone: string;
  status?: string;
  statusSetAt?: string;
  exists: boolean;
  profilePic?: string;
}

function extractWhatsAppData(record: ElephantasticRecord): WhatsAppData | undefined {
  const original = record.original as WhatsAppOriginal | undefined;
  if (!original) return undefined;
  
  const phone = original.phone || record.phones?.[0] || '';
  
  return {
    phone,
    status: original.status,
    statusSetAt: original.status_set_at,
    exists: original.numberExists !== false,
    profilePic: original.picture || original.profile_pic_url,
  };
}

/**
 * Extrait l'URL de la photo de profil
 */
function extractProfilePicUrl(record: ElephantasticRecord): string | undefined {
  const original = record.original as any;
  
  // CallerID (Eyecon, etc.)
  if (original?.user?.picture) return original.user.picture;
  
  // Google
  if (original?.profile_pic_url) return original.profile_pic_url;
  
  // Facebook
  if (original?.profile_pic) return original.profile_pic;
  
  // Instagram
  if (original?.profile_pic_url) return original.profile_pic_url;
  
  // Twitter
  if (original?.profile_image_url_https) return original.profile_image_url_https;
  
  // LinkedIn
  if (original?.profile_picture_url) return original.profile_picture_url;
  
  // Telegram
  if (original?.photo_url) return original.photo_url;
  
  return undefined;
}

/**
 * Extrait la dernière activité
 */
function extractLastActive(record: ElephantasticRecord): string | undefined {
  if (record.date?.last_update && record.date.last_update.length > 0) {
    // Convertir en format datetime-local
    const date = new Date(record.date.last_update[0]);
    if (!isNaN(date.getTime())) {
      return date.toISOString().slice(0, 16);
    }
  }
  return undefined;
}

/**
 * Extrait le nombre de followers
 */
function extractFollowers(record: ElephantasticRecord): number | undefined {
  const original = record.original as any;
  
  if (typeof original?.follower_count === 'number') return original.follower_count;
  if (typeof original?.followers_count === 'number') return original.followers_count;
  if (typeof original?.connections === 'number') return original.connections;
  
  return undefined;
}

/**
 * Extrait l'URL du profil
 */
function extractProfileUrl(record: ElephantasticRecord): string | undefined {
  // Chercher dans les URLs
  if (record.urls && record.urls.length > 0) {
    // Privilégier les URLs de profil
    const profileUrl = record.urls.find(url => 
      url.includes('/profile') || 
      url.includes('/u/') ||
      !url.includes('/calendar') && !url.includes('/maps')
    );
    return profileUrl || record.urls[0];
  }
  
  const original = record.original as any;
  if (original?.profile_url) return original.profile_url;
  if (original?.external_url) return original.external_url;
  if (original?.url) return original.url;
  
  return undefined;
}

/**
 * Construit la description à partir des données
 */
function buildDescription(record: ElephantasticRecord): string {
  const parts: string[] = [];
  const original = record.original as any;
  const collection = record.collection.toLowerCase();
  
  // Informations de base
  if (record.names && record.names.length > 0) {
    const uniqueNames = [...new Set(record.names)];
    if (uniqueNames.length > 1 || (uniqueNames[0] && uniqueNames[0] !== record.label)) {
      parts.push(`**Noms:** ${uniqueNames.join(', ')}`);
    }
  }
  
  // Usernames
  if (record.usernames && record.usernames.length > 0) {
    parts.push(`**Usernames:** ${record.usernames.join(', ')}`);
  }
  
  // Téléphones
  if (record.phones && record.phones.length > 0) {
    parts.push(`**Téléphone(s):** ${record.phones.join(', ')}`);
  }
  
  // Emails
  if (record.emails && record.emails.length > 0) {
    parts.push(`**Email(s):** ${record.emails.join(', ')}`);
  }
  
  // Pays
  if (record.countries && record.countries.length > 0) {
    const countryNames = record.countries.map(c => c.toUpperCase());
    parts.push(`**Pays:** ${countryNames.join(', ')}`);
  }
  
  // Identifiants spécifiques par plateforme
  // Note: Snapchat et WhatsApp ont leurs données dans les métadonnées, pas besoin de tout mettre en description
  if (collection === 'snapchat') {
    // Ne garder que les infos de base non affichées ailleurs
    // Les données importantes (Snap ID, Bitmoji, Username, Tier) sont dans les métadonnées
  }
  
  if (collection === 'whatsapp') {
    // Les données (statut, date, existence) sont dans les métadonnées
    // Rien de plus à ajouter en description
  }
  
  if (collection === 'google') {
    const gaiaId = extractGoogleId(record);
    if (gaiaId) {
      parts.push(`**Google Account ID (GAIA):** \`${gaiaId}\``);
    }
    const profile = original?.result?.PROFILE_CONTAINER?.profile;
    if (profile?.personId) {
      parts.push(`**Person ID:** \`${profile.personId}\``);
    }
    if (profile?.profileInfos?.PROFILE?.userTypes) {
      parts.push(`**Type de compte:** ${profile.profileInfos.PROFILE.userTypes.join(', ')}`);
    }
  }
  
  if (collection === 'facebook') {
    if (original?.uid || original?.id) {
      parts.push(`**Facebook UID:** \`${original.uid || original.id}\``);
    }
    if (original?.gender) parts.push(`**Genre:** ${original.gender}`);
    if (original?.birthday) parts.push(`**Date de naissance:** ${original.birthday}`);
    if (original?.location) parts.push(`**Localisation:** ${original.location}`);
    if (original?.relationship_status) parts.push(`**Statut relationnel:** ${original.relationship_status}`);
  }
  
  if (collection === 'instagram') {
    if (original?.pk) {
      parts.push(`**Instagram PK:** \`${original.pk}\``);
    }
    if (original?.biography) parts.push(`**Bio:** ${original.biography}`);
    if (original?.is_verified) parts.push(`**Vérifié:** ✅ Oui`);
    if (original?.is_private) parts.push(`**Compte privé:** 🔒 Oui`);
    if (original?.media_count) parts.push(`**Publications:** ${original.media_count}`);
  }
  
  if (collection === 'twitter' || collection === 'x') {
    if (original?.id_str) {
      parts.push(`**Twitter ID:** \`${original.id_str}\``);
    }
    if (original?.description) parts.push(`**Bio:** ${original.description}`);
    if (original?.verified) parts.push(`**Vérifié:** ✅ Oui`);
    if (original?.statuses_count) parts.push(`**Tweets:** ${original.statuses_count}`);
    if (original?.location) parts.push(`**Localisation:** ${original.location}`);
  }
  
  if (collection === 'linkedin') {
    if (original?.urn_id) {
      parts.push(`**LinkedIn URN:** \`${original.urn_id}\``);
    }
    if (original?.public_id) {
      parts.push(`**LinkedIn Public ID:** \`${original.public_id}\``);
    }
    if (original?.headline) parts.push(`**Titre:** ${original.headline}`);
    if (original?.industry) parts.push(`**Secteur:** ${original.industry}`);
    if (original?.summary) parts.push(`**Résumé:** ${original.summary}`);
  }
  
  if (collection === 'telegram') {
    if (original?.user_id) {
      parts.push(`**Telegram ID:** \`${original.user_id}\``);
    }
    if (original?.is_premium) parts.push(`**Premium:** ⭐ Oui`);
    if (original?.is_bot) parts.push(`**Bot:** 🤖 Oui`);
  }
  
  // HLR Lookup
  if (collection === 'hlrlookup' || collection === 'hlr' || collection === 'hlr lookup') {
    const hlrData = extractHLRData(record);
    if (hlrData) {
      // Statut de la ligne
      const statusEmoji = hlrData.liveStatus === 'live' ? '🟢' : hlrData.liveStatus === 'dead' ? '🔴' : '⚪';
      parts.push(`**Statut de la ligne:** ${statusEmoji} ${hlrData.liveStatus.toUpperCase()}`);
      
      // Type de ligne
      if (hlrData.lineType) {
        parts.push(`**Type:** ${hlrData.lineType}`);
      }
      
      // Opérateur actuel
      if (hlrData.currentOperator) {
        parts.push(`**Opérateur:** ${hlrData.currentOperator}`);
      }
      
      // Pays
      if (hlrData.currentCountry) {
        parts.push(`**Pays:** ${hlrData.currentCountry} (${hlrData.currentCountryCode || ''})`);
      }
      
      // MCC/MNC
      if (hlrData.currentMccMnc) {
        parts.push(`**MCC/MNC:** \`${hlrData.currentMccMnc}\``);
      }
      
      // Portabilité
      if (hlrData.isPorted) {
        parts.push(`**Numéro porté:** ✅ Oui`);
        if (hlrData.portedDate) {
          parts.push(`**Date de portabilité:** ${hlrData.portedDate}`);
        }
        if (hlrData.originalOperator && hlrData.originalOperator !== hlrData.currentOperator) {
          parts.push(`**Opérateur d'origine:** ${hlrData.originalOperator}`);
        }
      }
      
      // Date de vérification
      if (hlrData.verificationDate) {
        const date = new Date(hlrData.verificationDate);
        parts.push(`**Vérifié le:** ${date.toLocaleString('fr-FR')}`);
      }
      
      if (hlrData.error) {
        parts.push(`**Erreur:** ⚠️ ${hlrData.error}`);
      }
    }
  }
  
  // CallerID (Eyecon, CallApp, TrueCaller, etc.)
  if (['eyecon', 'callapp', 'truecaller', 'sync.me', 'hiya', 'getcontact'].includes(collection)) {
    const callerData = extractCallerIDData(record);
    if (callerData) {
      if (callerData.callerName) {
        parts.push(`**Nom identifié:** ${callerData.callerName}`);
      }
      if (callerData.country) {
        parts.push(`**Pays:** ${callerData.country}`);
      }
      parts.push(`**Source CallerID:** ${callerData.source}`);
    }
  }
  
  // WhatsApp
  if (collection === 'whatsapp') {
    const whatsappData = extractWhatsAppData(record);
    if (whatsappData) {
      if (whatsappData.status) {
        parts.push(`**Statut:** "${whatsappData.status}"`);
      }
      if (whatsappData.statusSetAt) {
        const date = new Date(whatsappData.statusSetAt);
        parts.push(`**Statut mis à jour le:** ${date.toLocaleString('fr-FR')}`);
      }
      parts.push(`**Compte existant:** ${whatsappData.exists ? '✅ Oui' : '❌ Non'}`);
    }
  }
  
  // Breaches / Leaks
  const breachCollections = ['netease', 'netease (2015)', 'linkedin leak', 'adobe leak', 'haveibeenpwned'];
  if (breachCollections.some(c => collection.includes(c.replace(' ', '').toLowerCase()) || collection === c)) {
    if (original?.password) {
      parts.push(`**Mot de passe exposé:** \`${original.password}\``);
    }
    if (original?.hash) {
      parts.push(`**Hash:** \`${original.hash}\``);
    }
    if (record.hostnames && record.hostnames.length > 0) {
      parts.push(`**Domaine(s):** ${record.hostnames.join(', ')}`);
    }
    parts.push(`⚠️ **ATTENTION:** Données issues d'une fuite de données`);
  }
  
  // Tous les identifiants
  if (record.identifiers && record.identifiers.length > 0) {
    parts.push(`\n**Identifiants:**`);
    record.identifiers.forEach(id => {
      parts.push(`- \`${id}\``);
    });
  }
  
  // Date de création de l'enregistrement
  if (record.created_at) {
    parts.push(`\n*Données collectées le: ${record.created_at}*`);
  }
  
  return parts.join('\n');
}

/**
 * Crée une source à partir des données
 */
function createSource(record: ElephantasticRecord): Source {
  const profileUrl = extractProfileUrl(record);
  
  // Créer un label générique basé sur la collection
  let label = 'Base de données';
  if (record.collection) {
    const collection = record.collection.toLowerCase();
    if (collection.includes('hlr') || collection.includes('lookup')) {
      label = 'Vérification téléphonique';
    } else if (collection.includes('whatsapp')) {
      label = 'Base de données WhatsApp';
    } else if (collection.includes('snapchat')) {
      label = 'Base de données Snapchat';
    } else if (collection.includes('facebook')) {
      label = 'Base de données Facebook';
    } else if (collection.includes('instagram')) {
      label = 'Base de données Instagram';
    } else if (collection.includes('twitter') || collection.includes('x')) {
      label = 'Base de données X/Twitter';
    } else if (collection.includes('linkedin')) {
      label = 'Base de données LinkedIn';
    } else if (collection.includes('telegram')) {
      label = 'Base de données Telegram';
    } else if (collection.includes('google')) {
      label = 'Base de données Google';
    } else if (collection.includes('microsoft')) {
      label = 'Base de données Microsoft';
    } else if (collection.includes('eyecon') || collection.includes('callapp') || collection.includes('truecaller')) {
      label = 'Base de données CallerID';
    } else if (collection.includes('breach') || collection.includes('leak') || collection.includes('netease') || collection.includes('haveibeenpwned')) {
      label = 'Fuite de données';
    } else {
      label = `Base de données - ${record.collection}`;
    }
  }
  
  return {
    type: profileUrl ? 'url' : 'database',
    value: profileUrl || label,
    note: record.created_at ? `Données collectées le ${new Date(record.created_at).toLocaleDateString('fr-FR')}` : undefined,
    accessedAt: record.created_at ? new Date(record.created_at).toISOString() : undefined,
  };
}

// ============================================================================
// FONCTION PRINCIPALE DE CONVERSION
// ============================================================================

/**
 * Convertit un enregistrement Elephantastic en Finding
 */
export function convertElephantasticToFinding(record: ElephantasticRecord): Finding {
  const collection = record.collection.toLowerCase();
  const platform = COLLECTION_TO_PLATFORM[collection] || 'other';
  
  // Construire les métadonnées
  const metadata: Record<string, any> = {
    platform,
    accountStatus: 'active', // Par défaut
    profileUrl: extractProfileUrl(record),
    profilePicUrl: extractProfilePicUrl(record),
    lastActive: extractLastActive(record),
    followers: extractFollowers(record),
    // Identifiants spécifiques par plateforme
    elephantasticImport: true,
    elephantasticSchema: record.schema,
    elephantasticCollection: record.collection,
  };
  
  // Ajouter les identifiants spécifiques
  if (collection === 'snapchat') {
    const snapId = extractSnapchatId(record);
    if (snapId) {
      metadata.snapchatId = snapId;
      metadata.snapId = snapId; // Alias
    }
    const original = record.original as SnapchatOriginal | undefined;
    // Username et display name
    if (original?.username) {
      metadata.snapchatUsername = original.username;
    }
    if (original?.mutable_username) {
      metadata.snapchatMutableUsername = original.mutable_username;
    }
    if (original?.display_name) {
      metadata.snapchatDisplayName = original.display_name;
    }
    // Tier
    if (original?.tier !== undefined) {
      metadata.snapchatTier = original.tier;
    }
    // Bitmoji
    if (original?.bitmoji_avatar_id) {
      metadata.bitmojiAvatarId = original.bitmoji_avatar_id;
    }
    if (original?.bitmoji_selfie_id) {
      metadata.bitmojiSelfieId = original.bitmoji_selfie_id;
    }
  }
  
  if (collection === 'google') {
    const gaiaId = extractGoogleId(record);
    if (gaiaId) {
      metadata.googleAccountId = gaiaId;
      metadata.gaiaId = gaiaId;
    }
  }
  
  if (collection === 'facebook') {
    const original = record.original as FacebookOriginal | undefined;
    if (original?.uid || original?.id) {
      metadata.facebookUid = original.uid || original.id;
    }
  }
  
  if (collection === 'instagram') {
    const original = record.original as InstagramOriginal | undefined;
    if (original?.pk) {
      metadata.instagramPk = original.pk;
    }
  }
  
  if (collection === 'twitter' || collection === 'x') {
    const original = record.original as TwitterOriginal | undefined;
    if (original?.id_str) {
      metadata.twitterId = original.id_str;
    }
  }
  
  if (collection === 'telegram') {
    const original = record.original as TelegramOriginal | undefined;
    if (original?.user_id) {
      metadata.telegramId = String(original.user_id);
    }
  }
  
  // HLR Lookup - données téléphonie
  if (collection === 'hlrlookup' || collection === 'hlr' || collection === 'hlr lookup') {
    const hlrData = extractHLRData(record);
    if (hlrData) {
      metadata.platform = 'hlr'; // Forcer le type
      metadata.hlr = hlrData;
      metadata.liveStatus = hlrData.liveStatus;
      metadata.lineType = hlrData.lineType;
      metadata.operator = hlrData.currentOperator;
      metadata.operatorCountry = hlrData.currentCountry;
      metadata.operatorCountryCode = hlrData.currentCountryCode;
      metadata.mccMnc = hlrData.currentMccMnc;
      metadata.isPorted = hlrData.isPorted;
      metadata.portedDate = hlrData.portedDate;
      metadata.originalOperator = hlrData.originalOperator;
      metadata.verificationDate = hlrData.verificationDate;
      // Statut du compte basé sur le statut HLR
      metadata.accountStatus = hlrData.liveStatus === 'live' ? 'active' : 
                               hlrData.liveStatus === 'dead' ? 'inactive' : 'unknown';
    }
  }
  
  // CallerID (Eyecon, CallApp, TrueCaller, etc.)
  if (['eyecon', 'callapp', 'truecaller', 'sync.me', 'hiya', 'getcontact'].includes(collection)) {
    const callerData = extractCallerIDData(record);
    if (callerData) {
      metadata.platform = 'callerid'; // Forcer le type
      metadata.callerID = callerData;
      metadata.callerName = callerData.callerName;
      metadata.callerSource = callerData.source;
      metadata.callerCountry = callerData.country;
      if (callerData.callerPicture) {
        metadata.profilePicUrl = callerData.callerPicture;
      }
    }
  }
  
  // WhatsApp
  if (collection === 'whatsapp') {
    const whatsappData = extractWhatsAppData(record);
    if (whatsappData) {
      metadata.whatsapp = whatsappData;
      // Stocker les données WhatsApp individuellement pour le formulaire
      metadata.whatsappStatus = whatsappData.status;
      metadata.whatsappStatusSetAt = whatsappData.statusSetAt;
      metadata.whatsappNumberExists = whatsappData.exists;
      if (whatsappData.profilePic) {
        metadata.profilePicUrl = whatsappData.profilePic;
      }
      metadata.accountStatus = whatsappData.exists ? 'active' : 'unknown';
    }
  }
  
  // Breaches / Leaks
  const breachCollections = ['netease', 'netease (2015)', 'linkedin leak', 'adobe leak', 'haveibeenpwned'];
  if (breachCollections.some(c => collection.includes(c.replace(' ', '').toLowerCase()) || collection === c)) {
    metadata.platform = 'breach'; // Forcer le type
    metadata.isBreach = true;
    metadata.breachSource = record.collection;
    if (record.passphrases && record.passphrases.length > 0) {
      metadata.exposedPasswords = record.passphrases;
    }
    if (record.hostnames && record.hostnames.length > 0) {
      metadata.breachDomains = record.hostnames;
    }
    // Pour les breaches, le statut est "compromised" (nouveau statut)
    metadata.accountStatus = 'compromised';
  }
  
  // Stocker les téléphones et emails dans les métadonnées aussi
  if (record.phones && record.phones.length > 0) {
    metadata.phones = record.phones;
  }
  if (record.emails && record.emails.length > 0) {
    metadata.emails = record.emails;
  }
  if (record.usernames && record.usernames.length > 0) {
    metadata.usernames = record.usernames;
  }
  if (record.identifiers && record.identifiers.length > 0) {
    metadata.identifiers = record.identifiers;
  }
  
  // Collecter les images pour les attachments
  const attachments: string[] = [];
  
  // Ajouter l'image de profil si disponible
  if (metadata.profilePicUrl) {
    attachments.push(metadata.profilePicUrl);
  }
  
  // Ajouter les photos du record original
  if (record.original) {
    const original = record.original as any;
    // WhatsApp profile pic (variantes de noms de champs)
    const whatsappPic = original.picture || original.profile_pic_url;
    if (whatsappPic && !attachments.includes(whatsappPic)) {
      attachments.push(whatsappPic);
    }
    // Snapchat bitmoji
    if (original.bitmoji_avatar_id) {
      const bitmojiUrl = `https://sdk.bitmoji.com/render/panel/${original.bitmoji_avatar_id}-v1.png?transparent=1&scale=2`;
      if (!attachments.includes(bitmojiUrl)) {
        attachments.push(bitmojiUrl);
      }
    }
    if (original.bitmoji_selfie_id) {
      const selfieUrl = `https://sdk.bitmoji.com/render/panel/${original.bitmoji_selfie_id}-v1.png?transparent=1&scale=2`;
      if (!attachments.includes(selfieUrl)) {
        attachments.push(selfieUrl);
      }
    }
    // Photos génériques
    if (original.photos && Array.isArray(original.photos)) {
      for (const photo of original.photos) {
        if (typeof photo === 'string' && !attachments.includes(photo)) {
          attachments.push(photo);
        }
      }
    }
  }
  
  // Construire le Finding
  const finding: Finding = {
    label: record.label || record.usernames?.[0] || 'Profil importé',
    description: buildDescription(record),
    confidence: 'confirmed' as ConfidenceLevel, // Les données Elephantastic sont considérées confirmées
    sources: [createSource(record)],
    attachments: attachments.length > 0 ? attachments : undefined,
    relatedEntities: [],
    metadata,
  };
  
  return finding;
}

/**
 * Parse et convertit un fichier JSON Elephantastic (peut contenir plusieurs lignes JSONL)
 */
export function parseElephantasticFile(content: string): ElephantasticRecord[] {
  const records: ElephantasticRecord[] = [];
  
  // Supporter le format JSONL (une ligne = un objet JSON)
  const lines = content.trim().split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    try {
      const record = JSON.parse(trimmedLine) as ElephantasticRecord;
      
      // Valider la structure minimale
      if (record.schema && record.collection) {
        records.push(record);
      } else {
        console.warn('Enregistrement Elephantastic invalide (schema ou collection manquant):', record);
      }
    } catch (e) {
      console.error('Erreur de parsing JSON:', e, 'Ligne:', trimmedLine);
    }
  }
  
  return records;
}

/**
 * Convertit plusieurs enregistrements Elephantastic en Findings
 */
export function convertElephantasticRecords(records: ElephantasticRecord[]): Finding[] {
  return records.map(convertElephantasticToFinding);
}

/**
 * Détermine la plateforme principale à partir des enregistrements
 */
export function detectMainPlatform(records: ElephantasticRecord[]): string | undefined {
  if (records.length === 0) return undefined;
  
  // Compter les collections
  const collectionCounts: Record<string, number> = {};
  for (const record of records) {
    const collection = record.collection.toLowerCase();
    collectionCounts[collection] = (collectionCounts[collection] || 0) + 1;
  }
  
  // Trouver la collection la plus fréquente
  let maxCount = 0;
  let mainCollection = '';
  for (const [collection, count] of Object.entries(collectionCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mainCollection = collection;
    }
  }
  
  return COLLECTION_TO_PLATFORM[mainCollection] || 'other';
}

/**
 * Télécharge les images externes d'un Finding et les remplace par des URLs locales
 * Utile pour capturer les images WhatsApp/externes avant expiration
 * @param finding Finding avec potentiellement des URLs externes
 * @param caseId ID du rapport pour associer les captures
 * @returns Finding modifié avec URLs locales
 */
export async function downloadExternalImages(finding: Finding, caseId?: string): Promise<Finding> {
  if (!finding.attachments || finding.attachments.length === 0) {
    return finding;
  }

  const { screenshotService } = await import('@/services/screenshot');
  const newAttachments: string[] = [];
  
  for (const url of finding.attachments) {
    try {
      // Vérifier si c'est une URL externe (commence par http/https)
      if (url.startsWith('http://') || url.startsWith('https://')) {
        console.log(`📥 Téléchargement de l'image: ${url}`);
        
        // Télécharger et stocker localement
        const result = await screenshotService.downloadFromUrl(url, {
          caseId: caseId,
          investigatorName: 'Import',
        });
        
        // Remplacer par l'URL locale
        newAttachments.push(result.url);
        console.log(`✅ Image capturée localement: ${result.filename}`);
      } else {
        // Garder les URLs locales telles quelles
        newAttachments.push(url);
      }
    } catch (error: any) {
      console.error(`❌ Échec du téléchargement de ${url}:`, error.message);
      // En cas d'erreur, garder l'URL originale
      newAttachments.push(url);
    }
  }
  
  return {
    ...finding,
    attachments: newAttachments,
  };
}
