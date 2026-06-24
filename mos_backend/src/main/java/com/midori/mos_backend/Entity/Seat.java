package com.midori.mos_backend.Entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 卓のエンティティクラス
 */
@Entity
@Table(name = "seats")
public class Seat {

    /**
     * 卓状態
     */
    public enum Status {
        EMPTY,  // 空席
        USING,  // 使用中
        PAID,   // 会計済み
        STOPPED // 利用停止
    }

    /** 卓ID */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 卓番号 */
    @Column(name = "seat_number", nullable = false, length = 20)
    private String seatNumber;

    /** 階数 */
    @Column
    private int floor = 1;

    /** 
     * 卓状態
     * 初期状態はEMPTY(空席)に
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Status status = Status.EMPTY;

    /** 利用客人数 */
    @Column(name = "customer_count")
    private int customerCount = 0;

    @Column(name = "qr_code", length = 200)
    private String qrCode;

    /** セッションスタート日時 */
    @Column(name = "session_started_at")
    private LocalDateTime sessionStartedAt;

    /** 作成日時 */
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /** 更新日時 */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** 作成/更新時、現在日時を保存 */
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    /** 更新時、現在時刻を保存 */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    //------------------
    // ゲッター/セッター
    //------------------
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSeatNumber() { return seatNumber; }
    public void setSeatNumber(String seatNumber) { this.seatNumber = seatNumber; }

    public int getFloor() { return floor; }
    public void setFloor(int floor) { this.floor = floor; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public int getCustomerCount() { return customerCount; }
    public void setCustomerCount(int customerCount) { this.customerCount = customerCount; }

    public String getQrCode() { return qrCode; }
    public void setQrCode(String qrCode) { this.qrCode = qrCode; }

    public LocalDateTime getSessionStartedAt() { return sessionStartedAt; }
    public void setSessionStartedAt(LocalDateTime sessionStartedAt) { this.sessionStartedAt = sessionStartedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
