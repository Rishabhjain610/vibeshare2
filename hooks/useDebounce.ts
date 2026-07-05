import { useState, useEffect } from "react"; // React hooks (useState aur useEffect) ko import kiya.

// Custom useDebounce hook jo kisi value (jaise text input) ko delay ke baad update karega.
// T = Generic type takki yeh hook kisi bhi data type (string, number etc.) par kaam kar sake.
// delay = milliseconds mein time (default 300ms) jab tak user type karna band na kare.
export function useDebounce<T>(value: T, delay: number = 300): T {
  // 1. Debounced value ke liye local state set kiya, initial value original value ke barabar hogi.
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // 2. Ek timer start karenge (setTimeout) jo X milliseconds ke baad state ko naye value se update karega.
    const timer = setTimeout(() => {
      setDebouncedValue(value); // Jab timer complete hoga toh naya text value state mein save ho jayega.
    }, delay);

    // 3. Cleanup Function: Agar user delay time (jaise 300ms) khatam hone se pehle dobara koi key press karta hai,
    // toh purana start kiya hua timer cancel (clear) ho jayega aur naya timer start ho jayega.
    // Is wajah se API call sirf tabhi trigger hogi jab user poora word type karke ruk jayega!
    return () => {
      clearTimeout(timer); // Purana timer cancel kiya.
    };
  }, [value, delay]); // Jab bhi value ya delay change hoga, yeh hook timer reset karega.

  // 4. Final debounced value return kar rahe hain jise client use karega API hit karne ke liye.
  return debouncedValue;
}
