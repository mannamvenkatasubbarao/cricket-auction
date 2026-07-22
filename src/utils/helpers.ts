export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const formatCurrency = (amount: number): string => {
  // Assuming amount is in absolute numerical value. 
  // Let's format it in Indian format (Lakhs/Crores)
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

export const parseCurrencyInput = (value: string): number => {
  // Convert standard numbers. Let's assume input is in normal numbers or L/Cr.
  // For simplicity, let's just parse the number directly for now and let the user enter absolute numbers or provide a dropdown for unit.
  // In the UI we'll ask for value in numbers.
  return Number(value.replace(/[^0-9.-]+/g,""));
}
