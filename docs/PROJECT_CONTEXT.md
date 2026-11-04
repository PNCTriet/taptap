# TAPTAP — Project Context

*Cập nhật: 04/11/2026 (giờ Sài Gòn, UTC+7). Tài liệu tổng hợp ngữ cảnh dự án; đối chiếu từ code repo này, brief của Đông và các ghi chú nội bộ.*

## 1. Purpose / Vision
Web game sưu tập thẻ thú bằng NFC tại Thảo Cầm Viên Sài Gòn (TCV): đi sở thú → chạm điện thoại vào trạm NFC → mở thẻ thú "siêu anh hùng" → trả lời quiz → gom đủ bộ → nhận video Wrapped để đăng story. Dự án cá nhân, **không liên kết chính thức với TCV**, MVP chi phí 0đ.

## 2. Hai repo và vai trò
| Repo | Vai trò |
|---|---|
| [PNCTriet/taptap](https://github.com/PNCTriet/taptap) | **Sản phẩm đang build.** Next.js App Router + TypeScript + Tailwind, Supabase (project `TAPTAP`, id `dfvkhtheqcsjfbfihzrk`, region `ap-northeast-2`), deploy Vercel project `taptap` → https://taptap-five.vercel.app. Test: Vitest + Playwright. |
| [dongnnh2112work/tap-tap](https://github.com/dongnnh2112work/tap-tap) | **Brief thiết kế của Đông** (docs 01–07: context, product flow, 15 trạm NFC, art style, motion, marketing, timeline), bộ ảnh 15 thẻ, và **prototype motion tĩnh** (`demo/motion-v7`, HTML/CSS/JS). Không có backend. Chỉ đọc, dùng làm nguồn spec. |

## 3. Product brief (từ repo Đông)
- **Nội dung:** 15 trạm NFC / 15 loài (voi, hươu cao cổ, capybara, meerkat, gấu chó, gấu mèo, tê giác, hổ, vượn, hồng hạc, công, cá sấu, rùa, ngựa lùn, hà mã lùn) + 2–3 thẻ Easter Egg ẩn; đười ươi dự phòng.
- **Art:** thẻ gouache, thú đeo mặt nạ + áo choàng siêu anh hùng, phụ kiện Sài Gòn, nền pastel.
- **Flow:** chạm NFC → intro (skip được) → đăng nhập Google → mở thẻ + fun fact → quiz (3–4 câu/trạm, hiện ngẫu nhiên 1) → bộ sưu tập x/15 → badge mốc 5/10/15 → video Wrapped dọc.
- **Đối tượng:** Gen Z 18–25 tại Sài Gòn. **Marketing:** chỉ Threads, 0đ.
- **Timeline 2026:** design/quiz 28/10–10/11 · **build 11–17/11** · **test 18–24/11** · **launch đầu tháng 12/2026**.

## 4. Build status vs brief (đối chiếu code ngày 04/11)
| Hạng mục | Brief | Code hiện tại | Gap |
|---|---|---|---|
| Trạm | 15 + Easter Egg | Seed demo "Saigon Zoo / Zoo Explorer" **4 trạm** (Asian Elephant, Botanical Conservatory, Flamingo Lagoon, Giraffe Lookout) | Seed 15 loài + Easter Egg, ảnh thẻ thật |
| NFC | Tag mở URL | Route `/s/[code]` theo `nfc_tags.public_code` (có QR fallback) | Phù hợp, chỉ cần ghi tag |
| Quiz | Có | **Chưa có** (không tìm thấy "quiz" trong `src/`, `supabase/`) | Build mới (bảng + UI) |
| Wrapped | Video dọc | **Chưa có** | Build mới |
| Rewards | Không quà vật lý, chỉ badge | Có module rewards/redemption + `/admin/rewards` | Chuyển thành badge 5/10/15 hoặc ẩn |
| Auth | Google | Anonymous + Google (Gmail) | Giữ; cân nhắc cho xem thẻ đầu trước khi bắt login |
| Khác | — | `/map` (GPS), `/passport`, `/collections`, `/profile`, `/admin`, `/health`; UI EN/VI mặc định EN | Đổi mặc định sang VI |

## 5. Architecture decision
- **Giữ stack taptap** (Next.js + Supabase + Vercel), không viết lại.
- **Port motion v7** của Đông thành React component (mở thẻ, tilt/shine) dùng trong trang `/s/[code]`.
- **Tag NFC chứa NDEF URL** trỏ về `https://taptap-five.vercel.app/s/<code>`; không cần app.

## 6. Art / card pipeline
- Style pack (KAI): tạo thẻ bằng Google AI Studio bản free, khung 2:3, xuất 537×800 JPG, có checklist duyệt và log prompt từng thẻ.
- **Master card:** capybara v03 (ngồi uống cà phê sữa đá). **Đã duyệt:** elephant_v01, raccoon_v01. **Chờ duyệt:** pygmy hippo. Còn lại chưa làm.
- Lưu ý: ảnh Gemini có SynthID; Gemini app/NotebookLM có watermark hiển thị ở VN → không dùng cho asset cuối. Hạn chế bắt chước style ref bên thứ ba.

## 7. Team roles
- **Triết** — founder. **Đông** — co-founder (brief, design).
- Agent: **Ivan** điều phối · **DEVIN** code · **KAI** AI tools/art pipeline · **MEIL** research + Threads.

## 8. Risks
- **Đặt trạm khi không có sự cho phép của TCV:** không được đụng tài sản sở thú; phương án đặt tag/QR chưa chốt — rủi ro pháp lý/quan hệ lớn nhất.
- **Quota free tier:** Supabase, Vercel, AI Studio đều giới hạn; batch ảnh qua Gemini API là trả phí.
- **Dữ liệu:** không đưa dữ liệu người dùng / trẻ em vào Gemini free (Google có thể dùng dữ liệu free tier để cải thiện sản phẩm).
- Thời gian: ~4 tuần tới launch; Threads account chưa tạo.

## 9. Next steps
1. Seed 15 trạm + Easter Egg vào Supabase, gắn ảnh thẻ đã duyệt.
2. Build quiz (schema + UI) và badge 5/10/15; tắt/đổi module rewards.
3. Port motion v7 thành component; build Wrapped.
4. Đặt mặc định tiếng Việt; chốt phương án đặt trạm; ghi tag NFC.
5. Hoàn thiện 12 thẻ còn lại theo style pack; tạo tài khoản Threads.
