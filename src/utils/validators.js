// CNIC: 12345-1234567-1
export const validateCNIC = (cnic) => {
  return /^\d{5}-\d{7}-\d{1}$/.test(cnic);
};

// Phone: 03XXXXXXXXX
export const validatePhone = (phone) => {
  return /^03\d{9}$/.test(phone);
};