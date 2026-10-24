"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Compass,
  Lock,
  ShieldAlert,
  Sparkles,
  TicketCheck,
} from "lucide-react";
import { useExplorer } from "@/context/explorer-context";

export default function RewardDetailPage() {
  const params = useParams<{ id: string }>();
  const rewardId = params?.id ?? "";

  const {
    locale,
    t,
    rewards,
    collections,
    collectedStamps,
    redemptions,
    issueRedemption,
    markRedemptionRedeemed,
  } = useExplorer();

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const reward =
    rewards.find((r) => r.id === rewardId || r.id.endsWith(rewardId)) ??
    rewards[0];

  if (!reward) {
    return (
      <div className="paper-card p-8 text-center space-y-4">
        <h1 className="font-display-serif text-2xl font-bold text-[#272E2B]">
          {locale === "vi" ? "Không tìm thấy phần thưởng" : "Reward not found"}
        </h1>
        <Link
          href="/passport"
          className="inline-flex items-center gap-2 rounded-full bg-[#176B61] text-white px-5 py-2.5 text-sm font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          {locale === "vi" ? "Quay lại Hộ chiếu" : "Back to Passport"}
        </Link>
      </div>
    );
  }

  const collection = collections.find((c) => c.id === reward.collectionId);
  const collectedCount = collectedStamps.length;
  const isEligible = collectedCount >= reward.requiredStamps;
  const existingRedemption = redemptions.find((r) => r.rewardId === reward.id);

  const handleConfirmIssue = () => {
    issueRedemption(reward.id);
    setShowConfirmModal(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/passport"
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#176B61] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{locale === "vi" ? "Quay về Hộ chiếu" : "Back to Passport"}</span>
        </Link>
      </div>

      <div className="paper-card overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Reward Photo */}
          <div className="md:col-span-5 bg-[#F5EFE2] aspect-[4/3] md:aspect-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={reward.imageUrl}
              alt={t(reward.name)}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Reward Info & Redemption Flow */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold ${
                    isEligible
                      ? "bg-[#E7F6F0] text-[#1B7F5C]"
                      : "bg-[#FEF5E3] text-[#B87514]"
                  }`}
                >
                  {isEligible ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {locale === "vi" ? "Đủ điều kiện đổi thưởng" : "Eligible to Claim"}
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      {locale === "vi"
                        ? `Cần ${reward.requiredStamps} con dấu (${collectedCount}/${reward.requiredStamps})`
                        : `Requires ${reward.requiredStamps} Stamps (${collectedCount}/${reward.requiredStamps})`}
                    </>
                  )}
                </span>

                {collection && (
                  <span className="rounded-full bg-[#F5EFE2] px-3 py-1 text-xs font-bold text-[#525D58]">
                    {t(collection.name)}
                  </span>
                )}
              </div>

              <h1 className="font-display-serif text-2xl sm:text-3xl font-extrabold text-[#272E2B]">
                {t(reward.name)}
              </h1>

              <p className="text-sm text-[#525D58] leading-relaxed">
                {t(reward.description)}
              </p>

              <div className="rounded-2xl bg-[#FFF8EB] border border-[#E6DECB] p-4 space-y-1.5">
                <p className="text-xs font-extrabold uppercase tracking-wider text-[#176B61]">
                  {locale === "vi" ? "Hướng dẫn nhận thưởng" : "Redemption Instructions"}
                </p>
                <p className="text-xs text-[#272E2B] leading-relaxed">
                  {t(reward.redemptionInstructions)}
                </p>
              </div>
            </div>

            {/* Redemption State Box */}
            <div className="pt-4 border-t border-[#E6DECB]">
              {!isEligible ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs font-bold text-[#525D58]">
                    {locale === "vi"
                      ? `Hãy sưu tầm thêm ${
                          reward.requiredStamps - collectedCount
                        } con dấu nữa để mở khóa phần thưởng này.`
                      : `Collect ${
                          reward.requiredStamps - collectedCount
                        } more stamp(s) to unlock this reward.`}
                  </p>
                  <Link
                    href="/collections/zoo-explorer"
                    className="min-h-[44px] shrink-0 inline-flex items-center justify-center gap-2 rounded-full bg-[#176B61] hover:bg-[#12564E] text-white px-5 py-2.5 text-xs font-extrabold transition-colors"
                  >
                    <Compass className="h-4 w-4 text-[#F2C653]" />
                    <span>
                      {locale === "vi" ? "Tiếp tục săn dấu" : "Continue Collecting"}
                    </span>
                  </Link>
                </div>
              ) : existingRedemption ? (
                <div className="rounded-2xl border-2 border-[#176B61] bg-[#E6F3F1]/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#176B61]">
                      <TicketCheck className="h-4 w-4" />
                      {locale === "vi" ? "Mã Đổi Thưởng Của Bạn" : "Your Redemption Voucher"}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase ${
                        existingRedemption.status === "redeemed"
                          ? "bg-[#272E2B] text-white"
                          : "bg-[#1B7F5C] text-white"
                      }`}
                    >
                      {existingRedemption.status}
                    </span>
                  </div>

                  <div className="rounded-xl bg-white border border-[#176B61]/30 py-3 px-4 text-center">
                    <p className="font-mono text-2xl font-extrabold tracking-widest text-[#272E2B]">
                      {existingRedemption.redemptionCode}
                    </p>
                  </div>

                  {existingRedemption.status === "issued" && (
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] text-[#525D58]">
                        {locale === "vi"
                          ? "Dành cho nhân viên quầy xác nhận:"
                          : "Staff counter verification:"}
                      </span>
                      <button
                        type="button"
                        onClick={() => markRedemptionRedeemed(existingRedemption.id)}
                        className="rounded-full bg-[#272E2B] hover:bg-[#176B61] text-white px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                      >
                        {locale === "vi" ? "Đánh dấu Đã Nhận" : "Mark as Redeemed"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {!showConfirmModal ? (
                    <button
                      type="button"
                      onClick={() => setShowConfirmModal(true)}
                      className="min-h-[50px] w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#176B61] hover:bg-[#12564E] text-white px-6 py-3 text-sm font-extrabold shadow-sm transition-colors cursor-pointer"
                    >
                      <Award className="h-5 w-5 text-[#F2C653]" />
                      <span>
                        {locale === "vi"
                          ? "Nhận Mã Đổi Thưởng"
                          : "Claim Redemption Code"}
                      </span>
                    </button>
                  ) : (
                    <div className="rounded-2xl border-2 border-[#F07861] bg-[#FDECE8]/60 p-4 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <ShieldAlert className="h-5 w-5 text-[#C84E37] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-extrabold text-[#272E2B]">
                            {locale === "vi"
                              ? "Xác nhận phát hành mã đổi thưởng?"
                              : "Confirm issuing your redemption code?"}
                          </p>
                          <p className="text-[11px] text-[#525D58] mt-0.5">
                            {locale === "vi"
                              ? "Chỉ xác nhận khi bạn đang ở gần Quầy Thông Tin để xuất trình mã cho nhân viên."
                              : "Confirm when you are ready at the Visitor Kiosk to present your voucher code."}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleConfirmIssue}
                          className="min-h-[42px] flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#176B61] hover:bg-[#12564E] text-white px-4 py-2 text-xs font-extrabold transition-colors cursor-pointer"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-[#F2C653]" />
                          <span>
                            {locale === "vi" ? "Xác nhận đổi thưởng" : "Confirm redeem"}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowConfirmModal(false)}
                          className="min-h-[42px] rounded-full border border-[#E6DECB] bg-white hover:bg-[#F5EFE2] text-[#272E2B] px-4 py-2 text-xs font-bold transition-colors cursor-pointer"
                        >
                          {locale === "vi" ? "Hủy" : "Cancel"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
