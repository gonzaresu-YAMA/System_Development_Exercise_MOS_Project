package com.midori.mos_backend.controller;

import com.midori.mos_backend.Entity.Seat;
import com.midori.mos_backend.service.SeatService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/seats")
public class SeatController {

    private final SeatService seatService;

    public SeatController(SeatService seatService) {
        this.seatService = seatService;
    }

    @GetMapping
    public ResponseEntity<List<Seat>> getAllSeats() {
        return ResponseEntity.ok(seatService.getAllSeats());
    }

    @GetMapping("/available")
    public ResponseEntity<List<Seat>> getAvailableSeats() {
        return ResponseEntity.ok(seatService.getAvailableSeats());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Seat> getSeatById(@PathVariable Long id) {
        return seatService.getSeatById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/number/{number}")
    public ResponseEntity<Seat> getSeatByNumber(@PathVariable String number) {
        return seatService.getSeatByNumber(number)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/qr")
    public ResponseEntity<Seat> getSeatByQrCode(@RequestParam String code) {
        return seatService.getSeatByQrCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 座席のQRコードを新規発行（再発行）する。都度サーバー側でトークンと有効期限を生成する
    @PostMapping("/{id}/qr")
    public ResponseEntity<Seat> issueQrCode(@PathVariable Long id) {
        return ResponseEntity.ok(seatService.issueQrCode(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Seat> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body
    ) {
        Seat.Status status = Seat.Status.valueOf(((String) body.get("status")).toUpperCase());
        Integer customerCount = body.get("customerCount") != null
                ? ((Number) body.get("customerCount")).intValue()
                : null;
        Seat seat = seatService.updateStatus(id, status, customerCount);
        return ResponseEntity.ok(seat);
    }
}
