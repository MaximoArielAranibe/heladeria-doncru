export const normalizePhoneAR = (phone) => {
  if (!phone) return null;

  // Sacamos todo lo que no sea número
  let cleaned = phone.replace(/\D/g, "");

  // Si empieza con 0 lo sacamos
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.slice(1);
  }

  // Si no tiene código país, lo agregamos
  if (!cleaned.startsWith("54")) {
    cleaned = "54" + cleaned;
  }

  return `+${cleaned}`;
};

export const isValidPhoneAR = (phone) => {
  const normalized = normalizePhoneAR(phone);

  // +54 + 10/11 dígitos
  return /^(\+54)(\d{10,11})$/.test(normalized);
};
