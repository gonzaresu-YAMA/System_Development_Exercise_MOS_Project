package com.midori.mos_backend.Entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * カテゴリのエンティティクラス(T07)
 */
@Entity
@Table(name = "categories")
public class Category {

    /** カテゴリID */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** カテゴリ名 */
    @Column(nullable = false, length = 100)
    private String name;

    /**  カテゴリ名(画面に表示するもの) */
    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    /** ソート順 */
    @Column(name = "sort_order")
    private int sortOrder = 0;

    /** カテゴリ作成日時 */
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /** カテゴリ作成時、createdAtに現在時刻を保存 */
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    //------------------
    // ゲッター/セッター
    //------------------
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}