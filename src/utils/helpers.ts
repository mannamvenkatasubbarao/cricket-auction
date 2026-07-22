export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const formatCurrency = (amount: number): string => {
  // College tournament uses real rupees - just show plain ₹ amount
  return `₹${amount.toLocaleString('en-IN')}`;
};

export const parseCurrencyInput = (value: string): number => {
  // Convert standard numbers. Let's assume input is in normal numbers or L/Cr.
  // For simplicity, let's just parse the number directly for now and let the user enter absolute numbers or provide a dropdown for unit.
  // In the UI we'll ask for value in numbers.
  return Number(value.replace(/[^0-9.-]+/g,""));
}
