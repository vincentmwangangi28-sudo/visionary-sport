import React, { useState, memo } from 'react';
import { TeamLogo } from '@/components/TeamLogo';
import { resolveTeamIdentity, TeamKitPattern } from '@/services/teamLogos';

export interface PlayerAvatarProps {
  playerId?: number;
  name: string;
  team?: string;
  photoUrl?: string | null;
  rating?: number;
  jerseyNumber?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showClubBadge?: boolean;
  showRatingBadge?: boolean;
  className?: string;
}

const KNOWN_PLAYER_HEADSHOTS: Record<string, string> = {
  // Manchester City
  'erling haaland': 'https://media.api-sports.io/football/players/1100.png',
  'haaland': 'https://media.api-sports.io/football/players/1100.png',
  'phil foden': 'https://media.api-sports.io/football/players/631.png',
  'foden': 'https://media.api-sports.io/football/players/631.png',
  'rodri': 'https://media.api-sports.io/football/players/44.png',
  'kevin de bruyne': 'https://media.api-sports.io/football/players/629.png',
  'de bruyne': 'https://media.api-sports.io/football/players/629.png',
  'bernardo silva': 'https://media.api-sports.io/football/players/636.png',
  'silva': 'https://media.api-sports.io/football/players/636.png',
  'ederson': 'https://media.api-sports.io/football/players/617.png',
  'rico lewis': 'https://media.api-sports.io/football/players/284230.png',
  'lewis': 'https://media.api-sports.io/football/players/284230.png',
  'ruben dias': 'https://media.api-sports.io/football/players/567.png',
  'dias': 'https://media.api-sports.io/football/players/567.png',
  'manuel akanji': 'https://media.api-sports.io/football/players/5.png',
  'akanji': 'https://media.api-sports.io/football/players/5.png',
  'josko gvardiol': 'https://media.api-sports.io/football/players/129033.png',
  'gvardiol': 'https://media.api-sports.io/football/players/129033.png',
  'mateo kovacic': 'https://media.api-sports.io/football/players/2291.png',
  'kovacic': 'https://media.api-sports.io/football/players/2291.png',
  'savinho': 'https://media.api-sports.io/football/players/282125.png',
  'jeremy doku': 'https://media.api-sports.io/football/players/1422.png',
  'doku': 'https://media.api-sports.io/football/players/1422.png',

  // Real Madrid
  'kylian mbappe': 'https://media.api-sports.io/football/players/278.png',
  'mbappe': 'https://media.api-sports.io/football/players/278.png',
  'vinicius junior': 'https://media.api-sports.io/football/players/762.png',
  'vinicius jr': 'https://media.api-sports.io/football/players/762.png',
  'vinicius': 'https://media.api-sports.io/football/players/762.png',
  'jude bellingham': 'https://media.api-sports.io/football/players/129718.png',
  'bellingham': 'https://media.api-sports.io/football/players/129718.png',
  'federico valverde': 'https://media.api-sports.io/football/players/756.png',
  'valverde': 'https://media.api-sports.io/football/players/756.png',
  'thibaut courtois': 'https://media.api-sports.io/football/players/730.png',
  'courtois': 'https://media.api-sports.io/football/players/730.png',
  'lucas vazquez': 'https://media.api-sports.io/football/players/754.png',
  'vazquez': 'https://media.api-sports.io/football/players/754.png',
  'eder militao': 'https://media.api-sports.io/football/players/738.png',
  'militao': 'https://media.api-sports.io/football/players/738.png',
  'antonio rudiger': 'https://media.api-sports.io/football/players/2285.png',
  'rudiger': 'https://media.api-sports.io/football/players/2285.png',
  'ferland mendy': 'https://media.api-sports.io/football/players/653.png',
  'mendy': 'https://media.api-sports.io/football/players/653.png',
  'aurelien tchouameni': 'https://media.api-sports.io/football/players/1271.png',
  'tchouameni': 'https://media.api-sports.io/football/players/1271.png',
  'rodrygo': 'https://media.api-sports.io/football/players/759.png',
  'luka modric': 'https://media.api-sports.io/football/players/746.png',
  'modric': 'https://media.api-sports.io/football/players/746.png',

  // Arsenal
  'bukayo saka': 'https://media.api-sports.io/football/players/1460.png',
  'saka': 'https://media.api-sports.io/football/players/1460.png',
  'martin odegaard': 'https://media.api-sports.io/football/players/37127.png',
  'odegaard': 'https://media.api-sports.io/football/players/37127.png',
  'declan rice': 'https://media.api-sports.io/football/players/2937.png',
  'rice': 'https://media.api-sports.io/football/players/2937.png',
  'william saliba': 'https://media.api-sports.io/football/players/22090.png',
  'saliba': 'https://media.api-sports.io/football/players/22090.png',
  'kai havertz': 'https://media.api-sports.io/football/players/978.png',
  'havertz': 'https://media.api-sports.io/football/players/978.png',
  'gabriel martinelli': 'https://media.api-sports.io/football/players/127769.png',
  'martinelli': 'https://media.api-sports.io/football/players/127769.png',
  'david raya': 'https://media.api-sports.io/football/players/19465.png',
  'raya': 'https://media.api-sports.io/football/players/19465.png',
  'gabriel magalhaes': 'https://media.api-sports.io/football/players/22224.png',
  'gabriel': 'https://media.api-sports.io/football/players/22224.png',
  'ben white': 'https://media.api-sports.io/football/players/19959.png',
  'white': 'https://media.api-sports.io/football/players/19959.png',
  'thomas partey': 'https://media.api-sports.io/football/players/49.png',
  'partey': 'https://media.api-sports.io/football/players/49.png',
  'jurrien timber': 'https://media.api-sports.io/football/players/38746.png',
  'timber': 'https://media.api-sports.io/football/players/38746.png',

  // Chelsea
  'cole palmer': 'https://media.api-sports.io/football/players/152982.png',
  'palmer': 'https://media.api-sports.io/football/players/152982.png',
  'nicolas jackson': 'https://media.api-sports.io/football/players/283058.png',
  'jackson': 'https://media.api-sports.io/football/players/283058.png',
  'moises caicedo': 'https://media.api-sports.io/football/players/116117.png',
  'caicedo': 'https://media.api-sports.io/football/players/116117.png',
  'enzo fernandez': 'https://media.api-sports.io/football/players/5996.png',
  'fernandez': 'https://media.api-sports.io/football/players/5996.png',
  'noni madueke': 'https://media.api-sports.io/football/players/136723.png',
  'madueke': 'https://media.api-sports.io/football/players/136723.png',
  'pedro neto': 'https://media.api-sports.io/football/players/18742.png',
  'neto': 'https://media.api-sports.io/football/players/18742.png',
  'robert sanchez': 'https://media.api-sports.io/football/players/18959.png',
  'sanchez': 'https://media.api-sports.io/football/players/18959.png',
  'malo gusto': 'https://media.api-sports.io/football/players/161907.png',
  'gusto': 'https://media.api-sports.io/football/players/161907.png',
  'wesley fofana': 'https://media.api-sports.io/football/players/22094.png',
  'fofana': 'https://media.api-sports.io/football/players/22094.png',
  'levi colwill': 'https://media.api-sports.io/football/players/152953.png',
  'colwill': 'https://media.api-sports.io/football/players/152953.png',
  'marc cucurella': 'https://media.api-sports.io/football/players/47380.png',
  'cucurella': 'https://media.api-sports.io/football/players/47380.png',
  'christopher nkunku': 'https://media.api-sports.io/football/players/269.png',
  'nkunku': 'https://media.api-sports.io/football/players/269.png',

  // Liverpool
  'mohamed salah': 'https://media.api-sports.io/football/players/306.png',
  'salah': 'https://media.api-sports.io/football/players/306.png',
  'virgil van dijk': 'https://media.api-sports.io/football/players/290.png',
  'van dijk': 'https://media.api-sports.io/football/players/290.png',
  'alisson': 'https://media.api-sports.io/football/players/280.png',
  'alisson becker': 'https://media.api-sports.io/football/players/280.png',
  'trent alexander-arnold': 'https://media.api-sports.io/football/players/283.png',
  'alexander-arnold': 'https://media.api-sports.io/football/players/283.png',
  'andrew robertson': 'https://media.api-sports.io/football/players/289.png',
  'robertson': 'https://media.api-sports.io/football/players/289.png',
  'ibrahima konate': 'https://media.api-sports.io/football/players/1145.png',
  'konate': 'https://media.api-sports.io/football/players/1145.png',
  'curtis jones': 'https://media.api-sports.io/football/players/1600.png',
  'diogo jota': 'https://media.api-sports.io/football/players/2678.png',
  'jota': 'https://media.api-sports.io/football/players/2678.png',
  'luis diaz': 'https://media.api-sports.io/football/players/2489.png',
  'darwin nunez': 'https://media.api-sports.io/football/players/51617.png',
  'nunez': 'https://media.api-sports.io/football/players/51617.png',
  'alexis mac allister': 'https://media.api-sports.io/football/players/6716.png',
  'mac allister': 'https://media.api-sports.io/football/players/6716.png',
  'dominik szoboszlai': 'https://media.api-sports.io/football/players/1096.png',
  'szoboszlai': 'https://media.api-sports.io/football/players/1096.png',

  // Barcelona
  'lamine yamal': 'https://media.api-sports.io/football/players/386828.png',
  'yamal': 'https://media.api-sports.io/football/players/386828.png',
  'robert lewandowski': 'https://media.api-sports.io/football/players/521.png',
  'lewandowski': 'https://media.api-sports.io/football/players/521.png',
  'pedri': 'https://media.api-sports.io/football/players/133609.png',
  'raphinha': 'https://media.api-sports.io/football/players/1496.png',
  'inaki pena': 'https://media.api-sports.io/football/players/727.png',
  'pena': 'https://media.api-sports.io/football/players/727.png',
  'jules kounde': 'https://media.api-sports.io/football/players/1257.png',
  'kounde': 'https://media.api-sports.io/football/players/1257.png',
  'ronald araujo': 'https://media.api-sports.io/football/players/101814.png',
  'araujo': 'https://media.api-sports.io/football/players/101814.png',
  'pau cubarsi': 'https://media.api-sports.io/football/players/396623.png',
  'cubarsi': 'https://media.api-sports.io/football/players/396623.png',
  'alejandro balde': 'https://media.api-sports.io/football/players/161928.png',
  'balde': 'https://media.api-sports.io/football/players/161928.png',
  'dani olmo': 'https://media.api-sports.io/football/players/1323.png',
  'olmo': 'https://media.api-sports.io/football/players/1323.png',
  'gavi': 'https://media.api-sports.io/football/players/310150.png',

  // Bayern Munich
  'harry kane': 'https://media.api-sports.io/football/players/184.png',
  'kane': 'https://media.api-sports.io/football/players/184.png',
  'jamal musiala': 'https://media.api-sports.io/football/players/181812.png',
  'musiala': 'https://media.api-sports.io/football/players/181812.png',
  'michael olise': 'https://media.api-sports.io/football/players/19617.png',
  'olise': 'https://media.api-sports.io/football/players/19617.png',
  'manuel neuer': 'https://media.api-sports.io/football/players/500.png',
  'neuer': 'https://media.api-sports.io/football/players/500.png',
  'joshua kimmich': 'https://media.api-sports.io/football/players/502.png',
  'kimmich': 'https://media.api-sports.io/football/players/502.png',
  'konrad laimer': 'https://media.api-sports.io/football/players/1159.png',
  'laimer': 'https://media.api-sports.io/football/players/1159.png',
  'dayot upamecano': 'https://media.api-sports.io/football/players/1149.png',
  'upamecano': 'https://media.api-sports.io/football/players/1149.png',
  'kim min-jae': 'https://media.api-sports.io/football/players/2901.png',
  'alphonso davies': 'https://media.api-sports.io/football/players/532.png',
  'davies': 'https://media.api-sports.io/football/players/532.png',
  'aleksandar pavlovic': 'https://media.api-sports.io/football/players/394575.png',
  'pavlovic': 'https://media.api-sports.io/football/players/394575.png',
  'serge gnabry': 'https://media.api-sports.io/football/players/510.png',
  'gnabry': 'https://media.api-sports.io/football/players/510.png',

  // Paris Saint-Germain
  'ousmane dembele': 'https://media.api-sports.io/football/players/153.png',
  'dembele': 'https://media.api-sports.io/football/players/153.png',
  'bradley barcola': 'https://media.api-sports.io/football/players/328108.png',
  'barcola': 'https://media.api-sports.io/football/players/328108.png',
  'vitinha': 'https://media.api-sports.io/football/players/41621.png',
  'achraf hakimi': 'https://media.api-sports.io/football/players/9.png',
  'hakimi': 'https://media.api-sports.io/football/players/9.png',
  'gianluigi donnarumma': 'https://media.api-sports.io/football/players/1622.png',
  'donnarumma': 'https://media.api-sports.io/football/players/1622.png',
  'marquinhos': 'https://media.api-sports.io/football/players/257.png',
  'willian pacho': 'https://media.api-sports.io/football/players/195710.png',
  'pacho': 'https://media.api-sports.io/football/players/195710.png',
  'nuno mendes': 'https://media.api-sports.io/football/players/263482.png',
  'joao neves': 'https://media.api-sports.io/football/players/382356.png',
  'neves': 'https://media.api-sports.io/football/players/382356.png',
  'warren zaire-emery': 'https://media.api-sports.io/football/players/336657.png',
  'zaire-emery': 'https://media.api-sports.io/football/players/336657.png',
  'lee kang-in': 'https://media.api-sports.io/football/players/927.png',

  // Inter Milan
  'lautaro martinez': 'https://media.api-sports.io/football/players/217.png',
  'martinez': 'https://media.api-sports.io/football/players/217.png',
  'marcus thuram': 'https://media.api-sports.io/football/players/21509.png',
  'thuram': 'https://media.api-sports.io/football/players/21509.png',
  'nicolo barella': 'https://media.api-sports.io/football/players/30558.png',
  'barella': 'https://media.api-sports.io/football/players/30558.png',
  'yann sommer': 'https://media.api-sports.io/football/players/2802.png',
  'sommer': 'https://media.api-sports.io/football/players/2802.png',
  'alessandro bastoni': 'https://media.api-sports.io/football/players/30508.png',
  'bastoni': 'https://media.api-sports.io/football/players/30508.png',
  'hakan calhanoglu': 'https://media.api-sports.io/football/players/1640.png',
  'calhanoglu': 'https://media.api-sports.io/football/players/1640.png',
  'benjamin pavard': 'https://media.api-sports.io/football/players/505.png',
  'pavard': 'https://media.api-sports.io/football/players/505.png',
  'francesco acerbi': 'https://media.api-sports.io/football/players/1882.png',
  'acerbi': 'https://media.api-sports.io/football/players/1882.png',
  'denzel dumfries': 'https://media.api-sports.io/football/players/374.png',
  'dumfries': 'https://media.api-sports.io/football/players/374.png',
  'henrikh mkhitaryan': 'https://media.api-sports.io/football/players/1464.png',
  'mkhitaryan': 'https://media.api-sports.io/football/players/1464.png',
  'federico dimarco': 'https://media.api-sports.io/football/players/30510.png',
  'dimarco': 'https://media.api-sports.io/football/players/30510.png',

  // Serie A / Bundesliga / Europe Stars
  'victor osimhen': 'https://media.api-sports.io/football/players/2780.png',
  'osimhen': 'https://media.api-sports.io/football/players/2780.png',
  'viktor gyokeres': 'https://media.api-sports.io/football/players/18979.png',
  'gyokeres': 'https://media.api-sports.io/football/players/18979.png',
  'ademola lookman': 'https://media.api-sports.io/football/players/18766.png',
  'lookman': 'https://media.api-sports.io/football/players/18766.png',
  'serhou guirassy': 'https://media.api-sports.io/football/players/21393.png',
  'guirassy': 'https://media.api-sports.io/football/players/21393.png',
  'florian wirtz': 'https://media.api-sports.io/football/players/203224.png',
  'wirtz': 'https://media.api-sports.io/football/players/203224.png',
  'victor boniface': 'https://media.api-sports.io/football/players/47502.png',
  'boniface': 'https://media.api-sports.io/football/players/47502.png',
  'dusan vlahovic': 'https://media.api-sports.io/football/players/30415.png',
  'vlahovic': 'https://media.api-sports.io/football/players/30415.png',
  'kenan yildiz': 'https://media.api-sports.io/football/players/339883.png',
  'yildiz': 'https://media.api-sports.io/football/players/339883.png',
  'teun koopmeiners': 'https://media.api-sports.io/football/players/36902.png',
  'koopmeiners': 'https://media.api-sports.io/football/players/36902.png',
  'manuel locatelli': 'https://media.api-sports.io/football/players/30533.png',
  'locatelli': 'https://media.api-sports.io/football/players/30533.png',
  'gregor kobel': 'https://media.api-sports.io/football/players/25929.png',
  'kobel': 'https://media.api-sports.io/football/players/25929.png',
  'julian brandt': 'https://media.api-sports.io/football/players/984.png',
  'brandt': 'https://media.api-sports.io/football/players/984.png',
  'emre can': 'https://media.api-sports.io/football/players/859.png',
  'christian pulisic': 'https://media.api-sports.io/football/players/17.png',
  'pulisic': 'https://media.api-sports.io/football/players/17.png',
  'rafael leao': 'https://media.api-sports.io/football/players/22236.png',
  'leao': 'https://media.api-sports.io/football/players/22236.png',
  'romelu lukaku': 'https://media.api-sports.io/football/players/907.png',
  'lukaku': 'https://media.api-sports.io/football/players/907.png',
  'khvicha kvaratskhelia': 'https://media.api-sports.io/football/players/483.png',
  'kvaratskhelia': 'https://media.api-sports.io/football/players/483.png',
  'scott mctominay': 'https://media.api-sports.io/football/players/903.png',
  'mctominay': 'https://media.api-sports.io/football/players/903.png',
  'julian alvarez': 'https://media.api-sports.io/football/players/6009.png',
  'alvarez': 'https://media.api-sports.io/football/players/6009.png',
  'antoine griezmann': 'https://media.api-sports.io/football/players/56.png',
  'griezmann': 'https://media.api-sports.io/football/players/56.png',
  'bruno fernandes': 'https://media.api-sports.io/football/players/1485.png',
  'rasmus hojlund': 'https://media.api-sports.io/football/players/288006.png',
  'hojlund': 'https://media.api-sports.io/football/players/288006.png',
  'amad diallo': 'https://media.api-sports.io/football/players/157997.png',
  'diallo': 'https://media.api-sports.io/football/players/157997.png',
  'alexander isak': 'https://media.api-sports.io/football/players/2864.png',
  'isak': 'https://media.api-sports.io/football/players/2864.png',
  'ollie watkins': 'https://media.api-sports.io/football/players/19366.png',
  'watkins': 'https://media.api-sports.io/football/players/19366.png',
  'son heung-min': 'https://media.api-sports.io/football/players/186.png',
  'dominic solanke': 'https://media.api-sports.io/football/players/18883.png',
  'solanke': 'https://media.api-sports.io/football/players/18883.png',
  'james maddison': 'https://media.api-sports.io/football/players/18784.png',
  'maddison': 'https://media.api-sports.io/football/players/18784.png',
};

export function resolveKnownPlayerHeadshot(rawName: string): string | null {
  if (!rawName) return null;
  const ascii = rawName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ø/gi, 'o')
    .replace(/ß/g, 'ss')
    .replace(/ı/g, 'i')
    .replace(/ğ/gi, 'g')
    .replace(/ş/gi, 's')
    .replace(/ç/gi, 'c')
    .trim()
    .toLowerCase();

  if (KNOWN_PLAYER_HEADSHOTS[ascii]) {
    return KNOWN_PLAYER_HEADSHOTS[ascii];
  }

  // Strip leading initial like "d. raya", "o. dembele", "l. martinez", "t. alexander-arnold"
  const withoutInitial = ascii.replace(/^[a-z]\.\s*/, '').trim();
  if (KNOWN_PLAYER_HEADSHOTS[withoutInitial]) {
    return KNOWN_PLAYER_HEADSHOTS[withoutInitial];
  }

  // Try last word token (surname) if >= 4 chars
  const parts = withoutInitial.split(/\s+/).filter(Boolean);
  const surname = parts[parts.length - 1] || '';
  if (surname.length >= 4 && KNOWN_PLAYER_HEADSHOTS[surname]) {
    return KNOWN_PLAYER_HEADSHOTS[surname];
  }

  return null;
}

interface KitPalette {
  primary: string;
  secondary: string;
  accent: string;
  pattern: TeamKitPattern;
}

export function getClubKitPalette(team = ''): KitPalette {
  if (!team) {
    return { primary: '#10b981', secondary: '#047857', accent: '#ffffff', pattern: 'solid' };
  }
  const identity = resolveTeamIdentity(team);
  return {
    primary: identity.primaryColor,
    secondary: identity.secondaryColor,
    accent: identity.accentColor,
    pattern: identity.kitPattern,
  };
}

const SIZE_CLASSES: Record<
  NonNullable<PlayerAvatarProps['size']>,
  { wrapper: string; dim: number; clubSize: 'xs' | 'sm'; text: string }
> = {
  xs: { wrapper: 'w-6 h-6 rounded-full', dim: 24, clubSize: 'xs', text: 'text-[9px]' },
  sm: { wrapper: 'w-9 h-9 rounded-full', dim: 36, clubSize: 'xs', text: 'text-[10px]' },
  md: { wrapper: 'w-12 h-12 rounded-2xl', dim: 48, clubSize: 'xs', text: 'text-xs' },
  lg: { wrapper: 'w-14 h-14 sm:w-16 sm:h-16 rounded-2xl', dim: 64, clubSize: 'sm', text: 'text-sm' },
  xl: { wrapper: 'w-20 h-20 rounded-2xl', dim: 80, clubSize: 'sm', text: 'text-base' },
};

export const PlayerAvatar: React.FC<PlayerAvatarProps> = memo(
  ({
    playerId,
    name,
    team = '',
    photoUrl,
    rating,
    jerseyNumber,
    size = 'lg',
    showClubBadge = true,
    showRatingBadge = false,
    className = '',
  }) => {
    const [imgFailed, setImgFailed] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);

    const normalizedName = (name || '').trim().toLowerCase();
    const resolvedPhotoUrl =
      resolveKnownPlayerHeadshot(name) ||
      photoUrl ||
      KNOWN_PLAYER_HEADSHOTS[normalizedName] ||
      (playerId && playerId < 9000
        ? `https://media.api-sports.io/football/players/${playerId}.png`
        : null);

    const kit = getClubKitPalette(team);
    const sizeCfg = SIZE_CLASSES[size] || SIZE_CLASSES.lg;
    const initials = (name || 'P')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('');

    const hash = normalizedName.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const skinTones = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'];
    const skinColor = skinTones[hash % skinTones.length];
    const hairColors = ['#111827', '#27272a', '#451a03', '#78350f', '#d97706'];
    const hairColor = hairColors[(hash * 3) % hairColors.length];

    return (
      <div className={`relative inline-flex flex-shrink-0 select-none ${className}`}>
        <div
          className={`relative overflow-hidden bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border border-border/80 dark:border-slate-700/80 shadow-xs flex items-end justify-center ${sizeCfg.wrapper}`}
          title={`${name}${team ? ` (${team})` : ''}`}
        >
          {/* Ambient Stadium Rim Glow */}
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 25%, ${kit.primary}, transparent 72%)`,
            }}
          />

          {/* Illustrated Athletic Kit & Portrait Backdrop (always rendered as base & zero-broken-image fallback) */}
          <svg
            viewBox="0 0 64 64"
            className={`w-full h-full transition-opacity duration-200 ${
              resolvedPhotoUrl && !imgFailed && imgLoaded ? 'opacity-0 absolute inset-0' : 'opacity-100'
            }`}
            aria-hidden="true"
          >
            {/* Kit Shoulders & Torso */}
            <path
              d="M10 64 C10 47, 20 42, 32 42 C44 42, 54 47, 54 64 Z"
              fill={kit.primary}
            />
            {kit.pattern === 'stripes' && (
              <g fill={kit.secondary} opacity="0.85">
                <rect x="21" y="43" width="5" height="21" />
                <rect x="30" y="42" width="5" height="22" />
                <rect x="39" y="43" width="5" height="21" />
              </g>
            )}
            {kit.pattern === 'hoops' && (
              <g fill={kit.secondary} opacity="0.85">
                <rect x="14" y="47" width="36" height="4" />
                <rect x="11" y="55" width="42" height="4" />
              </g>
            )}
            {kit.pattern === 'sleeves' && (
              <g fill={kit.secondary}>
                <path d="M10 64 C10 51, 15 46, 21 44 L21 64 Z" />
                <path d="M54 64 C54 51, 49 46, 43 44 L43 64 Z" />
              </g>
            )}
            {kit.pattern === 'sash' && (
              <polygon points="20,43 26,42 44,64 38,64" fill={kit.secondary} opacity="0.88" />
            )}
            {/* V-Neck Collar */}
            <polygon points="26,42 32,49 38,42" fill={kit.accent} opacity="0.9" />
            {/* Neck */}
            <rect x="28" y="34" width="8" height="10" rx="3" fill={skinColor} />
            {/* Head */}
            <ellipse cx="32" cy="25" rx="10.5" ry="12" fill={skinColor} />
            {/* Hair Silhouette */}
            <path
              d="M21.5 23 C21.5 14, 26 11, 32 11 C38 11, 42.5 14, 42.5 23 C40 18, 36 16.5, 32 16.5 C28 16.5, 24 18, 21.5 23 Z"
              fill={hairColor}
            />
            {/* Subtle Initials or Jersey Number on Kit Chest */}
            <text
              x="32"
              y="59"
              textAnchor="middle"
              fill={kit.primary === '#f8fafc' ? '#0f172a' : '#ffffff'}
              className="font-mono font-black"
              fontSize="10"
            >
              {jerseyNumber ? `#${jerseyNumber}` : initials}
            </text>
          </svg>

          {/* Official Player Headshot Photo */}
          {resolvedPhotoUrl && !imgFailed && (
            <img
              src={resolvedPhotoUrl}
              alt={`${name} football player portrait`}
              width={sizeCfg.dim}
              height={sizeCfg.dim}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgFailed(true)}
              className={`relative z-10 w-full h-full object-cover object-top transition-opacity duration-200 ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}
        </div>

        {/* Mini Club Badge Overlay (Bottom-Right) */}
        {showClubBadge && team && size !== 'xs' && (
          <div className="absolute -bottom-1 -right-1 z-20 rounded-full ring-2 ring-background shadow-xs">
            <TeamLogo team={team} size={sizeCfg.clubSize} />
          </div>
        )}

        {/* Optional Rating Pill Overlay (Top-Left) */}
        {showRatingBadge && typeof rating === 'number' && (
          <span
            className="absolute -top-1.5 -left-1.5 z-20 px-1.5 py-0.5 rounded-md bg-emerald-600 text-white font-mono tabular-nums text-[10px] font-black leading-none shadow-xs ring-1 ring-background"
            title={`Season Rating: ${rating.toFixed(1)}`}
          >
            {rating.toFixed(1)}
          </span>
        )}
      </div>
    );
  }
);

PlayerAvatar.displayName = 'PlayerAvatar';
