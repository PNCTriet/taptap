"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Award, Lock, TicketCheck } from "lucide-react";
import { useExplorer } from "@/context/explorer-context";

export default function RewardDetailPage() {
  const params = useParams<{ id: string }>();
  const rewardId = params?.id ?? "";

  const {
    locale,
    t,
    rewards,
    collectedStamps,
    redemptions,
    issueRedemption,
    markRedemptionRedeemed,
  } = useExplorer();

  const [showConfirm, setShowConfirm] = useState(false);

  const reward =
    rewards.find((r) => r.id === rewardId || r.id.endsWith(rewardId)) ??
    rewards[0];

  if (!reward) {
    return null;
  }

  const collectedCount = collectedStamps.length;
  const isEligible = collectedCount >= reward.requiredStamps;
  const existingRedemption = redemptions.find((r) => r.rewardId === reward.id);

  const handleConfirmIssue = () => {
    issueRedemption(reward.id);
    setShowConfirm(false);
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Link
        href="/passport"
        className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#176B61] hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{locale === "vi" ? "Hộ chiếu" : "Passport"}</span>
      </Link>

      <div className="paper-card p-5 sm:p-6 space-y-5">
        <div className="overflow-hidden rounded-[16px] border border-[#E6DECB] bg-[#F5EFE2] aspect-[4/3]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={reward.imageUrl}
            alt={t(reward.name)}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="space-y-1 text-center">
          <h1 className="font-display-serif text-2xl font-extrabold text-[#272E2B]">
            {t(reward.name)}
          </h1>
          <p className="text-sm text-[#525D58]">
            {t(reward.redemptionInstructions)}
          </p>
        </div>

        {!isEligible ? (
          <div className="rounded-2xl bg-[#F5EFE2] p-4 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#525D58]">
              <Lock className="h-4 w-4" />
              {collectedCount} / {reward.requiredStamps}{" "}
              {locale === "vi" ? "con dấu" : "stamps"}
            </span>
            <Link
              href="/collections/zoo-explorer"
              className="rounded-full bg-[#176B61] text-white px-4 py-2 text-xs font-extrabold"
            >
              {locale === "vi" ? "Sưu tầm tiếp" : "Collect stamps"}
            </Link>
          </div>
        ) : existingRedemption ? (
          <div className="rounded-2xl border-2 border-[#176B61] bg-[#E6F3F1]/50 p-4 text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#176B61]">
              <TicketCheck className="h-4 w-4" />
              <span className="uppercase">{existingRedemption.status}</span>
            </div>
            <p className="font-mono text-2xl font-extrabold tracking-widest text-[#272E2B]">
              {existingRedemption.redemptionCode}
            </p>
            {existingRedemption.status === "issued" && (
              <button
                type="button"
                onClick={() => markRedemptionRedeemed(existingRedemption.id)}
                className="rounded-full bg-[#272E2B] text-white px-4 py-1.5 text-xs font-bold cursor-pointer"
              >
                {locale === "vi" ? "Đánh dấu đã nhận" : "Mark redeemed"}
              </button>
            )}
          </div>
        ) : !showConfirm ? (
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="min-h-[50px] w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#176B61] hover:bg-[#12564E] text-white px-6 py-3 text-sm font-extrabold cursor-pointer"
          >
            <Award className="h-4 w-4 text-[#F2C653]" />
            <span>{locale === "vi" ? "Nhận mã thưởng" : "Claim reward"}</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleConfirmIssue}
              className="min-h-[46px] rounded-full bg-[#176B61] text-white px-4 py-2 text-xs font-extrabold cursor-pointer"
            >
              {locale === "vi" ? "Xác nhận" : "Confirm redeem"}
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              className="min-h-[46px] rounded-full border border-[#E6DECB] bg-white text-[#272E2B] px-4 py-2 text-xs font-bold cursor-pointer"
            >
              {locale === "vi" ? "Hủy" : "Cancel"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
