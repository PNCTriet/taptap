"use client";

import { useExplorer } from "@/context/explorer-context";

export default function BusinessHomePage() {
  const { locale } = useExplorer();
  const vi = locale === "vi";

  return (
    <section className="mx-auto max-w-lg py-4">
      <h1 className="font-gouache text-[length:var(--type-title-2)] leading-[1.15] text-business-ink">
        {vi ? "Không gian doanh nghiệp" : "Business workspace"}
      </h1>
      <p className="mt-2 max-w-sm text-[length:var(--type-body)] leading-snug text-[#3e5160]">
        {vi
          ? "Phòng, trạm và thẻ NFC sẽ có ở đây."
          : "Rooms, stations, and NFC tags will live here."}
      </p>
    </section>
  );
}
