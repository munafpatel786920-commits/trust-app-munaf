/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GujaratiFont {
  id: string;
  nameGuj: string;
  nameEng: string;
  categoryGuj: 'સામાન્ય / રનિંગ' | 'ટ્રેડિશનલ / ક્લાસિક' | 'કેલિગ્રાફી / સુલેખ' | 'મોડર્ન સેરીફ' | 'આર્ટિસ્ટિક / ડેકોરેટિવ';
  fontFamily: string;
  cssClass: string;
  samplePhraseGuj: string;
  descriptionGuj: string;
  isPopular?: boolean;
}

export const GUJARATI_FONTS: GujaratiFont[] = [
  {
    id: 'noto-sans',
    nameGuj: 'ડિફોલ્ટ રનિંગ ફોન્ટ (Noto Sans Gujarati)',
    nameEng: 'Noto Sans Gujarati (Default Clean)',
    categoryGuj: 'સામાન્ય / રનિંગ',
    fontFamily: "'Noto Sans Gujarati', system-ui, sans-serif",
    cssClass: 'font-noto-sans-gujarati',
    samplePhraseGuj: 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ - હિસાબી નામા પદ્ધતિ',
    descriptionGuj: 'સૌથી સ્પષ્ટ, સરળ અને રોજિંદા કામકાજ તથા રિપોર્ટ્સ માટે સર્વોત્તમ સ્ટાન્ડર્ડ ફોન્ટ.',
    isPopular: true
  },
  {
    id: 'harikrishna',
    nameGuj: 'હરિકૃષ્ણ ફોન્ટ (Yatra One / Classic)',
    nameEng: 'Yatra One Classic Gujarati',
    categoryGuj: 'ટ્રેડિશનલ / ક્લાસિક',
    fontFamily: "'Yatra One', 'Noto Serif Gujarati', serif",
    cssClass: 'font-harikrishna',
    samplePhraseGuj: 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ - દાન રસીદ અને વાઉચર',
    descriptionGuj: 'પુસ્તકો, ટ્રસ્ટ ડીડ, ઠરાવો અને અધિકૃત દસ્તાવેજો માટે ઉત્તમ શાસ્ત્રીય શૈલી.',
    isPopular: true
  },
  {
    id: 'sulekh',
    nameGuj: 'સુલેખ કેલિગ્રાફી (Shrikhand Calligraphy)',
    nameEng: 'Shrikhand Calligraphic',
    categoryGuj: 'કેલિગ્રાફી / સુલેખ',
    fontFamily: "'Shrikhand', 'Mogra', cursive",
    cssClass: 'font-sulekh',
    samplePhraseGuj: 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ - સુલેખ કલાત્મક શૈલી',
    descriptionGuj: 'હેડિંગ, ટાઇટલ, સર્ટીફીકેટ અને ઉત્સવ પાવતીઓ માટે આકર્ષક કેલિગ્રાફી શૈલી.',
    isPopular: true
  },
  {
    id: 'shruti',
    nameGuj: 'શ્રુતિ ફોન્ટ (Khand Standard)',
    nameEng: 'Khand Standard Gujarati',
    categoryGuj: 'સામાન્ય / રનિંગ',
    fontFamily: "'Khand', 'Noto Sans Gujarati', sans-serif",
    cssClass: 'font-shruti',
    samplePhraseGuj: 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ - રોકડ મેળ અને ખાતાવહી',
    descriptionGuj: 'કમપેક્ટ અને સ્પષ્ટ અક્ષરો વાળો પ્રમાણિત લેખન ફોન્ટ.',
    isPopular: true
  },
  {
    id: 'gopika',
    nameGuj: 'ગોપિકા ફોન્ટ (Rasa Traditional)',
    nameEng: 'Rasa Traditional Gujarati',
    categoryGuj: 'ટ્રેડિશનલ / ક્લાસિક',
    fontFamily: "'Rasa', 'Noto Serif Gujarati', serif",
    cssClass: 'font-gopika',
    samplePhraseGuj: 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ - સભાસદ શેર પ્રમાણપત્ર',
    descriptionGuj: 'સન્માન પત્રો, પ્રમાણપત્રો અને પારંપરિક લેખન માટે સુંદર શાસ્ત્રીય શૈલી.',
    isPopular: true
  },
  {
    id: 'saral',
    nameGuj: 'સરલ ફોન્ટ (Anek Simple)',
    nameEng: 'Anek Clean Sans',
    categoryGuj: 'સામાન્ય / રનિંગ',
    fontFamily: "'Anek Gujarati', 'Noto Sans Gujarati', sans-serif",
    cssClass: 'font-saral',
    samplePhraseGuj: 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ - નફો નુકસાન અને સરવૈયું',
    descriptionGuj: 'વાંચવામાં એકદમ હળવો અને આંખોને આરામદાયક લાગે તેવી સાદી રચના.'
  },
  {
    id: 'rekha',
    nameGuj: 'રેખા ફોન્ટ (Farsan Modern)',
    nameEng: 'Farsan Fine Stroke',
    categoryGuj: 'સામાન્ય / રનિંગ',
    fontFamily: "'Farsan', 'Noto Sans Gujarati', sans-serif",
    cssClass: 'font-rekha',
    samplePhraseGuj: 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ - વાર્ષિક ઓડિટ અહેવાલ',
    descriptionGuj: 'સુરેખ આકૃતિઓ વાળી આધુનિક દેખાવ આપતી ગુજરાતી શૈલી.'
  },
  {
    id: 'anek',
    nameGuj: 'અનેક ગુજરાતી (Anek Gujarati)',
    nameEng: 'Anek Gujarati Modern',
    categoryGuj: 'સામાન્ય / રનિંગ',
    fontFamily: "'Anek Gujarati', sans-serif",
    cssClass: 'font-anek',
    samplePhraseGuj: 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ - ડિજિટલ એકાઉન્ટિંગ સિસ્ટમ',
    descriptionGuj: 'આધુનિક ડિજિટલ ઇન્ટરફેસ અને મોબાઇલ/કમ્પ્યુટર સ્ક્રીન માટે શ્રેષ્ઠ ટાઇપોગ્રાફી.',
    isPopular: true
  },
  {
    id: 'noto-serif',
    nameGuj: 'નોટો સેરીફ (Noto Serif Gujarati)',
    nameEng: 'Noto Serif Gujarati',
    categoryGuj: 'મોડર્ન સેરીફ',
    fontFamily: "'Noto Serif Gujarati', serif",
    cssClass: 'font-noto-serif',
    samplePhraseGuj: 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ - અધિકૃત ટ્રસ્ટી મંડળ ઠરાવ',
    descriptionGuj: 'સત્તાવાર દસ્તાવેજો, એગ્રીમેન્ટ અને ઠરાવો માટે ગંભીર તથા પ્રતિષ્ઠિત સેરીફ ફોન્ટ.'
  },
  {
    id: 'baloo',
    nameGuj: 'બાલૂ ભાઈ ૨ (Baloo Bhai 2)',
    nameEng: 'Baloo Bhai 2 (Rounded Display)',
    categoryGuj: 'આર્ટિસ્ટિક / ડેકોરેટિવ',
    fontFamily: "'Baloo Bhai 2', cursive, sans-serif",
    cssClass: 'font-baloo',
    samplePhraseGuj: 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ - માનવ સેવા એ જ પ્રભુ સેવા',
    descriptionGuj: 'ગોળાકાર કિનારીઓ અને ઘાટા અક્ષરો સાથે અત્યંત મૈત્રીપૂર્ણ અને આકર્ષક દેખાવ.',
    isPopular: true
  },
  {
    id: 'rasa',
    nameGuj: 'રસ સેરીફ (Rasa Gujarati)',
    nameEng: 'Rasa Elegant Serif',
    categoryGuj: 'મોડર્ન સેરીફ',
    fontFamily: "'Rasa', serif",
    cssClass: 'font-rasa',
    samplePhraseGuj: 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ - ૧૦૦% કરમુક્ત દાન સ્વીકાર કેન્દ્ર',
    descriptionGuj: 'કાવ્યાત્મક અને શાલીનતાભર્યો સેરીફ ફોન્ટ જે પ્રીમિયમ લુક આપે છે.'
  },
  {
    id: 'farsan',
    nameGuj: 'ફરસાણ (Farsan Artistic)',
    nameEng: 'Farsan Display',
    categoryGuj: 'આર્ટિસ્ટિક / ડેકોરેટિવ',
    fontFamily: "'Farsan', cursive",
    cssClass: 'font-farsan',
    samplePhraseGuj: 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ - કલાત્મક હેડિંગ્સ અને બેનર',
    descriptionGuj: 'યુનિક અને આર્ટિસ્ટિક હેડલાઇન શૈલી.'
  },
  {
    id: 'mogra',
    nameGuj: 'મોગરા સુલેખ (Mogra Bold Calligraphy)',
    nameEng: 'Mogra Decorative',
    categoryGuj: 'કેલિગ્રાફી / સુલેખ',
    fontFamily: "'Mogra', cursive",
    cssClass: 'font-mogra',
    samplePhraseGuj: 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ - શુભ દીપાવલી અને નૂતન વર્ષાભિનંદન',
    descriptionGuj: 'તહેવારો, આમંત્રણ પત્રો અને પાવતી હેડરો માટે બોલ્ડ કેલિગ્રાફી.'
  },
  {
    id: 'shrikhand',
    nameGuj: 'શ્રીખંડ બોલ્ડ (Shrikhand)',
    nameEng: 'Shrikhand Ultra Bold',
    categoryGuj: 'કેલિગ્રાફી / સુલેખ',
    fontFamily: "'Shrikhand', cursive",
    cssClass: 'font-shrikhand',
    samplePhraseGuj: 'શ્રી સાર્વજનિક કલ્યાણ ટ્રસ્ટ',
    descriptionGuj: 'અતિ બોલ્ડ અને ધ્યાન ખેંચી લે તેવી ગુજરાતી શીર્ષક શૈલી.'
  }
];

export const getFontById = (id?: string): GujaratiFont => {
  if (!id) return GUJARATI_FONTS[0];
  const found = GUJARATI_FONTS.find(f => f.id === id);
  return found || GUJARATI_FONTS[0];
};

export const DEFAULT_FONT_ID = 'noto-sans';
