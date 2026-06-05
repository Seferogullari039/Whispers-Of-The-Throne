import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { enrichCardResults } from "./result-texts.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const imageKeyData = JSON.parse(
  readFileSync(join(__dirname, "..", "data", "card-image-keys.json"), "utf8"),
);
const sceneData = JSON.parse(
  readFileSync(join(__dirname, "..", "data", "scene-descriptions.json"), "utf8"),
);

function applyImageKey(cardData) {
  const imageKey = cardData.imageKey ?? imageKeyData.cards[cardData.id];
  return imageKey ? { ...cardData, imageKey } : cardData;
}

function applySceneDescription(cardData) {
  const sceneDescription =
    cardData.sceneDescription ?? sceneData.cards[cardData.id];
  return sceneDescription ? { ...cardData, sceneDescription } : cardData;
}

const ART_STYLE_SUFFIX =
  "Reigns-style stylized 2D dark fantasy, painterly vector illustration, simplified shapes, mobile card game artwork, friendly dark fantasy, warm readable colors, portrait illustration, no photorealism, no realism, no 3D render, no text, no logo";

function stylizeImagePrompt(prompt) {
  if (!prompt) return prompt;
  let p = prompt
    .replace(/,?\s*stylized 2D dark fantasy[^\n"]*/gi, "")
    .replace(/,?\s*no photorealism[^\n"]*/gi, "")
    .replace(/^Cinematic vertical card art,?\s*/i, "")
    .trim();
  if (p.endsWith(",")) p = p.slice(0, -1);
  return `${p}, ${ART_STYLE_SUFFIX}`;
}

function card(
  id,
  title,
  description,
  leftLabel,
  leftEffects,
  rightLabel,
  rightEffects,
  extra = {},
) {
  return {
    id,
    title,
    description,
    effects: {},
    leftChoice: { label: leftLabel, effects: leftEffects, ...(extra.leftExtra || {}) },
    rightChoice: { label: rightLabel, effects: rightEffects, ...(extra.rightExtra || {}) },
    ...extra.card,
  };
}

const introCards = [
  card(
    "orphan-crumbs",
    "Cenaze Kırıntıları",
    "Hizmetkârlar ziyafet artıklarını sokağa atıyor. Bu gece saray kapıları cenaze için açık; kalabalıkta kaybolabilirsin.",
    "Yas tutanların arasına karış",
    { influence: 6, suspicion: 6 },
    "Gölgede kal ve dinle",
    { suspicion: -6, loyalty: 5 },
    {
      card: {
        act: [1],
        tags: ["street", "chain"],
        imagePrompt:
          "Cinematic vertical card art, muddy orphan alley at night, palace funeral torches in distance, child hiding among mourners in black robes, warm firelight, moody Ottoman fantasy",
      },
    },
  ),
  card(
    "orphan-gate",
    "Boş Sefir Koltuğu",
    "Sütun gölgesinden sefirin tabutunu görüyorsun. Bir katip fısıldıyor: taht kanla ya da ilk haftada ayakta kalanla seçilecek.",
    "Soyluların yüzünü ezberle",
    { influence: 8, suspicion: 4 },
    "Katibin mührünü çal",
    { wealth: 6, suspicion: 10, loyalty: -6 },
    {
      card: {
        act: [1, 2],
        tags: ["court", "chain"],
        imagePrompt:
          "Cinematic vertical card art, grand palace gate at dusk, empty vizier throne draped in black, scribe with wax seal, tense courtiers, golden Ottoman architecture",
      },
    },
  ),
  card(
    "thief-mark",
    "Sefir Mührü",
    "Lonca efendin ölü sefirin mührünü getiriyor. Takıp yukarı çıkabilir ya da pazarda satabilirsin.",
    "Mührü sakla",
    { influence: 8, suspicion: 8, wealth: -4 },
    "Sessizce sat",
    { wealth: 10, influence: -6, loyalty: -6 },
    {
      card: {
        act: [1, 2],
        tags: ["street", "trade"],
        imagePrompt:
          "Cinematic vertical card art, thief guild master offering heavy bronze vizier seal, candlelit back room, stolen goods and silk, dark market atmosphere",
      },
    },
  ),
  card(
    "thief-patron",
    "Maskeli Patron",
    "Bir patron, sefirin Savaş Bakanı tarafından zehirlendiği söylentisini yayman için altın teklif ediyor.",
    "Söylentiyi yay",
    { influence: 8, suspicion: 6, loyalty: -6 },
    "Önce kanıt iste",
    { suspicion: -8, wealth: -4, influence: 5 },
    {
      card: {
        act: [1, 2],
        tags: ["street", "spy"],
        imagePrompt:
          "Cinematic vertical card art, masked velvet patron in shadowed tavern booth, gold coins on table, whispered conspiracy, noir Ottoman intrigue",
      },
    },
  ),
  card(
    "dock-signal",
    "Liman İşaretleri",
    "Ufukta üç gemi yanıyor. Liman efendisi saray uyurken seni hamalları toplamaya çağırıyor.",
    "Şafakta iskeleyi topla",
    { loyalty: 10, influence: 4, wealth: -6 },
    "Gönüllülerle denize çık",
    { influence: 6, suspicion: 8, loyalty: 6 },
    {
      card: {
        act: [2],
        tags: ["dock"],
        imagePrompt:
          "Cinematic vertical card art, harbor at dawn with burning ships on horizon, dock workers and ropes, harbor master shouting orders, smoke over water",
      },
    },
  ),
  card(
    "dock-manifest",
    "Gizli Manifesto",
    "Tapınak tütsüsü diye işaretli bir sandık var; içi ağır. Saraya bildir ya da sat.",
    "Saraya bildir",
    { influence: 8, loyalty: 6, wealth: -4 },
    "Yükü sessizce sat",
    { wealth: 10, suspicion: 8, loyalty: -8 },
    {
      card: {
        act: [2],
        tags: ["dock", "trade"],
        imagePrompt:
          "Cinematic vertical card art, heavy crate on wet dock planks labeled with temple incense, smuggler manifest, moonlit harbor cranes",
      },
    },
  ),
  card(
    "temple-vigil",
    "Cenaze Tevhidi",
    "Yüksek rahip hangi lordun ağladığını, hangisinin hesap yaptığını yazmanı istiyor.",
    "Her şeyi yaz",
    { loyalty: 8, suspicion: 6, influence: 4 },
    "Güçlüleri yağla",
    { influence: 8, loyalty: -8, suspicion: -4 },
    {
      card: {
        act: [1],
        tags: ["temple"],
        imagePrompt:
          "Cinematic vertical card art, temple vigil with incense smoke, high priest and quill, nobles weeping or scheming in candlelight, sacred Ottoman basilica",
      },
    },
  ),
  card(
    "temple-seal",
    "Sunak Altındaki Mühür",
    "Gizli bir mühür buldun: sefirin son itirafı, üç komployu adıyla yazıyor.",
    "Ayinde oku",
    { influence: 10, suspicion: 12, loyalty: 4 },
    "Koz için sakla",
    { influence: 6, suspicion: -6, wealth: 4 },
    {
      card: {
        act: [1],
        tags: ["temple"],
        imagePrompt:
          "Cinematic vertical card art, hidden wax seal beneath altar stone, confession scroll with names, flickering sacred lamps, tense monk discovering secret",
      },
    },
  ),
  card(
    "arena-roar",
    "Arena Kükremesi",
    "Yirmi bin kişi şampiyonun adını haykırıyor. Altın locadan bir imparatorluk elçisi izliyor.",
    "Yalnızca elçiye eğil",
    { influence: 8, loyalty: -4, suspicion: 2 },
    "Kalabalığı kışkırt",
    { loyalty: 10, influence: 4, suspicion: 8 },
    {
      card: {
        act: [1],
        tags: ["arena"],
        imagePrompt:
          "Cinematic vertical card art, massive sand arena roaring crowd, broken champion in pit, imperial envoy in golden box, blood and dust",
      },
    },
  ),
  card(
    "arena-patron",
    "Kumun Patronu",
    "Peçeli bir patron, dövüşlerin Savaş Bakanı tarafından ayarlandığını suçlarsan seni destekleyeceğini söylüyor.",
    "Bakana suçla",
    { influence: 10, suspicion: 8, wealth: 4 },
    "Reddet, gizlice antrenman yap",
    { loyalty: 8, influence: -4, suspicion: -6 },
    {
      card: {
        act: [1],
        tags: ["arena", "court"],
        imagePrompt:
          "Cinematic vertical card art, veiled arena patron in private tunnel beneath colosseum, gladiator training shadows, political conspiracy",
      },
    },
  ),
];

const commonCards = [
  card(
    "vizier-procession",
    "Sefir Alayı",
    "Sefirin cesedi sokaktan geçiyor. Hadımlar az ağlayanı not alıyor.",
    "Yüksek sesle yas tut",
    { loyalty: 8, suspicion: 6 },
    "Kalabalığa karışıp kaybol",
    { suspicion: -8, wealth: 4 },
    {
      card: {
        act: [1],
        tags: ["street", "court"],
        imagePrompt:
          "Cinematic vertical card art, vizier funeral procession through narrow streets, black banners, weeping nobles and spying servants",
      },
    },
  ),
  card(
    "spymaster-audience",
    "Casusbaşının Defteri",
    "Casusbaşı bodrumda geçmişinin defterini açıyor. Gerçek mi uydurma mı belli değil.",
    "Defteri yak",
    { suspicion: -10, loyalty: 8 },
    "Ağına altın ver",
    { wealth: -8, influence: 10, suspicion: 6 },
    {
      card: {
        act: [2],
        tags: ["spy"],
        imagePrompt:
          "Cinematic vertical card art, spymaster in candlelit dungeon with ledger of secrets, dagger and wine, smoky intelligence network",
      },
    },
  ),
  card(
    "hungry-winter",
    "Kış Kıtlığı",
    "Ambarlar mühürlenirken saray ziyafet çekiyor. Su kemerinin ötesinde halk aç.",
    "Ambarları aç",
    { wealth: -10, loyalty: 10 },
    "Tahılı yabancılara sat",
    { wealth: 10, loyalty: -10, suspicion: 5 },
    {
      card: {
        act: [3],
        tags: ["trade"],
        imagePrompt:
          "Cinematic vertical card art, snow-covered city with sealed grain silos, starving crowd beyond aqueduct, palace feast lights contrast",
      },
    },
  ),
  card(
    "exiled-heir",
    "Sürgün Prens",
    "Sürgündeki prens sınırda kılıç adamları topluyor diye şifreli haber geldi.",
    "Sarayda ihbar et",
    { influence: 8, suspicion: -4, loyalty: -6 },
    "Köprü altında buluş",
    { influence: -6, suspicion: 10, wealth: 6 },
    {
      card: {
        act: [3],
        tags: ["court", "spy"],
        imagePrompt:
          "Cinematic vertical card art, secret message about exiled prince, bridge meeting at night, hooded messengers and distant border fires",
      },
    },
  ),
  card(
    "bishop-blessing",
    "Patrik Kutsaması",
    "Patrik maaşının yarısını kutsal ondalık istiyor. Ödersen seni kutsar.",
    "Ondalığı öde",
    { wealth: -8, loyalty: 10 },
    "Kutsal emanetleri tehdit et",
    { influence: 8, loyalty: -8, suspicion: 6 },
    {
      card: {
        act: [3],
        tags: ["temple", "court"],
        imagePrompt:
          "Cinematic vertical card art, patriarch demanding tithe in dark basilica, golden chalice, ambitious courtier kneeling",
      },
    },
  ),
  card(
    "assassin-in-hall",
    "Salondaki Hançer",
    "Muhafızlar sefir arması oyulmuş hançerle bir mutfak çocuğunu sürüklüyor.",
    "İsimler için kır",
    { suspicion: -10, loyalty: -6, influence: 6 },
    "Uyarıyla serbest bırak",
    { loyalty: 10, suspicion: 8, influence: -4 },
    {
      card: {
        act: [4],
        tags: ["court"],
        imagePrompt:
          "Cinematic vertical card art, marble palace hall, guards dragging kitchen boy with vizier dagger, tense nobles watching",
      },
    },
  ),
  card(
    "trade-fleet",
    "İpek Filosu",
    "Sahte evrakla bir tüccar armadası limana yanaşıyor.",
    "Filoyu el koy",
    { wealth: 10, influence: -6, loyalty: -5 },
    "Evrak ver, geçir",
    { wealth: -5, influence: 10, loyalty: 6 },
    {
      card: {
        act: [2],
        tags: ["dock", "trade"],
        imagePrompt:
          "Cinematic vertical card art, silk merchant fleet at harbor, forged imperial documents, customs officers debating",
      },
    },
  ),
  card(
    "queen-mother",
    "Validenin Çağrısı",
    "İmparatorun annesi seni çağırıyor. Müttefik mi merak mı, belli değil.",
    "Diz çök ve dinle",
    { loyalty: 8, influence: -6, suspicion: -5 },
    "Özelde meydan oku",
    { influence: 10, loyalty: -10, suspicion: 4 },
    {
      card: {
        act: [4],
        tags: ["court"],
        imagePrompt:
          "Cinematic vertical card art, queen mother on mirrored throne, cold appraisal, young vizier aspirant in ornate salon",
      },
    },
  ),
  card(
    "tax-revolt",
    "Vergi İsyanı",
    "Katipler vergiyi artırdı. Tüccarlar divanda sesini duyurmak istiyor.",
    "Tüccarların yanında dur",
    { wealth: 6, influence: 6, loyalty: -8 },
    "Yeni vergiyi uygula",
    { loyalty: 8, influence: 4, wealth: -6 },
    {
      card: {
        act: [3],
        tags: ["trade", "street"],
        imagePrompt:
          "Cinematic vertical card art, angry merchants outside tax office, scribes with ledgers, riot brewing in market square",
      },
    },
  ),
  card(
    "servants-tale",
    "Hizmetkâr Dedikodusu",
    "Ev hizmetlileri dedikodu satıyor: sefirin ölümü Savaş Bakanının odasına bağlanıyor.",
    "Dedikoduyu yay",
    { influence: 8, suspicion: 8 },
    "Sessiz kalmaları için öde",
    { wealth: -6, suspicion: -8, loyalty: 4 },
    {
      card: {
        act: [4],
        tags: ["court", "spy"],
        imagePrompt:
          "Cinematic vertical card art, palace servants whispering in corridor, gossip for bread, shadow of war minister door",
      },
    },
  ),
  card(
    "grain-auction",
    "Tahıl Müzayedesi",
    "Müzayedeyi patron için ayarlayabilir ya da halkın almasına izin verebilirsin.",
    "Müzayedeyi ayarla",
    { wealth: 10, suspicion: 8, loyalty: -8 },
    "Halkın alsın",
    { loyalty: 10, wealth: -8, influence: 2 },
    {
      card: {
        act: [3],
        tags: ["trade", "street"],
        imagePrompt:
          "Cinematic vertical card art, grain auction hall, scales and sacks, patron fixing bids versus hungry crowd outside",
      },
    },
  ),
  card(
    "court-poet",
    "Saray Şairi",
    "Bir şair yükselişini dize döküyor. Gül ya da sustur.",
    "Herkese gül",
    { influence: 6, suspicion: -4 },
    "Sessizce sustur",
    { influence: 8, suspicion: 10, loyalty: -6 },
    {
      card: {
        act: [4],
        tags: ["court"],
        imagePrompt:
          "Cinematic vertical card art, court poet reciting satire in golden salon, nobles laughing or offended, quill and wine",
      },
    },
  ),
  card(
    "bridge-orphans",
    "Köprüdeki Çocuklar",
    "Çocuklar altın düşmezse alayı durduracak. Maske bir saat içinde geçecek.",
    "Altın saç",
    { wealth: -8, loyalty: 10 },
    "Muhafızlara temizlet",
    { influence: 5, loyalty: -10, suspicion: -4 },
    {
      card: {
        act: [1],
        tags: ["street"],
        imagePrompt:
          "Cinematic vertical card art, orphan children blocking ceremonial bridge, imperial procession waiting, coins scattered",
      },
    },
  ),
  card(
    "forged-decree",
    "Sahte Ferman",
    "Bir katip sahte imparatorluk emri sunuyor. Hazine açılır ya da asılırsın.",
    "Fermanı kullan",
    { wealth: 8, suspicion: 10 },
    "Katibi ele ver",
    { loyalty: 6, suspicion: -8, influence: 4 },
    {
      card: {
        act: [2],
        tags: ["spy", "court"],
        imagePrompt:
          "Cinematic vertical card art, nervous scribe with forged imperial decree, wax seal close-up, gallows shadow",
      },
    },
  ),
  card(
    "wine-cellar",
    "Şarap Mahzeni",
    "Sarhoş bir dük, cenaze muhafızına rüşvet verdiğini itiraf ediyor. Yalnızca sen duyuyorsun.",
    "Dükü şantajla",
    { wealth: 6, influence: 6, suspicion: 6 },
    "Casusbaşını uyar",
    { influence: 4, suspicion: -6, loyalty: -4 },
    {
      card: {
        act: [4],
        tags: ["court"],
        imagePrompt:
          "Cinematic vertical card art, wine cellar confession, drunken duke and resin wine jars, single listener in torchlight",
      },
    },
  ),
  card(
    "market-fire",
    "Pazar Yangını",
    "Alevler dükkan sırasını yiyor. Lonca defterleri mi, üst kattaki aileler mi?",
    "Defterleri kurtar",
    { wealth: 8, influence: 6, loyalty: -8 },
    "Aileleri kurtar",
    { loyalty: 10, wealth: -8, influence: 2 },
    {
      card: {
        act: [2],
        tags: ["street", "trade"],
        imagePrompt:
          "Cinematic vertical card art, market district fire at night, guild ledgers versus trapped families upstairs, heroic choice",
      },
    },
  ),
  card(
    "eunuch-envoy",
    "Hadım Elçi",
    "Saray elçisi hangi lorda hizmet ettiğini soruyor.",
    "Güçlü patron adı ver",
    { influence: 8, suspicion: 6 },
    "Yalnızca maskeye hizmet de",
    { loyalty: 6, influence: -4, suspicion: 8 },
    {
      card: {
        act: [4],
        tags: ["court"],
        imagePrompt:
          "Cinematic vertical card art, palace eunuch envoy interrogating young official, gilded antechamber, mask motif",
      },
    },
  ),
  card(
    "salt-riot",
    "Tuz İsyanı",
    "Hamallar vergi askerlerine tuz atıyor. Kan bir kötü karar uzağında.",
    "Askerleri ilerlet",
    { influence: 6, loyalty: -10, suspicion: -6 },
    "Ateşkes pazarlığı yap",
    { loyalty: 8, influence: 4, wealth: -6 },
    {
      card: {
        act: [2],
        tags: ["dock", "street"],
        imagePrompt:
          "Cinematic vertical card art, dock workers riot throwing salt at tax soldiers, city gate chaos, tense standoff",
      },
    },
  ),
  card(
    "library-flame",
    "Kütüphane Yangını",
    "Bir mum nüfus kayıtlarının yanına devrildi.",
    "Yanmasına izin ver",
    { wealth: 6, suspicion: 8, loyalty: -6 },
    "Kayıtları kurtar",
    { loyalty: 8, influence: 6, wealth: -4 },
    {
      card: {
        act: [3],
        tags: ["court"],
        imagePrompt:
          "Cinematic vertical card art, eastern library fire, census scrolls burning, scholar risking hand to save records",
      },
    },
  ),
  card(
    "midnight-coup",
    "Gece Darbesi",
    "Bir yüzbaşı Savaş Bakanının gece birlik hareket ettirdiğine yemin ediyor.",
    "Hemen tutukla",
    { influence: 8, suspicion: -8, loyalty: -4 },
    "Komployu tuzağa çek",
    { influence: 10, suspicion: 10, wealth: -6 },
    {
      card: {
        act: [4],
        tags: ["court", "spy"],
        imagePrompt:
          "Cinematic vertical card art, midnight palace corridors, captain reporting troop movement, coup whispers before dawn",
      },
    },
  ),
];

const chainCards = [
  card(
    "the-wounded-boy",
    "Yaralı Çocuk",
    "Bir çocuk muhafız rozetini sıkıyor. Kurtarırsan tanık olur; geçersen unutursun.",
    "Güvenli eve götür",
    { wealth: -6, loyalty: 8, suspicion: 4 },
    "Sessizce geç",
    { influence: 4, loyalty: -6, suspicion: -4 },
    {
      card: {
        once: true,
        chainId: "wounded-boy",
        act: [1],
        tags: ["street", "chain"],
        imagePrompt:
          "Cinematic vertical card art, wounded boy clutching broken guard badge in ash district alley, choice to help or walk away",
      },
      leftExtra: {
        setFlags: { saved_wounded_boy: true },
        removeFlags: ["ignored_wounded_boy"],
      },
      rightExtra: {
        setFlags: { ignored_wounded_boy: true },
        removeFlags: ["saved_wounded_boy"],
      },
    },
  ),
  card(
    "captain-remembers",
    "Kaptan Hatırlıyor",
    "Liman kaptanı kurtardığın çocuğa borçlu olduğunu söylüyor. Sefir mührü tartışılınca mızrak sunuyor.",
    "Mızrakları kabul et",
    { loyalty: 10, influence: 6, suspicion: 6 },
    "Yalnızca bilgi iste",
    { influence: 8, suspicion: -6, wealth: -4 },
    {
      card: {
        once: true,
        chainId: "wounded-boy",
        requirements: [{ flag: "saved_wounded_boy", equals: true }],
        act: [1, 2],
        tags: ["dock", "chain"],
        imagePrompt:
          "Cinematic vertical card art, harbor captain in tavern offering spears, grateful debt for saved child, lantern light",
      },
    },
  ),
  card(
    "cold-recognition",
    "Soğuk Tanıma",
    "Aynı kaptan çocuğu terk ettiğini gördü. Sessizliğinin bedeli var.",
    "Unutsun diye öde",
    { wealth: -8, suspicion: -8, influence: 4 },
    "Gözlerinin içine bak",
    { influence: 6, suspicion: 10, loyalty: -6 },
    {
      card: {
        once: true,
        chainId: "wounded-boy",
        requirements: [{ flag: "ignored_wounded_boy", equals: true }],
        act: [1, 2],
        tags: ["dock", "chain"],
        imagePrompt:
          "Cinematic vertical card art, captain blocking path at dawn, cold recognition, war minister spies in background",
      },
    },
  ),
  card(
    "veiled-informant",
    "Peçeli Muhbir",
    "Lağımda peçeli biri bıçak ve bilgi karşılığı masana oturmak istiyor.",
    "Ağına al",
    { wealth: -8, influence: 8, suspicion: 6 },
    "Reddet, ifşayı tehdit et",
    { influence: 4, suspicion: -6, loyalty: -4 },
    {
      card: {
        once: true,
        chainId: "informant",
        act: [2],
        tags: ["spy", "chain"],
        imagePrompt:
          "Cinematic vertical card art, veiled informant in sewer tunnel, knife and whispered secrets, spy network offer",
      },
      leftExtra: {
        setFlags: { hired_informant: true },
        removeFlags: ["refused_informant"],
      },
      rightExtra: {
        setFlags: { refused_informant: true },
        removeFlags: ["hired_informant"],
      },
    },
  ),
  card(
    "whispered-ledger",
    "Fısıldanan Defter",
    "Muhbir sefir defterinden bir sayfa veriyor: üç lord cenaze muhafızını geciktirmiş.",
    "Sarayda ifşa et",
    { influence: 10, suspicion: 8, loyalty: -4 },
    "Özelde şantaj yap",
    { wealth: 10, influence: 6, suspicion: 8 },
    {
      card: {
        once: true,
        chainId: "informant",
        requirements: [{ flag: "hired_informant", equals: true }],
        act: [2],
        tags: ["spy", "chain"],
        imagePrompt:
          "Cinematic vertical card art, informant sliding ledger page across table, three lord names, palace conspiracy",
      },
    },
  ),
  card(
    "closed-door",
    "Kapalı Kapı",
    "Muhbir kayboldu. Kapında uyarı: güvenli evini yakmazsan sahte tanıklık teklif ediliyor.",
    "Güvenli evi yak",
    { suspicion: -8, loyalty: -6, influence: 6 },
    "Casusbaşının bulmasına izin ver",
    { suspicion: 10, influence: 4, wealth: 6 },
    {
      card: {
        once: true,
        chainId: "informant",
        requirements: [{ flag: "refused_informant", equals: true }],
        act: [2],
        tags: ["spy", "chain"],
        imagePrompt:
          "Cinematic vertical card art, scratched warning on door, safe house burning choice, rival scribe threat",
      },
    },
  ),
  card(
    "guild-charter",
    "Lonca Senedi",
    "Lonca efendin sened sunuyor: ipeği vergiden kaçır ya da kaçakçıları ifşa et.",
    "Senedi imzala",
    { wealth: 8, suspicion: 8, influence: 4 },
    "Çeteyi ifşa et",
    { influence: 8, loyalty: 6, wealth: -6 },
    {
      card: {
        once: true,
        chainId: "merchant-guild",
        act: [2],
        tags: ["trade", "chain"],
        imagePrompt:
          "Cinematic vertical card art, merchant guild master with silk charter, smuggling choice, warehouse shadows",
      },
      leftExtra: {
        setFlags: { allied_guild: true },
        removeFlags: ["betrayed_guild"],
      },
      rightExtra: {
        setFlags: { betrayed_guild: true },
        removeFlags: ["allied_guild"],
      },
    },
  ),
  card(
    "guild-hidden-docks",
    "Gizli İskele",
    "Müttefiklerin gizli rıhtım açıyor. Savaş Bakanının müfettişleri geliyor.",
    "Müfettişlere rüşvet ver",
    { wealth: -8, suspicion: -6, influence: 4 },
    "Genç faktörü feda et",
    { influence: 8, suspicion: 8, loyalty: -8 },
    {
      card: {
        once: true,
        chainId: "merchant-guild",
        requirements: [{ flag: "allied_guild", equals: true }],
        act: [2],
        tags: ["dock", "trade", "chain"],
        imagePrompt:
          "Cinematic vertical card art, hidden dock at twilight, imperial inspectors approaching, smuggled silk crates",
      },
    },
  ),
  card(
    "guild-imperial-audit",
    "Lonca Denetimi",
    "Loncayı taça sattın. Şimdi tanık ol ya da darağacına git.",
    "İmparatorluk için tanık ol",
    { influence: 10, suspicion: 6, loyalty: -8 },
    "Lonca efendini uyar",
    { loyalty: 8, wealth: -8, suspicion: 10 },
    {
      card: {
        once: true,
        chainId: "merchant-guild",
        requirements: [{ flag: "betrayed_guild", equals: true }],
        act: [2],
        tags: ["trade", "court", "chain"],
        imagePrompt:
          "Cinematic vertical card art, imperial audit of merchant guild, witness stand or gallows, betrayed allies",
      },
    },
  ),
  card(
    "noble-feast",
    "Veldran Ziyafeti",
    "Veldran Evi ziyafete davet ediyor. Kabul edersen renklerini giyersin; reddedersen düşman olursun.",
    "Renkleri kabul et",
    { influence: 8, loyalty: 6, suspicion: 4 },
    "Nazikçe reddet",
    { suspicion: -6, influence: -4, loyalty: 4 },
    {
      card: {
        once: true,
        chainId: "noble-house",
        act: [3],
        tags: ["court", "chain"],
        imagePrompt:
          "Cinematic vertical card art, Veldran house feast invitation, crimson banners, poisoned chalice undertone",
      },
      leftExtra: {
        setFlags: { accepted_house: true },
        removeFlags: ["refused_house"],
      },
      rightExtra: {
        setFlags: { refused_house: true },
        removeFlags: ["accepted_house"],
      },
    },
  ),
  card(
    "noble-blood-oath",
    "Kan Yemini",
    "Lord Veldran atalarının önünde kan yemini sunuyor.",
    "Yemin et",
    { loyalty: 10, influence: 8, suspicion: 8 },
    "Şaka ile reddet",
    { influence: -6, suspicion: -4, wealth: 4 },
    {
      card: {
        once: true,
        chainId: "noble-house",
        requirements: [{ flag: "accepted_house", equals: true }],
        act: [4],
        tags: ["court", "chain"],
        imagePrompt:
          "Cinematic vertical card art, blood oath in noble gallery, ancestral portraits, ritual dagger",
      },
    },
  ),
  card(
    "noble-scandal",
    "Veldran Skandalı",
    "Evi reddettin. Şimdi sefirin şarabını zehirlediğin söylentisini yaydılar.",
    "Onların günahlarını sızdır",
    { influence: 8, suspicion: 8 },
    "Varise meydan oku",
    { influence: 6, loyalty: 8, wealth: -8 },
    {
      card: {
        once: true,
        chainId: "noble-house",
        requirements: [{ flag: "refused_house", equals: true }],
        act: [3],
        tags: ["court", "chain"],
        imagePrompt:
          "Cinematic vertical card art, scandal at Veldran gates, false poison accusation, dueling heirs",
      },
    },
  ),
  card(
    "temple-reliquary",
    "İlk İmparatorun Kabili",
    "Bir keşiş kutsal kabili gösteriyor. Çalarsan koz olur; ilan edersen meşruiyet kazanırsın.",
    "Kabili çal",
    { influence: 8, suspicion: 10, loyalty: -6 },
    "Müminlere ilan et",
    { loyalty: 10, influence: 4, wealth: -6 },
    {
      card: {
        once: true,
        chainId: "temple-secret",
        act: [4],
        tags: ["temple", "chain"],
        imagePrompt:
          "Cinematic vertical card art, first emperor reliquary bone, monk revealing sacred relic, theft or devotion",
      },
      leftExtra: {
        setFlags: { stole_relic: true },
        removeFlags: ["returned_relic"],
      },
      rightExtra: {
        setFlags: { returned_relic: true },
        removeFlags: ["stole_relic"],
      },
    },
  ),
  card(
    "temple-heresy",
    "Ketret Davası",
    "Engizisyon çaldığın kabili arıyor.",
    "Yüksek rahibi suçla",
    { influence: 8, suspicion: 10, loyalty: -8 },
    "İtiraf et, pazarlık yap",
    { wealth: -8, suspicion: -8, loyalty: 6 },
    {
      card: {
        once: true,
        chainId: "temple-secret",
        requirements: [{ flag: "stole_relic", equals: true }],
        act: [4],
        tags: ["temple", "chain"],
        imagePrompt:
          "Cinematic vertical card art, inquisition trial for stolen relic, high priest accused, heresy chamber",
      },
    },
  ),
  card(
    "temple-pilgrimage",
    "Hac Yolculuğu",
    "Kabili iade ettin. Hacılar saray dışında adını haykırıyor.",
    "Hacıları kucakla",
    { loyalty: 10, influence: 6, suspicion: 6 },
    "Eve gönder",
    { influence: 4, loyalty: -6, suspicion: -6 },
    {
      card: {
        once: true,
        chainId: "temple-secret",
        requirements: [{ flag: "returned_relic", equals: true }],
        act: [4],
        tags: ["temple", "chain"],
        imagePrompt:
          "Cinematic vertical card art, pilgrims chanting vizier name outside palace, returned relic blessing",
      },
    },
  ),
  card(
    "arena-challenge",
    "Kum Meydan Okuma",
    "Yabancı şampiyon imparatorluk sancağına tükürüyor. Kalabalık cevabını bekliyor.",
    "Kendin dövüş",
    { loyalty: 8, influence: 6, wealth: -6 },
    "Maçı altınla ayarla",
    { wealth: -8, influence: 8, suspicion: 8 },
    {
      card: {
        once: true,
        chainId: "arena-champion",
        act: [1],
        tags: ["arena", "chain"],
        imagePrompt:
          "Cinematic vertical card art, foreign champion spitting on imperial banner, sand arena crowd roaring",
      },
      leftExtra: {
        setFlags: { honored_crowd: true },
        removeFlags: ["fixed_fights"],
      },
      rightExtra: {
        setFlags: { fixed_fights: true },
        removeFlags: ["honored_crowd"],
      },
    },
  ),
  card(
    "arena-bloody-title",
    "Kanlı Unvan",
    "Dürüst dövüştün. Halk seni şampiyon diyor; Savaş Bakanı seni köpek sayıyor.",
    "Bakanın yüzüğünü öp",
    { influence: 8, loyalty: -8 },
    "Kalabalığa yemin et",
    { loyalty: 10, suspicion: 8, influence: 4 },
    {
      card: {
        once: true,
        chainId: "arena-champion",
        requirements: [{ flag: "honored_crowd", equals: true }],
        act: [4],
        tags: ["arena", "court", "chain"],
        imagePrompt:
          "Cinematic vertical card art, bloody arena champion facing war minister ring kiss or crowd oath",
      },
    },
  ),
  card(
    "arena-fixed-reckoning",
    "Ayarlanmış Dövüş",
    "Ayarladığın dövüş ortaya çıktı. Kalabalık kan istiyor.",
    "Bakana suç at",
    { influence: 10, suspicion: 10 },
    "Arena rahiplerine öde",
    { wealth: -10, suspicion: -8, loyalty: -4 },
    {
      card: {
        once: true,
        chainId: "arena-champion",
        requirements: [{ flag: "fixed_fights", equals: true }],
        act: [4],
        tags: ["arena", "chain"],
        imagePrompt:
          "Cinematic vertical card art, exposed fixed fight in arena sermon, bloodthirsty crowd, reckoning moment",
      },
    },
  ),
  card(
    "wounded-boy-legacy",
    "Çocuğun Tanıklığı",
    "İyileşen çocuk sefirin itildiğine tanıklık etmeye hazır. Casusbaşı sessizlik için altın sunuyor.",
    "Konuşmasına izin ver",
    { loyalty: 10, influence: 8, suspicion: 8 },
    "Sessizliğini satın al",
    { wealth: -8, suspicion: -8, influence: 6 },
    {
      card: {
        once: true,
        chainId: "wounded-boy",
        requirements: [{ flag: "saved_wounded_boy", equals: true }],
        act: [1, 2],
        tags: ["street", "chain"],
        imagePrompt:
          "Cinematic vertical card art, healed boy ready to testify, spymaster offering gold for silence, vizier fall witness",
      },
    },
  ),
  card(
    "informant-last-whisper",
    "Son Fısıltı",
    "Muhbir son bir isim veriyor — gerçek zehirleyici — sonra kayboluyor.",
    "Kamuya açıkla",
    { influence: 12, suspicion: 10, loyalty: -6 },
    "İsmi sakla",
    { influence: 8, wealth: 8, suspicion: 6 },
    {
      card: {
        once: true,
        chainId: "informant",
        requirements: [{ flag: "hired_informant", equals: true }],
        act: [2],
        tags: ["spy", "chain"],
        imagePrompt:
          "Cinematic vertical card art, informant last whisper naming true poisoner, vanishing into catacombs",
      },
    },
  ),
];

const rareCards = [
  card(
    "the-great-plague",
    "Büyük Veba",
    "Veba başkentte yayılıyor. Karantina mı, ticaret mi?",
    "Başkenti karantinaya al",
    { loyalty: 12, wealth: -18, influence: 8 },
    "Veba yok de",
    { wealth: 14, suspicion: 18, loyalty: -16 },
    {
      card: {
        once: true,
        act: [5],
        tags: ["street", "court"],
        imagePrompt:
          "Cinematic vertical card art, great plague approaching capital, quarantine gates versus open markets, death masks",
      },
    },
  ),
  card(
    "royal-inspection",
    "Kraliyet Denetimi",
    "İmparator maskesiyle sarayı denetliyor. Her defter ve fısıltı tartılıyor.",
    "Kusursuz hesap sun",
    { wealth: -10, influence: 14, suspicion: -10 },
    "Gerçeği gösterişle gizle",
    { influence: 8, suspicion: 18, loyalty: -8 },
    {
      card: {
        once: true,
        act: [5],
        tags: ["court"],
        imagePrompt:
          "Cinematic vertical card art, emperor mask surprise inspection, ledgers and daggers weighed, throne room audit",
      },
    },
  ),
  card(
    "border-war",
    "Sınır Savaşı",
    "Batı vilayetlerinde savaş çıktı. Lejyona destek mi, iki tarafa silah mı?",
    "Lejyonları besle",
    { wealth: -16, loyalty: 14, influence: 6 },
    "İki tarafa silah sat",
    { wealth: 18, suspicion: 18, loyalty: -14 },
    {
      card: {
        once: true,
        act: [5],
        tags: ["court", "trade"],
        imagePrompt:
          "Cinematic vertical card art, border war horns, grain and spears mobilization, arms dealer double deal",
      },
    },
  ),
  card(
    "assassin-offer",
    "Suikast Teklifi",
    "Bir katil masana sefir mührü koyuyor. Bir can, bir bedel.",
    "Reddet ve avla",
    { loyalty: 10, suspicion: -8, influence: 4 },
    "Sözleşmeyi kabul et",
    { influence: 18, suspicion: 18, loyalty: -18 },
    {
      card: {
        once: true,
        act: [5],
        tags: ["court", "spy"],
        imagePrompt:
          "Cinematic vertical card art, assassin contract on table with vizier seal, single candle, throne one step away",
      },
    },
  ),
  card(
    "forbidden-archive",
    "Yasak Arşiv",
    "Kütüphanenin altında her sefirin ölümü kayıtlı.",
    "Yasak defterleri oku",
    { influence: 14, suspicion: 16, wealth: -8 },
    "Arşivi mühürle",
    { loyalty: 10, suspicion: -10, influence: -6 },
    {
      card: {
        once: true,
        act: [5],
        tags: ["court", "temple"],
        imagePrompt:
          "Cinematic vertical card art, forbidden archive of vizier deaths, ancient sealed tomes, imperial lie beneath library",
      },
    },
  ),
  card(
    "eclipse-omen",
    "Güneş Tutulması",
    "Öğle vakti güneş kararıyor. Rahipler yargı, generaller fırsat diyor.",
    "İlahi lütuf ilan et",
    { loyalty: 12, influence: 10, suspicion: 8 },
    "Cephanelikleri ele geçir",
    { influence: 14, wealth: -10, suspicion: 14 },
    {
      card: {
        once: true,
        act: [5],
        tags: ["temple", "court"],
        imagePrompt:
          "Cinematic vertical card art, solar eclipse over emperor mask, priests and generals divided, omen sky",
      },
    },
  ),
  card(
    "emperor-mask-cracks",
    "Çatlak Maske",
    "İmparatorun maskesinde kırık görüyorsun. Altın toz dökülüyor.",
    "Mucize ilan et",
    { influence: 16, loyalty: 8, suspicion: 10 },
    "Hazinedarı şantajla",
    { wealth: 18, suspicion: 16, loyalty: -10 },
    {
      card: {
        once: true,
        act: [5],
        tags: ["court"],
        imagePrompt:
          "Cinematic vertical card art, cracked golden emperor mask shedding dust, only vizier sees truth, throne proximity",
      },
    },
  ),
  card(
    "famine-charter",
    "Kıtlık Senedi",
    "Soylular kıtlık yardımını borç zinciri olarak satıyor.",
    "Senedi yak",
    { loyalty: 12, wealth: -10, influence: 6 },
    "Borçları uygula",
    { wealth: 18, loyalty: -18, suspicion: 10 },
    {
      card: {
        once: true,
        act: [5],
        tags: ["court", "trade"],
        imagePrompt:
          "Cinematic vertical card art, famine lords debt charter, burning scroll versus enforcing chains on starving city",
      },
    },
  ),
  card(
    "slave-revolt",
    "Kürekçi İsyanı",
    "Kürekçiler zincirlerini kırdı. Liman yanıyor.",
    "İsyanı ez",
    { influence: 10, loyalty: -14, suspicion: -8 },
    "Özgürlük pazarlığı yap",
    { loyalty: 16, wealth: -14, influence: 8 },
    {
      card: {
        once: true,
        act: [5],
        tags: ["dock"],
        imagePrompt:
          "Cinematic vertical card art, galley slave revolt breaking chains, burning harbor, throne demands blood",
      },
    },
  ),
  card(
    "void-contract",
    "Hiçlik Sözleşmesi",
    "Bir yabancı dört erdemi yeniden yazacak bir pakt sunuyor.",
    "Kanla imzala",
    { wealth: 18, influence: 18, suspicion: 18 },
    "Reddet ve salonu yak",
    { loyalty: 12, influence: -10, suspicion: -14 },
    {
      card: {
        once: true,
        act: [5],
        tags: ["court"],
        imagePrompt:
          "Cinematic vertical card art, void contract signed in blood, stranger offering four virtues reborn, grave ink",
      },
    },
  ),
];

function formatCard(c) {
  const lines = [
    "  {",
    `    id: "${c.id}",`,
    `    title: "${c.title.replace(/"/g, '\\"')}",`,
    `    description:`,
    `      "${c.description.replace(/"/g, '\\"')}",`,
    "    effects: {},",
  ];
  if (c.once) lines.push("    once: true,");
  if (c.chainId) lines.push(`    chainId: "${c.chainId}",`);
  if (c.requirements) lines.push(`    requirements: ${JSON.stringify(c.requirements)},`);
  if (c.act) lines.push(`    act: ${JSON.stringify(c.act)},`);
  if (c.tags) lines.push(`    tags: ${JSON.stringify(c.tags)},`);
  if (c.imageKey) lines.push(`    imageKey: "${c.imageKey}",`);
  if (c.sceneDescription) {
    lines.push(
      `    sceneDescription: "${c.sceneDescription.replace(/"/g, '\\"')}",`,
    );
  }
  if (c.imagePrompt) {
    lines.push(
      `    imagePrompt: "${stylizeImagePrompt(c.imagePrompt).replace(/"/g, '\\"')}",`,
    );
  }
  lines.push("    leftChoice: {");
  lines.push(`      label: "${c.leftChoice.label.replace(/"/g, '\\"')}",`);
  lines.push(`      effects: ${JSON.stringify(c.leftChoice.effects)},`);
  if (c.leftChoice.resultText) {
    lines.push(
      `      resultText: "${c.leftChoice.resultText.replace(/"/g, '\\"')}",`,
    );
  }
  if (c.leftChoice.setFlags) lines.push(`      setFlags: ${JSON.stringify(c.leftChoice.setFlags)},`);
  if (c.leftChoice.removeFlags) lines.push(`      removeFlags: ${JSON.stringify(c.leftChoice.removeFlags)},`);
  lines.push("    },");
  lines.push("    rightChoice: {");
  lines.push(`      label: "${c.rightChoice.label.replace(/"/g, '\\"')}",`);
  lines.push(`      effects: ${JSON.stringify(c.rightChoice.effects)},`);
  if (c.rightChoice.resultText) {
    lines.push(
      `      resultText: "${c.rightChoice.resultText.replace(/"/g, '\\"')}",`,
    );
  }
  if (c.rightChoice.setFlags) lines.push(`      setFlags: ${JSON.stringify(c.rightChoice.setFlags)},`);
  if (c.rightChoice.removeFlags) lines.push(`      removeFlags: ${JSON.stringify(c.rightChoice.removeFlags)},`);
  lines.push("    },");
  lines.push("  },");
  return lines.join("\n");
}

const pipe = (cards) =>
  cards.map(enrichCardResults).map(applyImageKey).map(applySceneDescription);

const allIntro = pipe(introCards);
const allCommon = pipe(commonCards);
const allChain = pipe(chainCards);
const allRare = pipe(rareCards);

const out = `import type { StoryCardData } from "@/types/game";

/** Origin intro cards (10) — played in order per origin */
export const introCards: StoryCardData[] = [
${allIntro.map(formatCard).join("\n")}
];

/** Neutral / common court and street cards (20) */
export const commonStoryCards: StoryCardData[] = [
${allCommon.map(formatCard).join("\n")}
];

/** @deprecated Use commonStoryCards */
export const mainStoryCards = commonStoryCards;

/** Story chains (20) — six chains with branch requirements */
export const chainStoryCards: StoryCardData[] = [
${allChain.map(formatCard).join("\n")}
];

/** Rare fate cards (10) — high risk, high reward */
export const rareStoryCards: StoryCardData[] = [
${allRare.map(formatCard).join("\n")}
];

const cardRegistry = new Map<string, StoryCardData>(
  [...introCards, ...commonStoryCards, ...chainStoryCards, ...rareStoryCards].map(
    (card) => [card.id, card],
  ),
);

export function getCardById(id: string): StoryCardData | undefined {
  return cardRegistry.get(id);
}

/** @deprecated Use commonStoryCards or buildDeckForOrigin instead */
export const storyCards = commonStoryCards;
`;

const outPath = join(__dirname, "..", "data", "cards.ts");
writeFileSync(outPath, out, "utf8");
console.log("Generated", outPath);
console.log("Counts:", {
  intro: introCards.length,
  common: commonCards.length,
  chain: chainCards.length,
  rare: rareCards.length,
  total: introCards.length + commonCards.length + chainCards.length + rareCards.length,
});
