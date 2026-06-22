package com.midori.mos_backend.Entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 注文のエンティティクラス
 */
@Entity
@Table(name = "orders")
public class Order {

    /**
     * 提供状況
     */
    public enum Status {
        PENDING,    // 保留中
        CONFIRMED,  // 確認済み
        COOKING,    // 調理中
        READY,      // 準備完了
        COMPLETED,  // 配膳完了
        CANCELLED   // キャンセルされた
    }

    /** 注文ID */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 卓ID */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seat_id")
    private Seat seat;

    /** 卓番号 */
    @Column(name = "table_number", length = 20)
    private String tableNumber;

    /** 
     * 提供状況
     * 初期状態はPENDING(保留中)にする
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.PENDING;

    /** 注文の総数 */
    @Column(name = "total_amount")
    private int totalAmount = 0;

    /** コース種別 */
    @Column(name = "course_type", length = 50)
    private String courseType;

    /**
     * 注文商品
     * 一つの商品内に、複数のものがあるものに対応
     */
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    /** 作成日時 */
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /** 更新日時 */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** 注文日時 */
    @Column(name = "ordered_at")
    private LocalDateTime orderedAt;

    /**
     * 確認日時
     * 注文を受託した日時を保存
     */
    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    /**
     * 配膳完了日時
     * 配膳が完了した日時を保存
     */
    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    /**
     * 作成時、現在日時を保存
     */
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        orderedAt = LocalDateTime.now();
    }

    /**
     * 更新時、現在時刻を保存
     */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    //------------------
    // ゲッター/セッター
    //------------------
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Seat getSeat() { return seat; }
    public void setSeat(Seat seat) { this.seat = seat; }

    public String getTableNumber() { return tableNumber; }
    public void setTableNumber(String tableNumber) { this.tableNumber = tableNumber; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public int getTotalAmount() { return totalAmount; }
    public void setTotalAmount(int totalAmount) { this.totalAmount = totalAmount; }

    public String getCourseType() { return courseType; }
    public void setCourseType(String courseType) { this.courseType = courseType; }

    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getOrderedAt() { return orderedAt; }
    public void setOrderedAt(LocalDateTime orderedAt) { this.orderedAt = orderedAt; }

    public LocalDateTime getConfirmedAt() { return confirmedAt; }
    public void setConfirmedAt(LocalDateTime confirmedAt) { this.confirmedAt = confirmedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}