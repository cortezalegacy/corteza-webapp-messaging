// https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript/37511463#37511463
export const toNFD = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
