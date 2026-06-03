"use client";

import Link from "next/link";

interface LimitBannerProps {
  uploadCount: number;
  insightCount: number;
  plan: string;
}

export default function LimitBanner({ uploadCount, insightCount, plan }: LimitBannerProps) {
  if (plan !== "free") return null;

  const hitUploadLimit = uploadCount >= 1;
  const hitInsightLimit = insightCount >= 3;
  const hitAnyLimit = hitUploadLimit || hitInsightLimit;

  if (!hitAnyLimit) return null;

  return (
    <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-red-400 text-sm font-semibold">
              {hitUploadLimit && hitInsightLimit
                ? "You have hit your free plan limits"
                : hitUploadLimit
                ? "You have used your free CSV upload"
                : "You have used your free insights"}
            </p>
            <p className="text-red-300/70 text-xs">
              {hitUploadLimit && `${uploadCount}/1 uploads used. `}
              {hitInsightLimit && `${insightCount}/3 insights used. `}
              Upgrade to continue using RepWise.
            </p>
          </div>
        </div>
        <Link
          href="/billing"
          className="flex-shrink-0 bg-red-500 hover:bg-red-400 text-white font-semibold px-4 py-2 rounded-xl text-xs transition shadow-lg shadow-red-500/20"
        >
          Upgrade now
        </Link>
      </div>
    </div>
  );
}

