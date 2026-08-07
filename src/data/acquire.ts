// Inhalt der Seite „Kunst Erwerben" (DE) / „Acquire Art" (EN). Hier direkt editierbar;
// Layout + Akkordeon steckt in AcquireArt.astro. Sprache = Domain → interne Links am Root.
export interface AcquireItem {
  title: string;
  html: string;
}
export interface AcquireContent {
  title: string;
  hero: { src: string; alt: string };
  intro: string[];
  portrait: { src: string; alt: string; caption: string };
  sectionHeading: string;
  items: AcquireItem[];
}

export const acquire: Record<'de' | 'en', AcquireContent> = {
  de: {
    title: 'Kunst Erwerben',
    hero: { src: '/media/2020/11/olaf-hoppe-druck.jpg', alt: 'Olaf Hoppe an der Druckerpresse' },
    intro: [
      'Ich lade Sie herzlich in <a href="/kontakt/">meine Galerie an der Ostsee</a> ein. Hier können Sie viele meiner Werke auf einer Ausstellungsfläche von ca. 400 m² entdecken. Erwerben Sie zahlreiche Gemälde und mehrfarbige Holzschnitte direkt vor Ort. Sie können sich bereits vorab online einen Überblick mithilfe der <a href="/werke/">Werke-Seite</a> verschaffen.',
      'Nutzen Sie bei Ihrem Besuch die Möglichkeit, an einer persönlichen Führung durch das HAUS HOPPE – Galerie für Bildende Kunst teilzunehmen, bei der Ihnen das Oeuvre des Künstlers vorgestellt wird und Ihre Fragen zu Handwerk, Komposition, Kunst und Kunstgeschichte beantwortet werden.',
    ],
    portrait: {
      src: '/media/2020/12/Foto-Thomas-Haentzschel-nordlicht-Olaf-Hoppe-Garten-2010.jpg',
      alt: 'Olaf Hoppe in seinem Garten',
      caption: 'Olaf Hoppe, Foto: Thomas Haentzschel',
    },
    sectionHeading: 'Innovative Wege zur Kunst',
    items: [
      {
        title: 'Kunst-Ratenzahlung',
        html: '<p>Für den privaten Bereich biete ich Ihnen die Möglichkeit an, den Kunstkauf in monatlichen Ratenzahlungen zu begleichen – z. B. bei einem Gesamtwert von 500,– € in 10 Raten à 50,– €.</p>',
      },
      {
        title: 'Kunst-Leasing',
        html: `<p>Leasingraten sind als Betriebsausgaben sofort steuerlich absetzbar. Dies ist u. a. ein Vorteil bei der Gewerbesteuer. Nach der Festlegung des vereinbarten Restwertes verfügen Sie über die weitere „Verwendung" des Kunstwerkes.</p>
<p>Mit der Firma HW Leasing GmbH habe ich über Jahre einen zuverlässigen Partner, der schnell und flexibel Ihre Vorstellungen realisiert. Für weitere Fragen stehe ich Ihnen gerne zur Verfügung.</p>
<p class="acq-contact">HW Leasing GmbH<br>Spiegelberg 57<br>23966 Wismar<br>Telefon: +49 3841 711111<br>Telefax: +49 3841 711148<br><a href="mailto:info@hw-leasing.de">info@hw-leasing.de</a></p>`,
      },
      {
        title: 'Kunst im Auftrag',
        html: `<p>Viele meiner Kunstfreunde begleiten mich über Jahre. Natürlich kümmert man sich in der ersten Lebenshälfte vorwiegend um Familie, Kinder und Beruf. Da bleibt wenig Spielraum für den Erwerb eines wertvollen Kunstwerkes. Viele haben dabei aber die Hoffnung, die Anschaffung später noch nachholen zu können. Doch später ist oftmals zu spät – denn meine Kunstwerke finden meist schnell ein neues Zuhause.</p>
<p>Deshalb ist es mir eine besondere Freude, den Wunsch meiner Freunde dennoch erfüllen zu können: Ich erstelle als Kunstauftrag ein zweites Original vom Lieblingsmotiv. Gerne auch für Sie! Überzeugen Sie sich selbst:</p>
<div class="acq-gallery">
  <img src="/media/2020/12/Brot-und-Wasser.jpg" alt="Brot und Wasser" loading="lazy">
  <img src="/media/2020/12/Sawila.jpg" alt="Sawila" loading="lazy">
</div>`,
      },
      {
        title: 'Individuelle Wünsche',
        html: `<p>Sie möchten gerne Ihr Enkelkind porträtieren lassen, eine Fassade gestalten oder für einen ganz besonderen Anlass ein Kunstwerk in Auftrag geben? Sprechen Sie mich einfach an! Die folgenden drei Beispiele stehen für eine Reihe individueller Arbeiten:</p>
<ul>
  <li>„Ansicht der Burg Schwaan" für eine Seniorenresidenz</li>
  <li>Haus-Altar – Hommage an Hieronymus Bosch</li>
  <li>Gestaltung eines Swimmingpools</li>
</ul>
<div class="acq-gallery">
  <img src="/media/2021/05/burg-schwaan.jpg" alt="Ansicht der Burg Schwaan" loading="lazy">
  <img src="/media/2021/05/20180112_163221_1.jpg" alt="Individuelle Auftragsarbeit" loading="lazy">
  <img src="/media/2021/05/20180112_163149.jpg" alt="Individuelle Auftragsarbeit" loading="lazy">
</div>`,
      },
    ],
  },
  en: {
    title: 'Acquire Art',
    hero: { src: '/media/2020/11/olaf-hoppe-druck.jpg', alt: 'Olaf Hoppe at the printing press' },
    intro: [
      'I warmly invite you to visit <a href="/contact/">my gallery at the Baltic Sea</a>. Here you can discover many of my works on an exhibition area of about 400 m². Purchase numerous paintings and multi-coloured woodcuts directly on site. You can already get an overview online with the help of the <a href="/artwork/">Artwork page</a>.',
      'During your visit, take advantage of the opportunity to join a personal guided tour of HAUS HOPPE – Galerie für Bildende Kunst, where you will be introduced to the artist’s oeuvre and have your questions about craft, composition, art and art history answered.',
    ],
    portrait: {
      src: '/media/2020/12/Foto-Thomas-Haentzschel-nordlicht-Olaf-Hoppe-Garten-2010.jpg',
      alt: 'Olaf Hoppe in his garden',
      caption: 'Olaf Hoppe, Photo: Thomas Haentzschel',
    },
    sectionHeading: 'Innovative ways to art',
    items: [
      {
        title: 'Art in Instalments',
        html: '<p>For the private sector, I offer you the possibility to pay for your art purchase in monthly instalments – e.g. a total value of 500,– € in 10 payments of 50,– € each.</p>',
      },
      {
        title: 'Art Leasing',
        html: `<p>Leasing instalments are immediately tax-deductible as business expenses. This is, among other things, an advantage with regard to trade tax. Once the agreed residual value has been determined, you decide on the further „use" of the work of art.</p>
<p>With HW Leasing GmbH I have had a reliable partner for years who realises your ideas quickly and flexibly. If you have any further questions, please do not hesitate to contact me.</p>
<p class="acq-contact">HW Leasing GmbH<br>Spiegelberg 57<br>23966 Wismar<br>Phone: +49 3841 711111<br>Fax: +49 3841 711148<br><a href="mailto:info@hw-leasing.de">info@hw-leasing.de</a></p>`,
      },
      {
        title: 'Art on Commission',
        html: `<p>Many of my art friends have been with me for years. Of course, in the first half of your life you mainly take care of your family, children and job. That leaves little room for acquiring a valuable work of art. Many hope to make up for the purchase later — but later is often too late, because my works usually find a new home quickly.</p>
<p>That is why it is a special pleasure for me to fulfil my friends’ wishes nevertheless: I create a second original of the favourite motif as a commission. Gladly for you, too! See for yourself:</p>
<div class="acq-gallery">
  <img src="/media/2020/12/Brot-und-Wasser.jpg" alt="Brot und Wasser" loading="lazy">
  <img src="/media/2020/12/Sawila.jpg" alt="Sawila" loading="lazy">
</div>`,
      },
      {
        title: 'Individual Wishes',
        html: `<p>Would you like to have your grandchild portrayed, design a façade or commission a work of art for a very special occasion? Just contact me! The following three examples represent a range of individual works:</p>
<ul>
  <li>„View of Schwaan Castle" for a retirement home</li>
  <li>House altar – homage to Hieronymus Bosch</li>
  <li>Design of a swimming pool</li>
</ul>
<div class="acq-gallery">
  <img src="/media/2021/05/burg-schwaan.jpg" alt="View of Schwaan Castle" loading="lazy">
  <img src="/media/2021/05/20180112_163221_1.jpg" alt="Individual commission" loading="lazy">
  <img src="/media/2021/05/20180112_163149.jpg" alt="Individual commission" loading="lazy">
</div>`,
      },
    ],
  },
};
