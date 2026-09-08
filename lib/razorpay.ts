const RAZORPAY_SRC = "https://checkout.razorpay.com/v1/checkout.js";

/** Loads the Razorpay checkout script once and resolves when it is usable. */
export function loadRazorpayScript() {
  return new Promise<void>((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).Razorpay) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Could not load Razorpay")));
      return;
    }
    const el = document.createElement("script");
    el.src = RAZORPAY_SRC;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error("Could not load Razorpay"));
    document.body.appendChild(el);
  });
}
