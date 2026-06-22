package com.midori.mos_backend.service;

import com.midori.mos_backend.Entity.Seat;
import com.midori.mos_backend.repository.SeatRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class SeatService {

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

    @Transactional(readOnly = true)
    public Optional<Seat> getSeatByQrCode(String qrCode) {
        return seatRepository.findByQrCode(qrCode);
    }

    public Seat updateStatus(Long seatId, Seat.Status newStatus, Integer customerCount) {
        Seat seat = seatRepository.findById(seatId)
                .orElseThrow(() -> new IllegalArgumentException("Seat not found: " + seatId));
        seat.setStatus(newStatus);
        if (customerCount != null) {
            seat.setCustomerCount(customerCount);
        }
        return seatRepository.save(seat);
    }
}
