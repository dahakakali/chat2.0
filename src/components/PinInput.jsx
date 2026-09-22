"use client";

export default function PinInput({ value = "", onChange }) {
  const handleChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    onChange(val);
  };

  const handleFocus = (e) => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        e.target.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 150);
    });
  };

  return (
    <input
      type="tel"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={6}
      value={value}
      onChange={handleChange}
      onFocus={handleFocus}
      className="form-input"
      placeholder="••••••"
      autoComplete="one-time-code"
      style={{ WebkitTextSecurity: "disc" }}
    />
  );
}
