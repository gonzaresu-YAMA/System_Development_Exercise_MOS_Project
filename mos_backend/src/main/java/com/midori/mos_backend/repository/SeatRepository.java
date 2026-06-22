package com.midori.mos_backend.repository;

import com.midori.mos_backend.Entity.Seat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 卓を管理するリポジトリクラス
 */
@Repository
public interface SeatRepository extends JpaRepository<Seat, Long> {

    Optional<Seat> findBySeatNumber(String seatNumber);

    Optional<Seat> findByQrCode(String qrCode);

    List<Seat> findByStatus(Seat.Status status);

    List<Seat> findByFloorOrderBySeatNumberAsc(int floor);
}
