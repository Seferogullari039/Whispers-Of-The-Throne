import type { Ending } from "@/types/game";

export const endings: Ending[] = [
  {
    id: "starved-in-gutters",
    imageKey: "dark-alley",
    sceneDescription:
      "Emaciated body beneath a bridge during a harsh winter funeral procession",
    title: "Çıkmazlarda Açlık",
    subtitle: "İmparatorluk adını unuttu, sen açlığı unutmadan",
    type: "bad",
    maxLevel: 24,
    description: [
      "Yırtık tırnaklar ve ödünç cesaretle hiçlikten tırmandın; ama başkent ekmeği altınla, anıları kanla fiyatlar. Keselerin sonunda çöktüğünde hiçbir lonca mührünü taşımadı, hiçbir lord mektubuna cevap vermedi.",
      "Alt halka yüzün yalnızca çorba hendeğindeki bir hayalet olarak tanındı. O kış erken geldi; saray çanları seni hiç davet etmediği ziyafetler için çaldı.",
      "Sefirin alayından geçen köprünün altında bulundun; parmakların hiçbir şey satın alamayan paslı bir paraya kıvrılmıştı. Haberciler ölümünü ilan etmedi—sadece sıçanlar hatırladı.",
      "Kara Çeyrek kroniklerinde hikâyen bir uyarı olarak biter: taç aç kalmaz; ona uzananlar aç kalır.",
    ].join("\n\n"),
  },
  {
    id: "buried-by-debt",
    imageKey: "dark-alley",
    sceneDescription:
      "Rainy street with torn debt ledgers and empty merchant scales",
    title: "Borç Altında",
    subtitle: "Bu imparatorlukta defterler adamlardan uzun yaşar",
    type: "bad",
    description: [
      "Saraydaki her iyilik dişli bir borçtur. Yarına karşı borçlandın; yarına tahsilatçılar imparatorun renkleriyle geldi.",
      "Bir zamanlar seni pohpohlayan tüccarlar imzalı senetlerini meydanda sergiliyor. Savaş Bakanı buna adalet dedi; casus başı fırsat dedi.",
      "Şafaktan önce odan soyuldu—duvar halıları, mühürler, sefir zinceline hayal kurduğun sandalye bile. Geriye mürekkep, borç ve sessizlik kaldı.",
      "Seni idam etmediler. Rakamlar yavaş yavaş öldürdü; önce müttefiklerini, sonra adını, sonra geleceğini sattın.",
      "Defter kapandığında imparatorluk varlıkları arasında listelendin: tasfiye edilmiş, unutulmuş, hırslı kâtiplere fısıldanan bir ders.",
    ].join("\n\n"),
  },
  {
    id: "executed-by-crown",
    imageKey: "prison-cell",
    sceneDescription:
      "Public execution scaffold before a silent palace crowd at dawn",
    title: "Taç Tarafından İdam",
    subtitle: "Mahkeme yargılamadan önce maske hüküm verdi",
    type: "bad",
    description: [
      "İmparatorluk başkentinde güç iki ağızlı kılıçtır: azınsan silinirsin; fazlasan yanlış ışıkta parlar. Sen parladın.",
      "İmparatorun maskesi göz kırpmaz. Adın rüşvete, bıçağa, meclis bilmeden orduları oynatan fısıltılara bağlandı. Gerçek zamanlamadan az önemliydi.",
      "Sadakat çanları çağırırken şafakta alındın. Halkın güvenebileceği bir yargılama yoktu—yalnızca casus başının elinde yazılı bir ceza.",
      "Saraya dönerek öldüğün söylenir; bu çoğuna fazla bir lütuf. Kalabalığa devlete ihanet ettiğin söylendi. İmparatorluk bir öğle vakti rahat nefes aldı.",
      "Bedenin hainlerin sergilendiği yerde gösterildi, gece olmadan kaldırıldı ki lağımlar seni efsaneleştirmesin. Baş Sefir koltuğu biraz daha boş kaldı.",
    ].join("\n\n"),
  },
  {
    id: "betrayed-by-your-own",
    imageKey: "secret-meeting",
    sceneDescription:
      "Trusted ally turning away as a dagger gleams in a throne corridor",
    title: "Kendi Elinle Vuruldun",
    subtitle: "Sahtesini yapamadığın tek para sadakatti",
    type: "bad",
    description: [
      "Bıçaklar, kâtipler ve yeminliler topladın; onlara şafağın payını vaat ettin. Gülümsediler, eğildiler ve sırtına bıçak uzunluğunu ölçtüler.",
      "Düşmanların harekete geçtiğinde seninkiler geçmedi. Kapı açtılar, parmak uzattılar, sırlarını ateşe yakın koltuk için sattılar.",
      "Gördüğün son yüz imparatorun maskesi değil, kül yokuşunda doyurduğun bir hizmetkârdı. O ihanet bıçaktan daha derin acıttı.",
      "Yürüdüğün salonlardan sürüklenirken kimse gözlerinin içine bakmadı—yalnızca parlatılmış zemini, başka efendilerini seçmiş olanları.",
      "Tarih kalbini yanlış yerlere verdiğin için düştüğünü söyler. Sokaklar ise sadakat ettiğin için düştüğünü.",
    ].join("\n\n"),
  },
  {
    id: "forgotten-clerk",
    imageKey: "royal-court",
    sceneDescription:
      "Dusty clerk desk piled with forgotten scrolls in an empty office",
    title: "Unutulmuş Kâtip",
    subtitle: "İmzasız bir evrak parçasına dönüştün",
    type: "neutral",
    description: [
      "Tahtın kulağına hiç varamadın; yalnızca yeterince uzun süre yakınında durup umut ettin. Nüfuz parmaklarından kayınca saray seni nefret etmedi—görmezden geldi.",
      "Masam soğuk bir kanada taşındı. Davetler kesildi. Sefirin ölümü kamuoyunda yaslandı, özelde kâr edildi; sen emirleri kopyaladın.",
      "Yıllar mürekkep ve balmumunda geçti. Büyük bir haneye evlenmedin, büyük entrika çevirmedin, büyük bir kent kurtarmadın. İmparatorluk binlerce böyle hayatı yutar.",
      "Küçük bir emekli maaşı ve telaffuz edilemeyen bir adla emekli oldun. Çocuklar seni oynamaz.",
      "Mütevazı bir odada, bir zamanlar tırmanmayı hayal ettiğin duvara bakan pencerede öldün. Kronikler tarihi kaydetmez. Bu, sonunda, senin sonundu.",
    ].join("\n\n"),
  },
  {
    id: "minor-lord-ashford",
    imageKey: "noble-feast",
    sceneDescription:
      "Small hill manor overlooking quiet provincial farmlands at dusk",
    title: "Ashford'un Küçük Lordu",
    subtitle: "İyilikle değil, mühimmatla alınmış bir unvan",
    type: "neutral",
    description: [
      "Başkenti fethetmedin; başkent seni vilayetlere sürdü. Ashford tepeleri maskeden uzak; mesafe kendi merhametidir.",
      "Bir malikâne, bir vergi sınırı ve nazikçe geri çekildiğini söyleyen bir kurgu verdiler. Gerçekte yeterince yükseldin ki rahatsız edici oldun, ölmeyecek kadar yükselmedin.",
      "Yerelde sıkı yönettin. Köylüler tahsildarlarına beddua eder, yollarını övdü. Saray entrikalarını bir mevsimde unuttu.",
      "Bazen Baş Sefir koltuğunun hâlâ boş olduğu haberleri gelir. Şarap doldurur, cevap vermezsin.",
      "Yaşlı öldün; taşı üzerinde bir zamanlar kader sanılan unvanla gömüldün. İmparatorluk titremedi. Ashford yas tuttu, hasat etti, uyudu.",
    ].join("\n\n"),
  },
  {
    id: "silent-monk",
    imageKey: "mountain-monastery",
    sceneDescription:
      "Mountain monastery perched on a cliff above misty eastern peaks",
    title: "Sessiz Keşiş",
    subtitle: "Tütsüyü maskenin yerine koydun",
    type: "neutral",
    description: [
      "Şehir hataların için fazla gürültülü olunca doğuya, yeminlerin imparatorlardan uzun ömürlü olduğu uçurum manastırlarına yürüdün. Adını kestirdiler, numara verdiler, dua.",
      "Arılara baktın, kutsal metin kopyaladın; prensler birbirini boğarken. Kimse ne olduğunu sormadı; kutsal yerlerde geçmiş kabalıktır.",
      "Bazen hacılar sefirin yerini kim alacak diye konuşur. Eğilip çay ikram edersin. Hikâyeler uzak hava gibidir—ilginç, acısız, artık senin değil.",
      "Önce şüphe öldü, sonra hırs, sonra hatırlanma isteği. Geriye kaldı: çan, nefes, çan.",
      "Yüzyılların aşındırdığı taş basamaklarda öldün—bir zamanlar tahtlara koşan, burada sessizliğe eren ayaklar gibi.",
    ].join("\n\n"),
  },
  {
    id: "governor-western-gate",
    imageKey: "border-war",
    sceneDescription:
      "City walls and western gate guarding a frontier caravan road",
    title: "Batı Kapısı Valisi",
    subtitle: "Sınırı tuttun; saray nefesini tuttu",
    type: "good",
    description: [
      "Sadakat açgözlülüğe yenildiğinde çelik olur. Bakanlar yeminini gördü; seni imparatorluğun gerçekten bittiği Batı Kapısı'na gönderdiler.",
      "Disiplinle yönettin, gösterişle değil. Kervanlar aktı, kaleler ayakta kaldı; maske raporlarını korkmadan okudu—çünkü sınırlar istedin, tacı değil.",
      "Başkentte kullanışlı dediler. Askerler adil dedi. İkisi de nadirdir ve tehlikelidir; sen dikkatle taşıdın.",
      "Öldüğünde kapı bir gün yas için kapandı; tüccarlar yalan söylemedi. Sefir zinciri yoktu; yalnızca savunucular için çalan bir çan.",
      "Adın sınır dilinde fiil oldu: ayakta durmak. Taç seni sevmedi—ama ihtiyaç duydu. Bu da bir tür zaferdir.",
    ].join("\n\n"),
  },
  {
    id: "regent-behind-throne",
    imageKey: "throne-room",
    sceneDescription:
      "Figure whispering behind an empty throne in mirrored hall shadows",
    title: "Tahtın Ardında Naip",
    subtitle: "Maske konuşur; senin fısıltın cevap verir",
    type: "good",
    description: [
      "Kontrolsüz nüfuz ikinci bir tacdır. Tahta oturmadın—tahtın gölgesine geçtin; imparatorluk iradeni maskeninki sandı.",
      "Bakanlar zaten senin elinden yazılmış dilekçelerle geldi. Valide seni gerekli buldu; casus başı geçici buldu. İkisi de yanıldı.",
      "On yıl imparatorluk kamuoyunda refah içinde, özelde titreyerek yaşadı. Savaşları imzan engelledi; kıtlıkları altının geciktirdi. Maske sana gülümsedi.",
      "İmparator olgunlaşınca düşüş beklediler. Bunun yerine eğildin, mühürleri verdin, onurunla çekildin—sokak doğmuş birinin almaması gereken onurlarla.",
      "İpek içinde öldün; gücü öğrenmek isteyen öğrencilerle çevrili. Tarih sana naip der, sefir demez—ama başkent gece yarısı hâlâ adını fısıldar.",
    ].join("\n\n"),
  },
  {
    id: "grand-vizier",
    imageKey: "throne-room",
    sceneDescription:
      "Grand vizier seated on a golden throne in a vast imperial hall",
    title: "Baş Sefir",
    subtitle: "Zincir nihayet oturdu",
    type: "true",
    minLevel: 99,
    description: [
      "Külden ve dedikodudan tırmandın; sarayda daha yüksek basamak kalmadı. Baş Sefir zinciri öncekilerin ağırlığıyla geldi; sen yaşadın.",
      "İmparatorun maskesi sana hizmetkâr değil, yaşlı bir imparatorluğu ayakta tutan ortak olarak baktı. Ne zaman konuşacağını, susturacağını, lağımların kazandığını sandıracağını öğrendin.",
      "Hayatta kaldığın her entrika ders oldu. Bağışladığın her müttefik duvar oldu. Kırdığın her düşman, alt mahallede hırslı çocukları korkutan bir hikâye oldu.",
      "Gerçek son alkış değil—sürekliliktir. Yıllar geçti. İmparatorlar yaşlandı. Bakanlar düştü. Sen kaldın; sevildiğin için değil, makine sensiz işlemeyeceği için.",
      "Sonunda Baş Sefir koltuğunda öldün; mühürler hâlâ sıcaktı. Saray bir hanedanlığın bittiği gibi yas tuttu—çünkü bir bakıma bitti. Tahtın fısıltıları nihayet sustu; hepsi duyulmuştu, zirveye kadar.",
    ].join("\n\n"),
  },
];

const endingRegistry = new Map(endings.map((ending) => [ending.id, ending]));

export function getEndingById(id: string): Ending {
  const ending = endingRegistry.get(id);
  if (!ending) {
    return endingRegistry.get("forgotten-clerk")!;
  }
  return ending;
}
