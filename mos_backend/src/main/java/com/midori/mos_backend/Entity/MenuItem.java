package com.midori.mos_backend.Entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 商品のエンティティクラス(T05)
 */
@Entity
@Table(name = "menu_items")
public class MenuItem {

    /**商品ID */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** カテゴリID */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    /** 商品名 */
    @Column(nullable = false, length = 200)
    private String name;

    /** 商品価格 */
    @Column(nullable = false)
    private int price = 0;

    /**  売り切れフラグ */
    @Column(name = "is_sold_out")
    private boolean soldOut = false;

    /**
     * 飲み放題に含まれているかどうかのフラグ
     * Falseなら含まれている/Trueなら除外
     */
    @Column(name = "drink_plan_excluded")
    private boolean drinkPlanExcluded = false;

    /**  商品画像のパス */
    @Column(name = "image_url", length = 500)
    private String imageUrl;

    /**  ソート方法 */
    @Column(name = "sort_order")
    private int sortOrder = 0;

    /** 商品作成日時 */
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /** 商品更新日時 */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** 商品作成/更新時、現在時刻を保存 */
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    /** 商品更新時、現在時刻を保存 */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    //------------------
    // ゲッター/セッター
    //------------------
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getPrice() { return price; }
    public void setPrice(int price) { this.price = price; }

    /**
     * 売り切れか判定
     * @return soldOut  // 売り切れフラグ(T/F)
     */
    public boolean isSoldOut() { return soldOut; }
    public void setSoldOut(boolean soldOut) { this.soldOut = soldOut; }

    /**
     * 飲み放題に含まれているか判定
     * @return drinkPlanExcluded    // フラグ(T/F)
     */
    public boolean isDrinkPlanExcluded() { return drinkPlanExcluded; }
    public void setDrinkPlanExcluded(boolean drinkPlanExcluded) { this.drinkPlanExcluded = drinkPlanExcluded; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
