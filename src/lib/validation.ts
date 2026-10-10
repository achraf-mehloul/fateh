// التحقق من صحة المدخلات

// رقم هاتف جزائري صحيح: 05 / 06 / 07 متبوعة بـ 8 أرقام
export const normalizePhone = (raw: string): string => {
  let value = raw.replace(/[\s\-().]/g, '');
  // تحويل الصيغة الدولية إلى محلية
  if (value.startsWith('+213')) value = '0' + value.slice(4);
  else if (value.startsWith('00213')) value = '0' + value.slice(5);
  else if (value.startsWith('213') && value.length === 12) value = '0' + value.slice(3);
  return value;
};

export const isValidAlgerianPhone = (raw: string): boolean => {
  const value = normalizePhone(raw);
  return /^0[5-7][0-9]{8}$/.test(value);
};

export const PHONE_ERROR_MESSAGE =
  'رقم الهاتف غير صحيح. يجب أن يبدأ بـ 05 أو 06 أو 07 ويتكون من 10 أرقام';

// التحقق من الاسم
export const isValidName = (name: string): boolean => {
  const trimmed = name.trim();
  return trimmed.length >= 3 && trimmed.length <= 100 && /[\u0600-\u06FFa-zA-Z]/.test(trimmed);
};

export const NAME_ERROR_MESSAGE = 'يرجى إدخال الاسم الكامل (3 أحرف على الأقل)';
