const emailUser = 'rasyidmuhammadabdul';
const emailDomain = 'gmail.com';
const whatsappCountryCode = '62';
const whatsappPhoneNumber = '89673049122';

export const getProtectedEmail = () => `${emailUser}@${emailDomain}`;

export const getProtectedPhone = () => `+${whatsappCountryCode} ${whatsappPhoneNumber}`;

export const getProtectedWaUrl = () => {
  const message = encodeURIComponent(
    'Hello Muhammad Abdul Rasyid, I would like to discuss a systems and infrastructure project with you.'
  );
  return `https://wa.me/${whatsappCountryCode}${whatsappPhoneNumber}?text=${message}`;
};
