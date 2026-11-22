// EU/EEA + Switzerland: the "régimen comunitario" applies instead of the general foreigner regime.
export const EU_EEA_CH = new Set([
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE',
  'IS','LI','NO','CH',
]);

// Compact ISO list used by the questionnaire select (names resolved via Intl.DisplayNames in the active locale).
export const COUNTRY_CODES = ('AF AL DZ AD AO AR AM AU AZ BD BY BO BA BR CM CA CF TD CL CN CO CD CG CR CI CU DO EC EG SV ER ET GE GH GT GN GW GY HT HN IN ID IR IQ JM JP JO KZ KE XK KG LB LR LY MK MG ML MR MX MD MA MZ MM NP NI NE NG PK PS PA PY PE PH RU RW SN RS SL SO ZA SS SD SY TJ TZ TH TG TN TR TM UG UA UY UZ VE VN YE ZM ZW AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI SE IS LI NO CH GB US').split(' ');
