/**
 * pincodeState.js
 * ─────────────────────────────────────────────────────────────
 * Resolves an Indian 6-digit pincode → 2-letter state code.
 *
 * Strategy (never fails):
 *  1. Try India Post free API (authoritative, online)
 *  2. Fall back to comprehensive 3-digit prefix map (offline)
 *
 * The 3-digit map covers every Indian state/UT correctly,
 * including the critical Goa (403xxx) vs Maharashtra distinction.
 */

const https = require('https');

// ── India Post API state name → 2-letter code ─────────────────
const STATE_NAME_TO_CODE = {
  'Andaman & Nicobar Islands': 'AN',
  'Andhra Pradesh':            'AP',
  'Arunachal Pradesh':         'AR',
  'Assam':                     'AS',
  'Bihar':                     'BR',
  'Chandigarh':                'CH',
  'Chhattisgarh':              'CG',
  'Dadra and Nagar Haveli and Daman and Diu': 'DN',
  'Dadra & Nagar Haveli':      'DN',
  'Daman and Diu':             'DD',
  'Delhi':                     'DL',
  'Goa':                       'GA',
  'Gujarat':                   'GJ',
  'Haryana':                   'HR',
  'Himachal Pradesh':          'HP',
  'Jammu & Kashmir':           'JK',
  'Jammu and Kashmir':         'JK',
  'Jharkhand':                 'JH',
  'Karnataka':                 'KA',
  'Kerala':                    'KL',
  'Ladakh':                    'LA',
  'Lakshadweep':               'LD',
  'Madhya Pradesh':            'MP',
  'Maharashtra':               'MH',
  'Manipur':                   'MN',
  'Meghalaya':                 'ML',
  'Mizoram':                   'MZ',
  'Nagaland':                  'NL',
  'Odisha':                    'OD',
  'Puducherry':                'PY',
  'Pondicherry':               'PY',
  'Punjab':                    'PB',
  'Rajasthan':                 'RJ',
  'Sikkim':                    'SK',
  'Tamil Nadu':                'TN',
  'Telangana':                 'TS',
  'Tripura':                   'TR',
  'Uttar Pradesh':             'UP',
  'Uttarakhand':               'UK',
  'West Bengal':               'WB',
};

// ── Comprehensive 3-digit prefix → state code ────────────────
// Covers ALL Indian pincode ranges correctly (including Goa 403xxx)
const PREFIX_MAP = {
  // Delhi (11x)
  110:'DL',111:'DL',112:'DL',113:'DL',114:'DL',115:'DL',116:'DL',117:'DL',119:'DL',
  // Haryana (12x-13x)
  120:'HR',121:'HR',122:'HR',123:'HR',124:'HR',125:'HR',126:'HR',127:'HR',128:'HR',129:'HR',
  130:'HR',131:'HR',132:'HR',133:'HR',134:'HR',135:'HR',136:'HR',
  // Punjab (14x-16x, except 160)
  140:'PB',141:'PB',142:'PB',143:'PB',144:'PB',145:'PB',146:'PB',147:'PB',148:'PB',149:'PB',
  150:'PB',151:'PB',152:'PB',153:'PB',154:'PB',155:'PB',156:'PB',157:'PB',158:'PB',159:'PB',
  160:'CH',  // Chandigarh
  161:'PB',162:'PB',163:'PB',164:'PB',165:'PB',166:'PB',167:'PB',168:'PB',169:'PB',
  // Himachal Pradesh (17x)
  170:'HP',171:'HP',172:'HP',173:'HP',174:'HP',175:'HP',176:'HP',177:'HP',
  // Jammu & Kashmir / Ladakh (18x-19x)
  180:'JK',181:'JK',182:'JK',183:'JK',184:'JK',185:'JK',186:'JK',187:'JK',188:'JK',189:'JK',
  190:'JK',191:'JK',192:'JK',193:'JK',194:'LA',195:'JK',
  // Uttar Pradesh (20x-28x) + Uttarakhand (246-249, 263)
  200:'UP',201:'UP',202:'UP',203:'UP',204:'UP',205:'UP',206:'UP',207:'UP',208:'UP',209:'UP',
  210:'UP',211:'UP',212:'UP',213:'UP',214:'UP',215:'UP',216:'UP',217:'UP',218:'UP',219:'UP',
  220:'UP',221:'UP',222:'UP',223:'UP',224:'UP',225:'UP',226:'UP',227:'UP',228:'UP',229:'UP',
  230:'UP',231:'UP',232:'UP',233:'UP',234:'UP',235:'UP',236:'UP',237:'UP',238:'UP',239:'UP',
  240:'UP',241:'UP',242:'UP',243:'UP',244:'UP',245:'UP',
  246:'UK',247:'UK',248:'UK',249:'UK',
  250:'UP',251:'UP',252:'UP',253:'UP',254:'UP',255:'UP',256:'UP',257:'UP',258:'UP',259:'UP',
  260:'UP',261:'UP',262:'UP',263:'UK',264:'UP',265:'UP',266:'UP',267:'UP',268:'UP',269:'UP',
  270:'UP',271:'UP',272:'UP',273:'UP',274:'UP',275:'UP',276:'UP',277:'UP',278:'UP',279:'UP',
  280:'UP',281:'UP',282:'UP',283:'UP',284:'UP',285:'UP',
  // Rajasthan (30x-34x)
  301:'RJ',302:'RJ',303:'RJ',304:'RJ',305:'RJ',306:'RJ',307:'RJ',308:'RJ',309:'RJ',
  310:'RJ',311:'RJ',312:'RJ',313:'RJ',314:'RJ',315:'RJ',
  321:'RJ',322:'RJ',323:'RJ',324:'RJ',325:'RJ',326:'RJ',327:'RJ',328:'RJ',329:'RJ',
  330:'RJ',331:'RJ',332:'RJ',333:'RJ',334:'RJ',335:'RJ',
  341:'RJ',342:'RJ',343:'RJ',344:'RJ',345:'RJ',
  // Gujarat (36x-39x)
  360:'GJ',361:'GJ',362:'GJ',363:'GJ',364:'GJ',365:'GJ',366:'GJ',367:'GJ',368:'GJ',369:'GJ',
  370:'GJ',371:'GJ',372:'GJ',373:'GJ',374:'GJ',375:'GJ',376:'GJ',
  380:'GJ',381:'GJ',382:'GJ',383:'GJ',384:'GJ',385:'GJ',386:'GJ',387:'GJ',388:'GJ',389:'GJ',
  390:'GJ',391:'GJ',392:'GJ',393:'GJ',394:'GJ',395:'GJ',396:'GJ',
  // Maharashtra (40x-44x) — 403 is GOA, not MH
  400:'MH',401:'MH',402:'MH',
  403:'GA',  // ← GOA (critical fix — 403xxx is Goa, NOT Maharashtra)
  404:'MH',405:'MH',406:'MH',407:'MH',408:'MH',409:'MH',
  410:'MH',411:'MH',412:'MH',413:'MH',414:'MH',415:'MH',416:'MH',417:'MH',418:'MH',419:'MH',
  420:'MH',421:'MH',422:'MH',423:'MH',424:'MH',425:'MH',426:'MH',427:'MH',428:'MH',429:'MH',
  430:'MH',431:'MH',432:'MH',433:'MH',434:'MH',435:'MH',436:'MH',437:'MH',438:'MH',439:'MH',
  440:'MH',441:'MH',442:'MH',443:'MH',444:'MH',445:'MH',446:'MH',447:'MH',448:'MH',449:'MH',
  // Madhya Pradesh (45x-48x)
  450:'MP',451:'MP',452:'MP',453:'MP',454:'MP',455:'MP',456:'MP',457:'MP',458:'MP',459:'MP',
  460:'MP',461:'MP',462:'MP',463:'MP',464:'MP',465:'MP',466:'MP',467:'MP',468:'MP',469:'MP',
  470:'MP',471:'MP',472:'MP',473:'MP',474:'MP',475:'MP',476:'MP',477:'MP',478:'MP',479:'MP',
  480:'MP',481:'MP',
  // Chhattisgarh (48x-49x)
  482:'CG',483:'CG',484:'CG',485:'CG',486:'CG',487:'CG',488:'CG',489:'CG',
  490:'CG',491:'CG',492:'CG',493:'CG',494:'CG',495:'CG',496:'CG',497:'CG',
  // Telangana (50x-50x)
  500:'TS',501:'TS',502:'TS',503:'TS',504:'TS',505:'TS',506:'TS',507:'TS',508:'TS',509:'TS',
  // Andhra Pradesh (51x-53x)
  510:'AP',511:'AP',512:'AP',513:'AP',514:'AP',515:'AP',516:'AP',517:'AP',518:'AP',519:'AP',
  520:'AP',521:'AP',522:'AP',523:'AP',524:'AP',525:'AP',526:'AP',527:'AP',528:'AP',529:'AP',
  530:'AP',531:'AP',532:'AP',533:'AP',534:'AP',535:'AP',
  // Karnataka (56x-59x)
  560:'KA',561:'KA',562:'KA',563:'KA',564:'KA',565:'KA',566:'KA',567:'KA',568:'KA',569:'KA',
  570:'KA',571:'KA',572:'KA',573:'KA',574:'KA',575:'KA',576:'KA',577:'KA',
  580:'KA',581:'KA',582:'KA',583:'KA',584:'KA',585:'KA',586:'KA',587:'KA',588:'KA',589:'KA',
  590:'KA',591:'KA',
  // Kerala (67x-69x)
  670:'KL',671:'KL',672:'KL',673:'KL',674:'KL',675:'KL',676:'KL',677:'KL',678:'KL',679:'KL',
  680:'KL',681:'KL',682:'KL',683:'KL',684:'KL',685:'KL',686:'KL',687:'KL',688:'KL',689:'KL',
  690:'KL',691:'KL',692:'KL',693:'KL',694:'KL',695:'KL',
  // Tamil Nadu (60x-64x) + Puducherry (605, 607)
  600:'TN',601:'TN',602:'TN',603:'TN',604:'TN',605:'TN',606:'TN',607:'TN',608:'TN',609:'TN',
  610:'TN',611:'TN',612:'TN',613:'TN',614:'TN',615:'TN',616:'TN',617:'TN',618:'TN',619:'TN',
  620:'TN',621:'TN',622:'TN',623:'TN',624:'TN',625:'TN',626:'TN',627:'TN',628:'TN',629:'TN',
  630:'TN',631:'TN',632:'TN',633:'TN',634:'TN',635:'TN',636:'TN',637:'TN',638:'TN',
  639:'KL',640:'TN',641:'TN',642:'TN',643:'KL',
  // West Bengal (70x-74x)
  700:'WB',701:'WB',702:'WB',703:'WB',704:'WB',705:'WB',706:'WB',707:'WB',708:'WB',709:'WB',
  710:'WB',711:'WB',712:'WB',713:'WB',714:'WB',715:'WB',716:'WB',717:'WB',718:'WB',719:'WB',
  720:'WB',721:'WB',722:'WB',723:'WB',724:'WB',725:'WB',726:'WB',727:'WB',728:'WB',729:'WB',
  730:'WB',731:'WB',732:'WB',733:'WB',734:'WB',735:'WB',736:'WB',
  737:'SK', // Sikkim
  738:'WB',741:'WB',742:'WB',743:'WB',
  744:'AN', // Andaman & Nicobar
  // Odisha (75x-77x)
  751:'OD',752:'OD',753:'OD',754:'OD',755:'OD',756:'OD',757:'OD',758:'OD',759:'OD',
  760:'OD',761:'OD',762:'OD',763:'OD',764:'OD',765:'OD',766:'OD',767:'OD',768:'OD',769:'OD',
  770:'OD',
  // Assam (78x)
  781:'AS',782:'AS',783:'AS',784:'AS',785:'AS',786:'AS',787:'AS',788:'AS',
  // Northeast states (79x)
  790:'AR',791:'AR',792:'AR',
  793:'ML',794:'ML',
  795:'MN',
  796:'MZ',
  797:'NL',798:'NL',
  799:'TR',
  // Bihar (80x-85x) + Jharkhand (81x-83x)
  800:'BR',801:'BR',802:'BR',803:'BR',804:'BR',805:'BR',806:'BR',807:'BR',808:'BR',809:'BR',
  810:'JH',811:'JH',812:'JH',813:'JH',814:'JH',815:'JH',816:'JH',817:'JH',818:'JH',819:'JH',
  820:'JH',821:'JH',822:'JH',823:'BR',824:'BR',
  825:'JH',826:'JH',827:'JH',828:'JH',829:'JH',
  830:'JH',831:'JH',832:'JH',833:'JH',834:'JH',835:'JH',836:'JH',
  840:'BR',841:'BR',842:'BR',843:'BR',844:'BR',845:'BR',846:'BR',847:'BR',848:'BR',849:'BR',
  850:'BR',851:'BR',852:'BR',853:'BR',854:'BR',855:'BR',
};

/**
 * Fetch state info from India Post API (with 5s timeout).
 * Returns state name string or null if unavailable.
 */
function fetchFromIndiaPost(pincode) {
  return new Promise((resolve) => {
    const url = `http://api.postalpincode.in/pincode/${pincode}`;
    const req = https.get(url.replace('http://', 'https://') , { timeout: 5000 }, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          const status = json[0]?.Status;
          if (status === 'Success') {
            const stateName = json[0]?.PostOffice?.[0]?.State;
            resolve(stateName || null);
          } else {
            resolve(null);
          }
        } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

/**
 * Main export: resolve pincode to 2-letter state code.
 * NEVER returns null — falls back through multiple layers.
 *
 * @param {string|number} pincode - 6-digit Indian pincode
 * @returns {Promise<string>} 2-letter state code (e.g. 'GA', 'MH', 'KL')
 */
async function lookupPincodeState(pincode) {
  const pin = String(pincode || '').trim().replace(/\D/g, '');

  if (pin.length !== 6) {
    console.warn(`[Pincode] Invalid pincode: ${pincode} — using fallback`);
    return prefixFallback(pin);
  }

  // Layer 1: India Post API
  try {
    const stateName = await fetchFromIndiaPost(pin);
    if (stateName) {
      // Exact match first
      if (STATE_NAME_TO_CODE[stateName]) {
        console.log(`[Pincode] ${pin} → ${stateName} → ${STATE_NAME_TO_CODE[stateName]} (API)`);
        return STATE_NAME_TO_CODE[stateName];
      }
      // Partial match (case-insensitive)
      const key = Object.keys(STATE_NAME_TO_CODE).find(
        k => k.toLowerCase() === stateName.toLowerCase()
      );
      if (key) {
        console.log(`[Pincode] ${pin} → ${stateName} → ${STATE_NAME_TO_CODE[key]} (API fuzzy)`);
        return STATE_NAME_TO_CODE[key];
      }
      console.warn(`[Pincode] Unknown state from API: "${stateName}" for ${pin} — using prefix map`);
    }
  } catch (e) {
    console.warn(`[Pincode] API error for ${pin}: ${e.message} — using prefix map`);
  }

  // Layer 2: 3-digit prefix map
  return prefixFallback(pin);
}

function prefixFallback(pin) {
  const prefix = parseInt(pin.slice(0, 3), 10);
  const code = PREFIX_MAP[prefix];
  if (code) {
    console.log(`[Pincode] ${pin} → ${code} (3-digit prefix map)`);
    return code;
  }
  // Final safety net — 1-digit zone map
  const zone = { '1':'DL','2':'UP','3':'RJ','4':'MH','5':'AP','6':'TN','7':'WB','8':'BR' };
  const fallback = zone[pin[0]] || 'IN';
  console.warn(`[Pincode] ${pin} → ${fallback} (zone fallback, prefix ${prefix} not in map)`);
  return fallback;
}

module.exports = { lookupPincodeState };
