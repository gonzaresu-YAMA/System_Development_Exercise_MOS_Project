package com.midori.mos_backend.Entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 注文商品のエンティティクラス
 */
@Entity
@Table(name = "order_items")
public class OrderItem {

    /** 
     * 注文商品状況
     */
    public enum Status {
        PENDING,    // 保留中
        COOKING,    // 調理中
        READY,      // 準備完了
        SERVED      // 提供済み
    }

    /** 注文商品ID */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 注文ID */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    /** 商品ID */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;

    /** 商品名 */
    @Column(name = "item_name", nullable = false, length = 200)
    private String itemName;

    /** 単価 */
    @Column(name = "unit_price", nullable = false)
    private int unitPrice;

    /** 数量 */
    @Column(nullable = false)
    private int quantity = 1;

    /**
     * 注文商品状況
     * 初期設定は保留中に
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Status status = Status.PENDING;

    /** 作成日時 */
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /** 作成時、現在時刻を保存 */
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    //------------------
    // ゲッター/セッター
    //------------------
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }

    public MenuItem getMenuItem() { return menuItem; }
    public void setMenuItem(MenuItem menuItem) { this.menuItem = menuItem; }

    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }

    public int getUnitPrice() { return unitPrice; }
    public void setUnitPrice(int unitPrice) { this.unitPrice = unitPrice; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}