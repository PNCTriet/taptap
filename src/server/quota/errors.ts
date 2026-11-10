import type { QuotaResource } from "./quota";

export interface DbErrorLike {
  code?: string | null;
  message?: string | null;
  hint?: string | null;
}

export interface MappedError {
  status: number;
  code: string;
  resource?: QuotaResource;
  used?: number;
  max?: number;
  message: { en: string; vi: string };
}

const RESOURCE_LABEL: Record<QuotaResource, { en: string; vi: string }> = {
  rooms: { en: "rooms", vi: "phòng" },
  stations: { en: "stations", vi: "trạm" },
  members: { en: "members", vi: "thành viên" },
  active_nfc_tags: { en: "active tags", vi: "thẻ đang bật" },
};

/** Maps a Postgres / PostgREST error raised by TAPTAP RPCs to an HTTP response. */
export function mapDbError(err: DbErrorLike | null | undefined): MappedError {
  const message = err?.message ?? "";
  const quota = /^QUOTA_EXCEEDED:([a-z_]+):(\d+)\/(\d+)/.exec(message);
  if (quota) {
    const resource = quota[1] as QuotaResource;
    const used = Number(quota[2]);
    const max = Number(quota[3]);
    const label = RESOURCE_LABEL[resource] ?? { en: resource, vi: resource };
    return {
      status: 409,
      code: "QUOTA_EXCEEDED",
      resource,
      used,
      max,
      message: {
        en: `Plan limit reached: ${used}/${max} ${label.en}. Upgrade the plan to add more.`,
        vi: `Đã chạm hạn mức gói: ${used}/${max} ${label.vi}. Nâng gói để thêm.`,
      },
    };
  }
  if (err?.code === "42501" || message === "FORBIDDEN") {
    return {
      status: 403,
      code: "FORBIDDEN",
      message: { en: "You don't have permission for this.", vi: "Bạn không có quyền thực hiện." },
    };
  }
  if (err?.code === "P0002" || message === "NOT_FOUND") {
    return { status: 404, code: "NOT_FOUND", message: { en: "Not found.", vi: "Không tìm thấy." } };
  }
  if (message === "ALREADY_MEMBER") {
    return {
      status: 409,
      code: "ALREADY_MEMBER",
      message: { en: "Already a member or invited.", vi: "Đã là thành viên hoặc đã được mời." },
    };
  }
  if (message === "LAST_OWNER") {
    return {
      status: 409,
      code: "LAST_OWNER",
      message: { en: "A tenant needs at least one owner.", vi: "Cần ít nhất một chủ sở hữu." },
    };
  }
  if (err?.code === "22023" || message.startsWith("INVALID") || message === "ROOM_NOT_IN_TENANT") {
    return {
      status: 422,
      code: "INVALID",
      message: { en: `Invalid input (${message}).`, vi: `Dữ liệu không hợp lệ (${message}).` },
    };
  }
  if (err?.code === "23505") {
    return { status: 409, code: "DUPLICATE", message: { en: "Already exists.", vi: "Đã tồn tại." } };
  }
  return {
    status: 500,
    code: "UNKNOWN",
    message: { en: "Something went wrong. Try again.", vi: "Có lỗi xảy ra. Thử lại." },
  };
}
