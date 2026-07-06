package com.midori.mos_backend.service;

import com.midori.mos_backend.Entity.Seat;
import com.midori.mos_backend.repository.SeatRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class SeatService {

    /** QRコードの有効期限（分） */
    private static final long QR_VALID_MINUTES = 5;

    private final SeatRepository seatRepository;

    public SeatService(SeatRepository seatRepository) {
        this.seatRepository = seatRepository;
    }

    @Transactional(readOnly = true)
    public List<Seat> getAllSeats() {
        return seatRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Seat> getAvailableSeats() {
        return seatRepository.findByStatus(Seat.Status.EMPTY);
    }

    @Transactional(readOnly = true)
    public Optional<Seat> getSeatById(Long id) {
        return seatRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<Seat> getSeatByNumber(String number) {
        return seatRepository.findBySeatNumber(number);
    }

    /**
     * QRコードで座席を特定する（顧客がQRコードを読み取った瞬間に呼ばれる）
     * 有効期限切れのQRコードは無効として扱う（見つからなかったものとして返す）
     *
     * 読み取りに成功した場合:
     *   - session_started_at が未設定なら、このタイミング（読み取った瞬間）を開始時刻として設定する
     *   - customer_count を1加算する（読み取るたびに人数をカウントする）
     */
    public Optional<Seat> getSeatByQrCode(String qrCode) {
        Optional<Seat> seatOpt = seatRepository.findByQrCode(qrCode)
                .filter(seat -> seat.getQrExpiresAt() != null
                        && seat.getQrExpiresAt().isAfter(LocalDateTime.now()));

        seatOpt.ifPresent(seat -> {
            if (seat.getSessionStartedAt() == null) {
                seat.setSessionStartedAt(LocalDateTime.now());
            }
            seat.setCustomerCount(seat.getCustomerCount() + 1);
            seatRepository.save(seat);
        });

        return seatOpt;
    }

    /**
     * 座席用のQRコードを新規発行（再発行）する
     * トークンはランダムなUUIDとし、発行から5分間のみ有効とする
     */
    public Seat issueQrCode(Long seatId) {
        Seat seat = seatRepository.findById(seatId)
                .orElseThrow(() -> new IllegalArgumentException("Seat not found: " + seatId));
        seat.setQrCode(UUID.randomUUID().toString());
        seat.setQrExpiresAt(LocalDateTime.now().plusMinutes(QR_VALID_MINUTES));
        return seatRepository.save(seat);
    }

    public Seat updateStatus(Long seatId, Seat.Status newStatus, Integer customerCount) {
        Seat seat = seatRepository.findById(seatId)
                .orElseThrow(() -> new IllegalArgumentException("Seat not found: " + seatId));
        seat.setStatus(newStatus);
        if (customerCount != null) {
            seat.setCustomerCount(customerCount);
        }
        // 会計処理が完了したら、次の来店に備えてセッション開始時刻をリセットする
        if (newStatus == Seat.Status.PAID) {
            seat.setSessionStartedAt(null);
        }
        return seatRepository.save(seat);
    }
}
